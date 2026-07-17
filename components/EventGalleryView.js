"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";

export default function EventGalleryView({ event, initialPhotos = [], clientPin = "" }) {
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(new Set(initialPhotos.map((p) => p.photoId)));
  };

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const ITEMS_PER_PAGE = 12;

  const [prevPhotos, setPrevPhotos] = useState(initialPhotos);

  // Reset page when initialPhotos changes (render-time state adjustment)
  if (initialPhotos !== prevPhotos) {
    setPrevPhotos(initialPhotos);
    setPage(1);
  }

  // Derive visible photos directly from state
  const visiblePhotos = initialPhotos.slice(0, page * ITEMS_PER_PAGE);

  // Infinite Scroll Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePhotos.length < initialPhotos.length) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [visiblePhotos.length, initialPhotos.length]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setZoom(1);
    setIsDetailsOpen(false);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setZoom(1);
    setIsDetailsOpen(false);
  }, []);

  const navigateLightbox = useCallback((direction) => {
    setZoom(1); // Reset zoom on navigation
    setLightboxIndex((prevIndex) => {
      if (prevIndex === null) return null;
      let newIndex = prevIndex + direction;
      if (newIndex < 0) newIndex = initialPhotos.length - 1;
      if (newIndex >= initialPhotos.length) newIndex = 0;
      return newIndex;
    });
  }, [initialPhotos.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, navigateLightbox]);

  // Handle body overflow side-effect
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));
  const resetZoom = () => setZoom(1);

  // Helper to format file size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Cross-origin file download handler
  const handleDownload = async (photo) => {
    if (downloadingId) return;
    setDownloadingId(photo.photoId);
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = photo.name || `photo_${photo.photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);

      // Log download to Firestore asynchronously
      fetch("/api/downloads/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.eventId,
          photographerId: event.photographerId,
          photoIds: [photo.photoId],
        }),
      }).catch((err) => console.error("Failed to log download history:", err));
    } catch (error) {
      console.error("Blob download failed, opening URL in new window instead:", error);
      window.open(photo.url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  // Bulk downloads handler for multiple selected photos
  const handleDownloadMultiple = async () => {
    if (selectedPhotoIds.size === 0 || bulkDownloading) return;
    setBulkDownloading(true);
    
    const idsArray = Array.from(selectedPhotoIds);
    
    // Log all downloads to the history endpoint in a single batch call
    try {
      await fetch("/api/downloads/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.eventId,
          photographerId: event.photographerId,
          photoIds: idsArray,
        }),
      });
    } catch (err) {
      console.error("Failed to log bulk download stats:", err);
    }

    // Sequentially trigger browser download of each photo with a 200ms delay
    for (let i = 0; i < idsArray.length; i++) {
      const photoId = idsArray[i];
      const photo = initialPhotos.find((p) => p.photoId === photoId);
      if (!photo) continue;

      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = photo.name || `photo_${photo.photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Bulk photo download failed:", error);
        window.open(photo.url, "_blank");
      }

      // Add a small delay between downloads to prevent browser lockups or popup blocks
      if (i < idsArray.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setBulkDownloading(false);
    setIsSelectMode(false);
    setSelectedPhotoIds(new Set());
  };

  const currentPhoto = lightboxIndex !== null ? initialPhotos[lightboxIndex] : null;

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/80 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/event/${event.eventId}${clientPin ? `?pin=${clientPin}` : ""}`}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
            >
              <svg className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{event.eventName}</h1>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Interactive Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
              {initialPhotos.length} {initialPhotos.length === 1 ? "Photo" : "Photos"}
            </span>
            {initialPhotos.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectMode((prev) => !prev);
                  setSelectedPhotoIds(new Set());
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 select-none cursor-pointer ${
                  isSelectMode
                    ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {isSelectMode ? "Exit Select" : "Select Photos"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {initialPhotos.length > 0 ? (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {visiblePhotos.map((photo, index) => (
                <div
                  key={photo.photoId}
                  onClick={() => {
                    if (isSelectMode) {
                      togglePhotoSelection(photo.photoId);
                    } else {
                      openLightbox(index);
                    }
                  }}
                  className={`break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl border transition-all duration-300 animate-fade-in-up ${
                    isSelectMode
                      ? "cursor-pointer"
                      : "cursor-zoom-in hover:shadow-lg"
                  } ${
                    selectedPhotoIds.has(photo.photoId)
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-950"
                  }`}
                >
                  {isSelectMode && (
                    <div className="absolute top-3 left-3 z-10 select-none">
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedPhotoIds.has(photo.photoId)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white/90 border-zinc-300 dark:bg-zinc-950/90 dark:border-zinc-700"
                      }`}>
                        {selectedPhotoIds.has(photo.photoId) && (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.name}
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 rounded-2xl"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  {!isSelectMode && (
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-xs font-semibold text-white truncate">{photo.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-zinc-300 font-light">View Details</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo);
                          }}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-all"
                          title="Download Photo"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sentinel element for infinite scroll */}
            {visiblePhotos.length < initialPhotos.length && (
              <div ref={sentinelRef} className="py-12 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 max-w-lg mx-auto mt-10">
            <svg className="h-16 w-16 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-base font-bold text-zinc-800 dark:text-zinc-200">No photos in workspace</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed font-light">
              This client workspace is ready, but no proofing images have been uploaded yet. Check back soon!
            </p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && currentPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/98 backdrop-blur-lg select-none" onClick={closeLightbox}>
          {/* Lightbox Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/80 to-transparent w-full z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <button
                onClick={closeLightbox}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all"
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white/90 truncate max-w-[200px]">{currentPhoto.name}</p>
                <p className="text-[10px] text-white/50">{formatBytes(currentPhoto.size)}</p>
              </div>
            </div>

            {/* Counter */}
            <div className="text-xs font-semibold text-white/95 bg-white/10 px-3 py-1.5 rounded-full">
              {lightboxIndex + 1} of {initialPhotos.length}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center rounded-full bg-white/10 border border-white/5 p-0.5">
                <button
                  onClick={zoomOut}
                  className="p-1.5 rounded-full hover:bg-white/15 text-white/90 disabled:opacity-40 transition-all"
                  disabled={zoom === 1}
                  title="Zoom Out"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </button>
                <span className="text-[10px] font-bold text-white/80 w-8 text-center">{zoom}x</span>
                <button
                  onClick={zoomIn}
                  className="p-1.5 rounded-full hover:bg-white/15 text-white/90 disabled:opacity-40 transition-all"
                  disabled={zoom === 4}
                  title="Zoom In"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                </button>
                {zoom > 1 && (
                  <button
                    onClick={resetZoom}
                    className="p-1.5 rounded-full hover:bg-white/15 text-white/90 transition-all"
                    title="Reset Zoom"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Details toggle */}
              <button
                onClick={() => setIsDetailsOpen((prev) => !prev)}
                className={`p-2 rounded-full transition-all ${isDetailsOpen ? "bg-indigo-600 text-white" : "hover:bg-white/10 text-white/80 hover:text-white"}`}
                title="Details"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Download */}
              <button
                onClick={() => handleDownload(currentPhoto)}
                disabled={downloadingId !== null}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all disabled:opacity-50"
                title="Download Photo"
              >
                {downloadingId === currentPhoto.photoId ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Lightbox viewport & Details layout */}
          <div className="flex-1 flex flex-col md:flex-row relative items-stretch overflow-hidden">
            {/* Center Area (Arrows and Image) */}
            <div className="flex-1 flex items-center justify-between relative p-4 overflow-hidden">
              {/* Left Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(-1);
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 text-white/85 hover:text-white transition-all hover:scale-105"
                title="Previous Photo"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Main Image container */}
              <div 
                className="flex-1 h-full flex items-center justify-center overflow-auto transition-transform duration-300 ease-out"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.name}
                  style={{
                    transform: `scale(${zoom})`,
                    cursor: zoom > 1 ? "grab" : "default",
                    maxHeight: "85vh",
                    maxWidth: "100%",
                  }}
                  className="object-contain shadow-2xl transition-transform duration-200"
                />
              </div>

              {/* Right Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(1);
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 text-white/85 hover:text-white transition-all hover:scale-105"
                title="Next Photo"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Details Panel Side Drawer */}
            {isDetailsOpen && (
              <div
                className="w-full md:w-80 shrink-0 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 p-6 text-left flex flex-col justify-between overflow-y-auto animate-fade-in-left z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Image Specifications</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Name</label>
                      <p className="text-xs text-zinc-300 font-medium break-all mt-1">{currentPhoto.name}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Size</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1">{formatBytes(currentPhoto.size)}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Media Type</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1 uppercase">{currentPhoto.type || "Unknown Format"}</p>
                    </div>

                    {currentPhoto.createdAt && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Uploaded On</label>
                        <p className="text-xs text-zinc-300 font-medium mt-1">
                          {new Date(currentPhoto.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-zinc-800 pt-5">
                  <button
                    onClick={() => handleDownload(currentPhoto)}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Original File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Selection Action Bar */}
      {isSelectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/95 backdrop-blur-md">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {selectedPhotoIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPhotos}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 transition-all text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={handleDownloadMultiple}
                disabled={selectedPhotoIds.size === 0 || bulkDownloading}
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-indigo-650 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {bulkDownloading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Selected</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedPhotoIds(new Set());
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
