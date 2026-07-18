"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats overview:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      description: "Registered studio profiles & administrators",
      color: "from-blue-600 to-indigo-650",
      href: "/admin/users",
      action: "Manage Users",
    },
    {
      title: "Galleries & Events",
      value: stats?.totalEvents || 0,
      description: "Active shared user events online",
      color: "from-emerald-600 to-teal-650",
      href: "/admin/events",
      action: "Manage Events",
    },
    {
      title: "Content Items",
      value: stats?.totalPhotos || 0,
      description: "Hosted assets across all events",
      color: "from-rose-600 to-red-650",
      href: "/admin/content",
      action: "Delete Content",
    },
    {
      title: "Total Storage",
      value: formatBytes(stats?.totalStorageBytes || 0),
      description: "Cloud consumption by hosted items",
      color: "from-amber-600 to-orange-655",
      href: "/admin/storage",
      action: "Storage Details",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          System Overview
        </h1>
        <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
          Monitor real-time system metrics, platform adoption rates, and clean up temporary storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20"
          >
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                {card.title}
              </span>
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
                {card.value}
              </span>
              <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1 font-light">
                {card.description}
              </p>
            </div>
            <Link
              href={card.href}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-250 transition-all"
            >
              {card.action} &rarr;
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900/5 dark:bg-white/5 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-850 text-left">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Admin Operations Panel</h2>
        <p className="text-sm text-zinc-550 dark:text-zinc-400 font-light mt-1 mb-6">
          Authorized operations allow you to manage global users, verify active photographers, purge old events, audit storage footprints, and inspect reports.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/search"
            className="p-5 rounded-2xl border border-zinc-200/60 hover:border-zinc-350 dark:border-zinc-850 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/25 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Global Search</h3>
              <p className="text-[11px] text-zinc-450 font-light mt-1">
                Find anything on the system immediately with single-keyword lookup.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 mt-4 block">Search Everything &rarr;</span>
          </Link>
          <Link
            href="/admin/reports"
            className="p-5 rounded-2xl border border-zinc-200/60 hover:border-zinc-350 dark:border-zinc-850 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/25 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">System Reports</h3>
              <p className="text-[11px] text-zinc-450 font-light mt-1">
                Analytics and timeline growth graphs of users, galleries, and events.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 mt-4 block">View Reports &rarr;</span>
          </Link>
          <Link
            href="/admin/photographers"
            className="p-5 rounded-2xl border border-zinc-200/60 hover:border-zinc-350 dark:border-zinc-850 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/25 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Audit Photographers</h3>
              <p className="text-[11px] text-zinc-450 font-light mt-1">
                Verify studio profile setups, locations, and linked galleries list.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 mt-4 block">Manage Studio Profiles &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
