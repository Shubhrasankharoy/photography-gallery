"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStudio } from "@/context/StudioContext";
import { getProfileByUid } from "@/lib/profileService";
import { getEvents } from "@/lib/eventService";
import { getRecentUploads, getRecentDownloads } from "@/lib/photoService";
import { motion } from "motion/react";

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

/* ── Motion Variants ──────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { currentStudio, isLoading: studioLoading } = useStudio();
  const router = useRouter();
  const [studioName, setStudioName] = useState("");
  const [events, setEvents] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        setIsFetching(true);
        // Fetch profile
        const profile = await getProfileByUid(user.uid);
        if (profile && profile.studioName) {
          setStudioName(profile.studioName);
        }

        // Fetch live events, recent uploads, and downloads based on currentStudio
        let liveEvents = [];
        let uploads = [];
        let downloads = [];

        if (currentStudio) {
          liveEvents = await getEvents({ studioId: currentStudio.studioId });
          uploads = await getRecentUploads({ studioId: currentStudio.studioId }, 4);
          downloads = await getRecentDownloads({ studioId: currentStudio.studioId }, 5);
        } else {
          liveEvents = await getEvents({ photographerId: user.uid });
          uploads = await getRecentUploads({ photographerId: user.uid }, 4);
          downloads = await getRecentDownloads({ photographerId: user.uid }, 5);
        }

        setEvents(liveEvents);
        setRecentUploads(uploads);
        setRecentDownloads(downloads);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setIsFetching(false);
      }
    }

    if (user && !studioLoading) {
      loadDashboardData();
    }
  }, [user, currentStudio, studioLoading]);

  if (authLoading || studioLoading || !user) {
    return null;
  }

  // Calculate dynamic metrics
  const totalEventsCount = events.length;
  const totalPhotosCount = events.reduce((sum, evt) => sum + (evt.photoCount || evt.photos || 0), 0);
  const totalDownloadsCount = events.reduce((sum, evt) => sum + (evt.downloads || 0), 0);
  
  // Calculate storage used from events totalSize stats
  const totalStorageBytes = events.reduce((sum, evt) => sum + (evt.totalSize || 0), 0);
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercentage = Math.min((totalStorageBytes / (5 * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="rounded-[24px] bg-[#202020] p-6 sm:p-8 text-white shadow-[var(--shadow-soft)] border border-zinc-800/40 relative overflow-hidden"
      >
        {/* Subtle decorative gold blur behind card */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#D4AF37]/5 blur-2xl pointer-events-none" />
        
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
          Welcome to your Studio Console
        </h2>
        <p className="mt-2 text-sm text-zinc-300 font-light leading-relaxed max-w-2xl">
          Manage secure client access pins, view catalog storage, track downloads, and review your proofing galleries.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard/events/new"
              className="rounded-[12px] bg-[#D4AF37] px-6 py-2.5 text-xs font-bold text-[#181818] hover:bg-[#E0C55B] transition-all select-none block"
            >
              Create New Event
            </Link>
          </motion.div>
          {studioName && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/photographer/${studioName.toLowerCase().replace(/[^a-z0-9-]/g, "")}`}
                className="rounded-[12px] border border-zinc-700 bg-transparent px-6 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-all select-none block"
              >
                View Public Space
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div
        variants={itemVariants}
        className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Card 1: Total Events */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] text-left transition-all duration-300"
        >
          <span className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Total Events</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalEventsCount}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
          </div>
        </motion.div>

        {/* Card 2: Total Photos */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] text-left transition-all duration-300"
        >
          <span className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Total Photos</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalPhotosCount}
            </span>
            <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">High-res</span>
          </div>
        </motion.div>

        {/* Card 3: Downloads */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] text-left transition-all duration-300"
        >
          <span className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Downloads</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalDownloadsCount}
            </span>
            <span className="text-xs font-medium text-[#8E8E8E]">deliveries</span>
          </div>
        </motion.div>

        {/* Card 4: Storage Used */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] text-left transition-all duration-300"
        >
          <span className="text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">Storage Used</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{isFetching ? "..." : totalStorageGB} GB</span>
            <span className="text-xs text-[#8E8E8E]">of 5.0 GB</span>
          </div>
          <div className="mt-3.5 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${isFetching ? 0 : storagePercentage}%` }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity Sections */}
      <div className="mt-10 grid grid-cols-1 gap-8">
        
        {/* Row 1: Recent Events */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-[var(--shadow-soft)] dark:border-zinc-800/40 dark:bg-[#262626] text-left"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-headline">Recent Client Events</h3>
              <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Summary of published and PIN protected spaces</p>
            </div>
            <Link href="/dashboard/events" className="text-xs font-bold text-[#D4AF37] hover:text-[#E0C55B] transition-colors">
              Manage All →
            </Link>
          </div>

          {isFetching ? (
            <div className="py-8 text-center text-xs text-[#8E8E8E]">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[12px] text-center">
              <p className="text-xs text-[#8E8E8E] font-light">No events exist yet.</p>
              <Link href="/dashboard/events/new" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] hover:underline">
                Publish your first event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-bold text-[#8E8E8E] uppercase tracking-wider">
                    <th className="pb-3 font-bold">Event Details</th>
                    <th className="pb-3 font-bold">Photos</th>
                    <th className="pb-3 font-bold">Downloads</th>
                    <th className="pb-3 font-bold">Visibility</th>
                    <th className="pb-3 font-bold">PIN Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
                  {events.slice(0, 5).map((evt) => (
                    <tr key={evt.eventId} className="group hover:bg-[#FAFAFA] dark:hover:bg-[#2D2D2D]/30 transition-colors duration-150">
                      <td className="py-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex flex-col">
                          <span>{evt.eventName}</span>
                          {evt.location && <span className="text-xs text-[#8E8E8E] font-light mt-0.5">{evt.location}</span>}
                        </div>
                      </td>
                      <td className="py-4 text-zinc-600 dark:text-zinc-400 font-light">
                        {evt.photoCount !== undefined ? evt.photoCount : (evt.photos || 0)}
                      </td>
                      <td className="py-4 text-zinc-600 dark:text-zinc-400 font-light">
                        {evt.downloads || 0}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          evt.visibility === "public" 
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450" 
                            : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        }`}>
                          {evt.visibility === "public" ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-zinc-500 dark:text-zinc-400">
                        {evt.password || "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Row 2: Recent Uploads & Downloads side-by-side */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          
          {/* Recent Uploads */}
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-[var(--shadow-soft)] dark:border-zinc-800/40 dark:bg-[#262626] text-left flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-headline">Recent Uploads</h3>
                  <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Asset additions to galleries</p>
                </div>
                <Link href="/dashboard/uploads" className="text-xs font-bold text-[#D4AF37] hover:text-[#E0C55B] transition-colors">View All</Link>
              </div>

              {isFetching ? (
                <div className="py-8 text-center text-xs text-[#8E8E8E]">Loading uploads...</div>
              ) : recentUploads.length === 0 ? (
                <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[12px] text-center">
                  <p className="text-xs text-[#8E8E8E] font-light">No uploads yet.</p>
                  <Link href="/dashboard/uploads" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] hover:underline">
                    Start uploading →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recentUploads.map((photo) => (
                    <div key={photo.photoId} className="group relative flex flex-col overflow-hidden rounded-[18px] border border-zinc-150 dark:border-zinc-800/60 bg-[#FAFAFA] dark:bg-[#202020]">
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                        <img
                          src={photo.thumbnailUrl || photo.url || null}
                          alt={photo.name}
                          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 rounded-[8px] bg-black/60 px-2 py-0.5 text-[8px] font-bold text-white uppercase select-none backdrop-blur-xs">
                          {formatFileSize(photo.size)}
                        </div>
                      </div>

                      <div className="p-3 flex flex-col text-left">
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                          {photo.name}
                        </span>
                        <span className="text-[9px] text-[#8E8E8E] truncate mt-1">
                          Event {photo.eventId.substring(0, 8)}...
                        </span>
                        <span className="text-[8px] text-zinc-400 font-light mt-1.5 text-right">
                          {formatDate(photo.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mt-6">
              <Link href="/dashboard/uploads" className="group flex flex-col p-4 rounded-[12px] border border-dashed border-zinc-250 dark:border-zinc-800 hover:border-[#D4AF37]/50 transition-all cursor-pointer bg-[#FAFAFA] dark:bg-[#202020]/40 text-center">
                <svg className="mx-auto h-6 w-6 text-zinc-400 group-hover:text-[#D4AF37] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="mt-2 text-xs font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-[#D4AF37] transition-colors">Quick Upload</span>
                <span className="text-[9px] text-[#8E8E8E] mt-0.5">Go to uploads page</span>
              </Link>
            </motion.div>
          </div>

          {/* Recent Downloads */}
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-[var(--shadow-soft)] dark:border-zinc-800/40 dark:bg-[#262626] text-left">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-headline">Recent Downloads</h3>
                <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Guest download logs and delivery tracking</p>
              </div>
            </div>

            {isFetching ? (
              <div className="py-8 text-center text-xs text-[#8E8E8E]">Loading downloads...</div>
            ) : recentDownloads.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[12px] text-center flex flex-col items-center justify-center">
                <svg className="h-8 w-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <p className="text-xs text-[#8E8E8E] font-light mt-3">No downloads recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDownloads.map((dl) => (
                  <motion.div
                    key={dl.downloadId}
                    whileHover={{ x: 2, transition: { duration: 0.15 } }}
                    className="flex items-center justify-between p-3 rounded-[12px] border border-zinc-100 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#202020]/40 hover:bg-zinc-100/50 dark:hover:bg-[#2D2D2D]/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[8px] bg-[#D4AF37]/10 text-[#D4AF37]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-zinc-855 dark:text-zinc-200 truncate max-w-[200px]" title={dl.photoName}>
                          {dl.photoName}
                        </span>
                        <span className="text-[10px] text-[#8E8E8E] font-light mt-0.5">
                          Event {dl.eventId.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        Guest User
                      </span>
                      <span className="text-[9px] text-[#8E8E8E] mt-1">
                        {formatDate(dl.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
        </motion.div>
      </div>

    </motion.div>
  );
}
