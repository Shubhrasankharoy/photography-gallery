import { 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  collection, 
  limit, 
  startAfter, 
  orderBy, 
  updateDoc 
} from "firebase/firestore";
import { db } from "./firebase";

// In-session cache for resolved users, studios, and galleries
const usersCache = {};
const studiosCache = {};
const galleryCache = {};

// Extensible lifecycle hook registry
export const galleryHooks = {
  beforeLoadGallery: [],
  afterLoadGallery: [],
  beforeOpenLightbox: [],
  afterOpenLightbox: []
};

// Functions to register hooks dynamically
export function addHook(hookName, callback) {
  if (galleryHooks[hookName]) {
    galleryHooks[hookName].push(callback);
  }
}

async function triggerHooks(hookName, data) {
  const hooks = galleryHooks[hookName] || [];
  for (const hook of hooks) {
    try {
      await hook(data);
    } catch (err) {
      console.error(`Error in hook ${hookName}:`, err);
    }
  }
}

/**
 * Hydrates photo documents with missing uploader and studio names.
 * Performs batch parallel fetching to minimize database roundtrips.
 */
export async function hydratePhotoMetadata(photos) {
  if (!db || !photos || photos.length === 0) return photos;

  const uniqueUserIds = new Set();
  const uniqueStudioIds = new Set();

  photos.forEach(photo => {
    const uploaderId = photo.uploadedBy || photo.photographerId;
    if (uploaderId && !photo.uploaderName && !usersCache[uploaderId]) {
      uniqueUserIds.add(uploaderId);
    }
    if (photo.studioId && !photo.studioName && !studiosCache[photo.studioId]) {
      uniqueStudioIds.add(photo.studioId);
    }
  });

  const userFetches = Array.from(uniqueUserIds).map(async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        usersCache[uid] = snap.data().displayName || snap.data().email || "Unknown";
      } else {
        usersCache[uid] = "Unknown";
      }
    } catch (err) {
      console.error(`Error resolving user ${uid}:`, err);
      usersCache[uid] = "Unknown";
    }
  });

  const studioFetches = Array.from(uniqueStudioIds).map(async (sid) => {
    try {
      const snap = await getDoc(doc(db, "studios", sid));
      if (snap.exists()) {
        studiosCache[sid] = snap.data().studioName || "Unknown";
      } else {
        studiosCache[sid] = "Unknown";
      }
    } catch (err) {
      console.error(`Error resolving studio ${sid}:`, err);
      studiosCache[sid] = "Unknown";
    }
  });

  await Promise.all([...userFetches, ...studioFetches]);

  return photos.map(photo => {
    const uploaderId = photo.uploadedBy || photo.photographerId;
    const uploaderName = photo.uploaderName || (uploaderId ? usersCache[uploaderId] : "Unknown") || "Unknown";
    const studioName = photo.studioName || (photo.studioId ? studiosCache[photo.studioId] : null) || "Legacy (No Studio)";

    return {
      ...photo,
      uploaderName,
      studioName,
      // Future AI field placeholders
      faceIndexed: photo.faceIndexed !== undefined ? photo.faceIndexed : false,
      embeddingVersion: photo.embeddingVersion !== undefined ? photo.embeddingVersion : null,
      aiProcessed: photo.aiProcessed !== undefined ? photo.aiProcessed : false,
      // Hidden album support placeholders
      albumId: photo.albumId || null,
      albumName: photo.albumName || null
    };
  });
}

/**
 * Preload gallery photos to keep cache populated early.
 */
export async function preloadGallery(eventId) {
  if (!eventId) return;
  try {
    await getGalleryPhotos({ eventId });
  } catch (err) {
    console.error("Failed to preload gallery cache:", err);
  }
}

/**
 * Invalidates the cached list of photos for an event.
 */
export function invalidateCache(eventId) {
  if (eventId) {
    delete galleryCache[eventId];
  }
}

/**
 * Retrieves all photos or paginated batches for a gallery workspace.
 */
