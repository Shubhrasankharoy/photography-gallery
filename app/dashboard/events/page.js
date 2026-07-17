"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProfileByUid } from "@/lib/profileService";
import { 
  getEventsByPhotographer, 
  deleteEvent, 
  duplicateEvent 
} from "@/lib/eventService";

export default function EventsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [studioUsername, setStudioUsername] = useState("");

  // Helper to show notifications
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load photographer username and events
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    try {
      // Get profile for link copying
      const profile = await getProfileByUid(user.uid);
      if (profile && profile.username) {
        setStudioUsername(profile.username);
      }
      
      const list = await getEventsByPhotographer(user.uid);
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events:", err);
      showNotification("Error loading events. Please refresh.");
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Defer execution to avoid synchronous setState inside effect body
      Promise.resolve().then(() => loadData());
    }
  }, [user, loadData]);

  // Derive filtered events list in render phase (avoids useEffect + setState sync issues)
  const q = searchQuery.toLowerCase().trim();
  const filteredEvents = q
    ? events.filter(
        (evt) =>
          evt.eventName.toLowerCase().includes(q) ||
          evt.location.toLowerCase().includes(q) ||
          (evt.brideName && evt.brideName.toLowerCase().includes(q)) ||
          (evt.groomName && evt.groomName.toLowerCase().includes(q))
      )
    : events;

  const handleCopyLink = (eventId) => {
    // Generate link format: e.g. capturespace.com/event/eventId
    const base = window.location.origin;
    const link = `${base}/event/${eventId}`;
      
    navigator.clipboard.writeText(link)
      .then(() => showNotification("Event link copied to clipboard!"))
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        showNotification("Failed to copy link.");
      });
  };

  const handleDuplicate = async (eventId) => {
    setIsActionLoading(true);
    try {
      await duplicateEvent(eventId);
      showNotification("Event duplicated successfully.");
      await loadData();
    } catch (err) {
      console.error("Duplication failed:", err);
      showNotification("Failed to duplicate event.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (eventId, name) => {
    if (!window.confirm(`Are you sure you want to delete the event "${name}"? This action is permanent and will delete all photos inside.`)) {
      return;
    }
    setIsActionLoading(true);
    try {
      await deleteEvent(eventId);
      showNotification("Event deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
      showNotification("Failed to delete event.");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (authLoading || !user || isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Loading event galleries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300">
      
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Client Event Spaces
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-light">
            Create password-protected folders and distribute high-res download keys to clients.
          </p>
        </div>
        
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all select-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5" />
          </svg>
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Floating Action Notifications */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-zinc-900 border border-zinc-850 px-6 py-4 text-xs font-semibold text-white shadow-2xl animate-fade-in flex items-center gap-3">
          <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <span>{notification}</span>
        </div>
      )}

      {/* Search Filter input */}
      <div className="mt-8 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by event name, location, or couple..."
          className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-3 text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-400 transition-all"
        />
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-200 p-16 text-center dark:border-zinc-800 bg-white dark:bg-transparent">
          <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
          </svg>
          <h4 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">No Event Spaces Located</h4>
          <p className="mt-1.5 text-xs text-zinc-500 font-light max-w-xs mx-auto">
            {searchQuery ? "Try checking spelling or type another keyword query." : "Get started by publishing your first wedding, headshot, or event proofing folder."}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Link
                href="/dashboard/events/new"
                className="inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                Create Event
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className={`mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ${
          isActionLoading ? "opacity-50 pointer-events-none" : ""
        }`}>
          {filteredEvents.map((evt) => {
            const coverImage = evt.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=600&auto=format&fit=crop";
            return (
              <div key={evt.eventId} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs hover:shadow-lg dark:border-zinc-850 dark:bg-zinc-950/20 transition-all duration-300">
                
                {/* Cover Image Wrapper */}
                <div className="relative aspect-video w-full bg-zinc-150 dark:bg-zinc-900 overflow-hidden">
                  <img
                    src={coverImage}
                    alt={evt.eventName}
                    className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/10" />
                  
                  {/* Status Badge */}
                  <span className={`absolute top-3 left-3 inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    evt.visibility === "public"
                      ? "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400"
                      : "bg-amber-50/90 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400"
                  }`}>
                    {evt.visibility === "public" ? "Public" : "PIN Protected"}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-5 grow flex flex-col justify-between">
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {evt.eventName}
                    </h3>
                    
                    {/* Date and location */}
                    <div className="mt-2 flex flex-col space-y-1 text-xs text-zinc-550 dark:text-zinc-400 font-light">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{evt.eventDate || "Date not configured"}</span>
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{evt.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions buttons */}
                  <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-2">
                    
                    {/* Copy Link & Duplicate */}
                    <div className="flex gap-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCopyLink(evt.eventId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleCopyLink(evt.eventId);
                        }}
                        className="rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-900 p-2 text-zinc-650 dark:text-zinc-400 cursor-pointer select-none"
                        title="Copy Link"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDuplicate(evt.eventId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleDuplicate(evt.eventId);
                        }}
                        className="rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-900 p-2 text-zinc-650 dark:text-zinc-400 cursor-pointer select-none"
                        title="Duplicate Event"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376A8.965 8.965 0 0012 12.75a8.965 8.965 0 00-3.75 3.375m7.5 1.125V21a9 9 0 01-9-9V7.875M9 3.75h.008v.008H9V3.75z" />
                        </svg>
                      </span>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/events/edit/${evt.eventId}`}
                        className="rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-350"
                      >
                        Edit
                      </Link>

                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDelete(evt.eventId, evt.eventName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleDelete(evt.eventId, evt.eventName);
                        }}
                        className="rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 cursor-pointer select-none"
                      >
                        Delete
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
