"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion } from "motion/react";

// Helper function to format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Generate last 7 days helper
function getLast7Days() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

// Format Date to short format e.g. "Jul 18"
function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Check if two dates are same calendar day
function isSameDay(date1Str, date2Obj) {
  if (!date1Str) return false;
  const d1 = new Date(date1Str);
  return (
    d1.getFullYear() === date2Obj.getFullYear() &&
    d1.getMonth() === date2Obj.getMonth() &&
    d1.getDate() === date2Obj.getDate()
  );
}

/* ── Motion Variants ──────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function AnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Firestore Realtime Collections State
  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [views, setViews] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // Hover Tooltip States
  const [activeTooltip, setActiveTooltip] = useState(null); // { type, index, x, y, value, label }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Realtime Firestore listeners
  useEffect(() => {
    if (!user || !db) return;

    // Queries filtered by photographerId
    const eventsQuery = query(collection(db, "events"), where("photographerId", "==", user.uid));
    const photosQuery = query(collection(db, "photos"), where("photographerId", "==", user.uid));
    const downloadsQuery = query(collection(db, "downloads"), where("photographerId", "==", user.uid));
    const viewsQuery = query(collection(db, "views"), where("photographerId", "==", user.uid));

    // Listeners list
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ eventId: doc.id, ...doc.data() }));
      setEvents(data);
    });

    const unsubPhotos = onSnapshot(photosQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ photoId: doc.id, ...doc.data() }));
      setPhotos(data);
    });

    const unsubDownloads = onSnapshot(downloadsQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ downloadId: doc.id, ...doc.data() }));
      setDownloads(data);
    });

    const unsubViews = onSnapshot(viewsQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ viewId: doc.id, ...doc.data() }));
      setViews(data);
      setIsFetching(false);
    });

    return () => {
      unsubEvents();
      unsubPhotos();
      unsubDownloads();
      unsubViews();
    };
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  // Pre-calculate metrics
  const totalEvents = events.length;
  const totalPhotos = photos.length;
  const totalDownloads = downloads.length;
  const totalViews = views.length;

  const totalStorageBytes = photos.reduce((sum, p) => sum + (p.size || 0), 0);
  const maxStorageBytes = 5 * 1024 * 1024 * 1024; // 5 GB limit
  const storagePercentage = Math.min((totalStorageBytes / maxStorageBytes) * 100, 100);

  // Compile last 7 days datasets
  const daysList = getLast7Days();
  const uploadsData = daysList.map((day) => {
    return photos.filter((p) => isSameDay(p.createdAt, day)).length;
  });
  const downloadsData = daysList.map((day) => {
    return downloads.filter((d) => isSameDay(d.timestamp, day)).length;
  });
  const visitorsData = daysList.map((day) => {
    return views.filter((v) => isSameDay(v.timestamp, day)).length;
  });

  // Calculate Popular Events (aggregated by views + downloads)
  const popularEvents = events
    .map((e) => {
      const eventViews = e.views || 0;
      // Also check views collection in case the aggregation missed it
      const collViews = views.filter((v) => v.eventId === e.eventId).length;
      const finalViews = Math.max(eventViews, collViews);

      const eventDownloads = e.downloads || 0;
      const collDownloads = downloads.filter((d) => d.eventId === e.eventId).length;
      const finalDownloads = Math.max(eventDownloads, collDownloads);

      return {
        ...e,
        totalActions: finalViews + finalDownloads,
        viewsCount: finalViews,
        downloadsCount: finalDownloads,
      };
    })
    .sort((a, b) => b.totalActions - a.totalActions)
    .slice(0, 5); // top 5 popular events

  // Custom Chart Renderer Helpers
  const renderAreaChart = (data, dates, strokeColor, fillColor, gradientId, type) => {
    const width = 500;
    const height = 180;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 4); // minimum ceiling of 4 for visually pleasing axis
    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, value: val, label: formatShortDate(dates[idx]) };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";

    return (
      <div className="relative w-full aspect-2/1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + chartHeight * ratio;
            return (
              <line
                key={idx}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-zinc-200 dark:stroke-zinc-800/60"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area under curve */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Path Line */}
          {pathD && <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* X Axis ticks */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="text-[9px] font-medium fill-zinc-400 dark:fill-zinc-500 font-sans"
            >
              {p.label}
            </text>
          ))}

          {/* Data Points / Interactivity */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4.5"
              className="fill-white stroke-[#D4AF37] dark:fill-[#262626] dark:stroke-[#D4AF37] transition-all cursor-pointer hover:r-6"
              strokeWidth="2.5"
              onMouseEnter={(e) => {
                setActiveTooltip({
                  type,
                  index: idx,
                  x: p.x,
                  y: p.y - 12,
                  value: p.value,
                  label: p.label,
                });
              }}
              onMouseLeave={() => setActiveTooltip(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeTooltip && activeTooltip.type === type && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full bg-[#181818] text-white dark:bg-white dark:text-[#181818] rounded-[12px] border border-zinc-200/50 dark:border-zinc-800/40 px-3 py-1.5 text-[10px] font-bold shadow-xl flex flex-col items-center pointer-events-none transition-all duration-150"
            style={{
              left: `${(activeTooltip.x / width) * 100}%`,
              top: `${(activeTooltip.y / height) * 100}%`,
            }}
          >
            <span>{activeTooltip.value} {type}</span>
            <span className="text-[8px] opacity-75 font-normal mt-0.5">{activeTooltip.label}</span>
          </div>
        )}
      </div>
    );
  };

  const renderBarChart = (data, dates, barColor, hoverColor, type) => {
    const width = 500;
    const height = 180;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 4);
    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;

    const points = data.map((val, idx) => {
      const x = padding + idx * (barWidth + gap) + gap / 2;
      const h = (val / maxVal) * chartHeight;
      const y = padding + chartHeight - h;
      return { x, y, w: barWidth, h: Math.max(h, 2), value: val, label: formatShortDate(dates[idx]) };
    });

    return (
      <div className="relative w-full aspect-2/1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + chartHeight * ratio;
            return (
              <line
                key={idx}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-zinc-200 dark:stroke-zinc-800/60"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Bar Rectangles */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx="3"
              className="fill-[#D4AF37]/80 hover:fill-[#D4AF37] transition-all cursor-pointer"
              onMouseEnter={(e) => {
                setActiveTooltip({
                  type,
                  index: idx,
                  x: p.x + p.w / 2,
                  y: p.y - 8,
                  value: p.value,
                  label: p.label,
                });
              }}
              onMouseLeave={() => setActiveTooltip(null)}
            />
          ))}

          {/* X Axis labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x + p.w / 2}
              y={height - 5}
              textAnchor="middle"
              className="text-[9px] font-medium fill-zinc-400 dark:fill-zinc-500 font-sans"
            >
              {p.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeTooltip && activeTooltip.type === type && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full bg-[#181818] text-white dark:bg-white dark:text-[#181818] rounded-[12px] border border-zinc-200/50 dark:border-zinc-800/40 px-3 py-1.5 text-[10px] font-bold shadow-xl flex flex-col items-center pointer-events-none transition-all duration-150"
            style={{
              left: `${(activeTooltip.x / width) * 100}%`,
              top: `${(activeTooltip.y / height) * 100}%`,
            }}
          >
            <span>{activeTooltip.value} {type}</span>
            <span className="text-[8px] opacity-75 font-normal mt-0.5">{activeTooltip.label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#F7F7F7] dark:bg-[#181818] transition-colors duration-300 min-h-screen text-left"
    >
      
      {/* Title Header */}
      <motion.div
        variants={itemVariants}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-headline">
            Analytics Console
          </h1>
          <p className="mt-2 text-sm text-[#8E8E8E] font-light">
            Realtime client interaction metrics, visitor trends, and storage usage summary.
          </p>
        </div>

        {/* Live indicator badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200/50 bg-[#D4AF37]/10 text-[#D4AF37] dark:border-zinc-800/40 text-xs font-bold shrink-0 self-start sm:self-center select-none">
          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
          Live Realtime Connection
        </div>
      </motion.div>

      {/* Realtime Stats Summary Blocks */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {/* Stat Block 1: Visitors */}
        <div className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300">
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Total Visits</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {isFetching ? "..." : totalViews}
          </span>
          <span className="text-[9px] text-[#8E8E8E] font-light mt-1.5 block">Across all active event domains</span>
        </div>

        {/* Stat Block 2: Downloads */}
        <div className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300">
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Downloads</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {isFetching ? "..." : totalDownloads}
          </span>
          <span className="text-[9px] text-[#8E8E8E] font-light mt-1.5 block">Original high-res assets delivered</span>
        </div>

        {/* Stat Block 3: Uploaded Photos */}
        <div className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300">
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Total Images</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {isFetching ? "..." : totalPhotos}
          </span>
          <span className="text-[9px] text-[#8E8E8E] font-light mt-1.5 block">Photos hosted in proofing galleries</span>
        </div>

        {/* Stat Block 4: Storage quota usage */}
        <div className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300">
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Storage Space</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {isFetching ? "..." : formatBytes(totalStorageBytes, 2)}
          </span>
          <span className="text-[9px] text-[#8E8E8E] font-light mt-1.5 block">of 5.0 GB maximum quota limit</span>
        </div>
      </motion.div>

      {/* Main Charts Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Trends uploads/downloads/visitors */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          {/* Chart 1: Visitors trends */}
          <div className="bg-white dark:bg-[#262626] border border-zinc-200/50 dark:border-zinc-800/40 rounded-[20px] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-headline">Gallery Traffic</h3>
                <p className="text-[10px] text-[#8E8E8E] font-light">Client and guest visits over the past 7 days</p>
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#181818] px-3.5 py-1.5 rounded-[12px] border border-zinc-200/50 dark:border-zinc-800/40">
                Last 7 Days
              </span>
            </div>
            {isFetching ? (
              <div className="h-44 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : (
              renderBarChart(visitorsData, daysList, "#D4AF37", "#E0C55B", "Visits")
            )}
          </div>

          {/* Chart 2 & 3: Uploads & Downloads details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Uploads Area Chart */}
            <div className="bg-white dark:bg-[#262626] border border-zinc-200/50 dark:border-zinc-800/40 rounded-[20px] p-6 shadow-[var(--shadow-soft)]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-headline">Photo Uploads</h3>
                <p className="text-[10px] text-[#8E8E8E] font-light">Upload activity over the last 7 days</p>
              </div>
              {isFetching ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                </div>
              ) : (
                renderAreaChart(uploadsData, daysList, "#8E8E8E", "#8E8E8E", "uploadsGrad", "Uploads")
              )}
            </div>

            {/* Downloads Line Chart */}
            <div className="bg-white dark:bg-[#262626] border border-zinc-200/50 dark:border-zinc-800/40 rounded-[20px] p-6 shadow-[var(--shadow-soft)]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-headline">Deliveries (Downloads)</h3>
                <p className="text-[10px] text-[#8E8E8E] font-light">Photo download requests completed</p>
              </div>
              {isFetching ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                </div>
              ) : (
                renderAreaChart(downloadsData, daysList, "#D4AF37", "#D4AF37", "downloadsGrad", "Downloads")
              )}
            </div>
          </div>

        </motion.div>

        {/* Right column: Popular events and Storage Donut */}
        <motion.div variants={itemVariants} className="space-y-8">
          
          {/* Chart 4: Storage usage donut progress */}
          <div className="bg-white dark:bg-[#262626] border border-zinc-200/50 dark:border-zinc-800/40 rounded-[20px] p-6 shadow-[var(--shadow-soft)] text-center flex flex-col items-center">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 w-full text-left font-headline">Disk Space Usage</h3>
            <p className="text-[10px] text-[#8E8E8E] font-light w-full text-left mb-6">Photographer cloud storage allocation</p>

            <div className="relative h-40 w-40 flex items-center justify-center">
              {/* Radial Donut circle path */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-zinc-100 dark:stroke-zinc-900" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#D4AF37] dark:stroke-[#D4AF37] transition-all duration-500"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * storagePercentage) / 100}
                />
              </svg>

              {/* Text overlay inner donut */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{storagePercentage.toFixed(1)}%</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">Quota Used</span>
              </div>
            </div>

            <div className="mt-6 space-y-1.5 w-full">
              <div className="flex justify-between text-xs font-medium text-[#8E8E8E]">
                <span>Consumed:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatBytes(totalStorageBytes)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-[#8E8E8E]">
                <span>Total Quota:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">5.00 GB</span>
              </div>
              {storagePercentage >= 85 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-[10px] leading-normal font-light">
                  Storage quota is close to full. Disconnect Drive or map to another Google Drive directory inside Settings to bypass the limit.
                </div>
              )}
            </div>
          </div>

          {/* Chart 5: Popular Events list */}
          <div className="bg-white dark:bg-[#262626] border border-zinc-200/50 dark:border-zinc-800/40 rounded-[20px] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-headline">Popular Events</h3>
            <p className="text-[10px] text-[#8E8E8E] font-light mb-5">Ranked by combined guest views and downloads</p>

            {isFetching ? (
              <div className="py-8 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : popularEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-550 italic font-light">
                No active event interactions recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {popularEvents.map((evt, idx) => {
                  const viewsPercent = Math.min((evt.viewsCount / Math.max(...popularEvents.map(e => e.viewsCount || 1), 1)) * 100, 100);

                  return (
                    <div key={evt.eventId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 w-3 text-right">
                            {idx + 1}
                          </span>
                          <span className="truncate">{evt.eventName}</span>
                        </div>
                        <span className="shrink-0 font-extrabold text-[#D4AF37]">
                          {evt.totalActions} pts
                        </span>
                      </div>

                      {/* Visual bar tracking views metric */}
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37]"
                          style={{ width: `${viewsPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500 leading-none">
                        <span>{evt.viewsCount} views</span>
                        <span>{evt.downloadsCount} downloads</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </motion.div>

      </div>

    </motion.div>
  );
}
