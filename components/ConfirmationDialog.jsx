'use client';

import React from 'react';

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to perform this action?",
  warningText = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger" // "danger", "warning", "info"
}) {
  if (!isOpen) return null;

  const colorClasses = {
    danger: {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/60",
      btn: "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    warning: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60",
      btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60",
      btn: "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-zinc-900/10",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const classes = colorClasses[variant] || colorClasses.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${classes.bg} ${classes.text} rounded-full`}>
            {classes.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              {title}
            </h3>
            {warningText && (
              <p className={`text-xs ${classes.text} font-bold mt-0.5`}>
                {warningText}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
          {description}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-md ${classes.btn}`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
