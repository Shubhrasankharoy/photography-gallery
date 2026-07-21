'use client';

import React from 'react';

export function TrashCard({ 
  item, 
  isSelected, 
  onSelect, 
  onRestore, 
  onPermanentDelete 
}) {
  const trashId = item.trashId || item.id;
  const title = item.snapshot?.name || item.snapshot?.title || item.snapshot?.eventName || item.resourceId;

  const renderResourceIcon = (type) => {
    switch (type) {
      case 'photo':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'share':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`md:hidden bg-white dark:bg-zinc-950/40 p-4 rounded-xl border ${isSelected ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20' : 'border-zinc-200 dark:border-zinc-800'} shadow-xs space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(trashId)}
            className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
          />
          <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            {renderResourceIcon(item.resourceType)}
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{title}</h4>
            <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
              {item.resourceType}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <div className="flex justify-between">
          <span>Deleted by:</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.deletedByName || 'System'}</span>
        </div>
        <div className="flex justify-between">
          <span>Deleted on:</span>
          <span>
            {item.deletedAt?.seconds 
              ? new Date(item.deletedAt.seconds * 1000).toLocaleDateString()
              : item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onRestore(trashId)}
          className="flex-1 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restore
        </button>
        <button
          onClick={() => onPermanentDelete(trashId)}
          className="flex-1 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