export async function getGalleryPhotos({ 
  studioId, 
  eventId, 
  photographerId, 
  limitCount = 1000, 
  startAfterDoc = null,
  endBeforeDoc = null
}) {
  if (!db) return [];

  await triggerHooks("beforeLoadGallery", { studioId, eventId, photographerId });

  // Resolve studioId from Event first if not provided
  let activeStudioId = studioId;
  if (!activeStudioId && eventId) {
    const eventSnap = await getDoc(doc(db, "events", eventId));
    if (eventSnap.exists()) {
      activeStudioId = eventSnap.data().studioId || null;
    }
  }

  // Check cache for full event list in the browser context if no custom cursors are used
  const isServer = typeof window === "undefined";
  const useCache = !isServer && eventId && !startAfterDoc && !endBeforeDoc;
  if (useCache && galleryCache[eventId]) {
    const cachedPhotos = galleryCache[eventId];
    await triggerHooks("afterLoadGallery", cachedPhotos);
    return cachedPhotos.slice(0, limitCount);
  }

  let q;
  if (activeStudioId && eventId) {
    q = query(
      collection(db, "photos"),
      where("studioId", "==", activeStudioId),
      where("eventId", "==", eventId),
      where("status", "==", "active")
    );
  } else if (eventId) {
    q = query(
      collection(db, "photos"),
      where("eventId", "==", eventId)
    );
  } else if (photographerId) {
    q = query(
      collection(db, "photos"),
      where("photographerId", "==", photographerId)
    );
  } else {
    return [];
  }

  const querySnapshot = await getDocs(q);
  const photos = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status === "active") {
      photos.push({ id: doc.id, ...data, _snapshot: doc });
    }
  });

  // Sort in memory to avoid Firestore composite index requirement
  photos.sort((a, b) => {
    const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  // Handle in-memory slice pagination if startAfterDoc/limitCount is used
  let paginatedPhotos = photos;
  if (startAfterDoc) {
    const startIndex = photos.findIndex(p => p.photoId === startAfterDoc.photoId);
    if (startIndex !== -1) {
      paginatedPhotos = photos.slice(startIndex + 1);
    }
  }
  if (limitCount) {
    paginatedPhotos = paginatedPhotos.slice(0, limitCount);
  }

  const hydrated = await hydratePhotoMetadata(paginatedPhotos);

  const serialized = hydrated.map(photo => {
    const copy = { ...photo };
    delete copy._snapshot;
    if (copy.createdAt && typeof copy.createdAt.toDate === "function") {
      copy.createdAt = copy.createdAt.toDate().toISOString();
    }
    if (copy.updatedAt && typeof copy.updatedAt.toDate === "function") {
      copy.updatedAt = copy.updatedAt.toDate().toISOString();
    }
    if (copy.deletedAt && typeof copy.deletedAt.toDate === "function") {
      copy.deletedAt = copy.deletedAt.toDate().toISOString();
    }
    return copy;
  });

  if (useCache) {
    galleryCache[eventId] = serialized;
  }

  await triggerHooks("afterLoadGallery", serialized);
  return serialized;
}

/**
 * Returns statistics for a specific event. Falls back to counting photos on legacy events.
 */
export async function getGalleryStatistics(eventId) {
  if (!db || !eventId) return { photoCount: 0, totalSize: 0 };

  const eventRef = doc(db, "events", eventId);
  const eventSnap = await getDoc(eventRef);
  if (eventSnap.exists()) {
    const data = eventSnap.data();
    if (data.photoCount !== undefined && data.totalSize !== undefined) {
      return {
        photoCount: data.photoCount,
        totalSize: data.totalSize,
        lastUpload: data.lastUpload || null,
        lastUpdated: data.lastUpdated || null
      };
    }
  }

  // Self-healing: compute statistics if they do not exist
  const photos = await getGalleryPhotos({ eventId });
  const photoCount = photos.length;
  const totalSize = photos.reduce((sum, photo) => sum + (photo.fileSize || photo.size || 0), 0);
  const timestamp = new Date().toISOString();

  try {
    await updateDoc(eventRef, {
      photoCount,
      totalSize,
      lastUpdated: timestamp
    });
  } catch (err) {
    console.error(`Failed to self-heal stats for event ${eventId}:`, err);
  }

  return { photoCount, totalSize, lastUpload: null, lastUpdated: timestamp };
}

/**
 * Fetches details of a single photo document.
 */
export async function getPhoto(photoId) {
  if (!db || !photoId) return null;
  const snap = await getDoc(doc(db, "photos", photoId));
  if (snap.exists()) {
    const data = [snap.data()];
    const hydrated = await hydratePhotoMetadata(data);
    return hydrated[0];
  }
  return null;
}

/**
 * Generic Activity Feed fetching API.
 */
export async function getActivityFeed({ studioId, eventId, uploadedBy, cursor = null, limitCount = 10 }) {
  if (!db) return { activities: [], nextCursor: null };

  let q = collection(db, "uploadActivities");

  if (studioId) {
    q = query(q, where("studioId", "==", studioId));
  } else if (eventId) {
    q = query(q, where("eventId", "==", eventId));
  } else if (uploadedBy) {
    q = query(q, where("uploadedBy", "==", uploadedBy));
  }

  q = query(q, orderBy("createdAt", "desc"));

  if (cursor) {
    q = query(q, startAfter(cursor));
  }

  q = query(q, limit(limitCount));

  const querySnapshot = await getDocs(q);
  const activities = [];
  let lastDoc = null;
  querySnapshot.forEach((doc) => {
    activities.push(doc.data());
    lastDoc = doc;
  });

  return {
    activities,
    nextCursor: lastDoc
  };
}
