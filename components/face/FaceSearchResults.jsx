import React, { useState } from 'react';
import FaceMatchCard from './FaceMatchCard';

export function FaceSearchResults({ 
  matches = [], 
  selectedIds = [], 
  onToggleSelect, 
  onView, 
  onDownload, 
  downloadingId,
  pageSize = 12
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-md">
        <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        </div>
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">No Matches Found</h3>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
          No photo matching the visual similarity threshold could be found in this event gallery. Try searching with a different image.
        </p>
      </div>
    );
  }

  const visibleMatches = matches.slice(0, visibleCount);
  const hasMore = matches.length > visibleCount;

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Search Results</h2>
          <p className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider mt-0.5">
            Showing {visibleMatches.length} of {matches.length} matches sorted by similarity
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {visibleMatches.map((match) => (
          <FaceMatchCard
            key={match.photo.photoId}
            match={match}
            isSelected={selectedIds.includes(match.photo.photoId)}
            onToggleSelect={onToggleSelect}
            onView={onView}
            onDownload={onDownload}
            isDownloading={downloadingId === match.photo.photoId}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + pageSize)}
            className="rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-55 text-zinc-700 px-6 py-3 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 transition-all cursor-pointer shadow-sm"
          >
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}

export default FaceSearchResults;
