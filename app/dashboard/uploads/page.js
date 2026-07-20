"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudio } from "@/context/StudioContext";
import { getEvents, getStudioSettings } from "@/lib/eventService";
import { uploadPhoto, deletePhoto, canPerformPhotoAction } from "@/lib/photoService";
import Link from "next/link";

/**
 * Generate a thumbnail blob from an image file via canvas compression
 */
async function generateThumbnail(file, maxWidth = 300, maxHeight = 300, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context for thumbnail generation."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL(file.type, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error("Failed to generate thumbnail Data URL."));
        }
      };
      img.onerror = (err) => reject(new Error("Thumbnail image load failed."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Unable to read file for thumbnail generation."));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract image metadata: width, height, orientation, dominantColor
 */
async function getImageMetadata(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const orientation = width >= height ? "landscape" : "portrait";
      
      let dominantColor = "#ffffff";
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          dominantColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
      } catch (e) {
        // Safe fallback
      }
      resolve({ width, height, orientation, dominantColor });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0, orientation: "landscape", dominantColor: "#ffffff" });
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a file checksum on the client (SHA-255 / SHA-256 equivalent hash representation)
 */
async function getFileChecksum(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.warn("Failed to generate file checksum:", err);
    return "";
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Format date to relative time string
 */
function formatDate(dateValue) {
  if (!dateValue) return "just now";
  const date = dateValue.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_UPLOAD_COUNT = 50; // Max files allowed in a single selection batch

export default function UploadsPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentStudio, currentRole, isLoading: studioLoading } = useStudio();
  const router = useRouter();
  
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [uploads, setUploads] = useState([]); // Array of { id, file, status, progress, error, photoData }
  const uploadsRef = useRef([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [studioSettings, setStudioSettings] = useState(null);

  const updateUploads = (nextUploads) => {
    uploadsRef.current = nextUploads;
    setUploads(nextUploads);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load events for the selected Studio
  useEffect(() => {
    async function loadEventsAndSettings() {
      if (!user || !currentStudio) {
        setEvents([]);
        setIsFetching(false);
        return;
      }
      try {
        setIsFetching(true);
        const [studioEvents, settings] = await Promise.all([
          getEvents({ studioId: currentStudio.studioId }),
          getStudioSettings(currentStudio.studioId)
        ]);
        setEvents(studioEvents);
        setStudioSettings(settings);
        if (studioEvents.length > 0) {
          setSelectedEventId(studioEvents[0].eventId);
        } else {
          setSelectedEventId("");
        }
      } catch (err) {
        console.error("Failed to load events/settings:", err);
      } finally {
        setIsFetching(false);
      }
    }

    if (user && currentStudio) {
      loadEventsAndSettings();
    }
  }, [user, currentStudio]);

  // Sync ref
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  // Handle file selection and validation
  const handleFileSelect = async (files) => {
    if (!currentStudio) {
      alert("No active studio selected. Please select or create a studio first.");
      return;
    }

    if (!selectedEventId) {
      alert("Please select an event first");
      return;
    }

    // Role Validation
    if (!currentRole) {
      alert("You do not have permission to upload files (Membership in studio is required).");
      return;
    }

    // Supported File Types Check
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Please select valid image files.");
      return;
    }

    // Maximum Upload Count Check
    if (imageFiles.length > MAX_UPLOAD_COUNT) {
      alert(`Maximum upload batch limit is ${MAX_UPLOAD_COUNT} files. Please select fewer files.`);
      return;
    }

    // Size check
    const validFiles = [];
    const oversizedFiles = [];
    for (const f of imageFiles) {
      if (f.size > MAX_FILE_SIZE) {
        oversizedFiles.push(f.name);
      } else {
        validFiles.push(f);
      }
    }

    if (oversizedFiles.length > 0) {
      alert(`The following files exceed the 50MB limit and will be skipped:\n- ${oversizedFiles.join("\n- ")}`);
    }

    if (validFiles.length === 0) return;

    // Add files to uploads with initial state: 'queued'
    const newUploads = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      status: "queued",
      progress: 0,
      error: null,
      photoData: null,
    }));

    const nextUploads = [...uploadsRef.current, ...newUploads];
    updateUploads(nextUploads);
    if (!isUploading) {
      processQueue(nextUploads);
    }
  };

  // Sequential chunked queue processing (batch size: 5)
  const processQueue = async (currentQueue = uploadsRef.current) => {
    if (isUploading) return;
    setIsUploading(true);

    let queue = [...currentQueue];
    const batchSize = 5;

    // Retrieve only files with 'queued' status
    let queuedItems = queue.filter((u) => u.status === "queued");

    while (queuedItems.length > 0) {
      const currentBatch = queuedItems.slice(0, batchSize);
      
      // Update UI state of batch items to 'uploading'
      setUploads((prev) =>
        prev.map((u) =>
          currentBatch.some((b) => b.id === u.id)
            ? { ...u, status: "uploading", progress: 0 }
            : u
        )
      );

      // Map batch files to upload promises
      const uploadPromises = currentBatch.map(async (item) => {
        try {
          // 1. Generate local thumbnail blob
          const thumbnail = await generateThumbnail(item.file);
          
          // 2. Extract dimensions/color & compute checksum on the client
          const [meta, checksum] = await Promise.all([
            getImageMetadata(item.file),
            getFileChecksum(item.file)
          ]);

          // Update UI state to 'processing' before server saving
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: "processing" } : u
            )
          );

          // 3. Perform upload
          const photoData = await uploadPhoto({
            eventId: selectedEventId,
            studioId: currentStudio.studioId,
            uploaderId: user.uid,
            file: item.file,
            thumbnail,
            onProgress: (percent) => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === item.id ? { ...u, progress: Math.round(percent) } : u
                )
              );
            },
            width: meta.width,
            height: meta.height,
            orientation: meta.orientation,
            dominantColor: meta.dominantColor,
            checksum
          });

          // Mark completed
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: "completed", progress: 100, photoData } : u
            )
          );
        } catch (error) {
          console.error("Upload error:", error);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? { ...u, status: "failed", error: error.message }
                : u
            )
          );
        }
      });

      await Promise.all(uploadPromises);
      
      // Advance chunk
      queuedItems = queuedItems.slice(batchSize);
    }

    setIsUploading(false);

    // Trigger Notification for successfully completed files
    const successCount = uploadsRef.current.filter(u => u.status === "completed").length;
    if (successCount > 0) {
      try {
        const { createNotification } = await import("@/lib/notificationService");
        const eventObj = events.find(e => e.eventId === selectedEventId);
        const eventName = eventObj ? eventObj.eventName : "your gallery event";
        
        await createNotification(user.uid, {
          type: "upload_complete",
          title: "Uploads Complete 📤",
          message: `Successfully uploaded ${successCount} photo(s) to "${eventName}".`,
          metadata: { eventId: selectedEventId, count: successCount }
        });
      } catch (err) {
        console.error("Failed to trigger upload complete notification:", err);
      }
    }
  };

  // Retry failed upload
  const handleRetry = async (uploadId) => {
    const updated = uploadsRef.current.map((u) =>
      u.id === uploadId ? { ...u, status: "queued", progress: 0, error: null } : u
    );
    updateUploads(updated);
    if (!isUploading) {
      processQueue(updated);
    }
  };

  // Delete photo (soft-delete with permissions checks)
  const handleDeletePhoto = async (upload) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      if (upload.photoData) {
        const hasPermission = await canPerformPhotoAction(
          currentStudio.studioId,
          user.uid,
          "delete",
          upload.photoData,
          studioSettings
        );

        if (!hasPermission) {
          alert("You do not have permission to delete this photo.");
          return;
        }

        await deletePhoto(
          upload.photoData.photoId,
          currentStudio.studioId,
          user.uid
        );
      }

      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete photo: " + error.message);
    }
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    handleFileSelect(files);
  };

  const handleInputChange = (e) => {
    const { files } = e.currentTarget;
    handleFileSelect(files);
  };

  if (authLoading || studioLoading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Loading uploads interface...</span>
        </div>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black transition-colors duration-300 min-h-[85vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Photo Upload Manager
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 font-light max-w-2xl">
          Drag and drop your images or select files from your computer. Uploads belong to the selected studio, event, and uploader.
        </p>
      </div>

      {/* Studio Banner info */}
      {currentStudio && (
        <div className="mb-6 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50 p-4 flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">Selected Studio</span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentStudio.studioName}</h4>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-750 dark:bg-indigo-900/50 dark:text-indigo-300 capitalize">
            Role: {currentRole}
          </span>
        </div>
      )}

      {/* Event Selector */}
      <div className="mb-8 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3">
          Select Event
        </label>
        {isFetching ? (
          <div className="text-sm text-zinc-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4">
            <p className="text-sm text-amber-900 dark:text-amber-400 font-light">
              No events found for this studio. Create an event first to start uploading photos.
            </p>
            <Link
              href="/dashboard/events/new"
              className="mt-3 inline-block text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Create Event →
            </Link>
          </div>
        ) : (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-light text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <option value="">-- Select an event --</option>
            {events.map((evt) => (
              <option key={evt.eventId} value={evt.eventId}>
                {evt.eventName} ({evt.location || "Location TBD"})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Drag and Drop Zone */}
      {selectedEvent && (
        <>
          {!currentRole ? (
            <div className="mb-8 rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-900/50 bg-rose-50/20 p-12 text-center">
              <p className="text-rose-700 dark:text-rose-400 font-semibold">
                You do not have member access to this studio. Uploading is disabled.
              </p>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-8 rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/20"
                  : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/20"
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {isDragging ? "Drop your images here" : "Drag & drop images here"}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 font-light">
                  or
                </p>
                <label className="mt-2">
                  <span className="cursor-pointer text-sm font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
                    Click to select files
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Supported formats: JPG, PNG, WebP, GIF (max 50 MB each, up to 50 files at once)
                </p>
              </div>
            </div>
          )}

          {/* Upload Manager */}
          {uploads.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Upload Queue
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-0.5">
                    {uploads.filter((u) => u.status === "completed").length} of{" "}
                    {uploads.length} uploaded
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {Math.round(
                      (uploads.filter((u) => u.status === "completed").length /
                        uploads.length) *
                        100
                    )}
                    %
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    Complete
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {upload.file.name}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                            {formatFileSize(upload.file.size)}
                          </span>
                          {upload.photoData && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                              {formatDate(upload.photoData.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {upload.status === "queued" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                            Queued
                          </span>
                        )}
                        {upload.status === "uploading" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-155 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                            Uploading
                          </span>
                        )}
                        {upload.status === "processing" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse">
                            Processing
                          </span>
                        )}
                        {upload.status === "completed" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-105 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                            Success
                          </span>
                        )}
                        {upload.status === "failed" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-105 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(upload.status === "uploading" || upload.status === "queued" || upload.status === "processing") && (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-light">
                            Progress
                          </span>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {upload.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {upload.error && (
                      <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3 flex items-start gap-2">
                        <svg
                          className="h-5 w-5 text-rose-500 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            Upload Failed
                          </p>
                          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-light mt-0.5">
                            {upload.error}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {upload.status === "failed" && (
                        <button
                          onClick={() => handleRetry(upload.id)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-55 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(upload)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-55 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No event selected */}
      {!selectedEvent && events.length > 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/30 p-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 font-light">
            Select an event to start uploading photos
          </p>
        </div>
      )}
    </div>
  );
}
