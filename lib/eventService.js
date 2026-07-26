import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from "firebase/firestore";
import { db } from "./firebase";
import { timelineLogger } from "./timeline/timelineLogger";

/**
 * Fetch events based on studioId or photographerId.
 * If studioId is provided, returns events belonging to that studio.
 * Otherwise, falls back to legacy photographerId.
 */
export async function getEvents({ studioId, photographerId }) {
  if (!db) return [];
  let q;
  if (studioId) {
    q = query(
      collection(db, "events"),
      where("studioId", "==", studioId)
    );
  } else if (photographerId) {
    q = query(
      collection(db, "events"),
      where("photographerId", "==", photographerId)
    );
  } else {
    return [];
  }
  
  const querySnapshot = await getDocs(q);
  const events = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status !== "trashed") {
      events.push(serializeFirestoreData(data));
    }
  });
  
  // Sort in memory to avoid Firestore composite index requirement during migration
  events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return events;
}

/**
 * Helper to recursively serialize Firestore objects (converting Timestamp fields to ISO strings)
 * so they can be passed across Next.js Server-to-Client Component boundaries.
 */
export function serializeFirestoreData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Firestore Timestamp object (both native SDK and custom JSON-like structure)
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  
  if (typeof data === 'object') {
    if (typeof data.seconds === 'number' && typeof data.nanoseconds === 'number') {
      return new Date(data.seconds * 1000 + data.nanoseconds / 1000000).toISOString();
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return data.map(serializeFirestoreData);
    }

    // Standard plain object
    const serialized = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
    return serialized;
  }

  return data;
}

/**
 * Fetch all events belonging to a specific photographer (Legacy helper).
 */
export async function getEventsByPhotographer(photographerId) {
  return getEvents({ photographerId });
}

/**
 * Fetch a single event by its ID.
 */
export async function getEventById(eventId) {
  if (!db) return null;
  const docRef = doc(db, "events", eventId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return serializeFirestoreData(data);
  }
  return null;
}

/**
 * Create a new event.
 */
export async function createEvent(eventData) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const eventsRef = collection(db, "events");
  const newDocRef = doc(eventsRef); // Auto-generated document ID
  const eventId = newDocRef.id;
  const timestamp = new Date().toISOString();

  const finalEventData = {
    eventId,
    studioId: eventData.studioId || null,
    photographerId: eventData.photographerId || eventData.createdBy || "", // fallback compatibility
    createdBy: eventData.createdBy || "",
    updatedBy: eventData.createdBy || "",
    eventName: eventData.eventName || "",
    brideName: eventData.brideName || "",
    groomName: eventData.groomName || "",
    eventDate: eventData.eventDate || "",
    location: eventData.location || "",
    description: eventData.description || "",
    coverImage: eventData.coverImage || "",
    password: eventData.password || "",
    visibility: eventData.visibility || "public", // 'public' or 'private'
    status: eventData.status || "active", // 'draft' | 'active' | 'completed' | 'archived'
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(newDocRef, finalEventData);

  if (finalEventData.studioId) {
    try {
      const { syncStudioEvents } = await import("./studioService");
      await syncStudioEvents(finalEventData.studioId);
    } catch (e) {
      console.error("Failed to sync studio events in createEvent:", e);
    }
  }

  try {
    timelineLogger.logEventCreated(
      { id: eventId, studioId: finalEventData.studioId, name: finalEventData.eventName },
      { id: finalEventData.createdBy }
    );
  } catch (err) {
    console.error("Failed to log event creation to timeline:", err);
  }

  return eventId;
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, eventData) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const docRef = doc(db, "events", eventId);
  const updatedData = {
    ...eventData,
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, updatedData, { merge: true });

  try {
    const existing = await getEventById(eventId);
    if (existing) {
      timelineLogger.logEventUpdated(
        { id: eventId, studioId: existing.studioId, name: existing.eventName },
        eventData,
        { id: eventData.updatedBy || existing.updatedBy }
      );
      if (existing.studioId) {
        const { syncStudioEvents } = await import("./studioService");
        await syncStudioEvents(existing.studioId);
      }
    }
  } catch (err) {
    console.error("Failed to log event update to timeline:", err);
  }
}

/**
 * Delete an event.
 */
export async function deleteEvent(eventId, actor = {}) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const existing = await getEventById(eventId);
  if (!existing) throw new Error("Event not found.");

  const { recoveryService } = require('./recovery/recoveryService');

  await recoveryService.moveToTrash({
    resourceType: 'event',
    resourceId: eventId,
    studioId: existing.studioId,
    originalCollection: 'events',
    snapshot: existing,
    reason: 'User deleted event',
    metadata: {
      deletedFrom: 'events-list',
      eventName: existing.eventName
    }
  }, actor.uid ? actor : { uid: existing.updatedBy || existing.createdBy || 'system', name: 'User' });

  return { ...existing, status: 'trashed' };
}

/**
 * Duplicate an existing event.
 */
export async function duplicateEvent(eventId, duplicateByUserId = "") {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  // 1. Fetch original event details
  const original = await getEventById(eventId);
  if (!original) throw new Error("Original event not found.");
  
  // 2. Setup duplicate data
  const eventsRef = collection(db, "events");
  const newDocRef = doc(eventsRef);
  const newEventId = newDocRef.id;
  const timestamp = new Date().toISOString();

  const duplicatedData = {
    ...original,
    eventId: newEventId,
    eventName: `${original.eventName} Copy`,
    createdBy: duplicateByUserId || original.createdBy || "",
    updatedBy: duplicateByUserId || original.createdBy || "",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(newDocRef, duplicatedData);
  if (original.studioId) {
    try {
      const { syncStudioEvents } = await import("./studioService");
      await syncStudioEvents(original.studioId);
    } catch (e) {
      console.error("Failed to sync studio events in duplicateEvent:", e);
    }
  }
  return newEventId;
}

/**
 * Retrieve studio settings. Returns default settings if not exists.
 */
export async function getStudioSettings(studioId) {
  if (!db || !studioId) return {
    allowPhotographerCreateEvent: true,
    allowPhotographerDeleteEvent: false,
    allowGuestDownload: true,
    allowFaceSearch: true,
    allowDriveUpload: true,
    watermarkEnabled: false
  };

  const docRef = doc(db, "studioSettings", studioId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  
  // Default values
  return {
    studioId,
    allowPhotographerCreateEvent: true,
    allowPhotographerDeleteEvent: false,
    allowGuestDownload: true,
    allowFaceSearch: true,
    allowDriveUpload: true,
    watermarkEnabled: false
  };
}

/**
 * Assign a user as a member of an event (Prepared for future authorization).
 */
export async function addEventMember(eventId, userId, role, assignedBy) {
  if (!db) return;
  const memberRef = doc(db, "eventMembers", `${eventId}_${userId}`);
  await setDoc(memberRef, {
    eventId,
    userId,
    role, // e.g. "editor" | "uploader" | "viewer"
    assignedBy,
    assignedAt: new Date().toISOString()
  });
}
