import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetch all events belonging to a specific photographer.
 */
export async function getEventsByPhotographer(photographerId) {
  if (!db) return [];
  const q = query(
    collection(db, "events"),
    where("photographerId", "==", photographerId)
  );
  
  const querySnapshot = await getDocs(q);
  const events = [];
  querySnapshot.forEach((doc) => {
    events.push(doc.data());
  });
  
  // Sort in memory to avoid Firestore composite index requirement
  events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return events;
}

/**
 * Fetch a single event by its ID.
 */
export async function getEventById(eventId) {
  if (!db) return null;
  const docRef = doc(db, "events", eventId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Create a new event (automatically generating a unique event ID).
 */
export async function createEvent(photographerId, eventData) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const eventsRef = collection(db, "events");
  const newDocRef = doc(eventsRef); // Auto-generated document ID
  const eventId = newDocRef.id;

  const finalEventData = {
    eventId,
    photographerId,
    eventName: eventData.eventName || "",
    brideName: eventData.brideName || "",
    groomName: eventData.groomName || "",
    eventDate: eventData.eventDate || "",
    location: eventData.location || "",
    description: eventData.description || "",
    coverImage: eventData.coverImage || "",
    password: eventData.password || "",
    visibility: eventData.visibility || "public", // 'public' or 'private'
    createdAt: new Date().toISOString()
  };

  await setDoc(newDocRef, finalEventData);
  return eventId;
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, eventData) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const docRef = doc(db, "events", eventId);
  await setDoc(docRef, eventData, { merge: true });
}

/**
 * Delete an event.
 */
export async function deleteEvent(eventId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  const docRef = doc(db, "events", eventId);
  await deleteDoc(docRef);
}

/**
 * Duplicate an existing event.
 */
export async function duplicateEvent(eventId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  
  // 1. Fetch original event details
  const original = await getEventById(eventId);
  if (!original) throw new Error("Original event not found.");
  
  // 2. Setup duplicate data
  const eventsRef = collection(db, "events");
  const newDocRef = doc(eventsRef);
  const newEventId = newDocRef.id;

  const duplicatedData = {
    ...original,
    eventId: newEventId,
    eventName: `${original.eventName} Copy`,
    createdAt: new Date().toISOString()
  };

  await setDoc(newDocRef, duplicatedData);
  return newEventId;
}
