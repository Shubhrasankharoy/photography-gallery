"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // If loading or unauthenticated (waiting for redirect), render nothing
  if (loading || !user) {
    return null;
  }

  // Mock list of events for dashboard presentation
  const mockEvents = [
    { id: 1, name: "Sophie & Daniel Matrimony", photos: 342, status: "Published", date: "Jul 12, 2026" },
    { id: 2, name: "Urban Summer Fashion Editorial", photos: 88, status: "Published", date: "Jul 05, 2026" },
    { id: 3, name: "Studio Headshots | James", photos: 45, status: "Draft", date: "Jun 28, 2026" },
  ];

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-black py-10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workspace Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
              Welcome back, <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.displayName || user.email}</span>. Manage client spaces and delivery statistics.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-all select-none"
            >
              Edit Profile
            </Link>
            
            <span
              role="button"
              tabIndex={0}
              onClick={handleLogout}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleLogout();
              }}
              className="rounded-full border border-zinc-350 dark:border-zinc-800 bg-white hover:bg-zinc-50 px-5 py-2 text-xs font-bold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all select-none cursor-pointer"
            >
              Sign Out
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Client Events</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">3</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">+1 new</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Photos Hosted</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">475</span>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">High-res</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cloud Storage</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">1.4 GB</span>
              <span className="text-xs font-semibold text-zinc-400">of 5.0 GB used</span>
            </div>
            {/* Progress bar */}
            <div className="mt-4 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <div className="h-full bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500" style={{ width: "28%" }} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account Tier</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Starter Free</span>
              <span className="text-xs font-bold text-zinc-550 underline cursor-pointer">Upgrade</span>
            </div>
          </div>
        </div>

        {/* Dashboard Workspace sections */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Events table (span 8) */}
          <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Active Client Collections</h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-850 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Event Name</th>
                    <th className="pb-3 font-semibold">Uploaded</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm">
                  {mockEvents.map((evt) => (
                    <tr key={evt.id} className="group">
                      <td className="py-4 font-bold text-zinc-900 dark:text-zinc-100 flex flex-col">
                        <span>{evt.name}</span>
                        <span className="text-xs text-zinc-450 font-light mt-0.5">{evt.date}</span>
                      </td>
                      <td className="py-4 text-zinc-650 dark:text-zinc-400 font-light">
                        {evt.photos} photos
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold tracking-wider ${
                          evt.status === "Published" 
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Manage</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Shortcuts (span 4) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* Shortcut Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">Quick Workflows</h3>
              
              <div className="flex flex-col space-y-3">
                {/* Create collection */}
                <div className="group flex items-center justify-between p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Create Event Space</span>
                      <span className="text-[10px] text-zinc-400">Scheduled for Phase 4</span>
                    </div>
                  </div>
                </div>

                {/* Upload photos */}
                <div className="group flex items-center justify-between p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Upload Media Files</span>
                      <span className="text-[10px] text-zinc-400">Scheduled for Phase 5</span>
                    </div>
                  </div>
                </div>

                {/* Photographer Profile settings */}
                <Link
                  href="/dashboard/profile"
                  className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Photographer Profile</span>
                      <span className="text-[10px] text-zinc-555">Configure public branding & contact info</span>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Storage Teaser Info */}
            <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-md">
              <h4 className="text-sm font-bold tracking-wider uppercase">Upgrade Account</h4>
              <p className="mt-2 text-xs text-indigo-100 leading-relaxed font-light">
                Need more storage space or custom client sub-domains? Unlock AI face search and unlimited high-res downloads.
              </p>
              <div className="mt-5">
                <span className="inline-block rounded-full bg-white hover:bg-zinc-100 px-5 py-2 text-xs font-bold text-indigo-600 cursor-pointer select-none">
                  Get Unlimited Storage
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
