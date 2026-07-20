"use client";

import { useEffect, useState } from "react";
import { getActivityFeed } from "@/lib/galleryService";

export default function ActivityFeed({ studioId = "", eventId = "", uploadedBy = "", limitCount = 8 }) {
  const [activities, setActivities] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getActivityFeed({
          studioId,
          eventId,
          uploadedBy,
          cursor: null,
          limitCount
        });
        if (active) {
          setActivities(result.activities);
          setCursor(result.nextCursor);
          setHasMore(result.activities.length === limitCount);
        }
      } catch (err) {
        console.error("Failed to load activity feed:", err);
        if (active) setError("Unable to load activity logs.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [studioId, eventId, uploadedBy, limitCount]);

  const handleLoadMore = async () => {
    if (loading || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getActivityFeed({
        studioId,
        eventId,
        uploadedBy,
        cursor,
        limitCount
      });
      setActivities(prev => [...prev, ...result.activities]);
      setCursor(result.nextCursor);
      setHasMore(result.activities.length === limitCount);
    } catch (err) {
      console.error("Failed to load more activities:", err);
      setError("Unable to load more activities.");
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = (action) => {
    switch (action) {
      case "upload":
        return {
          label: "Uploaded Photo",
          color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
          icon: "📤"
        };
      case "delete":
        return {
          label: "Deleted Photo",
          color: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50",
          icon: "🗑️"
        };
      case "restore":
        return {
          label: "Restored Photo",
          color: "bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 border-teal-200/50",
          icon: "♻️"
        };
      case "replace":
        return {
          label: "Replaced Photo",
          color: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
          icon: "🔄"
        };
      case "failed":
        return {
          label: "Upload Failed",
          color: "bg-zinc-100 text-zinc-650 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200/50",
          icon: "⚠️"
        };
      default:
        return {
          label: "Activity Recorded",
          color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200/50",
          icon: "📝"
        };
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return "just now";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Activity Stream</h3>
        {loading && !cursor && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-750 font-medium">
          {error}
        </div>
      )}

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((item, index) => {
            const details = getActionDetails(item.action);
            return (
              <div 
                key={item.activityId || index}
                className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200/60 bg-white/70 shadow-sm hover:shadow-md dark:border-zinc-800/60 dark:bg-zinc-950/50 backdrop-blur-xs transition-all duration-300"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base ${details.color}`}>
                  {details.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.userDisplayName || "Unknown Uploader"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-light">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 font-light mt-1 break-all">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{details.label}: </span>
                    {item.fileName} {item.fileSize ? `(${formatFileSize(item.fileSize)})` : ""}
                  </p>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-zinc-450 uppercase tracking-wide font-semibold">
                    <span className="flex items-center gap-1">
                      📁 Event: <span className="text-zinc-600 dark:text-zinc-350">{item.eventName || "Legacy Event"}</span>
                    </span>
                    {item.studioName && (
                      <span className="flex items-center gap-1">
                        🏢 Studio: <span className="text-zinc-600 dark:text-zinc-350">{item.studioName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-900/50 text-xs font-bold text-zinc-700 dark:text-zinc-350 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-zinc-550 border-t-transparent"></div>
                  <span>Loading updates...</span>
                </>
              ) : (
                <span>Load More Activities</span>
              )}
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <div className="py-8 rounded-2xl border border-dashed border-zinc-200 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-500 font-light">No activity logs recorded for this space.</p>
          </div>
        )
      )}
    </div>
  );
}
