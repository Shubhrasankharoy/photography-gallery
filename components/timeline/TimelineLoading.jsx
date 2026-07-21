'use client';

import React from 'react';

export default function TimelineLoading({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800/60 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
