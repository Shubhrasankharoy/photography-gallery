import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp,
  updateDoc,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { storageProvider } from "./storageProvider";
import { invalidateCache } from "./galleryService";

async function updateEventStats(eventId, photoCountDelta, sizeDelta) {
  if (!db || !eventId) return;
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      photoCount: increment(photoCountDelta),
      totalSize: increment(sizeDelta),
      lastUpload: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to update event stats:", err);
  }
}

/**
 * Helper to retrieve studio settings. Returns default settings if not exists.
 */
async function localGetStudioSettings(studioId) {
  if (!db || !studioId) return { allowPhotographerDeletePhoto: false };
  try {
    const docRef = doc(db, "studioSettings", studioId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error reading studio settings:", err);
  }
  return {
    allowPhotographerDeletePhoto: false
  };
}

export async function canPerformPhotoAction(studioId, userId, action, targetPhoto = null, studioSettings = null) {
  if (!db || !studioId || !userId) return false;

  try {
    const memberRef = doc(db, "studioMembers", `${studioId}_${userId}`);
    const memberSnap = await getDoc(memberRef);
    if (!memberSnap.exists()) return false;
    
    // Any authenticated studio member is allowed to upload
    if (action === "upload") {
      return true;
    }

    const role = memberSnap.data().role;
    if (role === "owner" || role === "admin") {
      return true;
    }
    
    if (role === "photographer") {
      // Photographer can only replace/delete/restore their own uploads
      const isOwnUpload = targetPhoto && (targetPhoto.uploadedBy === userId || targetPhoto.photographerId === userId);
      if (!isOwnUpload) return false;

      if (action === "replace") return true;

      if (action === "delete" || action === "restore") {
        const settings = studioSettings || await localGetStudioSettings(studioId);
        return settings?.allowPhotographerDeletePhoto === true || settings?.allowPhotographerDeleteOwnUploads === true || settings?.allowPhotographerDeleteEvent === true;
      }
    }
  } catch (err) {
    console.error("Error checking photo action permissions:", err);
  }

  return false;
}

/**
 * Create upload activity records with denormalized names.
 */
async function createUploadActivity({ studioId, eventId, photoId, uploadedBy, action, fileName, fileSize }) {
  try {
    const activitiesRef = collection(db, "uploadActivities");
    const newActivityDoc = doc(activitiesRef);
    
    let userDisplayName = "Unknown User";
    let studioName = "Unknown Studio";
    let eventName = "Unknown Event";

    const userSnap = await getDoc(doc(db, "users", uploadedBy));
    if (userSnap.exists()) {
      userDisplayName = userSnap.data().displayName || userSnap.data().email || "Active User";
    }

    const studioSnap = await getDoc(doc(db, "studios", studioId));
    if (studioSnap.exists()) {
      studioName = studioSnap.data().studioName || "Active Studio";
    }

    const eventSnap = await getDoc(doc(db, "events", eventId));
    if (eventSnap.exists()) {
      eventName = eventSnap.data().eventName || "Active Event";
    }

    await setDoc(newActivityDoc, {
      activityId: newActivityDoc.id,
      studioId,
      eventId,
      photoId,
      uploadedBy,
      action,
      fileName,
      fileSize,
      userDisplayName,
      studioName,
      eventName,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to create upload activity log:", err);
  }
}

/* ==========================================================================
   EVENT LIFECYCLE HOOKS (No-op placeholders for future processing modules)
   ========================================================================== */
export async function beforeUpload(files) { return; }
export async function afterUpload(photo) { return; }
export async function onPhotoUploaded(photo) { return; }
export async function beforeDelete(photo) { return; }
export async function afterDelete(photo) { return; }
export async function beforeReplace(photo) { return; }
export async function afterReplace(photo) { return; }
export async function beforeSaveMetadata(photo) { return; }
export async function afterSaveMetadata(photo) { return; }

/**
 * Uploads a photo to the storage provider and registers its metadata in Firestore.
 */
export async function uploadPhoto({
  eventId,
  studioId,
  uploaderId,
  file,
  thumbnail,
  onProgress,
  width = 0,
  height = 0,
  orientation = "landscape",
  dominantColor = "#ffffff",
  checksum = ""
}) {
  if (!db) throw new Error("Firebase is not initialized.");

  // 1. Verify permissions
  const allowed = await canPerformPhotoAction(studioId, uploaderId, "upload");
  if (!allowed) {
    throw new Error("You do not have permission to upload photos to this studio.");
  }

  // Resolve Drive connection and root folder ID (supporting driveConnections & legacy fallback)
  let connectionId = "legacy";
  let rootFolderId = "root";
  let provider = "google-drive";
  let isConnected = false;

  if (studioId) {
    const q = query(
      collection(db, "driveConnections"),
      where("userId", "==", uploaderId),
      where("studioId", "==", studioId),
      where("status", "==", "connected")
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      connectionId = snap.docs[0].id;
      rootFolderId = docData.rootFolderId || "root";
      provider = docData.provider || "google-drive";
      isConnected = true;
    }
  }

  if (!isConnected) {
    const qGlobal = query(
      collection(db, "driveConnections"),
      where("userId", "==", uploaderId),
      where("status", "==", "connected")
    );
    const globalSnap = await getDocs(qGlobal);
    if (!globalSnap.empty) {
      const docData = globalSnap.docs[0].data();
      connectionId = globalSnap.docs[0].id;
      rootFolderId = docData.rootFolderId || "root";
      provider = docData.provider || "google-drive";
      isConnected = true;
    }
  }

  if (!isConnected) {
    const photographerRef = doc(db, "photographers", uploaderId);
    const profileSnap = await getDoc(photographerRef);
    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      if (profileData.googleDriveConnected) {
        connectionId = "legacy";
        rootFolderId = profileData.googleDriveFolderId || "root";
        provider = "google-drive";
        isConnected = true;
      }
    }
  }

  if (!isConnected) {
    throw new Error("Google Drive is not connected. Please go to Settings to connect your Drive account.");
  }

  // Get Studio and Event details to build names
  let studioName = "Default Studio";
  const studioSnap = await getDoc(doc(db, "studios", studioId));
  if (studioSnap.exists()) {
    studioName = studioSnap.data().studioName || "Default Studio";
  }

  let eventName = "Default Event";
  let eventYear = new Date().getFullYear().toString();
  const eventSnap = await getDoc(doc(db, "events", eventId));
  if (eventSnap.exists()) {
    const eventData = eventSnap.data();
    eventName = eventData.eventName || "Default Event";
    if (eventData.date) {
      const d = eventData.date.toDate ? eventData.date.toDate() : new Date(eventData.date);
      if (!isNaN(d.getTime())) {
        eventYear = d.getFullYear().toString();
      }
    }
  }

  // Resolve target directory structure on server recursively
  const pathArray = ["Photography Gallery", studioName, eventYear, eventName, "Original Photos"];
  const resolveRes = await fetch("/api/drive/folders/resolve-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: uploaderId,
      studioId,
      parentFolderId: rootFolderId,
      path: pathArray
    })
  });

  if (!resolveRes.ok) {
    throw new Error(`Failed to resolve Google Drive upload folder hierarchy: ${await resolveRes.text()}`);
  }
  const { folderId: resolvedUploadFolderId } = await resolveRes.json();

  // Call lifecycle hook before starting
  await beforeUpload([file]);

  // Create Firestore document reference for unique photoId
  const photosRef = collection(db, "photos");
  const newDocRef = doc(photosRef);
  const photoId = newDocRef.id;

  // Save initial record in "uploading" status
  const photoData = {
    photoId,
    eventId,
    studioId,
    photographerId: uploaderId, // Legacy compatibility
    uploadedBy: uploaderId,
    updatedBy: uploaderId,
    url: "",
    driveFileId: "",
    driveFolderId: resolvedUploadFolderId,
    storageProvider: provider,
    storageConnectionId: connectionId,
    thumbnailUrl: "",
    name: file.name,
    fileName: file.name,
    size: file.size,
    fileSize: file.size,
    type: file.type,
    mimeType: file.type,
    status: "uploading",
    width,
    height,
    orientation,
    dominantColor,
    checksum,
    originalStoragePath: "",
    thumbnailStoragePath: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null
  };

  await setDoc(newDocRef, photoData);

  try {
    // 2. Upload file through storageProvider (passing studioId)
    const driveData = await storageProvider.uploadFile(file, uploaderId, resolvedUploadFolderId, onProgress, studioId);
    const driveFileId = driveData.id;
    const originalUrl = storageProvider.getDownloadUrl(driveFileId, uploaderId, studioId);
    
    // Update status to processing
    await updateDoc(newDocRef, { status: "processing", updatedAt: serverTimestamp() });

    // Call hook before writing metadata
    await beforeSaveMetadata(photoData);

    const resolvedThumbnailUrl = storageProvider.getThumbnail(driveFileId, uploaderId, studioId, thumbnail);

    // Fetch names to denormalize
    let uploaderName = "Unknown";
    try {
      const userSnap = await getDoc(doc(db, "users", uploaderId));
      if (userSnap.exists()) {
        uploaderName = userSnap.data().displayName || userSnap.data().email || "Unknown";
      }
    } catch (err) {
      console.error("Failed to fetch uploader name during upload:", err);
    }

    // Save final details and switch status to active
    const finalPhotoData = {
      ...photoData,
      driveFileId,
      url: originalUrl,
      originalUrl,
      thumbnailUrl: resolvedThumbnailUrl,
      status: "active",
      uploaderName,
      studioName,
      albumId: null,
      albumName: null,
      faceIndexed: false,
      embeddingVersion: null,
      aiProcessed: false,
      updatedAt: serverTimestamp()
    };

    await setDoc(newDocRef, finalPhotoData);

    // Update event statistics
    await updateEventStats(eventId, 1, file.size);
    // Invalidate gallery cache
    invalidateCache(eventId);

    // Run post-save hooks
    await afterSaveMetadata(finalPhotoData);
    await afterUpload(finalPhotoData);
    await onPhotoUploaded(finalPhotoData);

    // Create activity entry
    await createUploadActivity({
      studioId,
      eventId,
      photoId,
      uploadedBy: uploaderId,
      action: "upload",
      fileName: file.name,
      fileSize: file.size
    });

    return finalPhotoData;

  } catch (error) {
    console.error("uploadPhoto: Upload failed:", error);
    await updateDoc(newDocRef, { status: "failed", updatedAt: serverTimestamp() });
    
    await createUploadActivity({
      studioId,
      eventId,
      photoId,
      uploadedBy: uploaderId,
      action: "failed",
      fileName: file.name,
      fileSize: file.size
    });

    throw error;
  }
}

