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
import { timelineLogger } from "./timeline/timelineLogger";

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

  // Background activity logging
  try {
    timelineLogger.logStudioCreated(
      { id: studioId, name: studioData.studioName },
      { id: userId }
    );
  } catch (err) {
    console.error("Failed to log studio creation timeline:", err);
  }

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

/**
 * Invite a member to the studio.
 */
export async function inviteMember(studioId, email, role, invitedByUid) {
  if (!db) throw new Error("Firestore Database is not initialized.");

  // Check if invitation already exists for this email
  const invitationsRef = collection(db, "studioInvitations");
  const q = query(
    invitationsRef,
    where("studioId", "==", studioId),
    where("email", "==", email.toLowerCase().trim()),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("A pending invitation already exists for this email.");
  }

  // Also check if they are already a member
  // First, look up the user document by email to find their UID if they exist
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("email", "==", email.toLowerCase().trim()), limit(1));
  const userSnap = await getDocs(userQuery);
  if (!userSnap.empty) {
    const existingUid = userSnap.docs[0].id;
    const memberRef = doc(db, "studioMembers", `${studioId}_${existingUid}`);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      throw new Error("This user is already a member of this studio.");
    }
  }

  const newInviteRef = doc(invitationsRef);
  const timestamp = new Date().toISOString();
  await setDoc(newInviteRef, {
    invitationId: newInviteRef.id,
    studioId,
    email: email.toLowerCase().trim(),
    role,
    invitedBy: invitedByUid,
    status: "pending",
    createdAt: timestamp
  });
}

/**
 * Get all invitations sent by a studio.
 */
export async function getStudioInvitations(studioId) {
  if (!db) return [];
  const q = query(
    collection(db, "studioInvitations"),
    where("studioId", "==", studioId)
  );
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((doc) => {
    list.push(doc.data());
  });
  return list;
}

/**
 * Cancel/Delete an invitation.
 */
export async function cancelInvitation(invitationId) {
  if (!db) return;
  const { deleteDoc: firestoreDelete } = await import("firebase/firestore");
  const docRef = doc(db, "studioInvitations", invitationId);
  await firestoreDelete(docRef);
}

/**
 * Fetch invitations matching the user's email.
 */
export async function getPendingInvitations(email) {
  if (!db) return [];
  const q = query(
    collection(db, "studioInvitations"),
    where("email", "==", email.toLowerCase().trim()),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  const invitations = [];
  for (const d of snap.docs) {
    const data = d.data();
    // Resolve studio name
    const studioData = await getStudioById(data.studioId);
    invitations.push({
      ...data,
      studioName: studioData ? studioData.studioName : "Unknown Studio"
    });
  }
  return invitations;
}

/**
 * Accept a studio invitation.
 */
export async function acceptInvitation(invitationId, userId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  const inviteRef = doc(db, "studioInvitations", invitationId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) {
    throw new Error("Invitation not found.");
  }
  const inviteData = inviteSnap.data();

  const timestamp = new Date().toISOString();
  const batch = writeBatch(db);

  // 1. Add to studioMembers
  const memberRef = doc(db, "studioMembers", `${inviteData.studioId}_${userId}`);
  batch.set(memberRef, {
    studioId: inviteData.studioId,
    userId,
    role: inviteData.role,
    joinedAt: timestamp
  });

  // 2. Mark invite as accepted
  batch.update(inviteRef, {
    status: "accepted",
    updatedAt: timestamp
  });

  await batch.commit();
}

/**
 * Reject a studio invitation.
 */
export async function rejectInvitation(invitationId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  const inviteRef = doc(db, "studioInvitations", invitationId);
  await setDoc(inviteRef, { status: "rejected" }, { merge: true });
}

/**
 * Fetch all members of a studio.
 */
export async function getStudioMembers(studioId) {
  if (!db) return [];
  const q = query(
    collection(db, "studioMembers"),
    where("studioId", "==", studioId)
  );
  const snap = await getDocs(q);
  const members = [];
  for (const d of snap.docs) {
    const data = d.data();
    // Resolve user details from 'users' collection
    const userRef = doc(db, "users", data.userId);
    const userSnap = await getDoc(userRef);
    let displayName = "Unknown User";
    let email = "";
    if (userSnap.exists()) {
      displayName = userSnap.data().displayName || userSnap.data().email || "Active User";
      email = userSnap.data().email || "";
    }
    members.push({
      ...data,
      displayName,
      email
    });
  }
  return members;
}

/**
 * Remove a member from the studio.
 */
export async function removeStudioMember(studioId, userId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  const { deleteDoc: firestoreDelete } = await import("firebase/firestore");
  const memberRef = doc(db, "studioMembers", `${studioId}_${userId}`);
  await firestoreDelete(memberRef);
}

/**
 * Update member's role (promote/demote).
 */
export async function updateMemberRole(studioId, userId, newRole) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  const memberRef = doc(db, "studioMembers", `${studioId}_${userId}`);
  await setDoc(memberRef, { role: newRole }, { merge: true });
}

/**
 * Transfer ownership.
 */
export async function transferStudioOwnership(studioId, currentOwnerId, newOwnerId) {
  if (!db) throw new Error("Firestore Database is not initialized.");
  const batch = writeBatch(db);

  const currentOwnerRef = doc(db, "studioMembers", `${studioId}_${currentOwnerId}`);
  const newOwnerRef = doc(db, "studioMembers", `${studioId}_${newOwnerId}`);
  const studioRef = doc(db, "studios", studioId);

  // 1. Demote current owner to admin
  batch.update(currentOwnerRef, { role: "admin" });

  // 2. Promote new owner to owner
  batch.update(newOwnerRef, { role: "owner" });

  // 3. Update ownerUid on studio document
  batch.update(studioRef, { ownerUid: newOwnerId });

  await batch.commit();
}

