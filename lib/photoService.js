import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

/**
 * Uploads a original photo and thumbnail to Firebase Storage, then registers metadata in Firestore.
 */
export async function uploadPhoto(eventId, photographerId, file, thumbnailBlob, onProgress) {
  if (!db || !storage) throw new Error("Firebase is not initialized.");

  console.log("uploadPhoto started", {
    eventId,
    photographerId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    thumbnailBlob: Boolean(thumbnailBlob),
  });

  // 1. Create Firestore document reference for unique photoId
  const photosRef = collection(db, "photos");
  const newDocRef = doc(photosRef);
  const photoId = newDocRef.id;

  // 2. Storage Paths
  const originalPath = `events/${eventId}/${photoId}_original`;
  const thumbnailPath = `events/${eventId}/${photoId}_thumb`;

  const originalRef = ref(storage, originalPath);
  const thumbnailRef = ref(storage, thumbnailPath);

  // 3. Upload Original file with progress tracking
  const originalUploadTask = uploadBytesResumable(originalRef, file);
  
  await new Promise((resolve, reject) => {
    originalUploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("uploadPhoto progress", file.name, Math.round(percent));
        if (onProgress) onProgress(percent);
      },
      (error) => {
        console.error("uploadPhoto original upload failed", error);
        reject(error);
      },
      () => resolve()
    );
  });

  const originalUrl = await getDownloadURL(originalRef);
  console.log("uploadPhoto original uploaded", originalUrl);

  // 4. Upload Thumbnail file if generated
  let thumbnailUrl = "";
  if (thumbnailBlob) {
    const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailBlob);
    await new Promise((resolve, reject) => {
      thumbnailUploadTask.on(
        "state_changed",
        null,
        (error) => reject(error),
        () => resolve()
      );
    });
    thumbnailUrl = await getDownloadURL(thumbnailRef);
  }

  // 5. Store metadata in Firestore
  const photoData = {
    photoId,
    eventId,
    photographerId,
    url: originalUrl,
    thumbnailUrl: thumbnailUrl || originalUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    originalStoragePath: originalPath,
    thumbnailStoragePath: thumbnailBlob ? thumbnailPath : "",
    createdAt: new Date().toISOString()
  };

  await setDoc(newDocRef, photoData);
  return photoData;
}

/**
 * Fetch all photos belonging to a specific event (sorted in-memory by newest first).
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
    photos.push(doc.data());
  });
  
  // Sort in memory to avoid Firestore composite index requirement
  photos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return photos;
}

/**
 * Fetch recent uploads across all photographer's events (sorted in-memory by newest first).
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
    photos.push(doc.data());
  });

  photos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return photos.slice(0, limitCount);
}

/**
 * Deletes Firestore document and associated original + thumbnail storage objects.
 */
export async function deletePhoto(photoId, originalStoragePath, thumbnailStoragePath) {
  if (!db) throw new Error("Firestore Database is not initialized.");

  // 1. Delete document from Firestore
  const docRef = doc(db, "photos", photoId);
  await deleteDoc(docRef);

  // 2. Delete original object from Storage
  if (storage && originalStoragePath) {
    try {
      const origRef = ref(storage, originalStoragePath);
      await deleteObject(origRef);
    } catch (err) {
      console.error(`Error deleting original storage object: ${originalStoragePath}`, err);
    }
  }

  // 3. Delete thumbnail object from Storage
  if (storage && thumbnailStoragePath) {
    try {
      const thumbRef = ref(storage, thumbnailStoragePath);
      await deleteObject(thumbRef);
    } catch (err) {
      console.error(`Error deleting thumbnail storage object: ${thumbnailStoragePath}`, err);
    }
  }
}
