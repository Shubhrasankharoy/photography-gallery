'use client';

import React from 'react';

export default function TimelineEmpty({ message = "No activity logs found." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-zinc-200/60 rounded-[20px] dark:bg-[#262626] dark:border-zinc-800/40 shadow-[var(--shadow-soft)]">
      <div className="p-4 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-headline">Timeline Empty</h3>
      <p className="text-xs text-[#8E8E8E] font-light mt-1.5 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}
