import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetch a photographer profile by their UID.
 */
export async function getProfileByUid(uid) {
  if (!db) return null;
  const docRef = doc(db, "photographers", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Fetch a photographer profile by their unique username.
 */
export async function getProfileByUsername(username) {
  if (!db) return null;
  const q = query(
    collection(db, "photographers"),
    where("username", "==", username.toLowerCase().trim()),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
}

/**
 * Check if a username is unique and not claimed by another photographer.
 */
export async function isUsernameUnique(username, currentUid) {
  if (!db) return true;
  const normalized = username.toLowerCase().trim();
  const q = query(
    collection(db, "photographers"),
    where("username", "==", normalized),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return true;
  }
  
  const existingDoc = querySnapshot.docs[0];
  // If the matching username belongs to the current user, it is unique/allowed
  return existingDoc.id === currentUid;
}

/**
 * Upload an image file (logo/cover) to Cloudinary and return the secure URL.
 */
export async function uploadProfileImage(file, folder, uid) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary credentials (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) are missing in .env.");
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `photographers/${uid}/${folder}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to upload image to Cloudinary.");
  }

  const data = await res.json();
  return data.secure_url;
}

/**
 * Write/Update photographer profile document in Firestore.
 */
export async function saveProfile(uid, profileData) {
  if (!db) {
    throw new Error("Firestore Database is not initialized.");
  }
  
  const docRef = doc(db, "photographers", uid);
  await setDoc(docRef, {
    uid,
    ...profileData,
    username: profileData.username.toLowerCase().trim(),
    joinedDate: profileData.joinedDate || new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetch all photographer profiles.
 */
export async function getAllPhotographers() {
  if (!db) return [];
  try {
    const q = query(collection(db, "photographers"));
    const querySnapshot = await getDocs(q);
    const photographers = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status !== "trashed") {
        photographers.push({ uid: doc.id, ...data });
      }
    });
    return photographers;
  } catch (error) {
    console.error("Error fetching photographers:", error);
    return [];
  }
}

/**
 * Fetch all events to compute stats across photographers.
 */
export async function getAllEvents() {
  if (!db) return [];
  try {
    const q = query(collection(db, "events"));
    const querySnapshot = await getDocs(q);
    const events = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status !== "trashed") {
        events.push({ eventId: doc.id, ...data });
      }
    });
    return events;
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
}
