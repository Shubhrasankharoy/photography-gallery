"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getProfileByUid } from "@/lib/profileService";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import StudioSwitcher from "@/components/StudioSwitcher";
import SearchTrigger from "@/components/SearchTrigger";
import { useSearchManager } from "@/hooks/useSearchManager";

export default function DashboardHeader({ onMenuClick }) {
  const { user } = useAuth();
  const [studioName, setStudioName] = useState("");
  const { setIsModalOpen } = useSearchManager();

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/50 bg-white/70 px-4 backdrop-blur-md dark:border-zinc-800/40 dark:bg-[#181818]/70 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Left side: Hamburger (mobile only) & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          type="button"
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 lg:hidden focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#8E8E8E]">
          <span className="text-zinc-800 dark:text-zinc-200">Console</span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <StudioSwitcher />
        </div>
      </div>

      {/* Middle: Search Trigger (Desktop/Tablet) */}
      <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-4">
        <SearchTrigger />
      </div>

      {/* Right side: Greeting, Notifications & Quick Profile link */}
      <div className="flex items-center gap-4">
        {/* Mobile search button */}
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="sm:hidden rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 focus:outline-hidden"
          aria-label="Open Search"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {user && (
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {user.displayName || user.email}
            </span>
            <span className="text-[10px] text-[#8E8E8E] font-light uppercase tracking-wider">
              Photographer Partner
            </span>
          </div>
        )}

        <NotificationBell />

        <Link
          href="/dashboard/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-[#181818] hover:bg-[#E0C55B] shadow-sm transition-all text-sm font-bold uppercase select-none border border-[#D4AF37]/20"
        >
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "P")}
        </Link>
      </div>

    </header>
  );
}

