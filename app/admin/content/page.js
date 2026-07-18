"use client";

import { useState, useEffect } from "react";

export default function DeleteContent() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/admin/photos");
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchPhotos());
  }, []);

  const toggleSelect = (photoId) => {
    if (selected.includes(photoId)) {
      setSelected(selected.filter((id) => id !== photoId));
    } else {
      setSelected([...selected, photoId]);
    }
  };

  const selectAllFiltered = (filteredList) => {
    const filteredIds = filteredList.map((p) => p.photoId);
    const allSelected = filteredIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected(selected.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelected([...new Set([...selected, ...filteredIds])]);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.length} items from the platform storage?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: selected }),
      });
      if (res.ok) {
        setPhotos(photos.filter((p) => !selected.includes(p.photoId)));
        setSelected([]);
      }
    } catch (err) {
      console.error("Error deleting items:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.eventName || "").toLowerCase().includes(term) ||
      (p.photoId || "").toLowerCase().includes(term) ||
      (p.url || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Bulk Content Moderation
          </h1>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
            Select, search, and purge uploaded media content records directly.
          </p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by event name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-zinc-250 bg-white px-4 py-2.5 text-sm outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:w-64"
          />

          <button
            onClick={handleBulkDelete}
            disabled={selected.length === 0 || deleting}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-all shrink-0"
          >
            {deleting ? "Purging..." : `Delete Selected (${selected.length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <span className="text-xs text-zinc-450 dark:text-zinc-500">
              Showing {filteredPhotos.length} image files of {photos.length} total.
            </span>
            <button
              onClick={() => selectAllFiltered(filteredPhotos)}
              className="text-xs font-bold text-indigo-650 hover:text-indigo-700 dark:text-indigo-400"
            >
              Toggle Select All Page
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredPhotos.map((p) => {
              const isSelected = selected.includes(p.photoId);
              return (
                <div
                  key={p.photoId}
                  onClick={() => toggleSelect(p.photoId)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected ? "border-rose-600 ring-2 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-850 hover:border-zinc-400"
                  }`}
                >
                  <img
                    src={p.url}
                    alt="Platform Asset"
                    className="h-full w-full object-cover select-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="text-[10px] text-white font-bold bg-zinc-950/80 px-2 py-1 rounded-sm">
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1 shadow-md">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
