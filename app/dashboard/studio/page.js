"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserStudios } from "@/lib/studioService";

export default function StudioHub() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [studios, setStudios] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadStudios() {
      if (!user) return;
      try {
        const userStudios = await getUserStudios(user.uid);
        setStudios(userStudios);
      } catch (err) {
        console.error("Failed to load user studios:", err);
      } finally {
        setIsFetching(false);
      }
    }
    if (user) {
      loadStudios();
    }
  }, [user]);

  if (authLoading || !user || isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Loading Studio environment...</span>
        </div>
      </div>
    );
  }

  // Case 1: User has no studio
  if (studios.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-[80vh] flex flex-col justify-center items-center text-center transition-colors duration-300">
        <div className="mb-6 h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v16.5m16.5-16.5v16.5m-13.5-12.75h3m-3 3h3m-3 3h3m3-6h3m-3 3h3m-3 3h3m-.75 5.25h-3a.75.75 0 00-.75.75v3h4.5v-3a.75.75 0 00-.75-.75z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Establish Your Brand Studio
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 font-light max-w-md leading-relaxed">
          Create a unified branding space, add members, organize proofing galleries under one roof, and stream workflows effortlessly.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard/studio/new"
            className="rounded-full bg-indigo-650 hover:bg-indigo-600 px-8 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
          >
            Create a Studio
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: User belongs to a studio (takes the first studio for now as foundation)
  const currentStudio = studios[0];
  const coverUrl = currentStudio.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300 text-left">
      {/* Header breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
        <span className="text-zinc-800 dark:text-zinc-200">Studio Workspace</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {currentStudio.studioName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-light">
            Manage your brand workspace, settings, and public profile view.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/studio/${currentStudio.studioSlug}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-350 dark:border-zinc-800 bg-white hover:bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all select-none"
          >
            <span>View Public Studio</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
          <Link
            href="/dashboard/studio/settings"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
          >
            <span>Studio Settings</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left branding summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
            <div className="relative aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              <img src={coverUrl} alt="Cover Preview" className="h-full w-full object-cover" />
            </div>

            <div className="flex justify-center -mt-12 relative z-10 mb-4">
              <div className="h-20 w-20 rounded-full bg-indigo-600 border-4 border-white shadow-md dark:border-zinc-950 overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
                {currentStudio.logo ? (
                  <img src={currentStudio.logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  currentStudio.studioName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">{currentStudio.studioName}</h3>
              <p className="text-xs text-zinc-500 font-light">slug: {currentStudio.studioSlug}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase mt-2">
                Your Role: {currentStudio.userRole}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-850">
                About the Studio
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-350 font-light mt-3 leading-relaxed whitespace-pre-line">
                {currentStudio.description || "No description provided yet."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStudio.email && (
                <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Email:</span>
                  <span>{currentStudio.email}</span>
                </div>
              )}
              {currentStudio.phone && (
                <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Phone:</span>
                  <span>{currentStudio.phone}</span>
                </div>
              )}
              {currentStudio.location && (
                <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Location:</span>
                  <span>{currentStudio.location}</span>
                </div>
              )}
              {currentStudio.website && (
                <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Website:</span>
                  <a href={currentStudio.website} target="_blank" className="hover:underline text-indigo-650 dark:text-indigo-400">{currentStudio.website}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
