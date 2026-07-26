"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStudio } from "@/context/StudioContext";
import { useSelectionManager } from "@/hooks/useSelectionManager";
import WatermarkOverlay from "@/components/WatermarkOverlay";
import Slideshow from "@/components/Slideshow";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

const DOWNLOAD_INTERVAL_MS = 200;

export default function EventGalleryView({ event, initialPhotos = [], clientPin = "" }) {
  const { user } = useAuth();
  const { currentRole } = useStudio();
  const selection = useSelectionManager();

  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Advanced feature states
  const [allowDownload, setAllowDownload] = useState(true);
  const [canManagePhoto, setCanManagePhoto] = useState(false);
  const [favoritedPhotos, setFavoritedPhotos] = useState(new Set());
  const [studioSettings, setStudioSettings] = useState({});
  const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(null);
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Actor / Guest resolution
  const [actorId, setActorId] = useState("");
  const [actorType, setActorType] = useState("guest");

  // Indexing status states
  const [indexingStatus, setIndexingStatus] = useState(null);
  const [failedJobs, setFailedJobs] = useState([]);
  const [queuePosition, setQueuePosition] = useState(0);
  const [facesIndexed, setFacesIndexed] = useState(0);
  const [deletePhotoDialog, setDeletePhotoDialog] = useState({ isOpen: false, photo: null });
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  useEffect(() => {
    if (!event?.eventId) return;

    // Listen to photos to count indexing
    const qPhotos = query(
      collection(db, 'photos'),
      where('eventId', '==', event.eventId)
    );

    const unsubPhotos = onSnapshot(qPhotos, (photoSnap) => {
      const activePhotos = photoSnap.docs
        .map(d => d.data())
        .filter(p => p.status === 'active');
      
      const total = activePhotos.length;
      if (total === 0) {
        setIndexingStatus(null);
        return;
      }

      const completed = activePhotos.filter(
        p => p.faceIndexStatus === 'completed' || p.faceIndexStatus === 'failed'
      ).length;

      // Listen to faceEmbeddings count
      const qEmbeddings = query(
        collection(db, 'faceEmbeddings'),
        where('eventId', '==', event.eventId),
        where('status', '==', 'active')
      );
      const unsubEmbeddings = onSnapshot(qEmbeddings, (embSnap) => {
        setFacesIndexed(embSnap.size);
      });

      // Listen to faceIndexJobs to determine statuses
      const qJobs = query(
        collection(db, 'faceIndexJobs'),
        where('eventId', '==', event.eventId)
      );

      const unsubJobs = onSnapshot(qJobs, (jobSnap) => {
        const jobs = jobSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const failed = jobs.filter(j => j.status === 'failed' || j.status === 'dead');
        setFailedJobs(failed);

        const pendingJobs = jobs.filter(j => j.status === 'pending');
        const runningJobs = jobs.filter(j => j.status === 'running');

        // Estimate queue position if there are pending jobs
        if (pendingJobs.length > 0) {
          const oldestJob = pendingJobs.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeA - timeB;
          })[0];
          
          if (oldestJob && oldestJob.createdAt) {
            const qQueuePos = query(
              collection(db, 'faceIndexJobs'),
              where('status', '==', 'pending'),
              where('createdAt', '<', oldestJob.createdAt)
            );
            getDocs(qQueuePos).then(posSnap => {
              setQueuePosition(posSnap.size + 1);
            }).catch(err => console.error(err));
          }
        } else {
          setQueuePosition(0);
        }

        // Map statuses to Waiting, Queued, Processing, Indexed, Failed
        if (failed.length > 0) {
          setIndexingStatus({
            type: 'failed',
            completed,
            total,
            failedCount: failed.length
          });
        } else if (runningJobs.length > 0) {
          setIndexingStatus({
            type: 'processing',
            completed,
            total
          });
        } else if (pendingJobs.length > 0) {
          setIndexingStatus({
            type: 'queued',
            completed,
            total
          });
        } else if (completed < total && jobs.length === 0) {
          setIndexingStatus({
            type: 'waiting',
            completed,
            total
          });
        } else if (completed < total) {
          setIndexingStatus({
            type: 'processing',
            completed,
            total
          });
        } else {
          setIndexingStatus({
            type: 'ready',
            completed,
            total
          });
        }
      });

      return () => {
        unsubEmbeddings();
        unsubJobs();
      };
    });

    return () => unsubPhotos();
  }, [event?.eventId]);

  const handleRetryAllFailed = async () => {
    if (failedJobs.length === 0) return;
    try {
      const { queueService } = await import('@/lib/queue/queueService');
      await Promise.all(
        failedJobs.map(job => queueService.retryJob(job.id, user))
      );
    } catch (err) {
      console.error('Failed to retry all jobs:', err);
    }
  };

  const fileInputRef = useRef(null);

  // Resolve Actor ID (guest vs authenticated user) safely inside deferred effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.uid) {
        setActorId(user.uid);
        setActorType("user");
      } else {
        let localId = localStorage.getItem("gallery_guest_id");
        if (!localId) {
          localId = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("gallery_guest_id", localId);
        }
        setActorId(localId);
        setActorType("guest");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  // Load favorites for the resolved actor
  useEffect(() => {
    if (!actorId || !event?.eventId) return;
    let active = true;
    const loadFavorites = async () => {
      try {
        const { getFavorites } = await import("@/lib/galleryService");
        const favs = await getFavorites({ eventId: event.eventId, actorId });
        if (active) {
          const favIds = new Set(favs.map(f => f.photoId));
          setFavoritedPhotos(favIds);
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };
    loadFavorites();
    return () => {
      active = false;
    };
  }, [actorId, event?.eventId]);

  // Load Studio Settings
  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      if (!event?.studioId) {
        if (active) {
          setAllowDownload(true);
          setStudioSettings({});
        }
        return;
      }
      try {
        const { getStudioSettings } = await import("@/lib/eventService");
        const settings = await getStudioSettings(event.studioId);
        const isMember = currentRole === "owner" || currentRole === "admin" || currentRole === "photographer";
        if (active) {
          setStudioSettings(settings);
          setAllowDownload(settings.allowGuestDownload || isMember);
        }
      } catch (err) {
        console.error("Failed to load studio settings:", err);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, [event?.studioId, currentRole]);

  // Auto-open lightbox if photoId query parameter is present (used by face search redirects)
  useEffect(() => {
    if (typeof window === "undefined" || !initialPhotos || initialPhotos.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const photoIdParam = urlParams.get("photoId");
    if (photoIdParam) {
      const idx = initialPhotos.findIndex(p => p.photoId === photoIdParam);
      if (idx !== -1) {
        Promise.resolve().then(() => setLightboxIndex(idx));
      }
    }
  }, [initialPhotos]);

  // Determine current active photolist based on favorites filter
  const filteredPhotos = filterFavorites 
    ? initialPhotos.filter(p => favoritedPhotos.has(p.photoId)) 
    : initialPhotos;

  const currentPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  // Check photo permissions
  useEffect(() => {
    let active = true;
    const checkPerms = async () => {
      if (!currentPhoto || !event?.studioId || !user?.uid) {
        if (active) setCanManagePhoto(false);
        return;
      }
      try {
        const { canPerformPhotoAction } = await import("@/lib/photoService");
        const allowed = await canPerformPhotoAction(event.studioId, user.uid, "delete", currentPhoto);
        if (active) {
          setCanManagePhoto(allowed);
        }
      } catch (err) {
        console.error("Failed to check photo manager perms:", err);
      }
    };
    checkPerms();
    return () => {
      active = false;
    };
  }, [currentPhoto, user?.uid, event?.studioId]);

  // Download logic (Single)
  const handleDownload = async (photo) => {
    if (downloadingId || !photo) return;
    setDownloadingId(photo.photoId);
    try {
      const response = await fetch(`${photo.url}&filename=${encodeURIComponent(photo.name || "photo.jpg")}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = photo.name || `photo_${photo.photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);

      // Async download logging
      fetch("/api/downloads/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.eventId,
          photographerId: event.photographerId,
          photoIds: [photo.photoId],
        }),
      }).then(() => {
        import("@/lib/notificationService").then(({ createNotification }) => {
          createNotification(event.photographerId, {
            type: "download",
            title: "Photo Downloaded 📥",
            message: `A client downloaded 1 photo from your gallery "${event.eventName}".`,
            metadata: { eventId: event.eventId, count: 1 }
          });
        }).catch(err => console.error("Notification import error:", err));
      }).catch((err) => console.error("Failed to log download history:", err));
    } catch (error) {
      console.error("Blob download failed, opening URL in new window instead:", error);
      window.open(photo.url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeletePhotoFromGallery = (photo) => {
    if (!photo || !user?.uid) return;
    setDeletePhotoDialog({ isOpen: true, photo });
  };

  const handleConfirmDeletePhoto = async () => {
    const photo = deletePhotoDialog.photo;
    if (!photo || !user?.uid) return;
    setIsDeletingPhoto(true);
    try {
      const { deletePhoto } = await import("@/lib/photoService");
      await deletePhoto(photo.photoId, event.studioId, user.uid);
      setDeletePhotoDialog({ isOpen: false, photo: null });
      window.location.reload();
    } catch (err) {
      alert("Failed to delete photo: " + err.message);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleReplaceFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentPhoto || !user?.uid) return;
    try {
      const { replacePhoto } = await import("@/lib/photoService");
      alert("Uploading replacement photo...");
      await replacePhoto({
        photoId: currentPhoto.photoId,
        studioId: event.studioId,
        userId: user.uid,
        newFile: file
      });
      alert("Photo replaced successfully!");
      window.location.reload();
    } catch (err) {
      alert("Failed to replace photo: " + err.message);
    }
  };

  // Toggle favorite on the current photo
  const handleToggleFavorite = async (photoId) => {
    if (!actorId) return;
    try {
      const { toggleFavorite } = await import("@/lib/galleryService");
      const isFav = await toggleFavorite({
        photoId,
        actorId,
        actorType,
        studioId: event.studioId,
        eventId: event.eventId
      });
      setFavoritedPhotos(prev => {
        const next = new Set(prev);
        if (isFav) {
          next.add(photoId);
        } else {
          next.delete(photoId);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleSharePhoto = async (photo) => {
    if (!photo) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.name,
          text: `Check out this photo: ${photo.name}`,
          url: photo.url
        });
      } catch (err) {
        console.log("Share failed, falling back to clipboard:", err);
        try {
          await navigator.clipboard.writeText(photo.url);
          alert("Link copied to clipboard for sharing!");
        } catch (clipErr) {
          console.error("Clipboard copy failed:", clipErr);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(photo.url);
        alert("Link copied to clipboard for sharing!");
      } catch (clipErr) {
        console.error("Clipboard copy failed:", clipErr);
      }
    }
  };

  const handleCopyLink = async (photo) => {
    if (!photo) return;
    try {
      await navigator.clipboard.writeText(photo.url);
      alert("Photo direct link copied!");
    } catch (clipErr) {
      console.error("Clipboard copy failed:", clipErr);
    }
  };

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const ITEMS_PER_PAGE = 12;

  // Reset page when filter or initial photos change safely in deferred tick to avoid render loop
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [filterFavorites, initialPhotos]);

  const visiblePhotos = filteredPhotos.slice(0, page * ITEMS_PER_PAGE);

  // Infinite Scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePhotos.length < filteredPhotos.length) {
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
  }, [visiblePhotos.length, filteredPhotos.length]);

  // Record Event View
  useEffect(() => {
    if (!event?.eventId || !event?.photographerId) return;

    const recordView = async () => {
      try {
        await fetch("/api/views/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: event.eventId,
            photographerId: event.photographerId,
          }),
        });
      } catch (err) {
        console.error("Error recording event view:", err);
      }
    };

    recordView();
  }, [event?.eventId, event?.photographerId]);

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
    setZoom(1);
    setLightboxIndex((prevIndex) => {
      if (prevIndex === null) return null;
      let newIndex = prevIndex + direction;
      if (newIndex < 0) newIndex = filteredPhotos.length - 1;
      if (newIndex >= filteredPhotos.length) newIndex = 0;
      return newIndex;
    });
  }, [filteredPhotos.length]);

  // Action-Based Lightbox Toolbar configurations as a plain array (avoids ref warnings during render)
  const toolbarActions = currentPhoto ? [
    {
      id: "download",
      label: "Download",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      onClick: () => handleDownload(currentPhoto),
      disabled: downloadingId !== null,
      visible: allowDownload
    },
    {
      id: "favorite",
      label: "Favorite",
      icon: (
        <svg className="h-5 w-5" fill={favoritedPhotos.has(currentPhoto.photoId) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: () => handleToggleFavorite(currentPhoto.photoId),
      visible: true,
      colorClass: favoritedPhotos.has(currentPhoto.photoId) ? "text-rose-500 hover:text-rose-605" : "text-white/80 hover:text-white"
    },
    {
      id: "watermark",
      label: "Watermark Preview",
      icon: (
        <svg className="h-5 w-5" fill={showWatermarkPreview ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      onClick: () => setShowWatermarkPreview(p => !p),
      visible: true,
      colorClass: showWatermarkPreview ? "text-indigo-400" : "text-white/80 hover:text-white"
    },
    {
      id: "slideshow",
      label: "Start Slideshow",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setSlideshowIndex(lightboxIndex),
      visible: true
    },
    {
      id: "info",
      label: "Photo Info",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setIsDetailsOpen(prev => !prev),
      visible: true,
      colorClass: isDetailsOpen ? "text-indigo-400" : "text-white/80 hover:text-white"
    },
    {
      id: "share",
      label: "Share",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l5.084-2.542m0 5.6l-5.084-2.542M19 12a3 3 0 11-6 0 3 3 0 016 0zM6 12a3 3 0 11-6 0 3 3 0 016 0zm12-7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => handleSharePhoto(currentPhoto),
      visible: true
    },
    {
      id: "link",
      label: "Copy Link",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 10v-5a1 1 0 011-1h1m-6 5a2 2 0 002 2h2a2 2 0 002-2v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5z" />
        </svg>
      ),
      onClick: () => handleCopyLink(currentPhoto),
      visible: true
    },
    {
      id: "replace",
      label: "Replace Photo",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
        </svg>
      ),
      onClick: "trigger-replace",
      visible: canManagePhoto
    },
    {
      id: "delete",
      label: "Delete Photo",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => handleDeletePhotoFromGallery(currentPhoto),
      visible: canManagePhoto,
      colorClass: "text-rose-450 hover:text-rose-550"
    }
  ] : [];

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Disable shortcuts while typing in input fields
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable
      );
      if (isTyping) return;

      // Ctrl + A (Select All)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        selection.selectAll(filteredPhotos.map(p => p.photoId));
        return;
      }

      // Ctrl + D (Clear Selection)
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        selection.clear();
        return;
      }

      // Keyboard navigation and lightbox hotkeys
      if (lightboxIndex !== null && currentPhoto) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") navigateLightbox(1);
        if (e.key === "ArrowLeft") navigateLightbox(-1);
        if (e.key === "Space") {
          e.preventDefault();
          setSlideshowIndex(lightboxIndex);
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          const elem = document.documentElement;
          if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => console.error(err));
          } else {
            document.exitFullscreen();
          }
        }
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          if (allowDownload) handleDownload(currentPhoto);
        }
        if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          setSlideshowIndex(lightboxIndex);
        }
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          handleToggleFavorite(currentPhoto.photoId);
        }
        if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setIsDetailsOpen(prev => !prev);
        }
        if (e.key === "w" || e.key === "W") {
          e.preventDefault();
          setShowWatermarkPreview(prev => !prev);
        }
        if (e.key === "Delete") {
          e.preventDefault();
          if (canManagePhoto) handleDeletePhotoFromGallery(currentPhoto);
        }

        // Reserved Zoom Keys
        if (["Home", "End", "PageUp", "PageDown", "+", "-", "0"].includes(e.key)) {
          e.preventDefault();
          console.warn(`Keyboard key "${e.key}" is reserved for future zoom and navigation controls.`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, currentPhoto, filteredPhotos, selection, allowDownload, canManagePhoto, navigateLightbox, closeLightbox]);

  // Scroll locking for lightbox
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

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Download logic (Multiple Selected)
  const handleDownloadMultiple = async () => {
    if (selection.count === 0 || bulkDownloading) return;
    setBulkDownloading(true);
    
    const idsArray = selection.getSelected();
    
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

      try {
        const { createNotification } = await import("@/lib/notificationService");
        await createNotification(event.photographerId, {
          type: "download",
          title: "Photos Downloaded 📥",
          message: `A client downloaded ${idsArray.length} photos from your gallery "${event.eventName}".`,
          metadata: { eventId: event.eventId, count: idsArray.length }
        });
      } catch (err) {
        console.error("Failed to trigger bulk download notification:", err);
      }
    } catch (err) {
      console.error("Failed to log bulk download stats:", err);
    }

    // Sequentially download with custom delay
    for (let i = 0; i < idsArray.length; i++) {
      const photoId = idsArray[i];
      const photo = initialPhotos.find((p) => p.photoId === photoId);
      if (!photo) continue;

      try {
        const response = await fetch(`${photo.url}&filename=${encodeURIComponent(photo.name || "photo.jpg")}`);
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

      if (i < idsArray.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_INTERVAL_MS));
      }
    }

    setBulkDownloading(false);
    setIsSelectMode(false);
    selection.clear();
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-855 dark:bg-black/80 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/event/${event.eventId}${clientPin ? `?pin=${clientPin}` : ""}`}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-55 dark:border-zinc-855 dark:bg-zinc-950 dark:text-zinc-455 dark:hover:bg-zinc-900 transition-all"
            >
              <svg className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{event.eventName}</h1>
              <p className="text-[10px] font-medium text-zinc-550 uppercase tracking-wider">Interactive Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Filter: All vs Favorites */}
            <button
              onClick={() => setFilterFavorites(prev => !prev)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 select-none cursor-pointer ${
                filterFavorites
                  ? "bg-rose-50 border border-rose-250 text-rose-600 dark:bg-rose-955/20 dark:border-rose-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill={filterFavorites ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {filterFavorites ? "Favorites Only" : "Show All"}
            </button>

            <span className="text-xs font-semibold text-zinc-555 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
              {filteredPhotos.length} {filteredPhotos.length === 1 ? "Photo" : "Photos"}
            </span>

            {/* Indexing Status Badge */}
            {indexingStatus && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                {indexingStatus.type === 'waiting' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-ping"></span>
                    <span>Waiting to Index</span>
                  </>
                )}
                {indexingStatus.type === 'queued' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-pulse"></span>
                    <span>Queued {queuePosition > 0 ? `(Pos: #${queuePosition})` : ''}</span>
                  </>
                )}
                {indexingStatus.type === 'processing' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
                    <span>Processing {indexingStatus.completed} / {indexingStatus.total}</span>
                  </>
                )}
                {indexingStatus.type === 'ready' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                    <span>Indexed {facesIndexed > 0 ? `(${facesIndexed} Face${facesIndexed > 1 ? 's' : ''})` : '(No Faces)'}</span>
                  </>
                )}
                {indexingStatus.type === 'failed' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-bounce"></span>
                    <span>Index Failed</span>
                    {(currentRole === "owner" || currentRole === "admin" || currentRole === "photographer") && (
                      <button 
                        onClick={handleRetryAllFailed}
                        className="ml-1.5 text-[10px] bg-rose-600 text-white hover:bg-rose-700 px-2 py-0.5 rounded transition-all cursor-pointer font-bold uppercase select-none"
                      >
                        Retry
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Face Search Button */}
            {(studioSettings?.allowFaceSearch !== false || currentRole === "owner" || currentRole === "admin" || currentRole === "photographer") && (
              <Link
                href={`/event/${event.eventId}/face-search${clientPin ? `?pin=${clientPin}` : ""}`}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 select-none cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 animate-pulse text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Face Search
              </Link>
            )}

            {filteredPhotos.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectMode((prev) => !prev);
                  selection.clear();
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
        {filteredPhotos.length > 0 ? (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {visiblePhotos.map((photo, index) => (
                <div
                  key={photo.photoId}
                  onClick={() => {
                    if (isSelectMode) {
                      selection.toggle(photo.photoId);
                    } else {
                      openLightbox(index);
                    }
                  }}
                  className={`break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl border transition-all duration-300 animate-fade-in-up ${
                    isSelectMode
                      ? "cursor-pointer"
                      : "cursor-zoom-in hover:shadow-lg"
                  } ${
                    selection.isSelected(photo.photoId)
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-950"
                  }`}
                  tabIndex={0}
                  aria-label={`Photo named ${photo.name || "Untitled"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (isSelectMode) {
                        selection.toggle(photo.photoId);
                      } else {
                        openLightbox(index);
                      }
                    }
                  }}
                >
                  {isSelectMode && (
                    <div className="absolute top-3 left-3 z-10 select-none">
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                        selection.isSelected(photo.photoId)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white/95 border-zinc-305 dark:bg-zinc-950/90 dark:border-zinc-700"
                      }`}>
                        {selection.isSelected(photo.photoId) && (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Photo container for dynamic watermark rendering in gallery (if enabled globally) */}
                  <div className="relative overflow-hidden w-full h-auto rounded-2xl">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.name}
                      className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 rounded-2xl"
                      loading="lazy"
                    />
                    <WatermarkOverlay studioSettings={studioSettings} preview={false} />
                  </div>

                  {/* Hover Overlay */}
                  {!isSelectMode && (
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-xs font-semibold text-white truncate">{photo.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-zinc-300 font-light">View Details</span>
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleFavorite(photo.photoId)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-rose-600 transition-all"
                            title="Favorite"
                          >
                            <svg className="h-3.5 w-3.5" fill={favoritedPhotos.has(photo.photoId) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownload(photo)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-all"
                            title="Download Photo"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            {visiblePhotos.length < filteredPhotos.length && (
              <div ref={sentinelRef} className="py-12 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 max-w-lg mx-auto mt-10">
            <svg className="h-16 w-16 text-zinc-350 dark:text-zinc-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-base font-bold text-zinc-805 dark:text-zinc-200">
              {filterFavorites ? "No favorited photos yet" : "No photos in workspace"}
            </h3>
            <p className="mt-1 text-xs text-zinc-555 dark:text-zinc-400 max-w-xs leading-relaxed font-light font-sans">
              {filterFavorites 
                ? "Tap the heart icon on any photo in the gallery to add it to your favorites."
                : "This client workspace is ready, but no proofing images have been uploaded yet. Check back soon!"}
            </p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && currentPhoto && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-zinc-950/98 backdrop-blur-lg select-none focus:outline-none" 
          onClick={closeLightbox}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Image view modal container"
        >
          {/* Lightbox Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/80 to-transparent w-full z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <button
                onClick={closeLightbox}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all focus:ring-2 focus:ring-white focus:outline-none"
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white/90 truncate max-w-[200px]">{currentPhoto.name}</p>
                <p className="text-[10px] text-white/50">{formatBytes(currentPhoto.size || currentPhoto.fileSize)}</p>
              </div>
            </div>

            {/* Counter */}
            <div className="text-xs font-semibold text-white/95 bg-white/10 px-3 py-1.5 rounded-full">
              {lightboxIndex + 1} of {filteredPhotos.length}
            </div>

            {/* Modular Plugin-Style Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center rounded-full bg-white/10 border border-white/5 p-0.5">
                <button
                  onClick={zoomOut}
                  className="p-1.5 rounded-full hover:bg-white/15 text-white/90 disabled:opacity-40 transition-all focus:outline-none"
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
                  className="p-1.5 rounded-full hover:bg-white/15 text-white/90 disabled:opacity-40 transition-all focus:outline-none"
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
                    className="p-1.5 rounded-full hover:bg-white/15 text-white/90 transition-all focus:outline-none"
                    title="Reset Zoom"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Render dynamic actions */}
              {toolbarActions
                .filter(action => action.visible)
                .map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.onClick === "trigger-replace") {
                        fileInputRef.current?.click();
                      } else {
                        action.onClick();
                      }
                    }}
                    disabled={action.disabled}
                    className={`p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      action.colorClass || "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    title={action.label}
                  >
                    {action.icon}
                  </button>
                ))}

              {/* Replace trigger file input helper */}
              {canManagePhoto && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleReplaceFileSelected}
                  accept="image/*"
                  className="hidden"
                />
              )}
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
                className="absolute left-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 text-white/85 hover:text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="Previous Photo"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Main Image container with Watermark */}
              <div 
                className="flex-1 h-full flex items-center justify-center overflow-auto transition-transform duration-300 ease-out"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
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
                  <WatermarkOverlay studioSettings={studioSettings} preview={showWatermarkPreview} />
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(1);
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 text-white/85 hover:text-white transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Uploader Name</label>
                      <p className="text-xs text-zinc-300 font-medium break-all mt-1">{currentPhoto.uploaderName || "Unknown"}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Studio Name</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1">{currentPhoto.studioName || "Legacy (No Studio)"}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Upload Date</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1 font-sans">
                        {currentPhoto.createdAt ? (
                          new Date(currentPhoto.createdAt.seconds ? currentPhoto.createdAt.seconds * 1000 : currentPhoto.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        ) : "Unknown"}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Size</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1">{formatBytes(currentPhoto.fileSize || currentPhoto.size)}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Image Resolution</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1">
                        {currentPhoto.width && currentPhoto.height ? `${currentPhoto.width} x ${currentPhoto.height}` : "Unknown"}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</label>
                      <p className="text-xs text-zinc-300 font-medium mt-1 uppercase">{currentPhoto.status || "Active"}</p>
                    </div>
                  </div>
                </div>

                {allowDownload && (
                  <div className="mt-8 border-t border-zinc-800 pt-5">
                    <button
                      onClick={() => handleDownload(currentPhoto)}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Original File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pure UI Slideshow component view */}
      {slideshowIndex !== null && (
        <Slideshow
          photos={filteredPhotos}
          initialIndex={slideshowIndex}
          onClose={() => setSlideshowIndex(null)}
        />
      )}

      {/* Bottom Selection Action Bar */}
      {isSelectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/95 backdrop-blur-md">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {selection.count} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => selection.selectAll(filteredPhotos.map((p) => p.photoId))}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 transition-all text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={handleDownloadMultiple}
                disabled={selection.count === 0 || bulkDownloading}
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-indigo-650 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  selection.clear();
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-805 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={deletePhotoDialog.isOpen}
        onClose={() => setDeletePhotoDialog({ isOpen: false, photo: null })}
        onConfirm={handleConfirmDeletePhoto}
        title="Move Photo to Trash?"
        description="Are you sure you want to delete this photo from the gallery? It will be moved to Trash & Recovery and can be restored within 30 days."
        warningText="This item can be restored from Trash."
        confirmText="Move to Trash"
        cancelText="Cancel"
        loading={isDeletingPhoto}
        variant="warning"
      />
    </div>
  );
}
