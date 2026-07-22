import { 
  db 
} from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { RecoveryProvider } from './recoveryProvider';
import { 
  RECOVERY_STATUS, 
  SNAPSHOT_VERSION, 
  DEFAULT_RETENTION_DAYS, 
  DEFAULT_RECOVERY_METADATA 
} from './recoveryConstants';
import { storageProvider } from '../storageProvider';

export class FirestoreRecoveryProvider extends RecoveryProvider {
  constructor() {
    super();
    this.collectionName = 'trash';
  }

  /**
   * Helper to sanitize snapshot data (stripping credentials/tokens if any)
   */
  sanitizeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return snapshot;
    const clean = { ...snapshot };
    delete clean.password;
    delete clean.accessToken;
    delete clean.refreshToken;
    delete clean.oauthToken;
    delete clean.credentials;
    return clean;
  }

  /**
   * Calculate default expiration date (30 days)
   */
  calculateExpiresAt(retentionDays = DEFAULT_RETENTION_DAYS) {
    const d = new Date();
    d.setDate(d.getDate() + retentionDays);
    return d;
  }

  async moveToTrash({
    resourceType,
    resourceId,
    studioId,
    deletedBy,
    deletedByName,
    originalCollection,
    snapshot,
    reason = null,
    metadata = {}
  }) {
    const trashRef = doc(collection(db, this.collectionName));
    const trashId = trashRef.id;

    const originalStatus = snapshot?.status || 'active';
    const sanitizedSnap = this.sanitizeSnapshot(snapshot);
    const expiresAtDate = this.calculateExpiresAt();

    const trashData = {
      trashId,
      resourceType,
      resourceId,
      studioId: studioId || null,
      deletedBy: deletedBy || 'system',
      deletedByName: deletedByName || 'User',
      originalCollection,
      originalStatus,
      snapshotVersion: SNAPSHOT_VERSION,
      snapshot: sanitizedSnap,
      reason,
      status: RECOVERY_STATUS.TRASHED,
      deletedAt: serverTimestamp(),
      expiresAt: expiresAtDate,
      restoredAt: null,
      restoredBy: null,
      permanentlyDeletedAt: null,
      deletedForeverBy: null,
      metadata: {
        ...DEFAULT_RECOVERY_METADATA,
        ...metadata
      }
    };

    // 1. Write Trash Document
    await setDoc(trashRef, trashData);

    // 2. Soft-delete target document in original collection if it exists
    if (originalCollection && resourceId) {
      try {
        const origRef = doc(db, originalCollection, resourceId);
        const origSnap = await getDoc(origRef);
        if (origSnap.exists()) {
          await updateDoc(origRef, {
            status: 'trashed',
            trashedAt: serverTimestamp(),
            trashId
          });
        }

        if (resourceType === 'photo') {
          // Cancel active/pending jobs for the photo
          const jobsQ = query(
            collection(db, 'faceIndexJobs'),
            where('photoId', '==', resourceId),
            where('status', 'in', ['pending', 'running'])
          );
          const jobSnaps = await getDocs(jobsQ);
          if (!jobSnaps.empty) {
            const batch = writeBatch(db);
            jobSnaps.docs.forEach(d => {
              batch.update(d.ref, {
                status: 'dead',
                lastError: 'Cancelled: Photo was moved to trash.',
                completedAt: serverTimestamp(),
                workerId: null,
                leaseExpiresAt: null,
                updatedAt: serverTimestamp()
              });
            });
            await batch.commit();
          }

          const q = query(collection(db, 'faceEmbeddings'), where('photoId', '==', resourceId));
          const embSnaps = await getDocs(q);
          if (!embSnaps.empty) {
            const batch = writeBatch(db);
            embSnaps.docs.forEach(d => {
              batch.update(d.ref, { status: 'trashed', updatedAt: serverTimestamp() });
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Could not mark original document ${originalCollection}/${resourceId} or its embeddings as trashed:`, err);
      }
    }

    return { trashId, ...trashData };
  }

  async batchMoveToTrash(itemsList) {
    const results = [];
    for (const item of itemsList) {
      const res = await this.moveToTrash(item);
      results.push(res);
    }
    return results;
  }

  async restore(trashId, restoredBy, options = {}) {
    const trashRef = doc(db, this.collectionName, trashId);
    const trashSnap = await getDoc(trashRef);

    if (!trashSnap.exists()) {
      throw new Error(`Trash item ${trashId} not found`);
    }

    const trashData = trashSnap.data();
    const { originalCollection, resourceId, originalStatus, snapshot } = trashData;

    // 1. Restore target document in original collection
    if (originalCollection && resourceId) {
      const origRef = doc(db, originalCollection, resourceId);
      const origDocSnap = await getDoc(origRef);

      if (origDocSnap.exists()) {
        await updateDoc(origRef, {
          status: originalStatus || 'active',
          trashedAt: null,
          trashId: null
        });
      } else if (snapshot) {
        // Document was physically removed or missing, recreate from snapshot
        const restoredDoc = {
          ...snapshot,
          status: originalStatus || 'active',
          updatedAt: serverTimestamp()
        };
        await setDoc(origRef, restoredDoc);
      }

      if (trashData.resourceType === 'photo') {
        const q = query(collection(db, 'faceEmbeddings'), where('photoId', '==', resourceId));
        const embSnaps = await getDocs(q);
        if (!embSnaps.empty) {
          const batch = writeBatch(db);
          embSnaps.docs.forEach(d => {
            batch.update(d.ref, { status: 'active', updatedAt: serverTimestamp() });
          });
          await batch.commit();
        } else {
          // No active embeddings, trigger background indexing if needed
          try {
            const { queueService } = await import('../queue/queueService');
            await queueService.createFaceIndexJob(
              resourceId,
              snapshot?.eventId || null,
              snapshot?.studioId || null,
              restoredBy || 'system'
            );
          } catch (e) {
            console.error('Failed to trigger indexing job on restore:', e);
          }
        }
      }
    }

    // 2. Update trash document status to RESTORED
    await updateDoc(trashRef, {
      status: RECOVERY_STATUS.RESTORED,
      restoredAt: serverTimestamp(),
      restoredBy: restoredBy || 'system'
    });

    return { trashId, restored: true, resourceId, resourceType: trashData.resourceType };
  }

  async batchRestore(trashIds, restoredBy, options = {}) {
    const results = [];
    for (const id of trashIds) {
      const res = await this.restore(id, restoredBy, options);
      results.push(res);
    }
    return results;
  }

  async permanentDelete(trashId, deletedBy) {
    const trashRef = doc(db, this.collectionName, trashId);
    const trashSnap = await getDoc(trashRef);

    if (!trashSnap.exists()) {
      throw new Error(`Trash record ${trashId} not found`);
    }

    const trashData = trashSnap.data();
    const { originalCollection, resourceId, snapshot, resourceType } = trashData;

    // 1. Delete Storage File FIRST if photo or file asset (to prevent orphaned files)
    if (resourceType === 'photo' && snapshot) {
      const storagePath = snapshot.storagePath || snapshot.url;
      if (storagePath) {
        try {
          await storageProvider.deleteFile(storagePath);
        } catch (err) {
          console.warn(`Storage file deletion failed for photo ${resourceId}, proceeding with document cleanup:`, err);
        }
      }
    }

    // 2. Delete Firestore Document SECOND
    if (originalCollection && resourceId) {
      try {
        const origRef = doc(db, originalCollection, resourceId);
        await deleteDoc(origRef);

        if (resourceType === 'photo') {
          // Delete associated jobs
          const jobsQ = query(collection(db, 'faceIndexJobs'), where('photoId', '==', resourceId));
          const jobSnaps = await getDocs(jobsQ);
          if (!jobSnaps.empty) {
            const batch = writeBatch(db);
            jobSnaps.docs.forEach(d => {
              batch.delete(d.ref);
            });
            await batch.commit();
          }

          const q = query(collection(db, 'faceEmbeddings'), where('photoId', '==', resourceId));
          const embSnaps = await getDocs(q);
          if (!embSnaps.empty) {
            const batch = writeBatch(db);
            embSnaps.docs.forEach(d => {
              batch.delete(d.ref);
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Firestore document or embedding deletion failed for ${originalCollection}/${resourceId}:`, err);
      }
    }

    // 3. Update Trash Record THIRD (Keep audit record, clear heavy snapshot)
    await updateDoc(trashRef, {
      status: RECOVERY_STATUS.PERMANENTLY_DELETED,
      snapshot: null,
      permanentlyDeletedAt: serverTimestamp(),
      deletedForeverBy: deletedBy || 'system'
    });

    return { trashId, permanentlyDeleted: true, resourceId, resourceType };
  }

  async batchPermanentDelete(trashIds, deletedBy) {
    const results = [];
    for (const id of trashIds) {
      const res = await this.permanentDelete(id, deletedBy);
      results.push(res);
    }
    return results;
  }

  async getTrash(options = {}) {
    const { 
      studioId, 
      resourceType, 
      status = RECOVERY_STATUS.TRASHED, 
      deletedBy, 
      search, 
      pageSize = 20, 
      lastDoc 
    } = options;

    let q = collection(db, this.collectionName);
    const constraints = [];

    if (studioId) {
      constraints.push(where('studioId', '==', studioId));
    }
    if (status) {
      constraints.push(where('status', '==', status));
    }
    if (resourceType && resourceType !== 'all') {
      constraints.push(where('resourceType', '==', resourceType));
    }
    if (deletedBy) {
      constraints.push(where('deletedBy', '==', deletedBy));
    }

    constraints.push(orderBy('deletedAt', 'desc'));
    constraints.push(limit(pageSize));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    let snapshot;
    try {
      const qRef = query(q, ...constraints);
      snapshot = await getDocs(qRef);
    } catch (err) {
      if (err.message && err.message.includes('requires an index')) {
        console.warn('Firestore composite index pending. Falling back to simple fetch and in-memory sort.');
        // Fallback: Query by status only or collection, then filter and sort in memory
        const fallbackConstraints = [];
        if (studioId) fallbackConstraints.push(where('studioId', '==', studioId));
        const fallbackQuery = query(collection(db, this.collectionName), ...fallbackConstraints);
        const rawSnap = await getDocs(fallbackQuery);
        
        let allDocs = rawSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        
        if (status) {
          allDocs = allDocs.filter(item => item.status === status);
        }
        if (resourceType && resourceType !== 'all') {
          allDocs = allDocs.filter(item => item.resourceType === resourceType);
        }
        if (deletedBy) {
          allDocs = allDocs.filter(item => item.deletedBy === deletedBy);
        }

        allDocs.sort((a, b) => {
          const tA = a.deletedAt?.seconds ? a.deletedAt.seconds * 1000 : new Date(a.deletedAt || 0);
          const tB = b.deletedAt?.seconds ? b.deletedAt.seconds * 1000 : new Date(b.deletedAt || 0);
          return tB - tA;
        });

        const sliced = allDocs.slice(0, pageSize);
        return {
          items: sliced,
          lastDoc: null,
          hasMore: allDocs.length > pageSize
        };
      }
      throw err;
    }

    let items = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // In-memory text search fallback if search query provided
    if (search && search.trim()) {
      const term = search.toLowerCase();
      items = items.filter(item => {
        const name = (item.snapshot?.name || item.snapshot?.title || item.snapshot?.filename || '').toLowerCase();
        const deletedByName = (item.deletedByName || '').toLowerCase();
        return name.includes(term) || deletedByName.includes(term);
      });
    }

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === pageSize
    };
  }

  async getTrashItem(trashId) {
    const trashRef = doc(db, this.collectionName, trashId);
    const snap = await getDoc(trashRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async getTrashSummary(studioId) {
    const qRef = query(
      collection(db, this.collectionName),
      where('studioId', '==', studioId),
      where('status', '==', RECOVERY_STATUS.TRASHED)
    );
    const snap = await getDocs(qRef);

    let total = 0;
    let photos = 0;
    let events = 0;
    let shares = 0;
    let expiringSoon = 0;

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    snap.docs.forEach(d => {
      const data = d.data();
      total++;
      if (data.resourceType === 'photo') photos++;
      else if (data.resourceType === 'event') events++;
      else if (data.resourceType === 'share') shares++;

      if (data.expiresAt) {
        const exp = new Date(data.expiresAt.seconds ? data.expiresAt.seconds * 1000 : data.expiresAt);
        if (exp <= sevenDaysFromNow) expiringSoon++;
      }
    });

    return { total, photos, events, shares, expiringSoon };
  }

  async emptyTrash(studioId, deletedBy) {
    const summary = await this.getTrashSummary(studioId);
    const { items } = await this.getTrash({ studioId, pageSize: 500 });

    const trashIds = items.map(i => i.trashId || i.id);
    await this.batchPermanentDelete(trashIds, deletedBy);

    return { count: trashIds.length };
  }

  async getExpiredItems(cutoffDate = new Date()) {
    const qRef = query(
      collection(db, this.collectionName),
      where('status', '==', RECOVERY_STATUS.TRASHED),
      where('expiresAt', '<=', cutoffDate)
    );
    const snap = await getDocs(qRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async cleanupCandidate(trashItem) {
    return trashItem.status === RECOVERY_STATUS.TRASHED && 
           trashItem.expiresAt && 
           new Date() >= new Date(trashItem.expiresAt.seconds ? trashItem.expiresAt.seconds * 1000 : trashItem.expiresAt);
  }

  async executeCleanup(candidates = []) {
    const results = [];
    for (const item of candidates) {
      const trashId = item.trashId || item.id;
      const res = await this.permanentDelete(trashId, 'system-cleanup-cron');
      results.push(res);
    }
    return results;
  }
}
