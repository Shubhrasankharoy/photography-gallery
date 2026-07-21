'use client';

import React from 'react';

export function TrashTable({ 
  items, 
  selectedIds, 
  onSelectAll, 
  onSelectItem, 
  onRestore, 
  onPermanentDelete 
}) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const renderResourceIcon = (type) => {
    switch (type) {
      case 'photo':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'share':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getExpirationBadge = (expiresAt) => {
    if (!expiresAt) return null;
    const expDate = new Date(expiresAt.seconds ? expiresAt.seconds * 1000 : expiresAt);
    const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">Expired</span>;
    }
    if (diffDays <= 7) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400">{diffDays}d left</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400">{diffDays}d left</span>;
  };

  return (
    <div className="hidden md:block overflow-x-auto bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-350">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          <tr>
            <th className="p-4 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
              />
            </th>
            <th className="p-4">Resource</th>
            <th className="p-4">Type</th>
            <th className="p-4">Deleted By</th>
            <th className="p-4">Deleted Date</th>
            <th className="p-4">Retention</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
          {items.map((item) => {
            const trashId = item.trashId || item.id;
            const isSelected = selectedIds.includes(trashId);
            const title = item.snapshot?.name || item.snapshot?.title || item.snapshot?.eventName || item.resourceId;

            return (
              <tr 
                key={trashId}
                className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors ${isSelected ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectItem(trashId)}
                    className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                  />
                </td>
                <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    {renderResourceIcon(item.resourceType)}
                  </div>
                  <div className="max-w-xs truncate">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{title}</p>
                    <p className="text-xs text-zinc-400 font-mono truncate">ID: {item.resourceId}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="capitalize px-2.5 py-1 text-xs font-bold rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                    {item.resourceType}
                  </span>
                </td>
                <td className="p-4 text-zinc-700 dark:text-zinc-300 font-medium">
                  {item.deletedByName || 'System'}
                </td>
                <td className="p-4 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.deletedAt?.seconds 
                    ? new Date(item.deletedAt.seconds * 1000).toLocaleDateString()
                    : item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-4">
                  {getExpirationBadge(item.expiresAt)}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => onRestore(trashId)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restore
                  </button>
                  <button
                    onClick={() => onPermanentDelete(trashId)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
