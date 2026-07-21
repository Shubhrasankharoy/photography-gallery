import { getTimelineProvider } from './timelineFactory';

export class TimelineService {
  constructor(provider = getTimelineProvider()) {
    this.provider = provider;
  }

  /**
   * Primary method to write activity log.
   */
  async log(activityPayload) {
    if (!activityPayload) return null;
    return await this.provider.log(activityPayload);
  }

  /**
   * Helper for upload activities.
   */
  async logUpload(payload) {
    return await this.log({
      ...payload,
      resourceType: 'upload'
    });
  }

  /**
   * Helper for event activities.
   */
  async logEvent(payload) {
    return await this.log({
      ...payload,
      resourceType: 'event'
    });
  }

  /**
   * Helper for member activities.
   */
  async logMember(payload) {
    return await this.log({
      ...payload,
      resourceType: 'member'
    });
  }

  /**
   * Helper for share activities.
   */
  async logShare(payload) {
    return await this.log({
      ...payload,
      resourceType: 'share'
    });
  }

  /**
   * Fetch activity timeline for a studio.
   */
  async getStudioTimeline(studioId, options = {}) {
    return await this.provider.getTimeline({
      ...options,
      studioId
    });
  }

  /**
   * Fetch activity timeline for a specific event.
   */
  async getEventTimeline(eventId, options = {}) {
    return await this.provider.getTimeline({
      ...options,
      eventId
    });
  }

  /**
   * Fetch activity timeline for a specific member/actor.
   */
  async getMemberTimeline(actorId, options = {}) {
    return await this.provider.getTimeline({
      ...options,
      actorId
    });
  }

  /**
   * Get single activity details.
   */
  async getActivity(activityId) {
    return await this.provider.getActivity(activityId);
  }

  /**
   * Soft delete activity.
   */
  async deleteActivity(activityId) {
    return await this.provider.deleteActivity(activityId);
  }
}

export const timelineService = new TimelineService();
