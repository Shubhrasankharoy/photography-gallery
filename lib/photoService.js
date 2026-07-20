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
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { storageProvider } from "./storageProvider";

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

  // Fetch uploader's Drive folder configuration from photographers collection
  const photographerRef = doc(db, "photographers", uploaderId);
  const profileSnap = await getDoc(photographerRef);
  if (!profileSnap.exists()) {
    throw new Error("Photographer profile not found.");
  }
  
  const profileData = profileSnap.data();
  if (!profileData.googleDriveConnected) {
    throw new Error("Google Drive is not connected. Please go to Settings to connect your Drive account.");
  }

  const folderId = profileData.googleDriveFolderId || "";

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
    // 2. Upload file through storageProvider
    const driveData = await storageProvider.uploadFile(file, uploaderId, folderId, onProgress);
    const driveFileId = driveData.id;
    const originalUrl = storageProvider.getDownloadUrl(driveFileId, uploaderId);
    
    // Update status to processing
    await updateDoc(newDocRef, { status: "processing", updatedAt: serverTimestamp() });

    // Call hook before writing metadata
    await beforeSaveMetadata(photoData);

    const resolvedThumbnailUrl = storageProvider.getThumbnail(driveFileId, uploaderId, thumbnail);

    // Save final details and switch status to active
    const finalPhotoData = {
      ...photoData,
      driveFileId,
      url: originalUrl,
      originalUrl,
      thumbnailUrl: resolvedThumbnailUrl,
      status: "active",
      updatedAt: serverTimestamp()
    };

    await setDoc(newDocRef, finalPhotoData);

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
    const driveData = await storageProvider.replaceFile(photo.driveFileId, newFile, userId, "", onProgress);
    const driveFileId = driveData.id;
    const originalUrl = storageProvider.getDownloadUrl(driveFileId, userId);
    
    await updateDoc(docRef, { status: "processing", updatedAt: serverTimestamp() });

    await beforeSaveMetadata(photo);

    const resolvedThumbnailUrl = storageProvider.getThumbnail(driveFileId, userId, thumbnail);

    const updatedPhoto = {
      ...photo,
      driveFileId,
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
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await setDoc(docRef, updatedPhoto);

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
  if (!db) return [];
  const q = query(
    collection(db, "photos"),
    where("eventId", "==", eventId)
  );
  
  const querySnapshot = await getDocs(q);
  const photos = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status !== "deleted") {
      photos.push(data);
    }
  });
  
  // Sort in memory to avoid Firestore composite index requirement
  photos.sort((a, b) => new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0) - new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0));
  return photos;
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
    if (data.status !== "deleted") {
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
