/**
 * ShareProvider Interface Definition
 */
export class ShareProvider {
  async createShare(shareData) {
    throw new Error('createShare method must be implemented');
  }

  async updateShare(shareId, updates) {
    throw new Error('updateShare method must be implemented');
  }

  async deleteShare(shareId) {
    throw new Error('deleteShare method must be implemented');
  }

  async getShare(shareId) {
    throw new Error('getShare method must be implemented');
  }

  async getShareByToken(token) {
    throw new Error('getShareByToken method must be implemented');
  }

  async getSharesByResource(resourceType, resourceId) {
    throw new Error('getSharesByResource method must be implemented');
  }

  async incrementAccess(shareId, meta = {}) {
    throw new Error('incrementAccess method must be implemented');
  }
}
