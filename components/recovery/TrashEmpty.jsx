'use client';

import React from 'react';

export function TrashEmpty({ search, resourceType }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs text-center">
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-3 text-zinc-400 dark:text-zinc-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
        {search || resourceType !== 'all' ? 'No Matching Trash Items' : 'Trash is Empty'}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 font-light">
        {search || resourceType !== 'all'
          ? 'Try clearing your search filters to view all trashed resources.'
          : 'Items moved to trash will appear here for 30 days before permanent expiration.'}
      </p>
    </div>
  );
}
