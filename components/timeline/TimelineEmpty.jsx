'use client';

import React from 'react';

export default function TimelineEmpty({ message = "No activity logs found." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
      <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700 text-slate-500 mb-3">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-200">Timeline Empty</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{message}</p>
    </div>
  );
}
