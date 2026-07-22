import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { queueFactory } from './queueFactory';
import { timelineService } from '../timeline/timelineService';

export class QueueService {
  constructor(provider = queueFactory.getProvider()) {
    this.provider = provider;
  }

  /**
   * Enqueues a new face indexing job for a uploaded photo
   */
  async createFaceIndexJob(photoId, eventId, studioId, creatorId = 'system', priority = 'normal') {
    if (!db || !photoId) return null;

    // Prevent duplicate indexing jobs for the same photo
    const jobsRef = collection(db, 'faceIndexJobs');
    const qJobs = query(
      jobsRef,
      where('photoId', '==', photoId),
      where('status', 'in', ['pending', 'running'])
    );
    const existingSnap = await getDocs(qJobs);
    if (!existingSnap.empty) {
      console.log(`Job already exists for photoId: ${photoId}. Returning existing jobId: ${existingSnap.docs[0].id}`);
      return existingSnap.docs[0].id;
    }

    // Fetch photo details to get image URLs
    const photoRef = doc(db, 'photos', photoId);
    const photoSnap = await getDoc(photoRef);
    if (!photoSnap.exists()) {
      throw new Error(`Photo ${photoId} not found`);
    }

    const photoData = photoSnap.data();

    // Check if the photo is active
    if (photoData.status !== 'active') {
      console.warn(`Photo ${photoId} is not active. Status: ${photoData.status}. Skipping indexing job.`);
      return null;
    }

    const input = {
      imageUrl: photoData.url || '',
      thumbnailUrl: photoData.thumbnailUrl || '',
      storagePath: photoData.storagePath || ''
    };

    // Metadata is stored on the job to facilitate future upgrades
    const metadata = {
      provider: 'insightface',
      model: 'buffalo_l',
      providerVersion: '0.7',
      embeddingVersion: 'buffalo_l_512_v1'
    };

    const jobId = await this.provider.enqueue({
      jobType: 'face_index',
      priority,
      studioId,
      eventId,
      photoId,
      input,
      metadata,
      createdBy: creatorId,
      maxAttempts: 3
    });

    // Write initial status to photo
    await this.provider.updateJob(jobId, {}); // update trigger
    
    // Log timeline event
    await timelineService.log({
      studioId,
      eventId,
      resourceType: 'photo',
      resourceId: photoId,
      action: 'ai_job_created',
      actorId: creatorId,
      actorName: creatorId === 'system' ? 'AI System' : 'Studio Member',
      title: 'AI Indexing Queued',
      description: `Face indexing job created for photo "${photoData.fileName || photoData.name || photoId}".`,
      severity: 'info',
      source: 'system',
      metadata: { custom: { jobId, photoId } }
    }).catch(err => console.error('Failed to log job creation:', err));

    return jobId;
  }

  /**
   * Reindexes a single photo
   */
  async reindexPhoto(photoId, eventId, studioId, actor = null) {
    if (!db || !photoId) return null;

    // Find and cancel any active jobs for this photo
    const jobsRef = collection(db, 'faceIndexJobs');
    const q = query(
      jobsRef,
      where('photoId', '==', photoId),
      where('status', 'in', ['pending', 'running'])
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await this.cancelJob(d.id, 'Reindexing requested', actor);
    }

    // Reset photo faceIndexStatus to pending
    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, {
      faceIndexStatus: 'pending',
      faceIndexError: null
    });

