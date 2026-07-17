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
import { auth } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!auth);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, name) => {
    if (!auth) throw new Error("Firebase Authentication is not initialized.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update user display name
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      // Force user object update in state by clone
      setUser({ ...auth.currentUser });
    }
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
