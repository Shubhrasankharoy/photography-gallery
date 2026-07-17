"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connected, setConnected] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const status = searchParams.get("status");
  const msg = searchParams.get("message");

  // Derive success and error states directly from URL search params
  const urlSuccess = status === "success" ? "Successfully connected to Google Drive!" : "";
  const urlError = status === "error" ? (msg || "OAuth connection failed. Please try again.") : "";

  const displaySuccess = success || urlSuccess;
  const displayError = error || urlError;

  // Clean up search parameters from the URL safely as a side-effect
  useEffect(() => {
    if (status) {
      router.replace("/dashboard/settings");
    }
  }, [status, router]);

  // Fetch folders from Google Drive API
  const fetchFolders = async (uid) => {
    try {
      const response = await fetch(`/api/drive/folders?uid=${uid}`);
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

  // Load photographer Google Drive connection status and folders
  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const docRef = doc(db, "photographers", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data();
          if (profile.googleDriveConnected) {
            setConnected(true);
            setSelectedFolderId(profile.googleDriveFolderId || "root");
            setSelectedFolderName(profile.googleDriveFolderName || "Root (My Drive)");
            
            // Load folders from Google Drive
            await fetchFolders(user.uid);
          } else {
            setConnected(false);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load connection settings.");
      } finally {
        setLoading(false);
      }
    }

    if (user && !authLoading) {
      loadSettings();
    }
  }, [user, authLoading]);

  // Disconnect Google Drive
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Original uploads will fall back to default space.")) {
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const docRef = doc(db, "photographers", user.uid);
      await setDoc(
        docRef,
        {
          googleDriveConnected: false,
          googleDriveToken: null,
          googleDriveFolderId: null,
          googleDriveFolderName: null,
        },
        { merge: true }
      );
      
      setConnected(false);
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

  // Save selected upload folder
  const handleSaveFolder = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const targetFolder = folders.find((f) => f.id === selectedFolderId);
      const folderName = targetFolder ? targetFolder.name : "Root (My Drive)";

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
      setSuccess(`Upload folder updated to "${folderName}".`);
    } catch (err) {
      console.error(err);
      setError("Failed to save folder selection.");
    } finally {
      setSaving(false);
    }
  };

  // Create new folder in Google Drive
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
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
      
      // Update in user profile directly
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

  const handleConnect = () => {
    if (!user) return;
    window.location.href = `/api/oauth/google?uid=${user.uid}`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-650 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black transition-colors duration-300 min-h-[85vh] text-left">
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          System Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
          Configure external cloud integrations, storage preferences, and OAuth connections.
        </p>
      </div>

      {/* Notifications banner */}
      {displayError && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Action Required</p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-light mt-0.5">{displayError}</p>
          </div>
        </div>
      )}

      {displaySuccess && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Operation Successful</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-light mt-0.5">{displaySuccess}</p>
          </div>
        </div>
      )}

      {/* Integration Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 transition-all duration-300">
        
        {/* Connection Status Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-zinc-850">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Google Drive Storage Connection</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-0.5">
                Automatically upload original full-resolution guest photos to Google Drive. Compressed thumbnails remain in Firebase.
              </p>
            </div>
          </div>

          <div>
            {connected ? (
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="w-full md:w-auto px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50"
              >
                {saving ? "Processing..." : "Disconnect Drive"}
              </button>
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

        {/* Folder Preference Customization */}
        {connected && (
          <div className="mt-8 space-y-8">
            
            {/* Folder selection dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Current Upload Directory
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-light text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
                  {saving ? "Saving..." : "Apply Selection"}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 font-light mt-1.5">
                Current setting: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{selectedFolderName}</span>
              </p>
            </div>

            {/* Create new folder inline form */}
            <div className="border-t border-zinc-200 dark:border-zinc-850 pt-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Create New Folder
              </label>

              <form onSubmit={handleCreateFolder} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="E.g., CaptureSpace_Portraits"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-light text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
                
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  {creatingFolder ? "Creating..." : "Create & Use"}
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
