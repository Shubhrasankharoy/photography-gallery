'use client';

import React from 'react';

export function TrashSummaryCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Trashed',
      value: summary?.total || 0,
      iconPath: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
      bgColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      borderColor: 'border-zinc-200 dark:border-zinc-800'
    },
    {
      title: 'Photos',
      value: summary?.photos || 0,
      iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      bgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      borderColor: 'border-zinc-200 dark:border-zinc-800'
    },
    {
      title: 'Events',
      value: summary?.events || 0,
      iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      bgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      borderColor: 'border-zinc-200 dark:border-zinc-800'
    },
    {
      title: 'Shares',
      value: summary?.shares || 0,
      iconPath: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
      bgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
      borderColor: 'border-zinc-200 dark:border-zinc-800'
    },
    {
      title: 'Expiring Soon',
      value: summary?.expiringSoon || 0,
      iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      bgColor: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
      borderColor: 'border-zinc-200 dark:border-zinc-800',
      badge: '< 7 Days'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`p-4 bg-white dark:bg-zinc-950/40 rounded-xl border ${card.borderColor} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.iconPath} />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {card.value}
            </span>
            {card.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400">
                {card.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