/**
 * Performs sequential chunked uploads of multiple files to prevent network limits.
 */
export async function uploadMultiplePhotos({
  eventId,
  studioId,
  uploaderId,
  filesList,
  thumbnailsList = [],
  onProgressCallback = null,
  batchSize = 5
}) {
  const results = [];
  const totalFiles = filesList.length;

  for (let i = 0; i < totalFiles; i += batchSize) {
    const chunkFiles = filesList.slice(i, i + batchSize);
    const chunkThumbnails = thumbnailsList.slice(i, i + batchSize);

    const chunkPromises = chunkFiles.map((file, index) => {
      const idx = i + index;
      const thumbInfo = chunkThumbnails[index] || null;
      return uploadPhoto({
        eventId,
        studioId,
        uploaderId,
        file,
        thumbnail: thumbInfo?.thumbnail || null,
        width: thumbInfo?.width || 0,
        height: thumbInfo?.height || 0,
        orientation: thumbInfo?.orientation || "landscape",
        dominantColor: thumbInfo?.dominantColor || "#ffffff",
        checksum: thumbInfo?.checksum || "",
        onProgress: (percent) => {
          if (onProgressCallback) {
            onProgressCallback(idx, percent);
          }
        }
      });
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Replaces a photo document's file on Google Drive and updates Firestore metadata.
 */
export async function replacePhoto({
  photoId,
  studioId,
  userId,
  newFile,
  thumbnail,
  onProgress,
  width = 0,
  height = 0,
  orientation = "landscape",
  dominantColor = "#ffffff",
  checksum = ""
}) {
  if (!db) throw new Error("Firebase is not initialized.");

  const docRef = doc(db, "photos", photoId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Photo not found.");
  }
  const photo = docSnap.data();

  // Validate permission
  const allowed = await canPerformPhotoAction(studioId, userId, "replace", photo);
  if (!allowed) {
    throw new Error("You do not have permission to replace this photo.");
  }

  await beforeReplace(photo);

  await updateDoc(docRef, { status: "uploading", updatedAt: serverTimestamp(), updatedBy: userId });

  try {
    const driveData = await storageProvider.replaceFile(
      photo.driveFileId,
      newFile,
      userId,
      photo.driveFolderId || "",
      onProgress,
      studioId
    );
    const driveFileId = driveData.id;
    const originalUrl = storageProvider.getDownloadUrl(driveFileId, userId, studioId);
    
    await updateDoc(docRef, { status: "processing", updatedAt: serverTimestamp() });

    await beforeSaveMetadata(photo);

    const resolvedThumbnailUrl = storageProvider.getThumbnail(driveFileId, userId, studioId, thumbnail);

    // Resolve and denormalize names for replaced upload if needed
    let uploaderName = photo.uploaderName || "Unknown";
    try {
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists()) {
        uploaderName = userSnap.data().displayName || userSnap.data().email || "Unknown";
      }
    } catch (err) {
      console.error("Failed to fetch uploader name during replace:", err);
    }

    const updatedPhoto = {
      ...photo,
      driveFileId,
      driveFolderId: photo.driveFolderId || driveData.folderId || "",
      storageProvider: driveData.provider || photo.storageProvider || "google-drive",
      storageConnectionId: driveData.connectionId || photo.storageConnectionId || "legacy",
      url: originalUrl,
      originalUrl,
      thumbnailUrl: resolvedThumbnailUrl,
      name: newFile.name,
      fileName: newFile.name,
      size: newFile.size,
      fileSize: newFile.size,
      type: newFile.type,
      mimeType: newFile.type,
      width,
      height,
      orientation,
      dominantColor,
      checksum,
      status: "active",
      uploaderName,
      faceIndexed: false,
      embeddingVersion: null,
      aiProcessed: false,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await setDoc(docRef, updatedPhoto);

    // Update statistics: difference in file size
    const sizeDiff = newFile.size - (photo.fileSize || photo.size || 0);
    await updateEventStats(photo.eventId, 0, sizeDiff);
    invalidateCache(photo.eventId);

    await afterSaveMetadata(updatedPhoto);
    await afterReplace(updatedPhoto);

    await createUploadActivity({

      studioId,
      eventId: photo.eventId,
      photoId,
      uploadedBy: userId,
      action: "replace",
      fileName: newFile.name,
      fileSize: newFile.size
    });

    return updatedPhoto;
  } catch (error) {
    console.error("replacePhoto failed:", error);
    await updateDoc(docRef, { status: "failed", updatedAt: serverTimestamp(), updatedBy: userId });
    throw error;
  }
}

/**
 * Soft-deletes a photo from the gallery.
 */
export async function deletePhoto(photoId, studioId, userId) {
  if (!db) throw new Error("Firebase is not initialized.");

  const docRef = doc(db, "photos", photoId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Photo not found.");
  }
  const photo = docSnap.data();

  // Validate permission
  const allowed = await canPerformPhotoAction(studioId, userId, "delete", photo);
  if (!allowed) {
    throw new Error("You do not have permission to delete this photo.");
  }

  await beforeDelete(photo);

  const updatedPhoto = {
    ...photo,
    status: "deleted",
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId
  };

  await setDoc(docRef, updatedPhoto);

  await updateEventStats(photo.eventId, -1, -(photo.fileSize || photo.size || 0));
  invalidateCache(photo.eventId);

  await afterDelete(photo);

  await createUploadActivity({
    studioId,
    eventId: photo.eventId,
    photoId,
    uploadedBy: userId,
    action: "delete",
    fileName: photo.fileName || photo.name,
    fileSize: photo.fileSize || photo.size || 0
  });

  return updatedPhoto;
}

/**
 * Restores a soft-deleted photo.
 */
export async function restorePhoto(photoId, studioId, userId) {
  if (!db) throw new Error("Firebase is not initialized.");

  const docRef = doc(db, "photos", photoId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Photo not found.");
  }
  const photo = docSnap.data();

  // Validate permission
  const allowed = await canPerformPhotoAction(studioId, userId, "restore", photo);
  if (!allowed) {
    throw new Error("You do not have permission to restore this photo.");
  }

  const updatedPhoto = {
    ...photo,
    status: "active",
    deletedAt: null,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  };

  await setDoc(docRef, updatedPhoto);

  await updateEventStats(photo.eventId, 1, photo.fileSize || photo.size || 0);
  invalidateCache(photo.eventId);

  await createUploadActivity({
    studioId,
    eventId: photo.eventId,
    photoId,
    uploadedBy: userId,
    action: "restore",
    fileName: photo.fileName || photo.name,
    fileSize: photo.fileSize || photo.size || 0
  });

  return updatedPhoto;
}

/**
 * Fetch all photos belonging to a specific event (excluding deleted ones).
 */
export async function getPhotosByEvent(eventId) {
  const { getGalleryPhotos } = require("./galleryService");
  return getGalleryPhotos({ eventId });
}

/**
 * Fetch recent uploads across all photographer's events (excluding deleted ones).
 */
export async function getRecentUploads(photographerId, limitCount = 4) {
  if (!db) return [];
  const q = query(
    collection(db, "photos"),
    where("photographerId", "==", photographerId)
  );

  const querySnapshot = await getDocs(q);
  const photos = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status === "active") {
      photos.push(data);
    }
  });

  photos.sort((a, b) => new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0) - new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0));
  return photos.slice(0, limitCount);
}

/**
 * Fetch recent download events for a photographer (sorted by newest first).
 */
export async function getRecentDownloads(photographerId, limitCount = 5) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "downloads"),
      where("photographerId", "==", photographerId)
    );
    const querySnapshot = await getDocs(q);
    const downloads = [];
    querySnapshot.forEach((doc) => {
      downloads.push({ downloadId: doc.id, ...doc.data() });
    });
    downloads.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return downloads.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent downloads:", error);
    return [];
  }
}
