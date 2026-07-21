/**
 * Activity Timeline Constants
 * Defines resource taxonomy, action types, severities, and origins.
 */

export const RESOURCE_TYPES = {
  STUDIO: 'studio',
  EVENT: 'event',
  UPLOAD: 'upload',
  PHOTO: 'photo',
  MEMBER: 'member',
  SHARE: 'share',
  // Future resources (constants ready, no schema changes needed)
  GALLERY: 'gallery',
  ALBUM: 'album',
  DOWNLOAD: 'download',
  FAVORITE: 'favorite',
  FACE_SEARCH: 'face_search',
  DRIVE: 'drive',
  SETTINGS: 'settings',
  WATERMARK: 'watermark'
};

export const ACTION_TYPES = {
  // Studio actions
  STUDIO_CREATED: 'studio_created',
  STUDIO_UPDATED: 'studio_updated',
  
  // Member actions
  MEMBER_JOINED: 'member_joined',
  MEMBER_REMOVED: 'member_removed',
  MEMBER_ROLE_CHANGED: 'member_role_changed',
  
  // Event actions
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_DELETED: 'event_deleted',
  
  // Photo & Upload actions
  PHOTO_UPLOADED: 'photo_uploaded',
  PHOTO_DELETED: 'photo_deleted',
  PHOTO_RESTORED: 'photo_restored',
  PHOTO_REPLACED: 'photo_replaced',
  
  // Share actions
  SHARE_CREATED: 'share_created',
  SHARE_REVOKED: 'share_revoked',
  
  // Download actions
  DOWNLOAD: 'download'
};

export const SEVERITIES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

export const SOURCES = {
  WEB: 'web',
  MOBILE: 'mobile',
  API: 'api',
  SYSTEM: 'system',
  CRON: 'cron',
  AI: 'ai'
};

export const DEFAULT_METADATA = {
  previousValue: null,
  newValue: null,
  fileCount: null,
  photoCount: null,
  role: null,
  eventName: null,
  shareType: null,
  custom: {}
};
