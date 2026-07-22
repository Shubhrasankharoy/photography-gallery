import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { QueueProvider } from './queueProvider';

export class FirestoreQueueProvider extends QueueProvider {
  constructor() {
    super();
    this.collectionName = 'faceIndexJobs';
  }

  /**
   * Helper to convert priority string to sortable priority code.
   * "1_high", "2_normal", "3_low" to maintain correct ascending sort.
   */
  getPriorityCode(priority) {
    switch (String(priority).toLowerCase()) {
      case 'high':
        return '1_high';
      case 'low':
        return '3_low';
      case 'normal':
      default:
        return '2_normal';
    }
  }

  async enqueue(jobParams) {
    const jobsRef = collection(db, this.collectionName);
    const jobDocRef = doc(jobsRef);
    const jobId = jobDocRef.id;

    const priorityCode = this.getPriorityCode(jobParams.priority);

    const jobDoc = {
      jobId,
      jobType: jobParams.jobType,
      status: 'pending',
      priority: priorityCode,
      
      studioId: jobParams.studioId || null,
      eventId: jobParams.eventId || null,
      photoId: jobParams.photoId || null,

      input: jobParams.input || {},
      output: jobParams.output || {},
      metadata: jobParams.metadata || {},

      attempts: 0,
      maxAttempts: jobParams.maxAttempts || 3,

      workerId: null,
      leaseExpiresAt: null,
      heartbeatAt: null,

      progress: 0,
      lastError: null,

      createdBy: jobParams.createdBy || 'system',
      createdAt: serverTimestamp(),
      startedAt: null,
      completedAt: null
    };

    await setDoc(jobDocRef, jobDoc);
    return jobId;
  }

  async claimJob(workerId, leaseDurationMs = 120000) {
    const jobsRef = collection(db, this.collectionName);
    const now = new Date();

    // We execute inside a transaction to prevent race conditions
    return await runTransaction(db, async (transaction) => {
      // 1. Look for pending jobs ordered by priority (asc) and createdAt (asc)
      const pendingQuery = query(
        jobsRef,
        where('status', '==', 'pending'),
        orderBy('priority', 'asc'),
        orderBy('createdAt', 'asc'),
        limit(5)
      );
      const pendingSnap = await getDocs(pendingQuery);
      let candidateDoc = null;

      if (!pendingSnap.empty) {
        candidateDoc = pendingSnap.docs[0];
      } else {
        // 2. Look for running jobs with expired leases
        const expiredQuery = query(
          jobsRef,
          where('status', '==', 'running'),
          where('leaseExpiresAt', '<', Timestamp.fromDate(now)),
          limit(5)
        );
        const expiredSnap = await getDocs(expiredQuery);
        if (!expiredSnap.empty) {
          candidateDoc = expiredSnap.docs[0];
        }
      }

      if (!candidateDoc) {
        return null; // No jobs to claim
      }

      // Re-read document within transaction to lock it
      const docRef = doc(db, this.collectionName, candidateDoc.id);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return null;

      const jobData = docSnap.data();
      // Double check status hasn't changed
      if (jobData.status !== 'pending' && !(jobData.status === 'running' && jobData.leaseExpiresAt.toDate() < now)) {
        return null;
      }

      const leaseExpiresAt = new Date(Date.now() + leaseDurationMs);

      const updates = {
        status: 'running',
        workerId: workerId,
        leaseExpiresAt: Timestamp.fromDate(leaseExpiresAt),
        heartbeatAt: serverTimestamp(),
        startedAt: jobData.startedAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.update(docRef, updates);

      return {
        ...jobData,
        ...updates,
        leaseExpiresAt: leaseExpiresAt.toISOString()
      };
    });
  }

  async updateJob(jobId, updates) {
    const docRef = doc(db, this.collectionName, jobId);
    const cleanUpdates = { ...updates, updatedAt: serverTimestamp() };
    
    // Convert Dates to Firestore Timestamps if any
    if (cleanUpdates.leaseExpiresAt && typeof cleanUpdates.leaseExpiresAt === 'string') {
      cleanUpdates.leaseExpiresAt = Timestamp.fromDate(new Date(cleanUpdates.leaseExpiresAt));
    }

    await updateDoc(docRef, cleanUpdates);
  }

  async failJob(jobId, error) {
    const docRef = doc(db, this.collectionName, jobId);
    
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) return;

      const jobData = snap.data();
      const nextAttempts = (jobData.attempts || 0) + 1;
      const maxAttempts = jobData.maxAttempts || 3;
      const isDead = nextAttempts >= maxAttempts;

      const updates = {
        attempts: nextAttempts,
        lastError: error?.message || String(error),
        status: isDead ? 'dead' : 'pending',
        workerId: null,
        leaseExpiresAt: null,
        heartbeatAt: null,
        updatedAt: serverTimestamp()
      };

      if (isDead) {
        updates.completedAt = serverTimestamp();
      }

      transaction.update(docRef, updates);
    });
  }

  async completeJob(jobId, output = {}) {
    const docRef = doc(db, this.collectionName, jobId);
    await updateDoc(docRef, {
      status: 'completed',
      progress: 100,
      output: output,
      completedAt: serverTimestamp(),
      workerId: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      updatedAt: serverTimestamp()
    });
  }

  async heartbeat(jobId, workerId, extendDurationMs = 120000) {
    const docRef = doc(db, this.collectionName, jobId);
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) return false;

      const jobData = snap.data();
      if (jobData.status !== 'running' || jobData.workerId !== workerId) {
        return false;
      }

      const leaseExpiresAt = new Date(Date.now() + extendDurationMs);

      transaction.update(docRef, {
        leaseExpiresAt: Timestamp.fromDate(leaseExpiresAt),
        heartbeatAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    });
  }

  async cancelJob(jobId, reason) {
    const docRef = doc(db, this.collectionName, jobId);
    await updateDoc(docRef, {
      status: 'dead',
      lastError: `Cancelled: ${reason}`,
      completedAt: serverTimestamp(),
      workerId: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      updatedAt: serverTimestamp()
    });
  }

  async getJob(jobId) {
    const docRef = doc(db, this.collectionName, jobId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async getPendingJobs(limitNum = 20) {
    const jobsRef = collection(db, this.collectionName);
    const q = query(
      jobsRef,
      where('status', '==', 'pending'),
      orderBy('priority', 'asc'),
      orderBy('createdAt', 'asc'),
      limit(limitNum)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getRunningJobs(limitNum = 20) {
    const jobsRef = collection(db, this.collectionName);
    const q = query(
      jobsRef,
      where('status', '==', 'running'),
      orderBy('createdAt', 'asc'),
      limit(limitNum)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}
