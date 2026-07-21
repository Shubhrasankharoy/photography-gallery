import { FirestoreRecoveryProvider } from './firestoreRecoveryProvider';
import { RecoveryValidator } from './recoveryValidator';
import { timelineLogger } from '../timeline/timelineLogger';

export class RecoveryService {
  constructor(provider = new FirestoreRecoveryProvider()) {
    this.provider = provider;
  }

  async moveToTrash(params, actor) {
    const val = RecoveryValidator.validateMoveToTrash({ id: params.resourceId }, actor);
    if (!val.isValid) throw new Error(val.error);

    const result = await this.provider.moveToTrash({
      ...params,
      deletedBy: actor?.uid || actor?.id || 'system',
      deletedByName: actor?.displayName || actor?.name || actor?.email || 'User'
    });

    try {
      await timelineLogger.logResourceTrashed({
        studioId: params.studioId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.snapshot?.name || params.snapshot?.title || params.resourceId,
        actor
      });
    } catch (err) {
      console.error('Failed to log timeline for trashed resource:', err);
    }

    return result;
  }

  async batchMoveToTrash(itemsList, actor) {
    const results = await this.provider.batchMoveToTrash(itemsList.map(item => ({
      ...item,
      deletedBy: actor?.uid || actor?.id || 'system',
      deletedByName: actor?.displayName || actor?.name || actor?.email || 'User'
    })));

    try {
      if (itemsList.length > 0) {
        await timelineLogger.logBulkDelete({
          studioId: itemsList[0].studioId,
          count: itemsList.length,
          actor
        });
      }
    } catch (err) {
      console.error('Failed to log timeline for bulk move to trash:', err);
    }

    return results;
  }

  async restore(trashId, actor, options = {}) {
    const trashItem = await this.provider.getTrashItem(trashId);
    const val = RecoveryValidator.validateRestore(trashItem, actor, options);
    if (!val.isValid) throw new Error(val.error);

    const result = await this.provider.restore(trashId, actor?.uid || actor?.id || 'system', options);

    try {
      await timelineLogger.logResourceRestored({
        studioId: trashItem.studioId,
        resourceType: trashItem.resourceType,
        resourceId: trashItem.resourceId,
        resourceName: trashItem.snapshot?.name || trashItem.snapshot?.title || trashItem.resourceId,
        actor
      });
    } catch (err) {
      console.error('Failed to log timeline for restored resource:', err);
    }

    return result;
  }

  async batchRestore(trashIds, actor, options = {}) {
    const results = await this.provider.batchRestore(trashIds, actor?.uid || actor?.id || 'system', options);
    try {
      if (trashIds.length > 0) {
        await timelineLogger.logBulkRestore({
          count: trashIds.length,
          actor
        });
      }
    } catch (err) {
      console.error('Failed to log timeline for bulk restore:', err);
    }
    return results;
  }

  async permanentDelete(trashId, actor) {
    const trashItem = await this.provider.getTrashItem(trashId);
    const val = RecoveryValidator.validatePermanentDelete(trashItem, actor);
    if (!val.isValid) throw new Error(val.error);

    const result = await this.provider.permanentDelete(trashId, actor?.uid || actor?.id || 'system');

    try {
      await timelineLogger.logResourceDeletedForever({
        studioId: trashItem.studioId,
        resourceType: trashItem.resourceType,
        resourceId: trashItem.resourceId,
        resourceName: trashItem.snapshot?.name || trashItem.snapshot?.title || trashItem.resourceId,
        actor
      });
    } catch (err) {
      console.error('Failed to log timeline for permanent delete:', err);
    }

    return result;
  }

  async batchPermanentDelete(trashIds, actor) {
    const results = await this.provider.batchPermanentDelete(trashIds, actor?.uid || actor?.id || 'system');
    try {
      if (trashIds.length > 0) {
        await timelineLogger.logBulkDelete({
          count: trashIds.length,
          actor,
          permanent: true
        });
      }
    } catch (err) {
      console.error('Failed to log timeline for bulk permanent delete:', err);
    }
    return results;
  }

  async emptyTrash(studioId, actor) {
    const res = await this.provider.emptyTrash(studioId, actor?.uid || actor?.id || 'system');
    try {
      await timelineLogger.logTrashEmptied({
        studioId,
        count: res.count,
        actor
      });
    } catch (err) {
      console.error('Failed to log timeline for empty trash:', err);
    }
    return res;
  }

  async getStudioTrash(studioId, options = {}) {
    return await this.provider.getTrash({ studioId, ...options });
  }

  async getUserTrash(deletedBy, options = {}) {
    return await this.provider.getTrash({ deletedBy, ...options });
  }

  async getTrashSummary(studioId) {
    return await this.provider.getTrashSummary(studioId);
  }
}

export const recoveryService = new RecoveryService();
