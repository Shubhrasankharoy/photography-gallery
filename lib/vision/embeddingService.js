import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { visionFactory } from './visionFactory';
import { INDEX_STATUS, EMITTING_VERSIONS, DEFAULT_VISION_SETTINGS } from './visionConstants';

export class EmbeddingService {
  /**
   * Set up default pending indexing status for a newly uploaded photo
   */
  async createIndexingJob(photoId, eventId, studioId) {
    if (!db || !photoId) return;
    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, {
      faceIndexStatus: INDEX_STATUS.PENDING,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Generates embeddings for a specific photo and stores them in Firestore
   */
  async indexPhoto(photoId, visionSettings = DEFAULT_VISION_SETTINGS) {
    if (!db || !photoId) return null;
    const photoRef = doc(db, 'photos', photoId);
    
    // 1. Fetch photo data
    const photoSnap = await getDoc(photoRef);
    if (!photoSnap.exists()) {
      throw new Error(`Photo ${photoId} not found`);
    }
    const photoData = photoSnap.data();

    // Avoid duplicating work if completed and version matches
    if (
      photoData.faceIndexStatus === INDEX_STATUS.COMPLETED &&
      photoData.embeddingVersion === visionSettings.embeddingVersion
    ) {
      return { success: true, cached: true };
    }

    // 2. Set status to processing
    await updateDoc(photoRef, {
      faceIndexStatus: INDEX_STATUS.PROCESSING,
      updatedAt: serverTimestamp()
    });

    try {
      const providerName = visionSettings.provider || 'canvas';
      const provider = visionFactory.getProvider(providerName);
      const metadata = EMITTING_VERSIONS[providerName] || { engine: 'color-layout', version: 'v1', length: 192 };

      // Use thumbnailUrl for faster client-side processing, fallback to url
      const imageSrc = photoData.thumbnailUrl || photoData.url;
      if (!imageSrc) {
        throw new Error(`No image URL available for photo ${photoId}`);
      }

      // 3. Detect regions
      const regions = await provider.detectRegion(imageSrc);

      // Remove any existing active embeddings for this photo to avoid duplicates
      await this.deletePhotoEmbeddings(photoId);

      const batch = writeBatch(db);
      
      // 4. Generate & store embeddings
      const embeddingsList = [];
      for (let i = 0; i < regions.length; i++) {
        const box = regions[i];
        const embedding = await provider.generateEmbedding(imageSrc, i, box);
        
        const embeddingId = `${photoId}_${i}`;
        const embeddingRef = doc(db, 'faceEmbeddings', embeddingId);
        
        const embeddingDoc = {
          embeddingId,
          photoId,
          eventId: photoData.eventId || null,
          studioId: photoData.studioId || null,
          personId: null,
          regionIndex: i,
          provider: providerName,
          engine: metadata.engine,
          embeddingVersion: metadata.version,
          embeddingLength: metadata.length,
          embedding,
          boundingBox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            rotation: box.rotation || 0,
            confidence: box.confidence || 1.0,
            detectedAt: box.detectedAt || new Date().toISOString()
          },
          qualityScore: 1.0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        };

        batch.set(embeddingRef, embeddingDoc);
        embeddingsList.push(embeddingDoc);
      }

      // Commit embeddings
      await batch.commit();

      // 5. Update photo status to completed
      await updateDoc(photoRef, {
        faceIndexStatus: INDEX_STATUS.COMPLETED,
        embeddingVersion: metadata.version,
        faceIndexError: null,
        updatedAt: serverTimestamp()
      });

      // 6. Update event statistics
      if (photoData.eventId) {
        const eventRef = doc(db, 'events', photoData.eventId);
        await updateDoc(eventRef, {
          faceCount: increment(regions.length),
          indexedPhotos: increment(1),
          indexVersion: metadata.version,
          lastIndexedAt: serverTimestamp()
        }).catch(err => console.error('Failed to update event stats:', err));
      }

      return { success: true, faceCount: regions.length };

    } catch (err) {
      console.error(`Failed to index photo ${photoId}:`, err);
      
      // Update status to failed
      await updateDoc(photoRef, {
        faceIndexStatus: INDEX_STATUS.FAILED,
        faceIndexError: err.message || 'Unknown processing error',
        updatedAt: serverTimestamp()
      });

      // Increment indexed count even if failed, to maintain progress ratio
      if (photoData.eventId) {
        const eventRef = doc(db, 'events', photoData.eventId);
        await updateDoc(eventRef, {
          indexedPhotos: increment(1),
          lastIndexedAt: serverTimestamp()
        }).catch(e => console.error('Failed to update event stats on fail:', e));
      }

      throw err;
    }
  }

  /**
   * Delete or deactivate embeddings associated with a photo
   */
  async deletePhotoEmbeddings(photoId) {
    if (!db || !photoId) return;
    const q = query(
      collection(db, 'faceEmbeddings'),
      where('photoId', '==', photoId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
