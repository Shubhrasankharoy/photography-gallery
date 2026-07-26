"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPhotographers, getAllEvents } from "@/lib/profileService";

export default function PhotographersDirectory() {
  const [photographers, setPhotographers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("alphabetical-asc");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // Load all photographers and events
  useEffect(() => {
    async function loadDirectoryData() {
      try {
        const [allPhotographers, allEvents] = await Promise.all([
          getAllPhotographers(),
          getAllEvents(),
        ]);
        setPhotographers(allPhotographers);
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to load directory details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDirectoryData();
  }, []);

  // Compute stats and compile full photographer dataset
  const directoryData = photographers.map((p) => {
    const photographerEvents = events.filter((e) => e.photographerId === p.uid);
    const eventsCount = photographerEvents.length;
    const totalPhotos = photographerEvents.reduce((sum, e) => sum + (e.photos || 0), 0);

    return {
      ...p,
      eventsCount,
      totalPhotos,
    };
  });

  // Extract unique locations for filtering dropdown
  const locationsList = Array.from(
    new Set(
      photographers
        .map((p) => p.location)
        .filter((loc) => loc && loc.trim() !== "")
    )
  );

  // Apply Search and Location Filters
  const filteredData = directoryData.filter((p) => {
    const matchesSearch =
      (p.studioName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.photographerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bio || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === "all" || p.location === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  // Apply Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "alphabetical-asc":
        return (a.studioName || "").localeCompare(b.studioName || "");
      case "alphabetical-desc":
        return (b.studioName || "").localeCompare(a.studioName || "");
      case "events-desc":
        return b.eventsCount - a.eventsCount;
      case "photos-desc":
        return b.totalPhotos - a.totalPhotos;
      default:
        return 0;
    }
  });

  // Apply Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPhotographers = sortedData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950/20 text-zinc-900 dark:text-zinc-50 py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Directory Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Find Photographers
          </h1>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
            Discover registered studios, browse public proofing galleries, and connect with creative experts.
          </p>
        </div>

        {/* Directory Controls Panel */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs backdrop-blur-md mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search studio name, bio, photographer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Filtering & Sorting Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Location Selector */}
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Locations</option>
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-300"
            >
              <option value="alphabetical-asc">Studio Name (A-Z)</option>
              <option value="alphabetical-desc">Studio Name (Z-A)</option>
              <option value="events-desc">Most Client Galleries</option>
              <option value="photos-desc">Most Proofing Photos</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 flex justify-center items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
          </div>
        ) : paginatedPhotographers.length === 0 ? (
          /* Empty Search results state */
          <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent py-20 text-center max-w-md mx-auto mt-10">
            <svg
              className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-base font-bold text-zinc-800 dark:text-zinc-200">
              No matching photographers
            </h3>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-light px-6">
              Try adjusting your keyword query, choosing a different sorting method, or changing your location filter.
            </p>
          </div>
        ) : (
          <>
            {/* Grid display of Photographer profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPhotographers.map((p) => {
                const initial = (p.studioName || p.photographerName || "P")
                  .charAt(0)
                  .toUpperCase();
                const coverImg =
                  p.coverImage ||
                  "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=600&auto=format&fit=crop";

                return (
                  <div
                    key={p.uid}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                  >
                    <div>
                      {/* Hero banner preview */}
                      <div className="relative h-32 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                        <img
                          src={coverImg}
                          alt={p.studioName}
                          className="h-full w-full object-cover filter brightness-[0.8] group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      {/* Header Avatar logo row */}
                      <div className="px-6 pb-4">
                        <div className="relative -mt-10 mb-4 h-20 w-20 rounded-full border-4 border-white bg-indigo-650 dark:border-zinc-950 flex items-center justify-center text-white text-2xl font-bold select-none overflow-hidden shrink-0 shadow-md">
                          {p.logo ? (
                            <img
                              src={p.logo}
                              alt={p.studioName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initial
                          )}
                        </div>

                        {/* Profile Info */}
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {p.studioName}
                        </h2>
                        
                        <p className="mt-1 text-xs text-zinc-500 font-semibold flex items-center gap-1">
                          <span>{p.photographerName}</span>
                          {p.location && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-800">•</span>
                              <span className="font-normal text-zinc-400">{p.location}</span>
                            </>
                          )}
                        </p>

                        <p className="mt-4 text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-light line-clamp-3">
                          {p.bio ||
                            "Capturing elegance and digital storytelling through premium creative visual assets."}
                        </p>
                      </div>
                    </div>

                    {/* Footer Stats row and Link */}
                    <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {p.eventsCount}
                          </span>
                          <span className="text-[10px] text-zinc-450 uppercase font-medium">
                            Galleries
                          </span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {p.totalPhotos}
                          </span>
                          <span className="text-[10px] text-zinc-450 uppercase font-medium">
                            Photos
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/photographer/${p.username}`}
                        className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Portfolio</span>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold px-3 text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
