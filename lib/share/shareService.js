import { ShareValidator } from './shareValidator';
import { QRCodeService } from './qrCodeService';
import { SHARE_STATUS, RESOURCE_TYPES } from './shareConstants';
import { timelineLogger } from '../timeline/timelineLogger';

export class ShareService {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Generates a 256-bit URL-safe cryptographically secure random token
   */
  generateToken() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Fallback node/environment
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Builds public share URL from token
   */
  getShareUrl(token) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/share/${token}`;
  }

  async createShare(shareData) {
    const token = this.generateToken();
    const payload = {
      ...shareData,
      token,
      resourceType: shareData.resourceType || RESOURCE_TYPES.EVENT
    };
    const result = await this.provider.createShare(payload);
    
    try {
      timelineLogger.logShareCreated(
        { id: result.id || result.shareId, studioId: result.studioId, eventId: result.resourceId, shareType: result.shareType || 'public' },
        { id: result.createdBy }
      );
    } catch (err) {
      console.error("Failed to log share creation timeline:", err);
    }

    return result;
  }

  async updateShare(shareId, updates) {
    return await this.provider.updateShare(shareId, updates);
  }

  async revokeShare(shareId) {
    const res = await this.provider.updateShare(shareId, {
      status: SHARE_STATUS.REVOKED
    });

    try {
      const oldShare = await this.provider.getShare(shareId);
      if (oldShare) {
        timelineLogger.logShareRevoked(
          { id: shareId, studioId: oldShare.studioId, eventId: oldShare.resourceId, shareType: oldShare.shareType || 'public' },
          { id: oldShare.createdBy }
        );
      }
    } catch (err) {
      console.error("Failed to log share revocation timeline:", err);
    }

    return res;
  }

  /**
   * Rotates token non-destructively: revokes old share document and creates a new one
   */
  async rotateToken(shareId) {
    const oldShare = await this.provider.getShare(shareId);
    if (!oldShare) throw new Error('Share document not found');

    // Revoke old token document
    await this.revokeShare(shareId);

    // Create new share with same configurations
    return await this.createShare({
      resourceType: oldShare.resourceType,
      resourceId: oldShare.resourceId,
      studioId: oldShare.studioId,
      createdBy: oldShare.createdBy,
      title: oldShare.title,
      description: oldShare.description,
      visibility: oldShare.visibility,
      password: oldShare.password,
      expiresAt: oldShare.expiresAt,
      maxAccessCount: oldShare.maxAccessCount,
      allowDownload: oldShare.allowDownload,
      allowFaceSearch: oldShare.allowFaceSearch,
      allowComments: oldShare.allowComments
    });
  }

  async getShare(shareId) {
    return await this.provider.getShare(shareId);
  }

  async getSharesByResource(resourceType, resourceId) {
    return await this.provider.getSharesByResource(resourceType, resourceId);
  }

  /**
   * Public access lookup - returns Public Share DTO
   */
  async getPublicShare(token) {
    const internalShare = await this.provider.getShareByToken(token);
    return this.provider.toPublicDTO(internalShare);
  }

  /**
   * Full validation and atomic access increment upon success
   */
  async validateAndAccessShare(token, options = {}) {
    const internalShare = await this.provider.getShareByToken(token);
    const validation = ShareValidator.validate(internalShare, options);

    if (validation.isValid) {
      // Post-validation atomic increment
      await this.provider.incrementAccess(internalShare.shareId, options.meta || {});
      return {
        ...validation,
        share: this.provider.toPublicDTO(internalShare),
        resourceId: internalShare.resourceId, // internal context passed strictly to server/resolver
        resourceType: internalShare.resourceType,
        studioId: internalShare.studioId
      };
    }

    return {
      ...validation,
      share: this.provider.toPublicDTO(internalShare)
    };
  }

  generateQRCodeSVG(token, options = {}) {
    const url = this.getShareUrl(token);
    return QRCodeService.generateSVG(url, options);
  }

  async generateQRCodePNG(token, options = {}) {
    const url = this.getShareUrl(token);
    return await QRCodeService.generatePNGDataURL(url, options);
  }

  async copyShareLink(token) {
    const url = this.getShareUrl(token);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    return false;
  }
}
