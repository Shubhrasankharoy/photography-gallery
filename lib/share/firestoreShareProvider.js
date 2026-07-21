import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShareProvider } from './shareProvider';
import { SHARE_STATUS } from './shareConstants';

export class FirestoreShareProvider extends ShareProvider {
  constructor() {
    super();
    this.collectionName = 'sharedResources';
  }

  /**
   * Helper to map raw Firestore doc into internal data model
   */
  _mapDoc(docSnap) {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      shareId: docSnap.id,
      ...data,
      expiresAt: data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)) : null,
      firstAccessAt: data.firstAccessAt ? (data.firstAccessAt.toDate ? data.firstAccessAt.toDate() : new Date(data.firstAccessAt)) : null,
      lastAccessAt: data.lastAccessAt ? (data.lastAccessAt.toDate ? data.lastAccessAt.toDate() : new Date(data.lastAccessAt)) : null,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : null,
    };
  }

  /**
   * Maps internal share object to Public Share DTO
   * Strips sensitive fields (studioId, resourceId, createdBy, password hash)
   */
  toPublicDTO(share) {
    if (!share) return null;
    return {
      shareId: share.shareId,
      token: share.token,
      resourceType: share.resourceType,
      title: share.title || '',
      description: share.description || '',
      visibility: share.visibility,
      expiresAt: share.expiresAt,
      maxAccessCount: share.maxAccessCount,
      accessCount: share.accessCount || 0,
      status: share.status,
      allowDownload: share.allowDownload ?? true,
      allowFaceSearch: share.allowFaceSearch ?? true,
      allowComments: share.allowComments ?? false
    };
  }

  async createShare(shareData) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        token: shareData.token,
        resourceType: shareData.resourceType,
        resourceId: shareData.resourceId,
        studioId: shareData.studioId || null,
        createdBy: shareData.createdBy || null,
        title: shareData.title || '',
        description: shareData.description || '',
        visibility: shareData.visibility || 'public',
        password: shareData.password || null, // hashed or plaintext if handled upstream
        expiresAt: shareData.expiresAt ? Timestamp.fromDate(new Date(shareData.expiresAt)) : null,
        maxAccessCount: shareData.maxAccessCount ? Number(shareData.maxAccessCount) : null,
        accessCount: 0,
        uniqueVisitorCount: 0,
        firstAccessAt: null,
        lastAccessAt: null,
        lastDevice: null,
        lastCountry: null,
        lastReferrer: null,
        status: SHARE_STATUS.ACTIVE,
        allowDownload: shareData.allowDownload ?? true,
        allowFaceSearch: shareData.allowFaceSearch ?? true,
        allowComments: shareData.allowComments ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const newSnap = await getDoc(docRef);
      return this._mapDoc(newSnap);
    } catch (error) {
      console.error('Error in FirestoreShareProvider.createShare:', error);
      throw error;
    }
  }

  async updateShare(shareId, updates) {
    try {
      const docRef = doc(db, this.collectionName, shareId);
      const payload = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.expiresAt !== undefined) {
        payload.expiresAt = updates.expiresAt ? Timestamp.fromDate(new Date(updates.expiresAt)) : null;
      }

      await updateDoc(docRef, payload);
      const updatedSnap = await getDoc(docRef);
      return this._mapDoc(updatedSnap);
    } catch (error) {
      console.error('Error in FirestoreShareProvider.updateShare:', error);
      throw error;
    }
  }

  async deleteShare(shareId) {
    try {
      const docRef = doc(db, this.collectionName, shareId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error in FirestoreShareProvider.deleteShare:', error);
      throw error;
    }
  }

  async getShare(shareId) {
    try {
      const docRef = doc(db, this.collectionName, shareId);
      const snap = await getDoc(docRef);
      return this._mapDoc(snap);
    } catch (error) {
      console.error('Error in FirestoreShareProvider.getShare:', error);
      throw error;
    }
  }

  async getShareByToken(token) {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('token', '==', token)
      );
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const firstDoc = querySnap.docs[0];
      return this._mapDoc(firstDoc);
    } catch (error) {
      console.error('Error in FirestoreShareProvider.getShareByToken:', error);
      throw error;
    }
  }

  async getSharesByResource(resourceType, resourceId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        where('status', '==', SHARE_STATUS.ACTIVE)
      );
      const querySnap = await getDocs(q);
      return querySnap.docs.map(d => this._mapDoc(d));
    } catch (error) {
      console.error('Error in FirestoreShareProvider.getSharesByResource:', error);
      throw error;
    }
  }

  async incrementAccess(shareId, meta = {}) {
    try {
      const docRef = doc(db, this.collectionName, shareId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const payload = {
        accessCount: increment(1),
        lastAccessAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!data.firstAccessAt) {
        payload.firstAccessAt = serverTimestamp();
      }

      await updateDoc(docRef, payload);
    } catch (error) {
      console.error('Error in FirestoreShareProvider.incrementAccess:', error);
      // Non-blocking error for view counting
    }
  }
}
