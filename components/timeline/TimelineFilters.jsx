'use client';

import React from 'react';
import { ACTION_TYPES, RESOURCE_TYPES } from '@/lib/timeline/timelineConstants';

export default function TimelineFilters({
  searchQuery,
  onSearchChange,
  selectedAction,
  onActionChange,
  selectedResource,
  onResourceChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters
}) {
  return (
    <div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 mb-6 space-y-4 dark:bg-[#262626] dark:border-zinc-800/40 shadow-[var(--shadow-soft)]">
      {/* Search Input */}
      <div className="relative">
        <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search activity by actor, action, keyword..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/60 focus:ring-2 focus:ring-[#D4AF37] rounded-[12px] text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-800/40 dark:bg-[#181818] dark:text-zinc-100 transition-colors"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Action Filter */}
        <div className="flex flex-col space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">Action Type</label>
          <select
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full bg-white border border-zinc-200/60 focus:ring-2 focus:ring-[#D4AF37] rounded-[12px] px-3.5 py-3 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800/40 dark:bg-[#181818] dark:text-zinc-200"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_TYPES).map(([key, val]) => (
              <option key={key} value={val}>{val}</option>
            ))}
          </select>
        </div>

        {/* Resource Filter */}
        <div className="flex flex-col space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">Resource Type</label>
          <select
            value={selectedResource}
            onChange={(e) => onResourceChange(e.target.value)}
            className="w-full bg-white border border-zinc-200/60 focus:ring-2 focus:ring-[#D4AF37] rounded-[12px] px-3.5 py-3 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800/40 dark:bg-[#181818] dark:text-zinc-200"
          >
            <option value="">All Resources</option>
            {Object.entries(RESOURCE_TYPES).map(([key, val]) => (
              <option key={key} value={val}>{val}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">From Date</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-white border border-zinc-200/60 focus:ring-2 focus:ring-[#D4AF37] rounded-[12px] px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800/40 dark:bg-[#181818] dark:text-zinc-200"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">To Date</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-white border border-zinc-200/60 focus:ring-2 focus:ring-[#D4AF37] rounded-[12px] px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none dark:border-zinc-800/40 dark:bg-[#181818] dark:text-zinc-200"
          />
        </div>
      </div>

      {/* Reset Button */}
      {(searchQuery || selectedAction || selectedResource || startDate || endDate) && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#E0C55B] font-bold transition-colors select-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
