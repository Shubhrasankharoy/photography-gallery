"use client";

import { useStudio } from "@/context/StudioContext";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function StudioSwitcher() {
  const { studios, currentStudio, switchStudio } = useStudio();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (studios.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full items-center justify-between gap-x-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-xs ring-1 ring-zinc-300 ring-inset hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-800"
          id="menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="flex items-center gap-1.5 max-w-[120px] truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">{currentStudio?.studioName || "Select Studio"}</span>
          </span>
          <svg className="-mr-1 h-3.5 w-3.5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-850 dark:bg-zinc-950 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="px-3 py-2 border-b border-zinc-150 dark:border-zinc-900 mb-1">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Workspace</p>
          </div>
          <div className="space-y-1" role="none">
            {studios.map((studio) => (
              <button
                key={studio.studioId}
                onClick={() => {
                  switchStudio(studio.studioId);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                  studio.studioId === currentStudio?.studioId
                    ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-900"
                }`}
                role="menuitem"
                tabIndex="-1"
              >
                <span className="truncate">{studio.studioName}</span>
                <span className="text-[9px] text-zinc-400 uppercase font-bold">{studio.userRole}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-900 mt-2 pt-2">
            <Link
              href="/dashboard/studio/new"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-indigo-650 hover:bg-zinc-50 dark:text-indigo-400 dark:hover:bg-zinc-900"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Create New Studio</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
