'use client';

import React, { useState } from 'react';
import { RESTORE_CONFLICT_POLICY } from '../../lib/recovery/recoveryConstants';

export function RestoreDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count = 1,
  loading = false 
}) {
  const [conflictPolicy, setConflictPolicy] = useState(RESTORE_CONFLICT_POLICY.CANCEL);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Restore {count > 1 ? `${count} Resources` : 'Resource'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This will restore the item(s) back to their original collection.
            </p>
          </div>
        </div>

        {/* Conflict Handling Option */}
        <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">If a naming conflict occurs:</span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="conflict"
                value={RESTORE_CONFLICT_POLICY.CANCEL}
                checked={conflictPolicy === RESTORE_CONFLICT_POLICY.CANCEL}
                onChange={() => setConflictPolicy(RESTORE_CONFLICT_POLICY.CANCEL)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Cancel restore on conflict (Default)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="conflict"
                value={RESTORE_CONFLICT_POLICY.OVERWRITE}
                checked={conflictPolicy === RESTORE_CONFLICT_POLICY.OVERWRITE}
                onChange={() => setConflictPolicy(RESTORE_CONFLICT_POLICY.OVERWRITE)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Overwrite existing document</span>
            </label>
          </div>
        </div>

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
            onClick={() => onConfirm({ conflictPolicy })}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/10"
          >
            {loading ? (
              <span>Restoring...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirm Restore
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
