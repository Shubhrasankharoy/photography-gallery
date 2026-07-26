'use client';

import React from 'react';

export default function TimelineLoading({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-zinc-200/50 rounded-[20px] dark:bg-[#262626] dark:border-zinc-800/40 p-5 flex items-start gap-4 shadow-[var(--shadow-soft)]">
          <div className="w-10 h-10 rounded-[12px] bg-zinc-100 dark:bg-[#181818] shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3.5 bg-zinc-100 dark:bg-[#181818] rounded w-1/4" />
            <div className="h-3.5 bg-zinc-100 dark:bg-[#181818] rounded w-3/4" />
            <div className="h-2.5 bg-zinc-100/60 dark:bg-[#181818]/60 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
