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
    <div className="group relative bg-white hover:bg-zinc-50/50 border border-zinc-200/50 hover:border-zinc-300 rounded-[20px] p-4 sm:p-5 transition-all duration-200 dark:bg-[#262626] dark:border-zinc-800/40 dark:hover:bg-[#2D2D2D]/30 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-4">
        {/* Activity Icon with Severity indication */}
        <ActivityIcon action={action} resourceType={resourceType} severity={severity} />

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            {/* Actor Avatar & Name */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200/60 dark:bg-[#181818] dark:border-zinc-800/40 flex items-center justify-center overflow-hidden shrink-0">
                {actorAvatar ? (
                  <img src={actorAvatar} alt={actorName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-headline truncate">{actorName || 'System'}</span>
              
              {/* Action Chip */}
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-mono border border-[#D4AF37]/20 font-bold">
                {action}
              </span>
            </div>

            {/* Relative Time */}
            <div className="flex items-center gap-1 text-[11px] text-[#8E8E8E] font-light">
              <svg className="w-3.5 h-3.5 text-[#8E8E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>

          {/* Title & Description */}
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-headline mt-1">{title}</h4>
          {description && (
            <p className="text-xs text-[#8E8E8E] dark:text-zinc-400 mt-1 font-light leading-relaxed">{description}</p>
          )}

          {/* Target Resource Link (if event or studio) */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {eventId && (
              <Link 
                href={`/event/${eventId}`} 
                className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-[#E0C55B] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-[12px] border border-[#D4AF37]/20 font-bold transition-colors select-none"
              >
                <span>View Event</span>
              </Link>
            )}

            {/* Source Chip */}
            {source && (
              <span className="inline-flex items-center gap-1.5 text-zinc-650 bg-zinc-50/60 dark:bg-[#181818]/60 dark:text-zinc-400 px-3 py-1.5 rounded-[12px] border border-zinc-200/50 dark:border-zinc-800/40 font-mono text-[10px] font-bold">
                <svg className="w-3 h-3 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{source}</span>
              </span>
            )}

            {/* Metadata Badges / Chips */}
            {metadata?.fileCount && (
              <span className="bg-zinc-50/60 border border-zinc-200/50 text-zinc-650 dark:bg-[#181818]/60 dark:border-zinc-800/40 dark:text-zinc-400 px-3 py-1 rounded-[12px] font-light">
                {metadata.fileCount} Files
              </span>
            )}
            {metadata?.role && (
              <span className="bg-zinc-50/60 border border-zinc-200/50 text-zinc-650 dark:bg-[#181818]/60 dark:border-zinc-800/40 dark:text-zinc-400 px-3 py-1 rounded-[12px] font-light">
                Role: <span className="font-bold text-[#D4AF37]">{metadata.role}</span>
              </span>
            )}
            {metadata?.shareType && (
              <span className="bg-zinc-50/60 border border-zinc-200/50 text-zinc-650 dark:bg-[#181818]/60 dark:border-zinc-800/40 dark:text-zinc-400 px-3 py-1 rounded-[12px] font-light">
                Share: <span className="font-bold text-[#D4AF37]">{metadata.shareType}</span>
              </span>
            )}
          </div>

          {/* Expandable Details Section */}
          {hasMetadata && (
            <div className="mt-3.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#8E8E8E] hover:text-[#D4AF37] transition-colors"
              >
                <span>{expanded ? 'Hide Details' : 'Expand Details'}</span>
                {expanded ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                )}
              </button>

              {expanded && (
                <div className="mt-2.5 p-3 rounded-[12px] bg-zinc-50/80 border border-zinc-200/50 dark:bg-[#181818]/60 dark:border-zinc-800/40 font-mono text-[11px] text-zinc-700 dark:text-zinc-350 space-y-1.5 overflow-x-auto">
                  <div className="text-zinc-400 dark:text-zinc-500 text-[10px] mb-1">Key: {activityKey}</div>
                  {metadata.previousValue && <div><span className="text-rose-500 font-semibold">- Previous:</span> {metadata.previousValue}</div>}
                  {metadata.newValue && <div><span className="text-emerald-600 font-semibold">+ New:</span> {metadata.newValue}</div>}
                  {metadata.eventName && <div><span className="text-[#8E8E8E]">Event:</span> {metadata.eventName}</div>}
                  {metadata.custom && Object.keys(metadata.custom).length > 0 && (
                    <pre className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-1 whitespace-pre-wrap">
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
