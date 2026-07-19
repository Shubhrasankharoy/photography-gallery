import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetch a studio by its ID.
 */
export async function getStudioById(studioId) {
  if (!db) return null;
  const docRef = doc(db, "studios", studioId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Fetch a studio by its unique slug.
 */
export async function getStudioBySlug(slug) {
  if (!db) return null;
  const q = query(
    collection(db, "studios"),
    where("studioSlug", "==", slug.toLowerCase().trim()),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
}

/**
 * Check if a studioSlug is unique and not claimed by another studio.
 */
export async function isStudioSlugUnique(slug, currentStudioId = null) {
  if (!db) return true;
  const normalized = slug.toLowerCase().trim();
  const q = query(
    collection(db, "studios"),
    where("studioSlug", "==", normalized),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return true;
  }
  
  const existingDoc = querySnapshot.docs[0];
  if (currentStudioId && existingDoc.id === currentStudioId) {
    return true;
  }
  return false;
}

/**
 * Fetch studios where the user is a member.
 */
export async function getUserStudios(userId) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "studioMembers"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const studioIds = [];
    querySnapshot.forEach((doc) => {
      studioIds.push(doc.data().studioId);
    });

    if (studioIds.length === 0) return [];

    // Fetch studio details
    const studios = [];
    for (const id of studioIds) {
      const studioData = await getStudioById(id);
      if (studioData) {
        // Find membership role
        const memberRef = doc(db, "studioMembers", `${id}_${userId}`);
        const memberSnap = await getDoc(memberRef);
        const role = memberSnap.exists() ? memberSnap.data().role : "member";
        studios.push({ ...studioData, userRole: role });
      }
    }
    return studios;
  } catch (error) {
    console.error("Error fetching user studios:", error);
    return [];
  }
}

/**
 * Create a new Studio.
 * Automatically adds the creator as the Owner.
 */
export async function createStudio(userId, studioData) {
  if (!db) {
    throw new Error("Firestore Database is not initialized.");
  }

  const studioSlug = studioData.studioSlug.toLowerCase().trim();
  const unique = await isStudioSlugUnique(studioSlug);
  if (!unique) {
    throw new Error("Studio slug is already taken.");
  }

  const studiosRef = collection(db, "studios");
  const newStudioDoc = doc(studiosRef); // Auto-generate ID
  const studioId = newStudioDoc.id;

  const timestamp = new Date().toISOString();
  const finalStudioData = {
    studioId,
    studioName: studioData.studioName,
    studioSlug,
    description: studioData.description || "",
    logo: studioData.logo || "",
    coverImage: studioData.coverImage || "",
    email: studioData.email || "",
    phone: studioData.phone || "",
    location: studioData.location || "",
    website: studioData.website || "",
    instagram: studioData.instagram || "",
    facebook: studioData.facebook || "",
    ownerUid: userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const batch = writeBatch(db);

  // 1. Create Studio Doc
  batch.set(newStudioDoc, finalStudioData);

  // 2. Add creator to studioMembers
  const memberDocRef = doc(db, "studioMembers", `${studioId}_${userId}`);
  batch.set(memberDocRef, {
    studioId,
    userId,
    role: "owner",
    joinedAt: timestamp
  });

  await batch.commit();

  return finalStudioData;
}

/**
 * Update studio document.
 */
export async function updateStudio(studioId, studioData) {
  if (!db) {
    throw new Error("Firestore Database is not initialized.");
  }

  const studioSlug = studioData.studioSlug.toLowerCase().trim();
  const unique = await isStudioSlugUnique(studioSlug, studioId);
  if (!unique) {
    throw new Error("Studio slug is already taken.");
  }

  const docRef = doc(db, "studios", studioId);
  const timestamp = new Date().toISOString();

  const finalData = {
    ...studioData,
    studioSlug,
    updatedAt: timestamp
  };

  await setDoc(docRef, finalData, { merge: true });
  return finalData;
}

/**
 * Upload studio assets to Cloudinary.
 */
export async function uploadStudioImage(file, folder, studioId) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary credentials (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) are missing in .env.");
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `studios/${studioId}/${folder}`);

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
