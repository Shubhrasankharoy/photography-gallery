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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search activity by actor, action, keyword..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Action Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Action Type</label>
          <select
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_TYPES).map(([key, val]) => (
              <option key={key} value={val}>{val}</option>
            ))}
          </select>
        </div>

        {/* Resource Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Resource Type</label>
          <select
            value={selectedResource}
            onChange={(e) => onResourceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Resources</option>
            {Object.entries(RESOURCE_TYPES).map(([key, val]) => (
              <option key={key} value={val}>{val}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">To Date</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Reset Button */}
      {(searchQuery || selectedAction || selectedResource || startDate || endDate) && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
