"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudio } from "@/context/StudioContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, writeBatch, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
import { 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { 
  getProfileByUid, 
  isUsernameUnique, 
  uploadProfileImage, 
  saveProfile 
} from "@/lib/profileService";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { currentStudio } = useStudio();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status")) {
        return "storage";
      }
    }
    return "profile";
  }); // profile, security, storage, preferences

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    studioName: "",
    photographerName: "",
    username: "",
    bio: "",
    phone: "",
    email: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
  });

  // Profile image links
  const [currentImages, setCurrentImages] = useState({
    logo: "",
    coverImage: "",
  });

  // Selected files for upload
  const [selectedFiles, setSelectedFiles] = useState({
    logo: null,
    coverImage: null,
  });

  // Preview URLs
  const [previews, setPreviews] = useState({
    logo: "",
    coverImage: "",
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Danger Zone - Account Deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Storage State (Google Drive)
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [lastSync, setLastSync] = useState("");
  const [provider, setProvider] = useState("google-drive");
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Preferences State (Theme & Notifications)
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState({
    notifyNewUploads: true,
    notifyDownloads: true,
    weeklyDigest: false,
  });

  // UI status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const status = searchParams.get("status");
  const msg = searchParams.get("message");

  // Derive success/error states directly from URL params
  const urlSuccess = status === "success" ? "Successfully connected to Google Drive!" : "";
  const urlError = status === "error" ? (msg || "OAuth connection failed. Please try again.") : "";

  const displaySuccess = success || urlSuccess;
  const displayError = error || urlError;

  // Clean URL search parameters safely
  useEffect(() => {
    if (status) {
      router.replace("/dashboard/settings");
    }
  }, [status, router]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previews.logo) URL.revokeObjectURL(previews.logo);
      if (previews.coverImage) URL.revokeObjectURL(previews.coverImage);
    };
  }, [previews]);

  // Retrieve folders from Google Drive
  const fetchFolders = async (uid, studioId = "") => {
    try {
      const response = await fetch(`/api/drive/folders?uid=${uid}&studioId=${studioId}`);
      if (!response.ok) {
        throw new Error("Failed to retrieve Google Drive folders");
      }
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve Google Drive folders. Make sure authorization is active.");
    }
  };

  // Load all settings
  useEffect(() => {
    async function loadAllSettings() {
      if (!user) return;
      try {
        // Load Profile Details
        const profile = await getProfileByUid(user.uid);
        if (profile) {
          setProfileForm({
            studioName: profile.studioName || "",
            photographerName: profile.photographerName || "",
            username: profile.username || "",
            bio: profile.bio || "",
            phone: profile.phone || "",
            email: profile.email || user.email || "",
            location: profile.location || "",
            website: profile.website || "",
            instagram: profile.instagram || "",
            facebook: profile.facebook || "",
          });
          setCurrentImages({
            logo: profile.logo || "",
            coverImage: profile.coverImage || "",
          });
          setNotifications({
            notifyNewUploads: profile.notifyNewUploads !== undefined ? profile.notifyNewUploads : true,
            notifyDownloads: profile.notifyDownloads !== undefined ? profile.notifyDownloads : true,
            weeklyDigest: profile.weeklyDigest !== undefined ? profile.weeklyDigest : false,
          });

          // Load Google Drive state from driveConnections
          let driveConnected = false;
          let folderId = "root";
          let folderName = "Root (My Drive)";
          let email = "";
          let statusStr = "Disconnected";
          let syncTimeStr = "";
          let providerStr = "google-drive";

          if (currentStudio) {
            const q = query(
              collection(db, "driveConnections"),
              where("userId", "==", user.uid),
              where("studioId", "==", currentStudio.studioId),
              where("status", "==", "connected")
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const data = snap.docs[0].data();
              driveConnected = true;
              folderId = data.rootFolderId || "root";
              folderName = data.googleDriveFolderName || "Root (My Drive)";
              email = data.driveEmail || "";
              statusStr = data.status || "connected";
              providerStr = data.provider || "google-drive";
              if (data.lastSyncAt) {
                const d = data.lastSyncAt.toDate ? data.lastSyncAt.toDate() : new Date(data.lastSyncAt);
                syncTimeStr = d.toLocaleString();
              } else if (data.updatedAt) {
                const d = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
                syncTimeStr = d.toLocaleString();
              }
            }
          }

          // Fallback to legacy profile if not found
          if (!driveConnected && profile.googleDriveConnected) {
            driveConnected = true;
            folderId = profile.googleDriveFolderId || "root";
            folderName = profile.googleDriveFolderName || "Root (My Drive)";
            email = profile.email || user.email || "";
            statusStr = "Connected (Legacy)";
            providerStr = "google-drive";
          }

          if (driveConnected) {
            setConnected(true);
            setConnectedEmail(email);
            setConnectionStatus(statusStr);
            setProvider(providerStr);
            setLastSync(syncTimeStr);
            setSelectedFolderId(folderId);
            setSelectedFolderName(folderName);
            await fetchFolders(user.uid, currentStudio?.studioId || "");
          } else {
            setConnected(false);
            setConnectedEmail("");
            setConnectionStatus("Disconnected");
          }
        } else {
          setProfileForm((prev) => ({ ...prev, email: user.email || "" }));
        }

        // Initialize Theme Toggle State
        const savedTheme = localStorage.getItem("theme");
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(savedTheme || systemTheme);

      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    if (user && !authLoading) {
      loadAllSettings();
    }
  }, [user, authLoading, currentStudio]);

  // Handle Input Changes for Profile Form
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSuccess("");
    setError("");
  };

  // Handle File uploads for Logo and Cover Image
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, [type]: "File must be an image." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [type]: "Image size must be less than 5MB." }));
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]);
    }
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    if (errors[type]) {
      setErrors((prev) => ({ ...prev, [type]: "" }));
    }
    setSuccess("");
  };

  // Profile Form Validation
  const validateProfileForm = () => {
    const tempErrors = {};
    if (!profileForm.studioName.trim()) {
      tempErrors.studioName = "Studio Name is required.";
    }
    if (!profileForm.photographerName.trim()) {
      tempErrors.photographerName = "Photographer Name is required.";
    }

    const usernameRegex = /^[a-z0-9-]+$/;
    if (!profileForm.username.trim()) {
      tempErrors.username = "Username URL handle is required.";
    } else if (!usernameRegex.test(profileForm.username)) {
      tempErrors.username = "Username must contain only lowercase letters, numbers, and hyphens.";
    }

    if (profileForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email)) {
        tempErrors.email = "Please enter a valid email address.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Save Photographer Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // 1. Check Username Uniqueness
      const unique = await isUsernameUnique(profileForm.username, user.uid);
      if (!unique) {
        setErrors((prev) => ({
          ...prev,
          username: "This username is already taken. Please choose another handle.",
        }));
        setSaving(false);
        return;
      }

      // 2. Upload Images if selected
      let uploadedLogoUrl = currentImages.logo;
      let uploadedCoverUrl = currentImages.coverImage;

      if (selectedFiles.logo) {
        uploadedLogoUrl = await uploadProfileImage(selectedFiles.logo, "logo", user.uid);
      }
      if (selectedFiles.coverImage) {
        uploadedCoverUrl = await uploadProfileImage(selectedFiles.coverImage, "coverImage", user.uid);
      }

      // 3. Save to Firestore
      const updatedProfile = {
        ...profileForm,
        logo: uploadedLogoUrl,
        coverImage: uploadedCoverUrl,
      };

      await saveProfile(user.uid, updatedProfile);

      setCurrentImages({
        logo: uploadedLogoUrl,
        coverImage: uploadedCoverUrl,
      });
      setSelectedFiles({ logo: null, coverImage: null });
      setSuccess("Profile settings updated successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  // Change Password Action
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSaving(true);

    try {
      const activeUser = auth.currentUser;
      if (!activeUser) throw new Error("No active authenticated user.");

      // Reauthenticate user before password updates
      if (securityForm.currentPassword) {
        const credential = EmailAuthProvider.credential(activeUser.email, securityForm.currentPassword);
        await reauthenticateWithCredential(activeUser, credential);
      }

      await updatePassword(activeUser, securityForm.newPassword);
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password updated successfully.");

      // Trigger Password Changed Notification
      try {
        const { createNotification } = await import("@/lib/notificationService");
        await createNotification(activeUser.uid, {
          type: "password_changed",
          title: "Password Updated 🔐",
          message: "Your CaptureSpace account password was changed successfully. If you did not make this change, please reset your password immediately."
        });
      } catch (err) {
        console.error("Failed to trigger password changed notification:", err);
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login" || err.code === "auth/wrong-password") {
        setError("Re-authentication failed. Please enter your correct current password, or sign out and sign back in to modify security settings.");
      } else {
        setError(err.message || "Failed to update account password.");
      }
    } finally {
      setSaving(false);
    }
  };


  // Delete Account Action
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (deleteConfirmText.toLowerCase() !== user.email.toLowerCase()) {
      setError("Email confirmation does not match your account email.");
      return;
    }

    setSaving(true);
    setShowDeleteModal(false);

    try {
      const activeUser = auth.currentUser;
      if (!activeUser) throw new Error("No active authenticated user.");

      // Reauthenticate if current password is provided
      if (securityForm.currentPassword) {
        const credential = EmailAuthProvider.credential(activeUser.email, securityForm.currentPassword);
        await reauthenticateWithCredential(activeUser, credential);
      }

      // 1. Delete Firestore Documents & Cascade Content
      const batch = writeBatch(db);

      // Delete users document
      const userDocRef = doc(db, "users", user.uid);
      batch.delete(userDocRef);

      // Delete photographers document
      const photographerDocRef = doc(db, "photographers", user.uid);
      batch.delete(photographerDocRef);

      // Retrieve and delete photographer's events, photos, downloads, and views
      const eventsQuery = query(collection(db, "events"), where("photographerId", "==", user.uid));
      const eventsSnap = await getDocs(eventsQuery);
      eventsSnap.forEach((docSnap) => {
        batch.delete(doc(db, "events", docSnap.id));
      });

      const photosQuery = query(collection(db, "photos"), where("photographerId", "==", user.uid));
      const photosSnap = await getDocs(photosQuery);
      photosSnap.forEach((docSnap) => {
        batch.delete(doc(db, "photos", docSnap.id));
      });

      const downloadsQuery = query(collection(db, "downloads"), where("photographerId", "==", user.uid));
      const downloadsSnap = await getDocs(downloadsQuery);
      downloadsSnap.forEach((docSnap) => {
        batch.delete(doc(db, "downloads", docSnap.id));
      });

      const viewsQuery = query(collection(db, "views"), where("photographerId", "==", user.uid));
      const viewsSnap = await getDocs(viewsQuery);
      viewsSnap.forEach((docSnap) => {
        batch.delete(doc(db, "views", docSnap.id));
      });

      await batch.commit();

      // 2. Delete Auth User Credentials
      await deleteUser(activeUser);

      // 3. Log out and redirect
      await logout();
      router.push("/");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setError("Account deletion requires recent authentication. Please enter your current password under security settings, or sign out and sign back in to complete deletion.");
      } else {
        setError(err.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Google Drive Connection Handler
  const handleConnect = () => {
    if (!user) return;
    const studioParam = currentStudio ? `&studioId=${currentStudio.studioId}` : "";
    window.location.href = `/api/oauth/google?uid=${user.uid}${studioParam}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Original uploads will fall back to default storage.")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const studioId = currentStudio ? currentStudio.studioId : "";
      const response = await fetch(`/api/drive/disconnect?uid=${user.uid}&studioId=${studioId}`, {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      setConnected(false);
      setConnectedEmail("");
      setConnectionStatus("Disconnected");
      setFolders([]);
      setSelectedFolderId("");
      setSelectedFolderName("");
      setSuccess("Disconnected Google Drive successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to disconnect Google Drive.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFolder = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const targetFolder = folders.find((f) => f.id === selectedFolderId);
      const folderName = targetFolder ? targetFolder.name : "Root (My Drive)";

      // Update new driveConnections schema
      if (currentStudio) {
        const q = query(
          collection(db, "driveConnections"),
          where("userId", "==", user.uid),
          where("studioId", "==", currentStudio.studioId),
          where("status", "==", "connected")
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await setDoc(snap.docs[0].ref, {
            rootFolderId: selectedFolderId,
            googleDriveFolderName: folderName, // Cached display name
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      // Maintain legacy photographer profile
      const docRef = doc(db, "photographers", user.uid);
      await setDoc(
        docRef,
        {
          googleDriveFolderId: selectedFolderId,
          googleDriveFolderName: folderName,
        },
        { merge: true }
      );

      setSelectedFolderName(folderName);
      setSuccess(`Upload directory updated to "${folderName}".`);
    } catch (err) {
      console.error(err);
      setError("Failed to save folder selection.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    setError("");
    setSuccess("");

    try {
      const studioId = currentStudio ? currentStudio.studioId : "";
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          studioId,
          folderName: newFolderName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create folder");
      }

      const newFolder = await res.json();
      setFolders((prev) => [...prev, newFolder]);
      setSelectedFolderId(newFolder.id);
      setSelectedFolderName(newFolder.name);
      setNewFolderName("");

      // Update new driveConnections schema
      if (currentStudio) {
        const q = query(
          collection(db, "driveConnections"),
          where("userId", "==", user.uid),
          where("studioId", "==", currentStudio.studioId),
          where("status", "==", "connected")
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await setDoc(snap.docs[0].ref, {
            rootFolderId: newFolder.id,
            googleDriveFolderName: newFolder.name,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      const docRef = doc(db, "photographers", user.uid);
      await setDoc(
        docRef,
        {
          googleDriveFolderId: newFolder.id,
          googleDriveFolderName: newFolder.name,
        },
        { merge: true }
      );

      setSuccess(`Created folder "${newFolder.name}" and selected it for uploads.`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create new folder.");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Preferences: Theme Toggling and Notification Preferences
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const docRef = doc(db, "photographers", user.uid);
      await setDoc(docRef, notifications, { merge: true });
      setSuccess("Preferences saved successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to save preferences settings.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-650 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black transition-colors duration-300 min-h-[85vh] text-left">
      
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light font-sans">
            Manage your photographer profile, credentials, storage integrations, and app settings.
          </p>
        </div>
      </div>

      {/* Status Notifications */}
      {displayError && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Action Required</p>
            <p className="text-[11px] text-rose-700 dark:text-rose-450 font-light mt-0.5 leading-relaxed">{displayError}</p>
          </div>
        </div>
      )}

      {displaySuccess && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Success</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-450 font-light mt-0.5">{displaySuccess}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Tab List */}
        <div className="flex lg:flex-col overflow-x-auto w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-850 pb-2 lg:pb-0 lg:pr-6 gap-2 shrink-0 scrollbar-none">
          <button
            onClick={() => { setActiveTab("profile"); setError(""); setSuccess(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "profile"
                ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </button>
          
          <button
            onClick={() => { setActiveTab("security"); setError(""); setSuccess(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "security"
                ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security & Login
          </button>

          <button
            onClick={() => { setActiveTab("storage"); setError(""); setSuccess(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "storage"
                ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Cloud Storage
          </button>

          <button
            onClick={() => { setActiveTab("preferences"); setError(""); setSuccess(""); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "preferences"
                ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Preferences
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 sm:p-8 shadow-xs">
          
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-55 pb-3 border-b border-zinc-200/50 dark:border-zinc-850">
                Edit Studio & Profile Settings
              </h2>

              {/* Avatar Logo & Cover photo row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
                    Studio Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {previews.logo || currentImages.logo ? (
                        <img src={previews.logo || currentImages.logo} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-8 w-8 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.964 18.901a22.42 22.42 0 00-11.928 0m0 0a2.247 2.247 0 00-1.425 2.248.75.75 0 00.75.75h13.25a.75.75 0 00.75-.75 2.248 2.248 0 00-1.425-2.248zM12 11.996a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={(e) => handleFileChange(e, "logo")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        Upload logo
                      </button>
                      {errors.logo && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.logo}</p>}
                    </div>
                  </div>
                </div>

                {/* Cover Image Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
                    Profile Cover Banner
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-32 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {previews.coverImage || currentImages.coverImage ? (
                        <img src={previews.coverImage || currentImages.coverImage} alt="Cover" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-8 w-8 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={coverInputRef}
                        onChange={(e) => handleFileChange(e, "coverImage")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        Upload cover
                      </button>
                      {errors.coverImage && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.coverImage}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard text inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Studio Name
                  </label>
                  <input
                    type="text"
                    name="studioName"
                    value={profileForm.studioName}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {errors.studioName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.studioName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Photographer Name
                  </label>
                  <input
                    type="text"
                    name="photographerName"
                    value={profileForm.photographerName}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {errors.photographerName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.photographerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Username URL Handle
                  </label>
                  <div className="relative flex items-stretch">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-450 text-xs">
                      /photographer/
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileInputChange}
                      className="flex-1 px-4 py-2.5 rounded-r-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {errors.username && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {errors.email && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Studio Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Website Address
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={profileForm.website}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={profileForm.instagram}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                    Facebook Handle
                  </label>
                  <input
                    type="text"
                    name="facebook"
                    value={profileForm.facebook}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                  Studio Biography
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  value={profileForm.bio}
                  onChange={handleProfileInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & LOGIN */}
          {activeTab === "security" && (
            <div className="space-y-8">
              {/* Password update form */}
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-55 pb-3 border-b border-zinc-200/50 dark:border-zinc-850">
                  Update Account Password
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? "Processing..." : "Update Password"}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Account deletion */}
              <div className="pt-8 border-t border-rose-200/50 dark:border-rose-950/20 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Danger Zone: Delete Account</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-1 max-w-xl leading-relaxed">
                      Permanently delete your photographer profile and close your CaptureSpace account. This action is irreversible. All galleries, event structures, and database records will be erased.
                    </p>
                  </div>
                </div>

                {!showDeleteModal ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-all"
                  >
                    Delete Account Permanent
                  </button>
                ) : (
                  <div className="p-5 border border-rose-250 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/5 rounded-2xl max-w-xl space-y-4 animate-fade-in">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 leading-normal">
                      Confirm by typing your email address <span className="font-bold underline select-all">{user.email}</span> below:
                    </p>
                    <input
                      type="email"
                      placeholder={user.email}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={saving || deleteConfirmText.toLowerCase() !== user.email.toLowerCase()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        Confirm Delete Irreversibly
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                        className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE INTEGRATION */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              
              {/* Connection Status Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-850">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Google Drive Cloud Storage</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-0.5 max-w-md">
                      Sync and back up client proofing images to Google Drive. Keep low-res versions in Firebase Storage.
                    </p>
                  </div>
                </div>

                <div>
                  {connected ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleConnect}
                        className="w-full md:w-auto px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50"
                      >
                        Reconnect
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={saving}
                        className="w-full md:w-auto px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50"
                      >
                        {saving ? "Processing..." : "Disconnect Drive"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className="w-full md:w-auto px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6H5v-2h6V5h2v6h6v2h-6v6z" />
                      </svg>
                      Connect Google Drive
                    </button>
                  )}
                </div>
              </div>

              {/* Connection Information Panel */}
              {connected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-850 text-xs">
                  <div>
                    <span className="font-semibold text-zinc-400">Connected Email:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">{connectedEmail || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-400">Connection Status:</span>{" "}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 capitalize">
                      {connectionStatus}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-400">Last Sync:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200">{lastSync || "Just now"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-400">Provider:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200 uppercase">{provider}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-400">Root Folder:</span>{" "}
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{selectedFolderName}</span>
                  </div>
                </div>
              )}

              {/* Folder Preferences Customization */}
              {connected && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Default Upload Directory
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="root">Root (My Drive)</option>
                        {folders
                          .filter((f) => f.id !== "root")
                          .map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                      </select>
                      
                      <button
                        onClick={handleSaveFolder}
                        disabled={saving}
                        className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                      >
                        {saving ? "Saving..." : "Apply Directory"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-light mt-1.5">
                      Current: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{selectedFolderName}</span>
                    </p>
                  </div>

                  {/* Create new folder form */}
                  <div className="border-t border-zinc-200 dark:border-zinc-850 pt-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Create New Folder
                    </label>
                    <form onSubmit={handleCreateFolder} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        placeholder="E.g., CaptureSpace_Weddings"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-50 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={creatingFolder}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                      >
                        {creatingFolder ? "Creating..." : "Create & Map"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PREFERENCES & TOGGLES */}
          {activeTab === "preferences" && (
            <div className="space-y-8">
              
              {/* Theme Settings Toggle */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-55 pb-2 border-b border-zinc-200/50 dark:border-zinc-850">
                  Visual Interface Theme
                </h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={`flex-1 flex flex-col items-center p-4 border rounded-2xl transition-all ${
                      theme === "light"
                        ? "border-indigo-600 bg-indigo-50/10 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400"
                        : "border-zinc-200 dark:border-zinc-850 bg-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14.25 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <span className="text-xs font-bold">Light Theme</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={`flex-1 flex flex-col items-center p-4 border rounded-2xl transition-all ${
                      theme === "dark"
                        ? "border-indigo-600 bg-indigo-50/10 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400"
                        : "border-zinc-200 dark:border-zinc-850 bg-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="text-xs font-bold">Dark Theme</span>
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-55 pb-2 border-b border-zinc-200/50 dark:border-zinc-850">
                  Notification Dispatch Preferences
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={notifications.notifyNewUploads}
                      onChange={(e) => setNotifications({ ...notifications, notifyNewUploads: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded-sm border-zinc-300 focus:ring-indigo-500"
                    />
                    <span>Email alert when guests or clients upload photos to your event spaces</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={notifications.notifyDownloads}
                      onChange={(e) => setNotifications({ ...notifications, notifyDownloads: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded-sm border-zinc-300 focus:ring-indigo-500"
                    />
                    <span>Email alert when photos are downloaded from your public galleries</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded-sm border-zinc-300 focus:ring-indigo-500"
                    />
                    <span>Subscribe to weekly summary statistics (views, downloads, and disk space usage)</span>
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-850">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
