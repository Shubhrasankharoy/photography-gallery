"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useSearchManager } from "@/hooks/useSearchManager";
import { useStudio } from "@/context/StudioContext";

export default function GlobalSearch() {
  const {
    isModalOpen,
    setIsModalOpen,
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
    activeFilters,
    setActiveFilters,
    sortOrder,
    setSortOrder,
    history,
    pinItem,
    removeItemFromHistory,
    clearAllHistory,
    selectResult,
    preloadPage
  } = useSearchManager();

  const { studios = [] } = useStudio() || {};

  // UI Local states
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Grouped results memoization
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });
    return groups;
  }, [results]);

  // Flattened results list to simplify keyboard navigation index calculations
  const flatResultsList = useMemo(() => {
    return Object.values(groupedResults).flat();
  }, [groupedResults]);

  // Register hotkey bindings globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Toggle modal on Cmd+K, Ctrl+K or Ctrl+/
      const isK = e.key && e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      const isSlash = e.key === "/" && e.ctrlKey;
      
      if (isK || isSlash) {
        e.preventDefault();
        setIsModalOpen((open) => !open);
      }

      // 2. Escape closes modal
      if (e.key === "Escape" && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);

  // Handle focus when modal opens
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      Promise.resolve().then(() => setHighlightedIndex(-1));
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Trigger page preloading on highlighted index change
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < flatResultsList.length) {
      const item = flatResultsList[highlightedIndex];
      if (item && item.url) {
        preloadPage(item.url);
      }
      
      // Auto scroll container
      const activeEl = resultsContainerRef.current?.querySelector(`[data-index="${highlightedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, flatResultsList, preloadPage]);

  // Keyboard navigation within the modal
  const handleInputKeyDown = (e) => {
    if (!isModalOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          flatResultsList.length === 0 ? -1 : (prev + 1) % flatResultsList.length
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          flatResultsList.length === 0 ? -1 : (prev - 1 + flatResultsList.length) % flatResultsList.length
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < flatResultsList.length) {
          selectResult(flatResultsList[highlightedIndex]);
        }
        break;
    }
  };

  // Close when clicking overlay backdrop
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsModalOpen(false);
    }
  };

  // Icon selector based on type/category
  const getEntityIcon = (type) => {
    switch (type) {
      case "studio":
        return (
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "member":
      case "bride":
      case "groom":
        return (
          <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "event":
        return (
          <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "location":
        return (
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setActiveFilters({
      studioId: "",
      status: "",
      location: "",
      startDate: "",
      endDate: "",
      type: ""
    });
  };

  if (!isModalOpen) return null;

  // Compile flat indices to keep hover working alongside arrow keys
  let runningIndexCount = 0;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-xs md:p-10 select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
    >
      <div
        ref={modalRef}
        className="flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden transition-all duration-300"
      >
        {/* Header Search Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-150 dark:border-zinc-900 shrink-0">
          <svg
            className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search studios, members, events, brides, grooms, locations..."
            className="flex-1 text-base bg-transparent text-zinc-800 placeholder-zinc-400 border-none outline-hidden focus:ring-0 focus:outline-hidden dark:text-zinc-50 dark:placeholder-zinc-600"
            aria-autocomplete="list"
            aria-activedescendant={highlightedIndex >= 0 ? `result-${highlightedIndex}` : undefined}
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-350 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              showFilters || Object.values(activeFilters).some(v => v !== "")
                ? "bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]"
                : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
          </button>

          <button
            onClick={() => setIsModalOpen(false)}
            className="hidden sm:inline px-3 py-1 rounded-md text-xs font-bold text-zinc-400 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-600 dark:border-zinc-800 dark:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-400 transition-all"
          >
            Esc
          </button>
        </div>

        {/* Inner Search Workspace Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Filters Sidebar Drawer */}
          {showFilters && (
            <div className="w-64 border-r border-zinc-150 p-4 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/50 overflow-y-auto shrink-0 flex flex-col gap-4 animate-fade-in-left">
              <div className="flex items-center justify-between border-b border-zinc-150 pb-2 dark:border-zinc-900">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Search Filters</span>
                <button onClick={handleResetFilters} className="text-[10px] font-bold text-rose-500 hover:underline">
                  Reset All
                </button>
              </div>

              {/* Studio selector */}
              {studios.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Studio</label>
                  <select
                    value={activeFilters.studioId}
                    onChange={(e) => handleFilterChange("studioId", e.target.value)}
                    className="w-full text-sm rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                  >
                    <option value="">All Studios</option>
                    {studios.map((s) => (
                      <option key={s.studioId} value={s.studioId}>{s.studioName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Entity Type Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Result Type</label>
                <select
                  value={activeFilters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full text-sm rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                >
                  <option value="">All Types</option>
                  <option value="studio">Studios</option>
                  <option value="member">Members</option>
                  <option value="event">Events</option>
                  <option value="bride">Brides</option>
                  <option value="groom">Grooms</option>
                  <option value="location">Locations</option>
                </select>
              </div>

              {/* Status Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Event Status</label>
                <select
                  value={activeFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full text-sm rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                >
                  <option value="">Any Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Location Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Specific Location</label>
                <input
                  type="text"
                  value={activeFilters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full text-sm rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                />
              </div>

              {/* Dates */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Event Date Range</label>
                <input
                  type="date"
                  value={activeFilters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full text-xs rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                />
                <input
                  type="date"
                  value={activeFilters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full text-xs rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                />
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sort By</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full text-sm rounded-lg border-zinc-250 bg-white py-1.5 px-2 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                >
                  <option value="score">Relevance Score</option>
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Area */}
          <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Loading Spinner */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-650 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
                <span className="text-sm font-semibold text-zinc-400">Querying records...</span>
              </div>
            )}

            {/* Error Message */}
            {error && !loading && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center dark:border-rose-950/20 dark:bg-rose-950/10">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {/* Empty Suggestion Fallbacks (If Input is Empty) */}
            {!query && !loading && !error && (
              <div className="space-y-6">
                {/* Suggestions List (Popular/Recent suggestions computed when empty) */}
                {suggestions.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Suggestions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectResult(sug.result)}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-150 bg-zinc-50 hover:bg-indigo-50/20 hover:border-indigo-200 text-left transition-all dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:bg-zinc-900"
                        >
                          {getEntityIcon(sug.result.type)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{sug.text}</p>
                            <p className="text-xs text-zinc-400 truncate">{sug.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-150 dark:border-zinc-900">
                  {/* Pinned searches */}
                  {history.pinned.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Pinned Items</h2>
                      <div className="flex flex-col gap-1.5">
                        {history.pinned.map((item) => (
                          <div key={item.id} className="group flex items-center justify-between p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/80 transition-all">
                            <button
                              onClick={() => selectResult(item)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              {getEntityIcon(item.type)}
                              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{item.title}</span>
                            </button>
                            <button
                              onClick={() => pinItem(item)}
                              className="p-1 text-amber-500 hover:text-amber-600 transition-colors"
                              title="Unpin"
                            >
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0L7.115 6.22l-4.047.588a1 1 0 00-.554 1.706l2.928 2.854-.69 4.03a1 1 0 001.453 1.054L10 14.547l3.6.892a1 1 0 001.453-1.054l-.69-4.031 2.928-2.854a1 1 0 00-.554-1.706l-4.047-.588-1.993-3.667z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent searches */}
                  {history.recent.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Searches</h2>
                        <button onClick={clearAllHistory} className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 transition-colors">
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {history.recent.map((item) => (
                          <div key={item.id} className="group flex items-center justify-between p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/80 transition-all">
                            <button
                              onClick={() => selectResult(item)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              {getEntityIcon(item.type)}
                              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{item.title}</span>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => pinItem(item)}
                                className="p-1 text-zinc-400 hover:text-amber-500 transition-colors"
                                title="Pin"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.908a1 1 0 00.95-.69l1.518-4.674z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeItemFromHistory(item.id)}
                                className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                                title="Remove"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Frequently Used */}
                  {history.frequentlyUsed.length > 0 && (
                    <div className="md:col-span-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Frequently Used</h2>
                      <div className="flex flex-wrap gap-2">
                        {history.frequentlyUsed.slice(0, 6).map((freq) => (
                          <button
                            key={freq.item.id}
                            onClick={() => selectResult(freq.item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                          >
                            {getEntityIcon(freq.item.type)}
                            <span>{freq.item.title}</span>
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-[8px] font-bold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                              {freq.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Viewed */}
                  {history.lastViewed && (
                    <div className="md:col-span-2 border-t border-zinc-150 pt-4 dark:border-zinc-900">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Last Viewed Item</h2>
                      <div
                        onClick={() => selectResult(history.lastViewed)}
                        className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/50 transition-all cursor-pointer"
                      >
                        {getEntityIcon(history.lastViewed.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{history.lastViewed.title}</p>
                          <p className="text-xs text-zinc-400 truncate">{history.lastViewed.subtitle}</p>
                        </div>
                        {history.lastViewed.badge && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                            {history.lastViewed.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Output List */}
            {query && !loading && !error && (
              <div className="space-y-6">
                {flatResultsList.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-base font-semibold text-zinc-400 dark:text-zinc-500">No matching records found.</p>
                    <p className="text-xs text-zinc-300 mt-1 dark:text-zinc-700">Try modifying filters or checking spelling.</p>
                  </div>
                ) : (
                  Object.keys(groupedResults).map((categoryName) => (
                    <div key={categoryName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{categoryName}</h3>
                        <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700">
                          {groupedResults[categoryName].length} items
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {groupedResults[categoryName].map((item) => {
                          // Find flat index
                          const index = flatResultsList.findIndex((x) => x.id === item.id);
                          const isHighlighted = index === highlightedIndex;

                          return (
                            <div
                              key={item.id}
                              data-index={index}
                              onClick={() => selectResult(item)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isHighlighted
                                  ? "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                                  : "bg-white border-zinc-150 hover:bg-zinc-55 dark:bg-zinc-950 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {/* Thumbnail / Logo fallback */}
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="h-10 w-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                                    {getEntityIcon(item.type)}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                      {item.title}
                                    </h4>
                                    {item.badge && (
                                      <span className="inline-flex items-center rounded-sm bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                    {item.subtitle}
                                  </p>
                                  {item.description && (
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right side: quick action (Pin Search) and View details */}
                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pinItem(item);
                                  }}
                                  className="p-1 text-zinc-300 hover:text-amber-500 dark:text-zinc-700 dark:hover:text-amber-400 transition-colors"
                                  title="Pin result"
                                >
                                  <svg
                                    className={`h-4 w-4 ${history.pinned.some((p) => p.id === item.id) ? "fill-amber-500 stroke-amber-500" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.908a1 1 0 00.95-.69l1.518-4.674z" />
                                  </svg>
                                </button>
                                 <span className="text-xs font-bold text-[#D4AF37] hover:text-[#E0C55B] hover:underline select-none">
                                   View Details
                                 </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
