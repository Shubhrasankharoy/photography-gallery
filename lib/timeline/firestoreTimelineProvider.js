import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TimelineProvider } from './timelineProvider';
import { DEFAULT_METADATA, SEVERITIES, SOURCES } from './timelineConstants';

export class FirestoreTimelineProvider extends TimelineProvider {
  constructor() {
    super();
    this.collectionName = 'activityTimeline';
  }

  /**
   * Log an activity record to Firestore (append-only).
   */
  async log(payload) {
    try {
      const nowTs = Date.now();
      const activityKey = payload.activityKey || `${payload.action || 'activity'}_${nowTs}_${Math.random().toString(36).substr(2, 6)}`;

      const mergedMetadata = {
        ...DEFAULT_METADATA,
        ...(payload.metadata || {})
      };

      const docData = {
        activityKey,
        studioId: payload.studioId || null,
        eventId: payload.eventId || null,
        resourceType: payload.resourceType || 'system',
        resourceId: payload.resourceId || null,
        action: payload.action || 'unknown',
        actorId: payload.actorId || 'system',
        actorName: payload.actorName || 'System',
        actorAvatar: payload.actorAvatar || null,
        targetUserId: payload.targetUserId || null,
        targetUserName: payload.targetUserName || null,
        title: payload.title || '',
        description: payload.description || '',
        metadata: mergedMetadata,
        severity: payload.severity || SEVERITIES.INFO,
        source: payload.source || SOURCES.WEB,
        visibility: payload.visibility || 'studio',
        notify: payload.notify !== undefined ? Boolean(payload.notify) : false,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      // Update activityId inside document to equal auto-generated doc ID
      await updateDoc(docRef, { activityId: docRef.id });

      return {
        id: docRef.id,
        activityId: docRef.id,
        ...docData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('FirestoreTimelineProvider.log error:', error);
      throw error;
    }
  }

  /**
   * Fetch timeline items with cursor pagination, sorting, and filtering.
   */
  async getTimeline(options = {}) {
    try {
      const {
        studioId,
        eventId,
        actorId,
        resourceType,
        action,
        startDate,
        endDate,
        searchQuery,
        pageSize = 20,
        lastDoc = null
      } = options;

      let constraints = [
        where('status', '==', 'active')
      ];

      if (studioId) {
        constraints.push(where('studioId', '==', studioId));
      }

      if (eventId) {
        constraints.push(where('eventId', '==', eventId));
      }

      if (actorId) {
        constraints.push(where('actorId', '==', actorId));
      }

      if (resourceType) {
        constraints.push(where('resourceType', '==', resourceType));
      }

      if (action) {
        constraints.push(where('action', '==', action));
      }

      // Order newest first
      constraints.push(orderBy('createdAt', 'desc'));

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(pageSize + 1));

      let snapshot;
      try {
        const q = query(collection(db, this.collectionName), ...constraints);
        snapshot = await getDocs(q);
      } catch (err) {
        // Fallback for missing compound index during development / deployment
        console.warn("Firestore index missing, falling back to client-side sorting:", err.message);
        const fallbackQuery = studioId 
          ? query(collection(db, this.collectionName), where('studioId', '==', studioId), limit(50))
          : query(collection(db, this.collectionName), limit(50));
        snapshot = await getDocs(fallbackQuery);
      }

      let items = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          activityId: docSnap.id,
          ...data,
          // Convert Firestore Timestamp to JS Date or ISO String for UI compatibility
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
          _snapshot: docSnap // keep snapshot reference for startAfter pagination
        };
      });

      // Filter status active if fallback was used
      items = items.filter(item => item.status !== 'deleted');

      // In-memory sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Local keyword search filtering if query provided
      if (searchQuery && searchQuery.trim() !== '') {
        const qLower = searchQuery.toLowerCase().trim();
        items = items.filter(item => 
          (item.title && item.title.toLowerCase().includes(qLower)) ||
          (item.description && item.description.toLowerCase().includes(qLower)) ||
          (item.actorName && item.actorName.toLowerCase().includes(qLower)) ||
          (item.targetUserName && item.targetUserName.toLowerCase().includes(qLower)) ||
          (item.action && item.action.toLowerCase().includes(qLower)) ||
          (item.resourceType && item.resourceType.toLowerCase().includes(qLower))
        );
      }

      // Date range filtering if specified
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        items = items.filter(item => new Date(item.createdAt).getTime() >= startMs);
      }
      if (endDate) {
        const endMs = new Date(endDate).getTime();
        items = items.filter(item => new Date(item.createdAt).getTime() <= endMs);
      }

      const hasMore = items.length > pageSize;
      const resultItems = hasMore ? items.slice(0, pageSize) : items;
      const newLastDoc = resultItems.length > 0 ? resultItems[resultItems.length - 1]._snapshot : null;

      // Strip internal snapshot reference before returning
      const cleanItems = resultItems.map(({ _snapshot, ...rest }) => rest);

      return {
        items: cleanItems,
        lastDoc: newLastDoc,
        hasMore
      };
    } catch (error) {
      console.error('FirestoreTimelineProvider.getTimeline error:', error);
      return { items: [], lastDoc: null, hasMore: false };
    }
  }

  /**
   * Retrieve single activity record.
   */
  async getActivity(activityId) {
    try {
      const docRef = doc(db, this.collectionName, activityId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        activityId: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    } catch (error) {
      console.error('FirestoreTimelineProvider.getActivity error:', error);
      return null;
    }
  }

  /**
   * Soft delete activity (updates ONLY status and updatedAt).
   * Appends/preserves append-only contract. Never modifies content fields.
   */
  async deleteActivity(activityId) {
    try {
      const docRef = doc(db, this.collectionName, activityId);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('FirestoreTimelineProvider.deleteActivity error:', error);
      return false;
    }
  }
}
