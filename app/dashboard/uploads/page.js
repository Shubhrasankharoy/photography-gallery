"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getEventsByPhotographer } from "@/lib/eventService";
import { uploadPhoto, deletePhoto } from "@/lib/photoService";
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
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function UploadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [uploads, setUploads] = useState([]); // Array of { id, file, status, progress, error, photoData }
  const uploadsRef = useRef([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Load photographer's events
  useEffect(() => {
    async function loadEvents() {
      if (!user) return;
      try {
        const photographerEvents = await getEventsByPhotographer(user.uid);
        setEvents(photographerEvents);
        if (photographerEvents.length > 0) {
          setSelectedEventId(photographerEvents[0].eventId);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setIsFetching(false);
      }
    }

    if (user) {
      loadEvents();
    }
  }, [user]);

  // Handle file selection
  const handleFileSelect = async (files) => {
    console.log("handleFileSelect", { selectedEventId, fileCount: files.length });
    if (!selectedEventId) {
      alert("Please select an event first");
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Please select image files");
      return;
    }

    // Add files to uploads with initial state
    const newUploads = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "queued",
      progress: 0,
      error: null,
      photoData: null,
    }));

    const nextUploads = [...uploadsRef.current, ...newUploads];
    updateUploads(nextUploads);
    if (!isUploading) {
      uploadNextFile(nextUploads);
    }
  };

  // Keep ref in sync with uploads state
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const uploadNextFile = async (uploadList = uploadsRef.current) => {
    const queuedFile = uploadList.find((u) => u.status === "queued");
    console.log("uploadNextFile", {
      queuedFileId: queuedFile?.id,
      uploadCount: uploadList.length,
      uploading: isUploading,
    });

    if (!queuedFile) {
      setIsUploading(false);
      
      // Trigger Upload Complete Notification if we had uploads
      const successCount = uploadList.filter(u => u.status === "success").length;
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
      return;
    }

    setIsUploading(true);

    try {
      // Update status to uploading
      setUploads((prev) =>
        prev.map((u) =>
          u.id === queuedFile.id ? { ...u, status: "uploading", progress: 0 } : u
        )
      );

      // Generate thumbnail
      const thumbnail = await generateThumbnail(queuedFile.file);
      console.log("thumbnail generated", { fileName: queuedFile.file.name, thumbnailType: thumbnail?.type, thumbnailSize: thumbnail?.size });

      // Upload photo
      const photoData = await uploadPhoto(
        selectedEventId,
        user.uid,
        queuedFile.file,
        thumbnail,
        (percent) => {
          console.log("upload progress callback", queuedFile.id, Math.round(percent));
          setUploads((prev) =>
            prev.map((u) =>
              u.id === queuedFile.id ? { ...u, progress: Math.round(percent) } : u
            )
          );
        }
      );

      // Update status to success
      setUploads((prev) =>
        prev.map((u) =>
          u.id === queuedFile.id
            ? { ...u, status: "success", progress: 100, photoData }
            : u
        )
      );

      // Upload next file (use the ref-based function so it reads latest state)
      setTimeout(() => uploadNextFile(), 500);
    } catch (error) {
      console.error("Upload error:", error);

      // Update status to failed
      setUploads((prev) =>
        prev.map((u) =>
          u.id === queuedFile.id
            ? { ...u, status: "failed", error: error.message }
            : u
        )
      );

      // Continue with next file even if one fails
      setTimeout(() => uploadNextFile(), 500);
    }
  };

  // Retry failed upload
  const handleRetry = async (uploadId) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadId
          ? { ...u, status: "queued", progress: 0, error: null }
          : u
      )
    );
  };

  // Delete photo
  const handleDeletePhoto = async (upload) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      if (upload.photoData) {
        await deletePhoto(
          upload.photoData.photoId,
          upload.photoData.originalStoragePath,
          upload.photoData.thumbnailStoragePath
        );
      }

      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete photo: " + error.message);
    }
  };

  // Handle drag and drop
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

  // Handle file input
  const handleInputChange = (e) => {
    const { files } = e.currentTarget;
    handleFileSelect(files);
  };

  if (authLoading || !user) {
    return null;
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
          Drag and drop your images or select files from your computer. Thumbnails are generated automatically.
        </p>
      </div>

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
              No events found. Create an event first to start uploading photos.
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
                Supported formats: JPG, PNG, WebP, GIF (max 50 MB each)
              </p>
            </div>
          </div>

          {/* Upload Manager */}
          {uploads.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Upload Queue
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-0.5">
                    {uploads.filter((u) => u.status === "success").length} of{" "}
                    {uploads.length} uploaded
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {Math.round(
                      (uploads.filter((u) => u.status === "success").length /
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
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                            Uploading
                          </span>
                        )}
                        {upload.status === "success" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                            Success
                          </span>
                        )}
                        {upload.status === "failed" && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(upload.status === "uploading" || upload.status === "queued") && (
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
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(upload)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
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
