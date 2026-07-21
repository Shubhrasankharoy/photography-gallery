/**
 * Abstract Timeline Provider interface.
 */
export class TimelineProvider {
  /**
   * Log an activity record.
   * @param {Object} activityData 
   * @returns {Promise<Object>} Created activity document
   */
  async log(activityData) {
    throw new Error('TimelineProvider.log() must be implemented.');
  }

  /**
   * Retrieve timeline items with filtering and pagination.
   * @param {Object} options 
   * @returns {Promise<{ items: Array, lastDoc: any, hasMore: boolean }>}
   */
  async getTimeline(options) {
    throw new Error('TimelineProvider.getTimeline() must be implemented.');
  }

  /**
   * Get single activity item by ID.
   * @param {string} activityId 
   * @returns {Promise<Object|null>}
   */
  async getActivity(activityId) {
    throw new Error('TimelineProvider.getActivity() must be implemented.');
  }

  /**
   * Soft delete an activity record (sets status: 'deleted').
   * @param {string} activityId 
   * @returns {Promise<boolean>}
   */
  async deleteActivity(activityId) {
    throw new Error('TimelineProvider.deleteActivity() must be implemented.');
  }
}
