'use client';

import React from 'react';

export function TrashLoading() {
  return (
    <div className="bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-6 space-y-4">
      <div className="h-6 bg-zinc-100 dark:bg-zinc-900 rounded w-1/4 animate-pulse" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
