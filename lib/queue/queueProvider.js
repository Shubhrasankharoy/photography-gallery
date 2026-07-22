/**
 * Abstract class representing a Queue Provider interface.
 */
export class QueueProvider {
  /**
   * Enqueues a new job.
   * @param {Object} jobParams - The details of the job.
   * @returns {Promise<string>} The created job ID.
   */
  async enqueue(jobParams) {
    throw new Error('enqueue method not implemented');
  }

  /**
   * Claims a pending job atomically.
   * @param {string} workerId - Unique ID of the worker claiming the job.
   * @param {number} leaseDurationMs - How long the lease should be valid.
   * @returns {Promise<Object|null>} The claimed job details or null if none available.
   */
  async claimJob(workerId, leaseDurationMs) {
    throw new Error('claimJob method not implemented');
  }

  /**
   * Updates a job's properties (e.g. progress, status, metadata).
   * @param {string} jobId
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  async updateJob(jobId, updates) {
    throw new Error('updateJob method not implemented');
  }

  /**
   * Fails a job, updating attempts, error details, and checking if it goes to DLQ.
   * @param {string} jobId
   * @param {Error|string} error
   * @returns {Promise<void>}
   */
  async failJob(jobId, error) {
    throw new Error('failJob method not implemented');
  }

  /**
   * Completes a job successfully, recording outputs and completed timestamp.
   * @param {string} jobId
   * @param {Object} output - Output payload from worker
   * @returns {Promise<void>}
   */
  async completeJob(jobId, output) {
    throw new Error('completeJob method not implemented');
  }

  /**
   * Extends the lease on a running job (heartbeat).
   * @param {string} jobId
   * @param {string} workerId
   * @param {number} extendDurationMs
   * @returns {Promise<boolean>} Whether the lease was successfully extended.
   */
  async heartbeat(jobId, workerId, extendDurationMs) {
    throw new Error('heartbeat method not implemented');
  }

  /**
   * Cancels a pending or running job.
   * @param {string} jobId
   * @param {string} reason
   * @returns {Promise<void>}
   */
  async cancelJob(jobId, reason) {
    throw new Error('cancelJob method not implemented');
  }

  /**
   * Fetches a specific job.
   * @param {string} jobId
   * @returns {Promise<Object|null>}
   */
  async getJob(jobId) {
    throw new Error('getJob method not implemented');
  }

  /**
   * Fetches pending jobs.
   * @param {number} limitNum
   * @returns {Promise<Array<Object>>}
   */
  async getPendingJobs(limitNum) {
    throw new Error('getPendingJobs method not implemented');
  }

  /**
   * Fetches running jobs.
   * @param {number} limitNum
   * @returns {Promise<Array<Object>>}
   */
  async getRunningJobs(limitNum) {
    throw new Error('getRunningJobs method not implemented');
  }
}
