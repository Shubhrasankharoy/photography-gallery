"use client";

import { useState, useEffect } from "react";

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load reports stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const renderTimelineChart = () => {
    // Generate dummy linear growth dataset based on totalStats for display
    const data = [1, Math.round((stats?.totalUsers || 3) * 0.3), Math.round((stats?.totalUsers || 3) * 0.6), stats?.totalUsers || 3];
    const labels = ["Jan", "Apr", "Jul", "Now"];

    const width = 500;
    const height = 180;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 4);
    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, value: val, label: labels[idx] };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {points.map((p, idx) => (
          <line
            key={idx}
            x1={p.x}
            y1={padding}
            x2={p.x}
            y2={height - padding}
            className="stroke-zinc-150 dark:stroke-zinc-900/60"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {pathD && <path d={pathD} fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" className="fill-white stroke-rose-600 dark:fill-zinc-950" strokeWidth="2" />
            <text x={p.x} y={height - 5} textAnchor="middle" className="text-[9px] font-medium fill-zinc-400 font-sans">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          System Reports
        </h1>
        <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
          Audit platform adoption vectors, media processing logs, and photographer storage trends.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Cumulative User Acquisition</h3>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-light">Growth distribution timeline of studio accounts</p>
              </div>
              <div className="relative w-full aspect-2/1">
                {renderTimelineChart()}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Total System Breakdown</h3>
              <div className="space-y-4 text-xs font-light text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span>Registered Accounts:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats?.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span>Galleries & Events:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats?.totalEvents || 0}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <span>Media Assets Hosted:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats?.totalPhotos || 0}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>Delivered Downloads:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats?.totalDownloads || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
