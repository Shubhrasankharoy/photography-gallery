import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

/**
 * Uploads a original photo and thumbnail to Firebase Storage, then registers metadata in Firestore.
 */
export async function uploadPhoto(eventId, photographerId, file, thumbnailDataUrl, onProgress) {
  if (!db || !storage) throw new Error("Firebase is not initialized.");

  // Fetch photographer profile connection details
  const photographerRef = doc(db, "photographers", photographerId);
  const profileSnap = await getDoc(photographerRef);
  if (!profileSnap.exists()) {
    throw new Error("Photographer profile not found.");
  }
  
  const profileData = profileSnap.data();
  if (!profileData.googleDriveConnected) {
    throw new Error("Google Drive is not connected. Please go to Settings to connect your Drive account.");
  }

  const folderId = profileData.googleDriveFolderId || "";

  console.log("uploadPhoto started (Google Drive flow)", {
    eventId,
    photographerId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    folderId,
    hasThumbnailDataUrl: Boolean(thumbnailDataUrl),
  });

  // 1. Create Firestore document reference for unique photoId
  const photosRef = collection(db, "photos");
  const newDocRef = doc(photosRef);
  const photoId = newDocRef.id;

  // 2. Upload Original file to Google Drive via server API with progress tracking
  const driveData = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/drive/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (err) {
          reject(new Error("Failed to parse Google Drive response."));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || "Google Drive upload failed."));
        } catch (err) {
          reject(new Error(`Google Drive upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Google Drive upload."));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uid", photographerId);
    if (folderId) {
      formData.append("folderId", folderId);
    }
    xhr.send(formData);
  });

  const driveFileId = driveData.id;
  const originalUrl = `/api/drive/file/${driveFileId}?uid=${photographerId}`;
  console.log("uploadPhoto: Original uploaded to Google Drive. File ID:", driveFileId);

  // 3. Store base64 thumbnail directly in Firestore metadata
  let thumbnailUrl = originalUrl;
  if (thumbnailDataUrl) {
    console.log("uploadPhoto: Storing compressed base64 thumbnail directly in Firestore.");
    thumbnailUrl = thumbnailDataUrl;
  } else {
    console.log("uploadPhoto: No thumbnail data URL provided.");
  }

  // 4. Store metadata in Firestore
  const photoData = {
    photoId,
    eventId,
    photographerId,
    url: originalUrl,
    driveFileId,
    thumbnailUrl: thumbnailUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    originalStoragePath: "",
    thumbnailStoragePath: "",
    createdAt: new Date().toISOString()
  };

  console.log("uploadPhoto: Storing metadata in Firestore...", photoData);
  await setDoc(newDocRef, photoData);
  console.log("uploadPhoto: Firestore metadata saved successfully!");
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

  // 1. Fetch the photo document to check if there is a Google Drive file to delete
  const docRef = doc(db, "photos", photoId);
  const docSnap = await getDoc(docRef);
  
  let driveFileId = "";
  let photographerId = "";

  if (docSnap.exists()) {
    const data = docSnap.data();
    driveFileId = data.driveFileId || "";
    photographerId = data.photographerId || "";
  }

  // 2. Delete document from Firestore
  await deleteDoc(docRef);

  // 3. Delete original from Google Drive (if present)
  if (driveFileId && photographerId) {
    try {
      const deleteUrl = `/api/drive/file/${driveFileId}?uid=${photographerId}`;
      const response = await fetch(deleteUrl, { method: "DELETE" });
      if (!response.ok) {
        console.error(`Failed to delete Drive file ${driveFileId} via proxy:`, await response.text());
      }
    } catch (err) {
      console.error(`Error deleting Drive file: ${driveFileId}`, err);
    }
  }

  // 4. Delete original object from Storage (legacy fallback)
  if (storage && originalStoragePath) {
    try {
      const origRef = ref(storage, originalStoragePath);
      await deleteObject(origRef);
    } catch (err) {
      console.error(`Error deleting original storage object: ${originalStoragePath}`, err);
    }
  }

  // 5. Delete thumbnail object from Storage
  if (storage && thumbnailStoragePath) {
    try {
      const thumbRef = ref(storage, thumbnailStoragePath);
      await deleteObject(thumbRef);
    } catch (err) {
      console.error(`Error deleting thumbnail storage object: ${thumbnailStoragePath}`, err);
    }
  }
}
