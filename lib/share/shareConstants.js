/**
 * Share System Constants & Enums
 */

export const RESOURCE_TYPES = {
  EVENT: 'event',
  GALLERY: 'gallery',
  ALBUM: 'album',
  PHOTO: 'photo',
  FACE_SEARCH: 'face_search',
  DOWNLOAD: 'download',
  INVOICE: 'invoice'
};

export const VISIBILITY_TYPES = {
  PUBLIC: 'public',
  PASSWORD: 'password'
};

export const SHARE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired'
};

export const DEFAULT_SHARE_PERMISSIONS = {
  allowDownload: true,
  allowFaceSearch: true,
  allowComments: false
};
