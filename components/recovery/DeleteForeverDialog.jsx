'use client';

import React from 'react';

export function DeleteForeverDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count = 1,
  loading = false,
  isEmptyTrash = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {isEmptyTrash ? 'Empty Trash?' : (count > 1 ? `Permanently Delete ${count} Resources?` : 'Permanently Delete Resource?')}
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
              Warning: This action is irreversible!
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
          {isEmptyTrash
            ? 'Are you sure you want to empty the entire trash? All resources, cloud storage files, and Firestore records will be permanently purged.'
            : (count > 1 
              ? `You are about to permanently delete ${count} items. Cloud storage files and Firestore records will be purged forever.`
              : `This resource and its associated storage files will be permanently purged from system storage.`
            )
          }
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1 shadow-md shadow-rose-600/10"
          >
            {loading ? (
              <span>{isEmptyTrash ? 'Emptying...' : 'Deleting...'}</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isEmptyTrash ? 'Empty Trash' : 'Delete Permanently'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
