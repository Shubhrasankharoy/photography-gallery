/**
 * Abstract Recovery Provider interface
 */
export class RecoveryProvider {
  async moveToTrash(params) {
    throw new Error('moveToTrash method not implemented');
  }

  async batchMoveToTrash(itemsList) {
    throw new Error('batchMoveToTrash method not implemented');
  }

  async restore(trashId, restoredBy, options) {
    throw new Error('restore method not implemented');
  }

  async batchRestore(trashIds, restoredBy, options) {
    throw new Error('batchRestore method not implemented');
  }

  async permanentDelete(trashId, deletedBy) {
    throw new Error('permanentDelete method not implemented');
  }

  async batchPermanentDelete(trashIds, deletedBy) {
    throw new Error('batchPermanentDelete method not implemented');
  }

  async getTrash(options) {
    throw new Error('getTrash method not implemented');
  }

  async getTrashItem(trashId) {
    throw new Error('getTrashItem method not implemented');
  }

  async getTrashSummary(studioId) {
    throw new Error('getTrashSummary method not implemented');
  }

  async emptyTrash(studioId, deletedBy) {
    throw new Error('emptyTrash method not implemented');
  }

  async getExpiredItems(cutoffDate) {
    throw new Error('getExpiredItems method not implemented');
  }

  async cleanupCandidate(trashItem) {
    throw new Error('cleanupCandidate method not implemented');
  }

  async executeCleanup(candidates) {
    throw new Error('executeCleanup method not implemented');
  }
}
