'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudio } from '@/context/StudioContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Vision Module
import { faceSearchService } from '@/lib/vision/faceSearchService';
import { visionFactory } from '@/lib/vision/visionFactory';
import { DEFAULT_VISION_SETTINGS } from '@/lib/vision/visionConstants';
import { CONFIDENCE_LEVELS } from '@/lib/vision/faceConstants';

// Components
import FaceSearchUploader from '@/components/face/FaceSearchUploader';
import FaceSearchResults from '@/components/face/FaceSearchResults';
import FaceSearchProgress from '@/components/face/FaceSearchProgress';
import BatchDownloadBar from '@/components/face/BatchDownloadBar';
import FaceSearchHistory, { addSearchToHistory } from '@/components/face/FaceSearchHistory';

const DOWNLOAD_INTERVAL_MS = 200;

export default function FaceSearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentRole } = useStudio();

  const eventId = params?.eventId;
  const clientPin = searchParams.get('pin') || '';

  // State
  const [event, setEvent] = useState(null);
  const [studioSettings, setStudioSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // PIN Access
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Vision Indexing Progress
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Search Results
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Load Event and settings
  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      try {
        // Fetch event
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        const eventData = eventSnap.data();
        if (!eventSnap.exists() || eventData.status === 'trashed') {
          setLoading(false);
          return;
        }
        setEvent(eventData);

        // Verify PIN passcode
        const isPrivate = eventData.visibility === 'private';
        const isCorrect = !isPrivate || (clientPin === eventData.password);
        setPinVerified(isCorrect);

        if (isCorrect && eventData.studioId) {
          // Fetch studio settings
          const settingsRef = doc(db, 'studioSettings', eventData.studioId);
          const settingsSnap = await getDoc(settingsRef);
          const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
          setStudioSettings(settingsData);

          // Get counts of pending/completed index documents
          const photosQuery = query(collection(db, 'photos'), where('eventId', '==', eventId));
          const photosSnap = await getDocs(photosQuery);
          if (!photosSnap.empty) {
            const allPhotos = photosSnap.docs.map(d => d.data()).filter(p => p.status === 'active');
            const total = allPhotos.length;
            const completed = allPhotos.filter(
              p => p.faceIndexStatus === 'completed' || p.faceIndexStatus === 'failed'
            ).length;

            setTotalCount(total);
            setIndexedCount(completed);

            // Auto-resume indexing queue if there are outstanding jobs
            if (completed < total) {
              setIsIndexing(true);
              faceSearchService.resumePendingJobs(
                eventId,
                eventData.studioId,
                user,
                (processed, totalProcessed) => {
                  setIndexedCount(processed);
                }
              ).then(() => {
                setIsIndexing(false);
                setIndexedCount(total);
              }).catch(err => {
                console.error('Queue execution failed:', err);
                setIsIndexing(false);
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load page context:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, clientPin, user]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (event && pinInput === event.password) {
      setPinVerified(true);
      setPinError(false);
      router.push(`/event/${eventId}/face-search?pin=${pinInput}`);
    } else {
      setPinError(true);
    }
  };

  const runVisualSimilaritySearch = async (embedding, sourceFileOrUrl) => {
    if (!event) return;
    setIsSearching(true);
    try {
      const config = studioSettings?.visionSettings || DEFAULT_VISION_SETTINGS;
      const res = await faceSearchService.searchMatches(
        embedding,
        eventId,
        event.studioId,
        user,
        config
      );
      setMatches(res.results);
      setSelectedIds([]);

      // Save to localStorage history
      if (sourceFileOrUrl) {
        addSearchToHistory(eventId, res.queryEmbedding || embedding, sourceFileOrUrl);
      }
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (file) => {
    setIsSearching(true);
    try {
      const config = studioSettings?.visionSettings || DEFAULT_VISION_SETTINGS;
      if (config.provider === 'insightface') {
        const res = await faceSearchService.searchMatches(
          file,
          eventId,
          event.studioId,
          user,
          config
        );
        setMatches(res.results);
        setSelectedIds([]);
        if (res.queryEmbedding) {
          addSearchToHistory(eventId, res.queryEmbedding, URL.createObjectURL(file));
        }
      } else {
        const provider = visionFactory.getProvider(config.provider);
        
        // Detect region
        const regions = await provider.detectRegion(file);
        if (regions.length === 0) {
          throw new Error('No crop region detected in the image');
        }

        // Generate embedding vector
        const embedding = await provider.generateEmbedding(file, 0, regions[0]);
        
        // Run comparison matches
        await runVisualSimilaritySearch(embedding, file);
      }
    } catch (err) {
      alert('Processing target image failed: ' + err.message);
      setIsSearching(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Timeline & Download helpers
  const handleSingleDownload = async (photo) => {
    if (downloadingId) return;
    setDownloadingId(photo.photoId);
    try {
      const response = await fetch(`${photo.url}&filename=${encodeURIComponent(photo.name || 'photo.jpg')}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.name || `photo_${photo.photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      // Async log download in timeline
      fetch('/api/downloads/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          photographerId: event.photographerId || event.createdBy,
          photoIds: [photo.photoId]
        })
      }).catch(err => console.error(err));

    } catch (error) {
      window.open(photo.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0 || bulkDownloading) return;
    setBulkDownloading(true);

    try {
      // Record download timeline log
      await timelineService.log({
        studioId: event.studioId,
        eventId,
        resourceType: 'face_search',
        resourceId: eventId,
        action: 'batch_download_started',
        actorId: user?.uid || 'guest',
        actorName: user?.displayName || 'Client Guest',
        title: 'Batch Downloads Started',
        description: `Client started downloading ${selectedIds.length} matched photos.`,
        severity: 'info',
        source: 'web',
        metadata: { custom: { count: selectedIds.length } }
      });

      // Fetch download logging endpoint
      await fetch('/api/downloads/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          photographerId: event.photographerId || event.createdBy,
          photoIds: selectedIds
        })
      });
    } catch (err) {
      console.error('Failed to log batch download start:', err);
    }

    // Sequentially download images with delay
    for (let i = 0; i < selectedIds.length; i++) {
      const id = selectedIds[i];
      const match = matches.find(m => m.photo.photoId === id);
      if (!match) continue;

      try {
        const response = await fetch(`${match.photo.url}&filename=${encodeURIComponent(match.photo.name || 'photo.jpg')}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = match.photo.name || `photo_${match.photo.photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        window.open(match.photo.url, '_blank');
      }

      if (i < selectedIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DOWNLOAD_INTERVAL_MS));
      }
    }

    try {
      await timelineService.log({
        studioId: event.studioId,
        eventId,
        resourceType: 'face_search',
        resourceId: eventId,
        action: 'batch_download_completed',
        actorId: user?.uid || 'guest',
        actorName: user?.displayName || 'Client Guest',
        title: 'Batch Downloads Completed',
        description: `Finished downloading ${selectedIds.length} matched photos.`,
        severity: 'success',
        source: 'web',
        metadata: { custom: { count: selectedIds.length } }
      });
    } catch (err) {
      console.error(err);
    }

    setBulkDownloading(false);
    setSelectedIds([]);
  };

  const handleToggleSelect = (photoId) => {
    setSelectedIds(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(matches.map(m => m.photo.photoId));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-zinc-500">Securing workspace configurations...</p>
      </div>
    );
  }

  // Not Found Screen
  if (!event) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-white px-4 text-center dark:bg-black transition-colors duration-300">
        <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-500 mb-5">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Event Gallery Space Not Found</h1>
        <p className="mt-2 text-xs text-zinc-400 font-light max-w-sm">
          The requested event workspace could not be verified. It may have been archived or deleted.
        </p>
        <Link href="/" className="mt-6 rounded-full bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white dark:bg-zinc-50 dark:text-black">
          Return to Homepage
        </Link>
      </div>
    );
  }

  // Passcode authentication
  if (!pinVerified) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 transition-colors duration-300">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200/60 bg-white p-8 shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 select-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="mt-5 text-center text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Passcode Protected Space
          </h2>
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
            Enter the access PIN provided by your photographer to view the private client gallery of <span className="font-semibold text-zinc-800 dark:text-zinc-200">{event.eventName}</span>.
          </p>

          {pinError && (
            <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-955/20 dark:border-rose-900/50 flex items-start gap-3 text-left">
              <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-350">Invalid Passcode</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-450 font-light mt-0.5 leading-relaxed">
                  The access code entered is incorrect. Verify the PIN with your photographer.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <div className="flex flex-col space-y-1.5 text-left">
              <label htmlFor="pin-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PIN Code</label>
              <input
                id="pin-input"
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                required
                className="w-full rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 transition-all text-center tracking-widest font-bold"
                placeholder="E.g., 5082"
              />
            </div>
            <button type="submit" className="w-full flex items-center justify-center rounded-[12px] bg-[#D4AF37] hover:bg-[#E0C55B] py-3.5 text-xs font-bold text-[#181818] shadow-md hover:shadow-lg transition-all">
              Verify & Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Permissions Check: Settings Allow Search or User is Studio Member
  const isMember = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'photographer';
  const isSearchAllowed = studioSettings?.allowFaceSearch !== false; // defaults to true
  const isPermitted = isSearchAllowed || isMember;

  if (!isPermitted) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-500 mb-5">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50">Visual Search is Disabled</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
          The studio has deactivated visual similarity search for this workspace. Studio members can still access this feature by logging in.
        </p>
        <Link
          href={`/event/${eventId}/gallery${clientPin ? `?pin=${clientPin}` : ''}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-55 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all shadow-sm"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-black pb-24 transition-colors duration-300">
      {/* Search Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-855 dark:bg-black/80 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/event/${eventId}/gallery${clientPin ? `?pin=${clientPin}` : ''}`}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-55 dark:border-zinc-855 dark:bg-zinc-950 dark:text-zinc-455 dark:hover:bg-zinc-900 transition-all"
            >
              <svg className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Visual Search</h1>
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                {event.eventName}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-555 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
            {totalCount} Active Images
          </span>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Control Panel: Upload, progress, history */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-6">
          <FaceSearchUploader onSearch={handleSearch} isSearching={isSearching} />

          {/* Indexing Queue Progress Indicator */}
          {isIndexing && (
            <FaceSearchProgress 
              indexedCount={indexedCount} 
              totalCount={totalCount} 
              isIndexing={isIndexing} 
            />
          )}

          {/* Recent Search History */}
          <FaceSearchHistory 
            eventId={eventId} 
            onSelectSearch={(emb) => runVisualSimilaritySearch(emb, null)} 
          />
        </div>

        {/* Right Content Panel: Results */}
        <div className="grow w-full">
          {isSearching ? (
            <FaceSearchProgress isIndexing={false} statusMessage="Computing visual match matrices..." />
          ) : (
            <FaceSearchResults
              matches={matches}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onView={(photo) => {
                // Redirect back to gallery, opening the lightbox index of this photo
                window.location.href = `/event/${eventId}/gallery?pin=${clientPin}&photoId=${photo.photoId}`;
              }}
              onDownload={handleSingleDownload}
              downloadingId={downloadingId}
            />
          )}
        </div>
      </main>

      {/* Batch Floating Download Bar */}
      <BatchDownloadBar
        selectedCount={selectedIds.length}
        onDownloadSelected={handleDownloadSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        isDownloading={bulkDownloading}
      />
    </div>
  );
}
