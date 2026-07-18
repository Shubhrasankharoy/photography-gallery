"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

/**
 * Ensures a users/{uid} document exists in Firestore.
 * Called after every successful sign-in so new and existing accounts
 * are always synced. Uses merge:true to preserve existing fields
 * (e.g. isAdmin) without overwriting them.
 */
async function ensureUserDocument(firebaseUser) {
  if (!db || !firebaseUser) return;
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // First time — create the document with defaults
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        isAdmin: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Subsequent logins — keep existing fields, just refresh mutable ones
      await setDoc(
        userRef,
        {
          displayName: firebaseUser.displayName || snap.data().displayName || "",
          email: firebaseUser.email || snap.data().email || "",
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("Failed to sync user document:", err);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!auth);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync users document whenever auth state resolves to a logged-in user
        await ensureUserDocument(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, name) => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      setUser({ ...auth.currentUser });
    }
    // Explicitly create the Firestore document right after registration
    await ensureUserDocument({ ...userCredential.user, displayName: name });
    return userCredential;
  };

  const login = async (email, password) => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
