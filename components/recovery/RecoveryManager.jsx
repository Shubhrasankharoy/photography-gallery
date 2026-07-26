'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { recoveryService } from '../../lib/recovery/recoveryService';
import { TrashSummaryCards } from './TrashSummaryCards';
import { TrashFilters } from './TrashFilters';
import { TrashTable } from './TrashTable';
import { TrashCard } from './TrashCard';
import { RestoreDialog } from './RestoreDialog';
import { DeleteForeverDialog } from './DeleteForeverDialog';
import { TrashEmpty } from './TrashEmpty';
import { TrashLoading } from './TrashLoading';

export function RecoveryManager({ studioId, user }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState('all');
  const [status, setStatus] = useState('TRASHED');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Dialogs
  const [restoreModal, setRestoreModal] = useState({ isOpen: false, trashId: null, isBulk: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, trashId: null, isBulk: false, isEmptyTrash: false });

  // Fetch Trash Summary
  const fetchSummary = useCallback(async () => {
    if (!studioId) return;
    setSummaryLoading(true);
    try {
      const data = await recoveryService.getTrashSummary(studioId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch trash summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [studioId]);

  // Fetch Trash List
  const fetchTrash = useCallback(async (isLoadMore = false) => {
    if (!studioId) return;
    setLoading(!isLoadMore);
    try {
      const res = await recoveryService.getStudioTrash(studioId, {
        resourceType,
        status,
        search,
        pageSize: 15,
        lastDoc: isLoadMore ? lastDoc : null
      });

      if (isLoadMore) {
        setItems(prev => [...prev, ...res.items]);
      } else {
        setItems(res.items);
      }
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to fetch trash list:', err);
    } finally {
      setLoading(false);
    }
  }, [studioId, resourceType, status, search, lastDoc]);

  useEffect(() => {
    Promise.resolve().then(() => fetchSummary());
  }, [fetchSummary]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTrash(false);
      setSelectedIds([]);
    });
  }, [resourceType, status, search, fetchTrash]);

  // Handle Selection
  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.trashId || i.id));
    }
  };

  const handleSelectItem = (trashId) => {
    setSelectedIds(prev => 
      prev.includes(trashId) ? prev.filter(id => id !== trashId) : [...prev, trashId]
    );
  };

  // Actions
  const handleConfirmRestore = async (options) => {
    setActionLoading(true);
    try {
      if (restoreModal.isBulk) {
        await recoveryService.batchRestore(selectedIds, user, options);
      } else if (restoreModal.trashId) {
        await recoveryService.restore(restoreModal.trashId, user, options);
      }
      setRestoreModal({ isOpen: false, trashId: null, isBulk: false });
      setSelectedIds([]);
      fetchSummary();
      fetchTrash(false);
    } catch (err) {
      alert(err.message || 'Failed to restore resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    setActionLoading(true);
    try {
      if (deleteModal.isEmptyTrash) {
        await recoveryService.emptyTrash(studioId, user);
      } else if (deleteModal.isBulk) {
        await recoveryService.batchPermanentDelete(selectedIds, user);
      } else if (deleteModal.trashId) {
        await recoveryService.permanentDelete(deleteModal.trashId, user);
      }
      setDeleteModal({ isOpen: false, trashId: null, isBulk: false, isEmptyTrash: false });
      setSelectedIds([]);
      fetchSummary();
      fetchTrash(false);
    } catch (err) {
      alert(err.message || (deleteModal.isEmptyTrash ? 'Failed to empty trash' : 'Failed to permanently delete resource'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = () => {
    setDeleteModal({ isOpen: true, trashId: null, isBulk: false, isEmptyTrash: true });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <svg className="w-7 h-7 text-rose-600 dark:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Trash & Recovery
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-light">
            Manage soft-deleted photos, events, and shares. Items stay in trash for 30 days before permanent cleanup.
          </p>
        </div>

        {summary?.total > 0 && status === 'TRASHED' && (
          <button
            onClick={handleEmptyTrash}
            disabled={actionLoading}
            className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-full transition-colors flex items-center gap-1.5 self-start md:self-auto shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Empty Trash
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <TrashSummaryCards summary={summary} loading={summaryLoading} />

      {/* Filter Bar */}
      <TrashFilters
        search={search}
        onSearchChange={setSearch}
        resourceType={resourceType}
        onResourceTypeChange={setResourceType}
        status={status}
        onStatusChange={setStatus}
        onResetFilters={() => {
          setSearch('');
          setResourceType('all');
          setStatus('TRASHED');
        }}
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 text-white p-3.5 rounded-2xl flex items-center justify-between animate-fadeIn shadow-xl">
          <span className="text-xs font-bold pl-2 text-zinc-200">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setRestoreModal({ isOpen: true, trashId: null, isBulk: true })}
              className="px-3.5 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restore Selected
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, trashId: null, isBulk: true })}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Trash Content List / Loading / Empty */}
      {loading ? (
        <TrashLoading />
      ) : items.length === 0 ? (
        <TrashEmpty search={search} resourceType={resourceType} />
      ) : (
        <>
          <TrashTable
            items={items}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onRestore={(trashId) => setRestoreModal({ isOpen: true, trashId, isBulk: false })}
            onPermanentDelete={(trashId) => setDeleteModal({ isOpen: true, trashId, isBulk: false })}
          />

          <div className="md:hidden space-y-3">
            {items.map(item => (
              <TrashCard
                key={item.trashId || item.id}
                item={item}
                isSelected={selectedIds.includes(item.trashId || item.id)}
                onSelect={handleSelectItem}
                onRestore={(trashId) => setRestoreModal({ isOpen: true, trashId, isBulk: false })}
                onPermanentDelete={(trashId) => setDeleteModal({ isOpen: true, trashId, isBulk: false })}
              />
            ))}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchTrash(true)}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl shadow-xs transition-colors"
              >
                Load More Items
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modals */}
      <RestoreDialog
        isOpen={restoreModal.isOpen}
        onClose={() => setRestoreModal({ isOpen: false, trashId: null, isBulk: false })}
        onConfirm={handleConfirmRestore}
        count={restoreModal.isBulk ? selectedIds.length : 1}
        loading={actionLoading}
      />

      <DeleteForeverDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, trashId: null, isBulk: false, isEmptyTrash: false })}
        onConfirm={handleConfirmPermanentDelete}
        count={deleteModal.isBulk ? selectedIds.length : 1}
        loading={actionLoading}
        isEmptyTrash={deleteModal.isEmptyTrash}
      />
    </div>
  );
}
