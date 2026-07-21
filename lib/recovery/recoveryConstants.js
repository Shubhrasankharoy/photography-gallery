/**
 * Recovery Taxonomy & Constants
 */

export const RECOVERY_STATUS = {
  TRASHED: 'TRASHED',
  RESTORED: 'RESTORED',
  PERMANENTLY_DELETED: 'PERMANENTLY_DELETED',
  EXPIRED: 'EXPIRED'
};

export const SNAPSHOT_VERSION = 1;

export const RESTORE_CONFLICT_POLICY = {
  CANCEL: 'cancel',
  OVERWRITE: 'overwrite',
  RENAME: 'rename'
};

export const DEFAULT_RETENTION_DAYS = 30;

export const RESOURCE_TYPES = {
  EVENT: 'event',
  PHOTO: 'photo',
  SHARE: 'share',
  // Future resources (schema requires no changes)
  ALBUM: 'album',
  GALLERY: 'gallery',
  FACE_SEARCH: 'face_search',
  DRIVE: 'drive',
  STUDIO: 'studio',
  MEMBER: 'member',
  WATERMARK: 'watermark',
  AI_RESULT: 'ai_result'
};

export const DEFAULT_RECOVERY_METADATA = {
  originalPath: null,
  fileSize: null,
  reason: null,
  deletedFrom: null,
  storageProvider: null,
  custom: {}
};
