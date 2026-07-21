import React from 'react';

export function FaceSearchProgress({ 
  indexedCount = 0, 
  totalCount = 0, 
  isIndexing = false,
  statusMessage = 'Analyzing photo database...'
}) {
  const percent = totalCount > 0 ? Math.round((indexedCount / totalCount) * 100) : 0;

  if (!isIndexing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-900">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
          <div className="relative rounded-full bg-indigo-50 border border-indigo-200/50 p-2.5 dark:bg-indigo-950/30 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-xs font-bold text-zinc-900 dark:text-zinc-100">{statusMessage}</p>
        <p className="mt-1 text-[10px] text-zinc-400 font-light leading-relaxed max-w-xs">
          Comparing query visual signature against indexed photos. This will take just a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white dark:bg-zinc-950/80 rounded-3xl border border-zinc-200/80 dark:border-zinc-900 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
          <div>
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50 tracking-tight">AI Indexing Gallery</h4>
            <p className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider">Sequential Client Queue</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{percent}%</span>
          <p className="text-[10px] text-zinc-400 font-medium">
            {indexedCount} / {totalCount} Photos
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className="bg-gradient-to-r from-indigo-550 to-indigo-650 h-full rounded-full transition-all duration-300 ease-out"
        ></div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-450 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 pt-3">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Processing uploads client-side
        </span>
        <span className="font-light">Please keep this browser window open</span>
      </div>
    </div>
  );
}

export default FaceSearchProgress;
