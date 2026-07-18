"use client";

import { useState, useEffect } from "react";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchEvents());
  }, []);

  async function deleteEventItem(eventId) {
    if (!confirm("Are you sure you want to permanently delete this event and pull down its pages?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/events?eventId=${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents(events.filter((e) => e.eventId !== eventId));
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }

  const filtered = events.filter((e) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (e.eventName || "").toLowerCase().includes(term) ||
      (e.location || "").toLowerCase().includes(term) ||
      (e.eventId || "").toLowerCase().includes(term);

    const matchesVisibility =
      visibilityFilter === "all" || e.visibility === visibilityFilter;

    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Manage Events
          </h1>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
            Monitor, inspect visibility, or dismantle photo proofing collections platform-wide.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search events name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-zinc-250 bg-white px-4 py-2.5 text-sm outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white w-full sm:w-64"
          />

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="rounded-xl border border-zinc-250 bg-white px-4 py-2.5 text-sm outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-950/20">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Event details
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Creation Date
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-zinc-450 dark:text-zinc-555 italic font-light">
                    No active events cataloged.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.eventId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                          {e.eventName || "Unnamed Event"}
                        </span>
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-light mt-1">
                          ID: {e.eventId} | Location: {e.location || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-light">
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          e.visibility === "private"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-955/20 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-955/20 dark:text-emerald-400"
                        }`}
                      >
                        {e.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <a
                          href={`/event/${e.eventId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-650 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          View Page
                        </a>
                        <button
                          onClick={() => deleteEventItem(e.eventId)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700"
                        >
                          Dismantle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
