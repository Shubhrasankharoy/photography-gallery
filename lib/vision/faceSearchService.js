import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { embeddingService } from './embeddingService';
import { matchingService } from './matchingService';
import { timelineService } from '../timeline/timelineService';
import { INDEX_STATUS, DEFAULT_VISION_SETTINGS, CONFIDENCE_LEVELS } from './visionConstants';

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
   * Search for matching photos inside an event using an uploaded face/subject embedding
   */
  async searchMatches(queryEmbedding, eventId, studioId, actor = null, options = {}) {
    const settings = { ...DEFAULT_VISION_SETTINGS, ...options };
    const cacheKey = `${eventId}_${getEmbeddingHash(queryEmbedding)}`;

    // 1. Check search cache
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        return cached.results;
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

    // 2. Fetch all active faceEmbeddings in this event
    const q = query(
      collection(db, 'faceEmbeddings'),
      where('eventId', '==', eventId),
      where('status', '==', 'active')
    );
    const querySnap = await getDocs(q);
    const matches = [];

    if (!querySnap.empty) {
      // 3. Score all embeddings using matchingService
      const comparisons = await Promise.all(
        querySnap.docs.map(async (docSnap) => {
          const embDoc = docSnap.data();
          const comparison = await matchingService.compare(queryEmbedding, embDoc.embedding, settings.provider);
          return {
            embDoc,
            ...comparison
          };
        })
      );

      // Filter based on minimum confidence threshold
      const filtered = comparisons.filter(comp => comp.similarity >= settings.minimumConfidence);

      // Sort by similarity descending
      filtered.sort((a, b) => b.similarity - a.similarity);

      // 4. Batch resolve corresponding photo metadata to avoid n+1 queries
      const uniquePhotoIds = [...new Set(filtered.map(f => f.embDoc.photoId))];
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

      // 5. Structure final result payload with rank and distance
      filtered.forEach((match, index) => {
        const photo = photoMap.get(match.embDoc.photoId);
        // Exclude trashed or deleted photos
        if (photo && photo.status === 'active') {
          matches.push({
            photo,
            boundingBox: match.embDoc.boundingBox,
            similarity: match.similarity,
            distance: match.distance,
            confidence: match.similarity,
            confidenceLevel: match.level,
            provider: match.embDoc.provider,
            embeddingVersion: match.embDoc.embeddingVersion,
            rank: index + 1
          });
        }
      });
    }

    // 6. Save to cache
    const cacheDurationMs = (settings.cacheDuration || 300) * 1000;
    searchCache.set(cacheKey, {
      results: matches,
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
      description: `Face search completed. Found ${matches.length} matching photos.`,
      severity: 'success',
      source: 'web',
      metadata: { custom: { matchesCount: matches.length } }
    }).catch(err => console.error('Failed to log search complete:', err));

    return matches;
  }

  /**
   * Scan and run pending jobs for an event sequentially in background
   */
  async resumePendingJobs(eventId, studioId, actor = null, onProgress = null) {
    if (activeQueues.has(eventId)) {
      const active = activeQueues.get(eventId);
      if (!active.isPaused) {
        return active.promise;
      }
    }

    const queueState = { isPaused: false, promise: null };
    activeQueues.set(eventId, queueState);

    queueState.promise = (async () => {
      try {
        // Query event photos
        const q = query(
          collection(db, 'photos'),
          where('eventId', '==', eventId)
        );
        const snaps = await getDocs(q);
        if (snaps.empty) {
          activeQueues.delete(eventId);
          return { success: true, count: 0 };
        }

        // Filter active photos that are not indexed or failed/pending
        const pendingPhotos = snaps.docs
          .map(d => d.data())
          .filter(photo => 
            photo.status === 'active' && 
            photo.faceIndexStatus !== INDEX_STATUS.COMPLETED &&
            photo.faceIndexStatus !== INDEX_STATUS.FAILED
          );

        if (pendingPhotos.length === 0) {
          activeQueues.delete(eventId);
          return { success: true, count: 0 };
        }

        // Log queue started
        await timelineService.log({
          studioId,
          eventId,
          resourceType: 'event',
          resourceId: eventId,
          action: 'index_queue_started',
          actorId: actor?.uid || actor?.id || 'system',
          actorName: actor?.displayName || actor?.name || 'System Uploader',
          title: 'AI Indexing Queue Started',
          description: `Indexing queue started for ${pendingPhotos.length} photos.`,
          severity: 'info',
          source: 'system'
        }).catch(err => console.error(err));

        let processed = 0;
        let successes = 0;

        for (const photo of pendingPhotos) {
          // Check if queue has been paused mid-run
          if (queueState.isPaused) {
            await timelineService.log({
              studioId,
              eventId,
              resourceType: 'event',
              resourceId: eventId,
              action: 'index_queue_paused',
              actorId: actor?.uid || actor?.id || 'system',
              actorName: actor?.displayName || actor?.name || 'System Uploader',
              title: 'AI Indexing Queue Paused',
              description: `Indexing paused. Processed ${processed}/${pendingPhotos.length} photos.`,
              severity: 'warning',
              source: 'system'
            }).catch(e => console.error(e));
            return { paused: true, processed, successes };
          }

          try {
            const indexRes = await embeddingService.indexPhoto(photo.photoId);
            if (indexRes && indexRes.success) {
              successes++;
              // Log single photo index success
              await timelineService.log({
                studioId,
                eventId,
                resourceType: 'photo',
                resourceId: photo.photoId,
                action: 'photo_indexed',
                actorId: 'system',
                actorName: 'AI Engine',
                title: 'Photo Index Completed',
                description: `Photo "${photo.fileName || photo.name}" processed successfully. Detected ${indexRes.faceCount} regions.`,
                severity: 'info',
                source: 'system',
                metadata: { custom: { faceCount: indexRes.faceCount } }
              }).catch(e => {});
            }
          } catch (err) {
            console.error(`Queue item failed for photo ${photo.photoId}:`, err);
            // Log single photo index failure
            await timelineService.log({
              studioId,
              eventId,
              resourceType: 'photo',
              resourceId: photo.photoId,
              action: 'index_failed',
              actorId: 'system',
              actorName: 'AI Engine',
              title: 'Photo Index Failed',
              description: `Photo "${photo.fileName || photo.name}" processing failed: ${err.message}`,
              severity: 'error',
              source: 'system'
            }).catch(e => {});
          }

          processed++;
          if (onProgress) {
            onProgress(processed, pendingPhotos.length);
          }
        }

        // Log queue completed
        await timelineService.log({
          studioId,
          eventId,
          resourceType: 'event',
          resourceId: eventId,
          action: 'index_queue_completed',
          actorId: actor?.uid || actor?.id || 'system',
          actorName: actor?.displayName || actor?.name || 'System Uploader',
          title: 'AI Indexing Queue Completed',
          description: `Indexing queue completed. Processed ${processed} photos successfully.`,
          severity: 'success',
          source: 'system'
        }).catch(err => console.error(err));

        activeQueues.delete(eventId);
        return { success: true, count: processed, successes };

      } catch (error) {
        console.error('Queue execution failed:', error);
        activeQueues.delete(eventId);
        throw error;
      }
    })();

    return queueState.promise;
  }

  /**
   * Pause background queue for an event
   */
  async pausePendingJobs(eventId, studioId, actor = null) {
    if (activeQueues.has(eventId)) {
      const active = activeQueues.get(eventId);
      active.isPaused = true;
      return true;
    }
    return false;
  }

  /**
   * Clear cache for an event (e.g. if settings change)
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
