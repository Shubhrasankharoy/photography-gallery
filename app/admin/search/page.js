"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SearchEverything() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function loadSearchData() {
      try {
        if (!db) return;
        const [usersSnap, eventsSnap, photosSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "photos")),
        ]);

        const uList = [];
        usersSnap.forEach((doc) => uList.push({ uid: doc.id, ...doc.data() }));
        setUsers(uList);

        const eList = [];
        eventsSnap.forEach((doc) => eList.push({ eventId: doc.id, ...doc.data() }));
        setEvents(eList);

        const pList = [];
        photosSnap.forEach((doc) => pList.push({ photoId: doc.id, ...doc.data() }));
        setPhotos(pList);
      } catch (err) {
        console.error("Error fetching system catalog indexes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSearchData();
  }, []);

  const query = search.trim().toLowerCase();

  const filteredUsers = query
    ? users.filter(
        (u) =>
          (u.displayName || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.uid || "").toLowerCase().includes(query)
      )
    : [];

  const filteredEvents = query
    ? events.filter(
        (e) =>
          (e.eventName || "").toLowerCase().includes(query) ||
          (e.location || "").toLowerCase().includes(query) ||
          (e.eventId || "").toLowerCase().includes(query)
      )
    : [];

  const filteredPhotos = query
    ? photos.filter(
        (p) =>
          (p.photoId || "").toLowerCase().includes(query) ||
          (p.url || "").toLowerCase().includes(query)
      )
    : [];

  const totalResults = filteredUsers.length + filteredEvents.length + filteredPhotos.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Global Directory Index Search
        </h1>
        <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
          Query anything on the platform matching users, events, and photos immediately.
        </p>
      </div>

      <div className="mb-8 w-full max-w-2xl">
        <input
          type="text"
          placeholder="Type user name, email, event ID, location or photo ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-zinc-250 bg-white px-5 py-4 text-base outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
        />
        {query && (
          <span className="text-xs text-zinc-450 dark:text-zinc-500 mt-2 block font-medium">
            Found {totalResults} query matches on directory indexes.
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : !query ? (
        <div className="py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-3xl text-center text-sm text-zinc-450 dark:text-zinc-555 font-light">
          Search directory is ready. Enter keywords to query index.
        </div>
      ) : totalResults === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-450 dark:text-zinc-555 font-light">
          No matches found on the platform for &quot;{search}&quot;.
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Results */}
          {filteredUsers.length > 0 && (
            <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-150 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                Users & Accounts ({filteredUsers.length})
              </h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{u.displayName || "Photographer"}</span>
                      <span className="text-xs text-zinc-450 block">{u.email}</span>
                    </div>
                    <a href="/admin/users" className="text-xs font-bold text-rose-600 hover:text-rose-700">
                      Manage &rarr;
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Results */}
          {filteredEvents.length > 0 && (
            <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-150 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                Galleries & Events ({filteredEvents.length})
              </h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredEvents.map((e) => (
                  <div key={e.eventId} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{e.eventName || "Unnamed Event"}</span>
                      <span className="text-xs text-zinc-450 block">Location: {e.location || "N/A"} | ID: {e.eventId}</span>
                    </div>
                    <a href={`/event/${e.eventId}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-rose-600 hover:text-rose-700">
                      Open Page &rarr;
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Results */}
          {filteredPhotos.length > 0 && (
            <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-150 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                Media Files & Photos ({filteredPhotos.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {filteredPhotos.map((p) => (
                  <div key={p.photoId} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850">
                    <img src={p.url} alt="Search Match" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex flex-col justify-end p-2 transition-all">
                      <span className="text-[8px] text-white truncate">{p.photoId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
