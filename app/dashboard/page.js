"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProfileByUid } from "@/lib/profileService";
import { getEventsByPhotographer } from "@/lib/eventService";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [studioName, setStudioName] = useState("");
  const [events, setEvents] = useState([]);
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
  const totalPhotosCount = events.reduce((sum, evt) => sum + (evt.photos || 0), 0);
  const totalDownloadsCount = events.reduce((sum, evt) => sum + (evt.downloads || 0), 0);

  // Mock recent uploads list with details and images
  const mockRecentUploads = [
    { id: 1, name: "IMG_3092.jpg", event: "Sophie & Daniel Wedding", size: "4.8 MB", date: "2 hrs ago", url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop" },
    { id: 2, name: "IMG_3091.jpg", event: "Sophie & Daniel Wedding", size: "5.1 MB", date: "2 hrs ago", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=300&auto=format&fit=crop" },
    { id: 3, name: "DSC_8842.jpg", event: "Urban Summer Fashion", size: "8.4 MB", date: "1 day ago", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=300&auto=format&fit=crop" },
    { id: 4, name: "DSC_8841.jpg", event: "Urban Summer Fashion", size: "7.9 MB", date: "1 day ago", url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop" },
  ];

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
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">0.0 GB</span>
            <span className="text-xs text-zinc-400">of 5.0 GB</span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div className="h-full bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500" style={{ width: "0%" }} />
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
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-not-allowed">View All</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mockRecentUploads.map((file) => (
              <div key={file.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10">
                {/* Thumbnail */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase select-none">
                    {file.size}
                  </div>
                </div>

                {/* Details */}
                <div className="p-2 flex flex-col text-left">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-zinc-400 truncate mt-0.5">
                    {file.event}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-light mt-1 text-right">
                    {file.date}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick upload placeholder card */}
          <div className="mt-6 flex flex-col p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all cursor-not-allowed bg-zinc-50/10 hover:bg-zinc-50/30 text-center">
            <svg className="mx-auto h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="mt-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">Drop files here to upload</span>
            <span className="text-[9px] text-zinc-400 mt-0.5">Locked until Phase 5</span>
          </div>

        </div>

      </div>

    </div>
  );
}
