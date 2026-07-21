import { timelineService } from './timelineService';
import { ACTION_TYPES, RESOURCE_TYPES, SEVERITIES, SOURCES } from './timelineConstants';

/**
 * TimelineLogger automatically structures titles, descriptions, icons,
 * severities, and metadata for services, keeping duplicate code out of core features.
 */
export class TimelineLogger {
  constructor(service = timelineService) {
    this.service = service;
  }

  // --- STUDIO LOGS ---
  async logStudioCreated(studio, actor) {
    return await this.service.log({
      studioId: studio.id,
      resourceType: RESOURCE_TYPES.STUDIO,
      resourceId: studio.id,
      action: ACTION_TYPES.STUDIO_CREATED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Studio Created',
      description: `Studio "${studio.name}" was created.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { newName: studio.name }
    });
  }

  async logStudioUpdated(studioId, updates, actor) {
    return await this.service.log({
      studioId,
      resourceType: RESOURCE_TYPES.STUDIO,
      resourceId: studioId,
      action: ACTION_TYPES.STUDIO_UPDATED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Studio Settings Updated',
      description: `Studio settings were modified.`,
      severity: SEVERITIES.INFO,
      source: SOURCES.WEB,
      metadata: { custom: updates }
    });
  }

  // --- MEMBER LOGS ---
  async logMemberJoined(studioId, member, actor) {
    return await this.service.log({
      studioId,
      resourceType: RESOURCE_TYPES.MEMBER,
      resourceId: member.id || member.userId,
      action: ACTION_TYPES.MEMBER_JOINED,
      actorId: actor?.id || actor?.uid || member.id || 'system',
      actorName: actor?.name || actor?.displayName || member.name || 'New Member',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      targetUserId: member.userId || member.id,
      targetUserName: member.name || member.email,
      title: 'Member Joined',
      description: `${member.name || member.email} joined the studio as ${member.role || 'Member'}.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { role: member.role }
    });
  }

  async logMemberRemoved(studioId, member, actor) {
    return await this.service.log({
      studioId,
      resourceType: RESOURCE_TYPES.MEMBER,
      resourceId: member.id || member.userId,
      action: ACTION_TYPES.MEMBER_REMOVED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      targetUserId: member.userId || member.id,
      targetUserName: member.name || member.email,
      title: 'Member Removed',
      description: `${member.name || member.email} was removed from the studio.`,
      severity: SEVERITIES.WARNING,
      source: SOURCES.WEB,
      metadata: { role: member.role }
    });
  }

  async logMemberRoleChanged(studioId, member, oldRole, newRole, actor) {
    return await this.service.log({
      studioId,
      resourceType: RESOURCE_TYPES.MEMBER,
      resourceId: member.id || member.userId,
      action: ACTION_TYPES.MEMBER_ROLE_CHANGED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      targetUserId: member.userId || member.id,
      targetUserName: member.name || member.email,
      title: 'Member Role Changed',
      description: `Role for ${member.name || member.email} was changed from ${oldRole} to ${newRole}.`,
      severity: SEVERITIES.INFO,
      source: SOURCES.WEB,
      metadata: { previousValue: oldRole, newValue: newRole, role: newRole }
    });
  }

  // --- EVENT LOGS ---
  async logEventCreated(event, actor) {
    return await this.service.log({
      studioId: event.studioId,
      eventId: event.id,
      resourceType: RESOURCE_TYPES.EVENT,
      resourceId: event.id,
      action: ACTION_TYPES.EVENT_CREATED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Event Created',
      description: `Event "${event.title || event.name}" was created.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { eventName: event.title || event.name }
    });
  }

  async logEventUpdated(event, updates, actor) {
    return await this.service.log({
      studioId: event.studioId,
      eventId: event.id,
      resourceType: RESOURCE_TYPES.EVENT,
      resourceId: event.id,
      action: ACTION_TYPES.EVENT_UPDATED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Event Updated',
      description: `Event "${event.title || event.name}" details were updated.`,
      severity: SEVERITIES.INFO,
      source: SOURCES.WEB,
      metadata: { eventName: event.title || event.name, custom: updates }
    });
  }

  async logEventDeleted(event, actor) {
    return await this.service.log({
      studioId: event.studioId,
      eventId: event.id,
      resourceType: RESOURCE_TYPES.EVENT,
      resourceId: event.id,
      action: ACTION_TYPES.EVENT_DELETED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Event Deleted',
      description: `Event "${event.title || event.name}" was deleted.`,
      severity: SEVERITIES.WARNING,
      source: SOURCES.WEB,
      metadata: { eventName: event.title || event.name }
    });
  }

  // --- PHOTO & UPLOAD LOGS ---
  async logPhotoUploaded({ studioId, eventId, photoCount, fileCount, eventName, actor }) {
    const count = photoCount || fileCount || 1;
    return await this.service.log({
      studioId,
      eventId,
      resourceType: RESOURCE_TYPES.PHOTO,
      resourceId: eventId || null,
      action: ACTION_TYPES.PHOTO_UPLOADED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: `${count} Photo${count > 1 ? 's' : ''} Uploaded`,
      description: `Uploaded ${count} photo(s)${eventName ? ` to "${eventName}"` : ''}.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { fileCount: count, photoCount: count, eventName }
    });
  }

  async logPhotoDeleted({ studioId, eventId, photoId, photoName, actor }) {
    return await this.service.log({
      studioId,
      eventId,
      resourceType: RESOURCE_TYPES.PHOTO,
      resourceId: photoId,
      action: ACTION_TYPES.PHOTO_DELETED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Photo Deleted',
      description: `Photo "${photoName || photoId}" was deleted.`,
      severity: SEVERITIES.WARNING,
      source: SOURCES.WEB,
      metadata: { previousValue: photoName || photoId }
    });
  }

  async logPhotoRestored({ studioId, eventId, photoId, photoName, actor }) {
    return await this.service.log({
      studioId,
      eventId,
      resourceType: RESOURCE_TYPES.PHOTO,
      resourceId: photoId,
      action: ACTION_TYPES.PHOTO_RESTORED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Photo Restored',
      description: `Photo "${photoName || photoId}" was restored.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { newValue: photoName || photoId }
    });
  }

  // --- SHARE LOGS ---
  async logShareCreated(shareRecord, actor) {
    return await this.service.log({
      studioId: shareRecord.studioId,
      eventId: shareRecord.eventId,
      resourceType: RESOURCE_TYPES.SHARE,
      resourceId: shareRecord.id,
      action: ACTION_TYPES.SHARE_CREATED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Share Link Created',
      description: `Created share link (${shareRecord.shareType || 'public'}) for event.`,
      severity: SEVERITIES.SUCCESS,
      source: SOURCES.WEB,
      metadata: { shareType: shareRecord.shareType }
    });
  }

  async logShareRevoked(shareRecord, actor) {
    return await this.service.log({
      studioId: shareRecord.studioId,
      eventId: shareRecord.eventId,
      resourceType: RESOURCE_TYPES.SHARE,
      resourceId: shareRecord.id,
      action: ACTION_TYPES.SHARE_REVOKED,
      actorId: actor?.id || actor?.uid || 'system',
      actorName: actor?.name || actor?.displayName || 'System User',
      actorAvatar: actor?.avatar || actor?.photoURL || null,
      title: 'Share Link Revoked',
      description: `Revoked share link for event.`,
      severity: SEVERITIES.WARNING,
      source: SOURCES.WEB,
      metadata: { shareType: shareRecord.shareType }
    });
  }
}

export const timelineLogger = new TimelineLogger();
