"use client";

import { useAuth } from "@/context/AuthContext";

export default function AdminHeader({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-950/80 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          onClick={onMenuClick}
          type="button"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20">
            System Console
          </span>
          <span className="hidden text-sm font-semibold text-zinc-400 dark:text-zinc-650 sm:inline">
            /
          </span>
          <span className="hidden text-sm font-medium text-zinc-600 dark:text-zinc-350 sm:inline">
            Manage everything from a unified terminal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Admin Access:
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
