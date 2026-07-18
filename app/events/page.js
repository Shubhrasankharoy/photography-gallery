"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAllPhotographers, getAllEvents } from "@/lib/profileService";

export default function EventsSearchDirectory() {
  const [events, setEvents] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Autocomplete UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const ITEMS_PER_PAGE = 6;

  // Load directory data
  useEffect(() => {
    async function loadData() {
      try {
        const [allPhotographers, allEvents] = await Promise.all([
          getAllPhotographers(),
          getAllEvents(),
        ]);
        setPhotographers(allPhotographers);
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to load search data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Map photographers and compile full event dataset
  const enrichedEvents = events.map((e) => {
    const photographer = photographers.find((p) => p.uid === e.photographerId);
    return {
      ...e,
      photographerName: photographer?.photographerName || "Unknown Photographer",
      studioName: photographer?.studioName || "Unknown Studio",
      photographerUsername: photographer?.username || "",
    };
  });

  // Extract unique locations for filtering
  const locationsList = Array.from(
    new Set(
      events
        .map((e) => e.location)
        .filter((loc) => loc && loc.trim() !== "")
    )
  );

  // Derive autocomplete suggestions during render (You Might Not Need An Effect)
  const suggestions = (() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    const matches = [];

    // Match Event Names
    enrichedEvents.forEach((e) => {
      if (e.eventName?.toLowerCase().includes(query)) {
        matches.push({ type: "Event", value: e.eventName, display: e.eventName });
      }
    });

    // Match Photographers
    photographers.forEach((p) => {
      if (
        p.photographerName?.toLowerCase().includes(query) ||
        p.studioName?.toLowerCase().includes(query)
      ) {
        const name = p.studioName || p.photographerName;
        matches.push({ type: "Photographer", value: name, display: name });
      }
    });

    // Match Locations
    locationsList.forEach((loc) => {
      if (loc.toLowerCase().includes(query)) {
        matches.push({ type: "Location", value: loc, display: loc });
      }
    });

    // Match Bride/Groom names
    enrichedEvents.forEach((e) => {
      if (e.brideName?.toLowerCase().includes(query)) {
        matches.push({ type: "Client (Bride)", value: e.brideName, display: `Bride: ${e.brideName}` });
      }
      if (e.groomName?.toLowerCase().includes(query)) {
        matches.push({ type: "Client (Groom)", value: e.groomName, display: `Groom: ${e.groomName}` });
      }
    });

    // Remove duplicate values across matches
    const uniqueMatches = [];
    const seen = new Set();
    for (const match of matches) {
      const key = `${match.type}:${match.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(match);
      }
    }

    return uniqueMatches.slice(0, 8); // limit to top 8 suggestions
  })();

  // Click outside to close autocomplete
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter application
  const filteredEvents = enrichedEvents.filter((e) => {
    // 1. Text Query Search (matching Photographer, Event Name, Bride Name, Groom Name, Location)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (e.eventName || "").toLowerCase().includes(query) ||
      (e.photographerName || "").toLowerCase().includes(query) ||
      (e.studioName || "").toLowerCase().includes(query) ||
      (e.brideName || "").toLowerCase().includes(query) ||
      (e.groomName || "").toLowerCase().includes(query) ||
      (e.location || "").toLowerCase().includes(query);

    // 2. Location Filter
    const matchesLocation =
      selectedLocation === "all" || e.location === selectedLocation;

    // 3. Visibility Filter
    const matchesVisibility =
      selectedVisibility === "all" || e.visibility === selectedVisibility;

    // 4. Date Range Filter
    let matchesDate = true;
    if (selectedDateRange !== "all" && e.eventDate) {
      const eventTime = new Date(e.eventDate).getTime();
      const now = new Date().getTime();
      const diffMs = now - eventTime;
      const oneDay = 24 * 60 * 60 * 1000;

      if (selectedDateRange === "30days") {
        matchesDate = diffMs <= 30 * oneDay;
      } else if (selectedDateRange === "6months") {
        matchesDate = diffMs <= 180 * oneDay;
      } else if (selectedDateRange === "1year") {
        matchesDate = diffMs <= 365 * oneDay;
      }
    }

    return matchesSearch && matchesLocation && matchesVisibility && matchesDate;
  });

  // Sort application
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.eventDate || b.createdAt || 0) - new Date(a.eventDate || a.createdAt || 0);
      case "oldest":
        return new Date(a.eventDate || a.createdAt || 0) - new Date(b.eventDate || b.createdAt || 0);
      case "alpha-asc":
        return (a.eventName || "").localeCompare(b.eventName || "");
      case "alpha-desc":
        return (b.eventName || "").localeCompare(a.eventName || "");
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalItems = sortedEvents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const selectSuggestion = (value) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950/20 text-zinc-900 dark:text-zinc-50 py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Search Events
          </h1>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
            Find client proofing galleries by Event Name, Photographer, Bride & Groom names, or Location.
          </p>
        </div>

        {/* Controls and Search Bar */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs backdrop-blur-md mb-8">
          <div className="flex flex-col gap-6">
            
            {/* Search Input with Autocomplete suggestions */}
            <div className="relative w-full" ref={suggestionRef}>
              <div className="relative">
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
                  placeholder="Search by event, photographer, client name (bride/groom) or location..."
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400 text-zinc-850 dark:text-zinc-150"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-2xl animate-fade-in max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Suggestions
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.type}-${suggestion.value}-${idx}`}
                        onClick={() => selectSuggestion(suggestion.value)}
                        className="w-full text-left flex items-center justify-between rounded-xl px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <span className="text-zinc-700 dark:text-zinc-350 font-medium truncate">
                          {suggestion.display}
                        </span>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-medium uppercase tracking-wider">
                          {suggestion.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Location Select */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Location</label>
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
              </div>

              {/* Visibility Select */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Access Rights</label>
                <select
                  value={selectedVisibility}
                  onChange={(e) => {
                    setSelectedVisibility(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-305"
                >
                  <option value="all">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private (Password Protected)</option>
                </select>
              </div>

              {/* Date Filter Select */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Date Posted</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => {
                    setSelectedDateRange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-305"
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>

              {/* Sorting Select */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-305"
                >
                  <option value="newest">Event Date: Newest First</option>
                  <option value="oldest">Event Date: Oldest First</option>
                  <option value="alpha-asc">Event Name (A-Z)</option>
                  <option value="alpha-desc">Event Name (Z-A)</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Results Info Bar */}
        {!isLoading && (
          <div className="mb-6 flex justify-between items-center px-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Found <span className="font-semibold text-zinc-850 dark:text-zinc-200">{totalItems}</span> matching events
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation("all");
                  setSelectedVisibility("all");
                  setSelectedDateRange("all");
                  setSortBy("newest");
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner / Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 p-4">
                <div className="aspect-4/3 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 mb-3" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2 mb-6" />
                <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : paginatedEvents.length === 0 ? (
          /* Empty Search results state */
          <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent py-20 text-center max-w-md mx-auto mt-10">
            <svg
              className="mx-auto h-16 w-16 text-zinc-350 dark:text-zinc-805"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-4 text-base font-bold text-zinc-850 dark:text-zinc-200">
              No matching events found
            </h3>
            <p className="mt-2 text-xs text-zinc-550 dark:text-zinc-400 font-light max-w-xs mx-auto">
              We couldn&apos;t find any events matching your search criteria. Try adjusting your query or filters.
            </p>
          </div>
        ) : (
          /* Event Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedEvents.map((event) => {
                const isPrivate = event.visibility === "private";
                const eventLink = `/event/${event.eventId}`;
                const photographerLink = event.photographerUsername
                  ? `/photographer/${event.photographerUsername}`
                  : null;

                return (
                  <div
                    key={event.eventId}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-150 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Cover image area */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.eventName}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-linear-to-tr from-violet-600/10 to-indigo-600/10 dark:from-violet-950/20 dark:to-indigo-950/20 text-zinc-400">
                          <svg className="h-10 w-10 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}

                      {/* Visibility Badge Overlay */}
                      <span
                        className={`absolute top-4 left-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border ${
                          isPrivate
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-505 border-emerald-505/20"
                        }`}
                      >
                        {isPrivate ? (
                          <>
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            Private
                          </>
                        ) : (
                          <>
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            Public
                          </>
                        )}
                      </span>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {event.eventName}
                        </h3>
                      </div>

                      {/* Client info / Date / Location */}
                      <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-light mb-4 flex-1">
                        {(event.brideName || event.groomName) && (
                          <p className="flex items-center gap-1.5 font-medium text-zinc-750 dark:text-zinc-300">
                            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            {event.brideName && event.groomName
                              ? `${event.brideName} & ${event.groomName}`
                              : event.brideName || event.groomName}
                          </p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {event.location}
                          </p>
                        )}
                        {event.eventDate && (
                          <p className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008z" />
                            </svg>
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>

                      {/* Photographer Credit */}
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Photographer</p>
                          {photographerLink ? (
                            <Link
                              href={photographerLink}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {event.studioName || event.photographerName}
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              {event.studioName || event.photographerName}
                            </span>
                          )}
                        </div>

                        <Link
                          href={eventLink}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-950 px-4 text-xs font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                        >
                          View Gallery
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-650/20"
                          : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-505 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
