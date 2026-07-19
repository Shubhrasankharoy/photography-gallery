"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getProfileByUid } from "@/lib/profileService";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import StudioSwitcher from "@/components/StudioSwitcher";

export default function DashboardHeader({ onMenuClick }) {
  const { user } = useAuth();
  const [studioName, setStudioName] = useState("");

  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((profile) => {
        if (profile && profile.studioName) {
          setStudioName(profile.studioName);
        }
      });
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-850 dark:bg-black/80 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Left side: Hamburger (mobile only) & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          type="button"
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <span className="text-zinc-800 dark:text-zinc-200">Console</span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <StudioSwitcher />
        </div>
      </div>

      {/* Right side: Greeting, Notifications & Quick Profile link */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {user.displayName || user.email}
            </span>
            <span className="text-[10px] text-zinc-400 font-light uppercase tracking-wider">
              Photographer Partner
            </span>
          </div>
        )}

        <NotificationBell />

        <Link
          href="/dashboard/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-650 text-white hover:bg-indigo-600 shadow-sm transition-all text-sm font-bold uppercase select-none border border-indigo-500/20"
        >
          {user?.displayName ? user.displayName.charAt(0) : (user?.email ? user.email.charAt(0) : "P")}
        </Link>
      </div>

    </header>
  );
}