    const actorId = actor?.uid || actor?.id || 'system';
    return await this.createFaceIndexJob(photoId, eventId, studioId, actorId, 'high');
  }

  /**
   * Reindexes all active photos in an event
   */
  async reindexEvent(eventId, studioId, actor = null) {
    if (!db || !eventId) return;
    const photosRef = collection(db, 'photos');
    const q = query(
      photosRef,
      where('eventId', '==', eventId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    
    const reindexPromises = snap.docs.map(d => this.reindexPhoto(d.id, eventId, studioId, actor));
    await Promise.all(reindexPromises);

    // Log event reindexed
    const actorId = actor?.uid || actor?.id || 'system';
    const actorName = actor?.displayName || actor?.name || 'Studio Member';
    await timelineService.log({
      studioId,
      eventId,
      resourceType: 'event',
      resourceId: eventId,
      action: 'face_reindexed',
      actorId,
      actorName,
      title: 'Event Reindexing Started',
      description: `All active photos in event re-queued for face indexing.`,
      severity: 'info',
      source: 'web'
    }).catch(err => console.error('Failed to log event reindexing:', err));
  }

  /**
   * Retries all failed/dead indexing jobs for an event
   */
  async retryFailedJobs(eventId, studioId, actor = null) {
    if (!db || !eventId) return;
    const jobsRef = collection(db, 'faceIndexJobs');
    const q = query(
      jobsRef,
      where('eventId', '==', eventId),
      where('status', 'in', ['failed', 'dead'])
    );
    const snap = await getDocs(q);
    
    const retryPromises = snap.docs.map(d => this.retryJob(d.id, actor));
    await Promise.all(retryPromises);
  }

  /**
   * Schedules a job for retry
   */
  async retryJob(jobId, actor = null) {
    const job = await this.provider.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const actorId = actor?.uid || actor?.id || 'system';
    const actorName = actor?.displayName || actor?.name || 'Studio Member';

    await this.provider.updateJob(jobId, {
      status: 'pending',
      attempts: 0,
      workerId: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      progress: 0,
      lastError: null,
      startedAt: null,
      completedAt: null
    });

    // Also reset the associated photo to pending
    if (job.photoId) {
      const photoRef = doc(db, 'photos', job.photoId);
      await updateDoc(photoRef, {
        faceIndexStatus: 'pending',
        faceIndexError: null
      }).catch(err => console.error('Failed to update photo on retry:', err));
    }

    await timelineService.log({
      studioId: job.studioId,
      eventId: job.eventId,
      resourceType: 'photo',
      resourceId: job.photoId,
      action: 'ai_job_retried',
      actorId,
      actorName,
      title: 'AI Job Retried',
      description: `Job ${jobId} manually scheduled for retry.`,
      severity: 'info',
      source: 'web',
      metadata: { custom: { jobId } }
    }).catch(err => console.error('Failed to log job retry:', err));
  }

  /**
   * Cancels a job
   */
  async cancelJob(jobId, reason = 'Manually cancelled', actor = null) {
    const job = await this.provider.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const actorId = actor?.uid || actor?.id || 'system';
    const actorName = actor?.displayName || actor?.name || 'Studio Member';

    await this.provider.cancelJob(jobId, reason);

    await timelineService.log({
      studioId: job.studioId,
      eventId: job.eventId,
      resourceType: 'photo',
      resourceId: job.photoId,
      action: 'ai_job_failed',
      actorId,
      actorName,
      title: 'AI Job Cancelled',
      description: `Job ${jobId} cancelled: ${reason}.`,
      severity: 'warning',
      source: 'web',
      metadata: { custom: { jobId, reason } }
    }).catch(err => console.error('Failed to log job cancellation:', err));
  }

  /**
   * Generates live statistics and metrics for the queue in a studio
   */
  async getQueueStatistics(studioId) {
    const jobsRef = collection(db, 'faceIndexJobs');
    
    // Fetch recent jobs for this studio to compute stats in-memory
    const q = query(
      jobsRef,
      where('studioId', '==', studioId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const snap = await getDocs(q);
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const stats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      dead: 0,
      totalJobs: jobs.length,
      averageProcessingTimeMs: 0,
      runningWorkers: 0,
      throughputPerMinute: 0,
      retryRate: 0,
      failedAttemptsCount: 0
    };

    const workerSet = new Set();
    let totalProcTimeMs = 0;
    let procTimeCount = 0;
    let retriedJobsCount = 0;

    const now = Date.now();
    let completedInLastTenMin = 0;

    jobs.forEach(job => {
      // Counts
      if (stats[job.status] !== undefined) {
        stats[job.status]++;
      }

      // Track active workers
      if (job.status === 'running' && job.workerId && job.leaseExpiresAt) {
        const leaseExp = job.leaseExpiresAt.toDate ? job.leaseExpiresAt.toDate() : new Date(job.leaseExpiresAt);
        if (leaseExp.getTime() > now) {
          workerSet.add(job.workerId);
        }
      }

      // Average processing time (completed jobs)
      if (job.status === 'completed' && job.startedAt && job.completedAt) {
        const start = job.startedAt.toDate ? job.startedAt.toDate().getTime() : new Date(job.startedAt).getTime();
        const end = job.completedAt.toDate ? job.completedAt.toDate().getTime() : new Date(job.completedAt).getTime();
        totalProcTimeMs += (end - start);
        procTimeCount++;

        // Throughput
        if (now - end < 600000) { // 10 minutes
          completedInLastTenMin++;
        }
      }

      // Retry rate calculation
      if (job.attempts > 0) {
        retriedJobsCount++;
        stats.failedAttemptsCount += job.attempts;
      }
    });

    stats.runningWorkers = workerSet.size;
    stats.averageProcessingTimeMs = procTimeCount > 0 ? Math.round(totalProcTimeMs / procTimeCount) : 0;
    stats.throughputPerMinute = Number((completedInLastTenMin / 10).toFixed(1));
    stats.retryRate = jobs.length > 0 ? Number(((retriedJobsCount / jobs.length) * 100).toFixed(1)) : 0;

    return stats;
  }

  /**
   * Check for expired leases and reset them to pending
   */
  async cleanOrphanedJobs() {
    const jobsRef = collection(db, 'faceIndexJobs');
    const now = new Date();

    const q = query(
      jobsRef,
      where('status', '==', 'running'),
      where('leaseExpiresAt', '<', Timestamp.fromDate(now))
    );

    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const job = docSnap.data();
      console.log(`Reclaiming orphaned job: ${job.jobId}`);
      await this.provider.failJob(job.jobId, new Error('Lease expired (worker heartbeat timed out)'));
    }
  }
}

export const queueService = new QueueService();
export default queueService;
