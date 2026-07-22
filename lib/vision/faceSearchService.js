import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc 
} from 'firebase/firestore';
import { CONFIDENCE_LEVELS, CONFIDENCE_THRESHOLDS, DETECTOR_INFO } from './faceConstants';
import { timelineService } from '../timeline/timelineService';

// Search results cache in memory
const searchCache = new Map();

// Active queues mapping: eventId -> queueState { isPaused, currentPromise }
const activeQueues = new Map();

/**
 * Helper to generate a string hash key from a float embedding vector
 */
function getEmbeddingHash(embedding) {
  if (!embedding || !Array.isArray(embedding)) return '';
  return embedding.map(val => val.toFixed(4)).join(',');
}

export class FaceSearchService {
  /**
   * Compare two embedding vectors using cosine similarity
   */
  compareEmbeddings(emb1, emb2) {
    return this.calculateSimilarity(emb1, emb2);
  }

  /**
   * Calculate Cosine Similarity (dot product since embeddings are unit normalized)
   */
  calculateSimilarity(emb1, emb2) {
    if (!emb1 || !emb2 || emb1.length !== emb2.length) return 0;
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < emb1.length; i++) {
      dot += emb1[i] * emb2[i];
      norm1 += emb1[i] * emb1[i];
      norm2 += emb2[i] * emb2[i];
    }
    if (norm1 === 0 || norm2 === 0) return 0;
    const similarity = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(-1.0, Math.min(1.0, similarity));
  }

  /**
   * Filter matches by minimum confidence threshold
   */
  filterMatches(matches, threshold) {
    return matches.filter(m => m.similarity >= threshold);
  }

  /**
   * Sort matches by similarity descending
   */
  sortMatches(matches) {
    return [...matches].sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Map similarity score to confidence badge levels
   */
  getConfidenceLevel(similarity) {
    if (similarity >= CONFIDENCE_THRESHOLDS.VERY_HIGH) {
      return CONFIDENCE_LEVELS.VERY_HIGH;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.HIGH) {
      return CONFIDENCE_LEVELS.HIGH;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      return CONFIDENCE_LEVELS.MEDIUM;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.LOW) {
      return CONFIDENCE_LEVELS.LOW;
    }
    return CONFIDENCE_LEVELS.NO_MATCH;
  }

  /**
   * Search by query embedding vector (fallback/compatibility mode)
   */
  async searchByEmbedding(queryEmbedding, eventId, studioId, options = {}) {
    const minConf = options.minimumConfidence ?? CONFIDENCE_THRESHOLDS.LOW;
    
    // Fetch all active faceEmbeddings in this event
    const q = query(
      collection(db, 'faceEmbeddings'),
      where('eventId', '==', eventId),
      where('status', '==', 'active')
    );
    const querySnap = await getDocs(q);
    
    let rawMatches = [];
    if (!querySnap.empty) {
      querySnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const similarity = this.calculateSimilarity(queryEmbedding, data.embedding);
        rawMatches.push({
          embeddingId: data.embeddingId,
          photoId: data.photoId,
          similarity,
          boundingBox: data.boundingBox,
          faceIndex: data.faceIndex ?? data.regionIndex ?? 0,
          qualityScore: data.qualityScore ?? 1.0,
          provider: data.provider,
          embeddingVersion: data.embeddingVersion
        });
      });
    }

    const filtered = this.filterMatches(rawMatches, minConf);
    return this.sortMatches(filtered);
  }

  /**
   * Search for matching photos inside an event using an uploaded target face image
   */
  async searchByImage(file, eventId, studioId, options = {}) {
    const minConf = options.minimumConfidence ?? CONFIDENCE_THRESHOLDS.LOW;

    // Call Next.js POST /api/face/search endpoint
    const formData = new FormData();
    formData.append('image', file);
    formData.append('eventId', eventId);
    formData.append('minimumConfidence', String(minConf));

    const response = await fetch('/api/face/search', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Face search request failed: ${errText}`);
    }

    const data = await response.json();
    return {
      matches: data.matches || [],
      queryEmbedding: data.queryEmbedding || null
    };
  }

  /**
   * Main entrypoint for Face Search UI (resolves photos and updates timeline)
   */
  async searchMatches(queryInput, eventId, studioId, actor = null, options = {}) {
    const minConf = options.minimumConfidence ?? CONFIDENCE_THRESHOLDS.LOW;
    const isImageFile = queryInput instanceof File || queryInput instanceof Blob;
    const cacheKey = `${eventId}_${isImageFile ? 'file_' + queryInput.size : getEmbeddingHash(queryInput)}`;

    // 1. Check search cache
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        return {
          results: cached.results,
          queryEmbedding: cached.queryEmbedding
        };
      }
      searchCache.delete(cacheKey);
    }

    // Log search start in timeline
    await timelineService.log({
      studioId,
      eventId,
      resourceType: 'face_search',
      resourceId: eventId,
      action: 'face_search_started',
      actorId: actor?.id || actor?.uid || 'guest',
      actorName: actor?.name || actor?.displayName || 'Client Guest',
      title: 'Face Search Started',
      description: 'A client started a face image similarity search.',
      severity: 'info',
      source: 'web'
    }).catch(err => console.error('Failed to log search start:', err));

    // 2. Perform search retrieval
    let matchedEmbeds = [];
    let queryEmbeddingResult = null;
    if (isImageFile) {
      const searchRes = await this.searchByImage(queryInput, eventId, studioId, options);
      matchedEmbeds = searchRes.matches;
      queryEmbeddingResult = searchRes.queryEmbedding;
    } else {
      matchedEmbeds = await this.searchByEmbedding(queryInput, eventId, studioId, options);
      queryEmbeddingResult = queryInput;
    }

    const finalMatches = [];
    if (matchedEmbeds.length > 0) {
      // 3. Batch resolve corresponding photo metadata
      const uniquePhotoIds = [...new Set(matchedEmbeds.map(f => f.photoId))];
      const photoMap = new Map();

      // Chunk requests in groups of 30 due to Firestore 'in' limitation
      const chunkSize = 30;
      for (let i = 0; i < uniquePhotoIds.length; i += chunkSize) {
        const chunk = uniquePhotoIds.slice(i, i + chunkSize);
        const photosQuery = query(
          collection(db, 'photos'),
          where('photoId', 'in', chunk)
        );
        const photoSnaps = await getDocs(photosQuery);
        photoSnaps.forEach(pSnap => {
          photoMap.set(pSnap.id, pSnap.data());
        });
      }

      // 4. Structure final result payload with rank and distance
      matchedEmbeds.forEach((match, index) => {
        const photo = photoMap.get(match.photoId);
        // Exclude trashed or deleted photos
        if (photo && photo.status === 'active') {
          finalMatches.push({
            photo,
            boundingBox: match.boundingBox,
            similarity: match.similarity,
            distance: 1 - match.similarity,
            confidence: match.similarity,
            confidenceLevel: this.getConfidenceLevel(match.similarity),
            provider: match.provider || DETECTOR_INFO.PROVIDER,
            embeddingVersion: match.embeddingVersion || DETECTOR_INFO.EMBEDDING_VERSION,
            rank: index + 1
          });
        }
      });
    }

    // 5. Save to cache
    const cacheDurationMs = (options.cacheDuration || 300) * 1000;
    searchCache.set(cacheKey, {
      results: finalMatches,
      queryEmbedding: queryEmbeddingResult,
      expiresAt: Date.now() + cacheDurationMs
    });

    // Log search complete in timeline
    await timelineService.log({
      studioId,
      eventId,
      resourceType: 'face_search',
      resourceId: eventId,
      action: 'face_search_completed',
      actorId: actor?.id || actor?.uid || 'guest',
      actorName: actor?.name || actor?.displayName || 'Client Guest',
      title: 'Face Search Completed',
      description: `Face search completed. Found ${finalMatches.length} matching photos.`,
      severity: 'success',
      source: 'web',
      metadata: { custom: { matchesCount: finalMatches.length } }
    }).catch(err => console.error('Failed to log search complete:', err));

    return {
      results: finalMatches,
      queryEmbedding: queryEmbeddingResult
    };
  }

  /**
   * Monitor pending jobs for an event by polling Firestore photo indexing statuses.
   */
  async resumePendingJobs(eventId, studioId, actor = null, onProgress = null) {
    if (activeQueues.has(eventId)) {
      return activeQueues.get(eventId);
    }

    const pollPromise = new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          const q = query(
            collection(db, 'photos'),
            where('eventId', '==', eventId)
          );
          const snaps = await getDocs(q);
          if (snaps.empty) {
            clearInterval(intervalId);
            activeQueues.delete(eventId);
            resolve({ success: true, count: 0 });
            return;
          }

          const activePhotos = snaps.docs
            .map(d => d.data())
            .filter(p => p.status === 'active');

          const total = activePhotos.length;
          const completed = activePhotos.filter(
            p => p.faceIndexStatus === 'completed' || p.faceIndexStatus === 'failed'
          ).length;

          if (onProgress) {
            onProgress(completed, total);
          }

          if (completed >= total) {
            clearInterval(intervalId);
            activeQueues.delete(eventId);
            resolve({ success: true, count: completed });
          }
        } catch (err) {
          clearInterval(intervalId);
          activeQueues.delete(eventId);
          reject(err);
        }
      }, 3000);

      // Save cancel function if needed
      activeQueues.set(eventId, {
        promise: pollPromise,
        cancel: () => {
          clearInterval(intervalId);
          activeQueues.delete(eventId);
          resolve({ success: false, cancelled: true });
        }
      });
    });

    return pollPromise;
  }

  /**
   * Stop monitoring background queue progress
   */
  async pausePendingJobs(eventId, studioId, actor = null) {
    if (activeQueues.has(eventId)) {
      const active = activeQueues.get(eventId);
      if (active.cancel) {
        active.cancel();
      }
      return true;
    }
    return false;
  }

  /**
   * Clear cache for an event
   */
  clearEventCache(eventId) {
    for (const key of searchCache.keys()) {
      if (key.startsWith(`${eventId}_`)) {
        searchCache.delete(key);
      }
    }
  }
}

export const faceSearchService = new FaceSearchService();
export default faceSearchService;
