'use client';

import React from 'react';

export function TrashFilters({ 
  search, 
  onSearchChange, 
  resourceType, 
  onResourceTypeChange,
  status,
  onStatusChange,
  onResetFilters
}) {
  const hasActiveFilters = search || resourceType !== 'all' || status !== 'TRASHED';

  return (
    <div className="bg-white dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Search Bar */}
      <div className="relative w-full md:w-80">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, title, user..."
          className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        {search && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Filters:</span>
        </div>

        {/* Resource Type Dropdown */}
        <select
          value={resourceType}
          onChange={(e) => onResourceTypeChange(e.target.value)}
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Resources</option>
          <option value="photo">Photos</option>
          <option value="event">Events</option>
          <option value="share">Shares</option>
          <option value="album">Albums</option>
          <option value="gallery">Galleries</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="TRASHED">In Trash</option>
          <option value="RESTORED">Restored</option>
          <option value="PERMANENTLY_DELETED">Permanently Deleted</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
