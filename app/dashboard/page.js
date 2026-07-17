"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProfileByUid } from "@/lib/profileService";
import { getEventsByPhotographer } from "@/lib/eventService";
import { getRecentUploads } from "@/lib/photoService";

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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [studioName, setStudioName] = useState("");
  const [events, setEvents] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
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
        // Fetch profile
        const profile = await getProfileByUid(user.uid);
        if (profile && profile.studioName) {
          setStudioName(profile.studioName);
        }

        // Fetch live events
        const liveEvents = await getEventsByPhotographer(user.uid);
        setEvents(liveEvents);

        // Fetch recent uploads
        const uploads = await getRecentUploads(user.uid, 4);
        setRecentUploads(uploads);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setIsFetching(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  // Calculate dynamic metrics
  const totalEventsCount = events.length;
  const totalPhotosCount = recentUploads.length + events.reduce((sum, evt) => sum + (evt.photos || 0), 0);
  const totalDownloadsCount = events.reduce((sum, evt) => sum + (evt.downloads || 0), 0);
  
  // Calculate storage used from uploads
  const totalStorageBytes = recentUploads.reduce((sum, photo) => sum + (photo.size || 0), 0);
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercentage = Math.min((totalStorageBytes / (5 * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black transition-colors duration-300">
      
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-indigo-950 via-slate-900 to-zinc-950 p-6 sm:p-8 text-white shadow-xl dark:border dark:border-zinc-900">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome to your Studio Console
        </h2>
        <p className="mt-2 text-sm text-zinc-300 font-light leading-relaxed max-w-2xl">
          Manage secure client access pins, view catalog storage, track downloads, and review your proofing galleries.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/events/new"
            className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-100 transition-all select-none"
          >
            Create New Event
          </Link>
          {studioName && (
            <Link
              href={`/photographer/${studioName.toLowerCase().replace(/[^a-z0-9-]/g, "")}`}
              className="rounded-full border border-zinc-700 bg-transparent px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-900 hover:text-white transition-all select-none"
            >
              View Public Space
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Events */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Events</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalEventsCount}
            </span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">Live</span>
          </div>
        </div>

        {/* Card 2: Total Photos */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Photos</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalPhotosCount}
            </span>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">High-res</span>
          </div>
        </div>

        {/* Card 3: Downloads */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Downloads</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isFetching ? "..." : totalDownloadsCount}
            </span>
            <span className="text-xs font-semibold text-zinc-400">deliveries</span>
          </div>
        </div>

        {/* Card 4: Storage Used */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Storage Used</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{isFetching ? "..." : totalStorageGB} GB</span>
            <span className="text-xs text-zinc-400">of 5.0 GB</span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div className="h-full bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500" style={{ width: `${isFetching ? 0 : storagePercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Events (span 8) */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Client Events</h3>
              <p className="text-xs text-zinc-450 font-light mt-0.5">Summary of published and PIN protected spaces</p>
            </div>
            <Link href="/dashboard/events" className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
              Manage All
            </Link>
          </div>

          {isFetching ? (
            <div className="py-8 text-center text-xs text-zinc-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
              <p className="text-xs text-zinc-450 font-light">No events exist yet.</p>
              <Link href="/dashboard/events/new" className="mt-3 inline-block text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
                Publish your first event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-850 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Event Details</th>
                    <th className="pb-3 font-semibold">Photos</th>
                    <th className="pb-3 font-semibold">Downloads</th>
                    <th className="pb-3 font-semibold">Visibility</th>
                    <th className="pb-3 font-semibold">PIN Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm">
                  {events.slice(0, 5).map((evt) => (
                    <tr key={evt.eventId} className="group">
                      <td className="py-4 font-bold text-zinc-900 dark:text-zinc-100 flex flex-col">
                        <span>{evt.eventName}</span>
                        {evt.location && <span className="text-xs text-zinc-450 font-light mt-0.5">{evt.location}</span>}
                      </td>
                      <td className="py-4 text-zinc-650 dark:text-zinc-400 font-light">
                        {evt.photos || 0}
                      </td>
                      <td className="py-4 text-zinc-650 dark:text-zinc-400 font-light">
                        {evt.downloads || 0}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          evt.visibility === "public" 
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {evt.visibility === "public" ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-zinc-600 dark:text-zinc-300">
                        {evt.password || "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Recent Uploads (span 4) */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 text-left">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Uploads</h3>
              <p className="text-xs text-zinc-455 font-light mt-0.5">Asset additions to galleries</p>
            </div>
            <Link href="/dashboard/uploads" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All</Link>
          </div>

          {isFetching ? (
            <div className="py-8 text-center text-xs text-zinc-400">Loading uploads...</div>
          ) : recentUploads.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
              <p className="text-xs text-zinc-450 font-light">No uploads yet.</p>
              <Link href="/dashboard/uploads" className="mt-3 inline-block text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
                Start uploading →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentUploads.map((photo) => (
                <div key={photo.photoId} className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10">
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase select-none">
                      {formatFileSize(photo.size)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-2 flex flex-col text-left">
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                      {photo.name}
                    </span>
                    <span className="text-[9px] text-zinc-400 truncate mt-0.5">
                      Event {photo.eventId.substring(0, 8)}...
                    </span>
                    <span className="text-[8px] text-zinc-500 font-light mt-1 text-right">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick upload card */}
          <Link href="/dashboard/uploads" className="mt-6 flex flex-col p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all cursor-pointer bg-zinc-50/10 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-center">
            <svg className="mx-auto h-6 w-6 text-zinc-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="mt-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">Quick Upload</span>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">Go to uploads page</span>
          </Link>

        </div>

      </div>

    </div>
  );
}
