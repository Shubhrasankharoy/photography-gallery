"use client";

import { useState } from "react";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("all"); // all, unread, events, uploads, downloads
  const [visibleCount, setVisibleCount] = useState(10);

  const getIcon = (type) => {
    switch (type) {
      case "welcome":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
        );
      case "password_changed":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-450">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      case "event_created":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "upload_complete":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "download":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter(n => !n.read);
      case "events":
        return notifications.filter(n => n.type === "event_created");
      case "uploads":
        return notifications.filter(n => n.type === "upload_complete");
      case "downloads":
        return notifications.filter(n => n.type === "download");
      default:
        return notifications;
    }
  };

  const filtered = getFilteredNotifications();
  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-left bg-zinc-50 dark:bg-black min-h-[85vh]">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-150 dark:bg-zinc-900"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-left bg-zinc-50 dark:bg-black min-h-[85vh] transition-colors duration-300">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-55 tracking-tight">
            Notification Center
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
            Stay updated with event creations, picture downloads, and storage uploads.
          </p>
        </div>
        {notifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={markAllAsRead}
            className="self-start sm:self-center px-4 py-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold text-indigo-650 dark:text-indigo-400 rounded-xl transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="mb-6 flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-850 pb-2 gap-2 scrollbar-none">
        {[
          { id: "all", name: "All" },
          { id: "unread", name: "Unread" },
          { id: "events", name: "Events" },
          { id: "uploads", name: "Uploads" },
          { id: "downloads", name: "Downloads" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setFilter(tab.id); setVisibleCount(10); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filter === tab.id
                ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-8">
            <svg className="h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">No notifications found</p>
            <p className="mt-2 text-xs text-zinc-450 dark:text-zinc-500 font-light">There are no updates here right now.</p>
          </div>
        ) : (
          visible.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) markAsRead(notif.id);
              }}
              className={`flex items-start gap-4 p-5 bg-white dark:bg-zinc-950/10 border transition-all cursor-pointer rounded-2xl ${
                !notif.read 
                  ? "border-indigo-100 dark:border-indigo-900/50 shadow-xs" 
                  : "border-zinc-200 dark:border-zinc-850/60"
              }`}
            >
              {getIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className={`text-sm ${!notif.read ? "font-bold text-zinc-900 dark:text-zinc-100" : "font-semibold text-zinc-700 dark:text-zinc-300"}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-light">
                    {new Date(notif.createdAt).toLocaleString(undefined, { 
                      month: "short", 
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                  {notif.message}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-center">
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notif.id);
                    }}
                    title="Mark as read"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-indigo-650 hover:bg-zinc-50 dark:text-indigo-400 dark:hover:bg-zinc-900 focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  title="Delete notification"
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:hover:bg-rose-950/20 focus:outline-none transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filtered.length > visibleCount && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-indigo-650 text-white dark:bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl transition-all"
          >
            Load More
          </button>
        </div>
      )}

    </div>
  );
}
