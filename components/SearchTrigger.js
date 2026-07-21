"use client";

import { useSearchManager } from "@/hooks/useSearchManager";
import { useEffect, useState } from "react";

export default function SearchTrigger() {
  const { setIsModalOpen } = useSearchManager();
  const [shortcutKey, setShortcutKey] = useState("⌘K");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      Promise.resolve().then(() => setShortcutKey(isMac ? "⌘K" : "Ctrl+K"));
    }
  }, []);

  return (
    <button
      onClick={() => setIsModalOpen(true)}
      type="button"
      className="group flex items-center justify-between gap-3 w-full max-w-xs md:max-w-md px-3.5 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-350 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 dark:hover:border-zinc-700 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 select-none"
      aria-label="Open Search Command Palette"
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-zinc-400 group-hover:text-zinc-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300">
          Search...
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1">
        <kbd className="inline-flex items-center justify-center rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 shadow-2xs">
          {shortcutKey}
        </kbd>
        <span className="text-[10px] text-zinc-300 dark:text-zinc-650">or</span>
        <kbd className="inline-flex items-center justify-center rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 shadow-2xs">
          Ctrl+/
        </kbd>
      </div>
    </button>
  );
}
