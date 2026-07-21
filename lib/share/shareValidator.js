import { SHARE_STATUS, VISIBILITY_TYPES } from './shareConstants';

export class ShareValidator {
  /**
   * Validates a share document against business constraints
   * @param {Object} share - Internal share object
   * @param {Object} options - Validation options (e.g. { password })
   * @returns {Object} { isValid: boolean, code: string, message: string, requiresPassword?: boolean }
   */
  static validate(share, options = {}) {
    if (!share) {
      return {
        isValid: false,
        code: 'NOT_FOUND',
        message: 'This shared link is invalid or no longer available.'
      };
    }

    if (share.status !== SHARE_STATUS.ACTIVE) {
      return {
        isValid: false,
        code: 'REVOKED',
        message: 'This shared link is invalid or no longer available.'
      };
    }

    if (share.expiresAt) {
      const expiryDate = new Date(share.expiresAt);
      if (expiryDate.getTime() < Date.now()) {
        return {
          isValid: false,
          code: 'EXPIRED',
          message: 'This shared link is invalid or no longer available.'
        };
      }
    }

    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return {
        isValid: false,
        code: 'MAX_ACCESS_REACHED',
        message: 'This shared link is invalid or no longer available.'
      };
    }

    if (share.visibility === VISIBILITY_TYPES.PASSWORD) {
      if (!options.password) {
        return {
          isValid: false,
          requiresPassword: true,
          code: 'PASSWORD_REQUIRED',
          message: 'Password required to access this resource.'
        };
      }

      if (share.password && share.password !== options.password) {
        return {
          isValid: false,
          requiresPassword: true,
          code: 'INVALID_PASSWORD',
          message: 'Incorrect password provided.'
        };
      }
    }

    return {
      isValid: true,
      code: 'VALID',
      message: 'Share link is valid.'
    };
  }
}
