import { RECOVERY_STATUS, RESOURCE_TYPES } from './recoveryConstants';

export class RecoveryValidator {
  /**
   * Validate if a user can move a resource to trash
   */
  static validateMoveToTrash(resource, actor) {
    if (!resource || !resource.id) {
      return { isValid: false, error: 'Invalid resource: missing ID' };
    }
    if (!actor || (!actor.uid && !actor.id)) {
      return { isValid: false, error: 'Unauthorized: missing user context' };
    }
    return { isValid: true };
  }

  /**
   * Validate if a user can restore a trash item
   */
  static validateRestore(trashItem, actor, options = {}) {
    if (!trashItem) {
      return { isValid: false, error: 'Trash item not found' };
    }
    if (trashItem.status === RECOVERY_STATUS.RESTORED) {
      return { isValid: false, error: 'Resource has already been restored' };
    }
    if (trashItem.status === RECOVERY_STATUS.PERMANENTLY_DELETED) {
      return { isValid: false, error: 'Resource has been permanently deleted and cannot be restored' };
    }
    if (!actor || (!actor.uid && !actor.id)) {
      return { isValid: false, error: 'Unauthorized: permission denied' };
    }
    // Check retention
    const retentionCheck = this.validateRetention(trashItem);
    if (!retentionCheck.isValid && !options.overrideExpired) {
      return retentionCheck;
    }

    return { isValid: true };
  }

  /**
   * Validate if a user can permanently delete a trash item
   */
  static validatePermanentDelete(trashItem, actor) {
    if (!trashItem) {
      return { isValid: false, error: 'Trash item not found' };
    }
    if (trashItem.status === RECOVERY_STATUS.PERMANENTLY_DELETED) {
      return { isValid: false, error: 'Resource has already been permanently deleted' };
    }
    if (!actor || (!actor.uid && !actor.id)) {
      return { isValid: false, error: 'Unauthorized: permission denied' };
    }
    return { isValid: true };
  }

  /**
   * Validate retention period
   */
  static validateRetention(trashItem) {
    if (!trashItem.expiresAt) return { isValid: true };
    const expiresDate = new Date(trashItem.expiresAt.seconds ? trashItem.expiresAt.seconds * 1000 : trashItem.expiresAt);
    if (new Date() > expiresDate) {
      return { isValid: false, error: 'Trash item retention period has expired' };
    }
    return { isValid: true };
  }
}
