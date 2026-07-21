'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ActivityIcon from './ActivityIcon';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default React.memo(function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);

  const {
    actorName,
    actorAvatar,
    action,
    title,
    description,
    createdAt,
    resourceType,
    resourceId,
    eventId,
    severity,
    source,
    metadata,
    activityKey
  } = activity;

  const hasMetadata = metadata && (
    metadata.fileCount || 
    metadata.photoCount || 
    metadata.role || 
    metadata.eventName || 
    metadata.shareType || 
    metadata.previousValue || 
    metadata.newValue ||
    (metadata.custom && Object.keys(metadata.custom).length > 0)
  );

  return (
    <div className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Activity Icon with Severity indication */}
        <ActivityIcon action={action} resourceType={resourceType} severity={severity} />

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            {/* Actor Avatar & Name */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {actorAvatar ? (
                  <img src={actorAvatar} alt={actorName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-200 truncate">{actorName || 'System'}</span>
              
              {/* Action Chip */}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-indigo-400 font-mono border border-indigo-900/40">
                {action}
              </span>
            </div>

            {/* Relative Time */}
            <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>

          {/* Title & Description */}
          <h4 className="text-base font-medium text-slate-100 mt-1">{title}</h4>
          {description && (
            <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{description}</p>
          )}

          {/* Target Resource Link (if event or studio) */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {eventId && (
              <Link 
                href={`/event/${eventId}`} 
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-800/50 transition-colors"
              >
                <span>View Event</span>
              </Link>
            )}

            {/* Source Chip */}
            {source && (
              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-700/50 font-mono">
                <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{source}</span>
              </span>
            )}

            {/* Metadata Badges / Chips */}
            {metadata?.fileCount && (
              <span className="bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                {metadata.fileCount} Files
              </span>
            )}
            {metadata?.role && (
              <span className="bg-slate-800/80 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-900/40">
                Role: {metadata.role}
              </span>
            )}
            {metadata?.shareType && (
              <span className="bg-slate-800/80 text-purple-400 px-2.5 py-1 rounded-lg border border-purple-900/40">
                Share: {metadata.shareType}
              </span>
            )}
          </div>

          {/* Expandable Details Section */}
          {hasMetadata && (
            <div className="mt-3 pt-3 border-t border-slate-800/60">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>{expanded ? 'Hide Details' : 'Expand Details'}</span>
                {expanded ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                )}
              </button>

              {expanded && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
                  <div className="text-slate-500 text-[11px] mb-1">Key: {activityKey}</div>
                  {metadata.previousValue && <div><span className="text-rose-400">- Previous:</span> {metadata.previousValue}</div>}
                  {metadata.newValue && <div><span className="text-emerald-400">+ New:</span> {metadata.newValue}</div>}
                  {metadata.eventName && <div><span className="text-slate-400">Event:</span> {metadata.eventName}</div>}
                  {metadata.custom && Object.keys(metadata.custom).length > 0 && (
                    <pre className="text-slate-400 text-[11px] mt-1 whitespace-pre-wrap">
                      {JSON.stringify(metadata.custom, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
