'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { timelineService } from '@/lib/timeline/timelineService';
import ActivityCard from './ActivityCard';
import TimelineFilters from './TimelineFilters';
import TimelineEmpty from './TimelineEmpty';
import TimelineLoading from './TimelineLoading';

export default function ActivityTimeline({ studioId, eventId, actorId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // IntersectionObserver reference for auto infinite scroll
  const observerRef = useRef(null);

  const fetchTimeline = useCallback(async (isInitial = true, currentLastDoc = null) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await timelineService.getStudioTimeline(studioId, {
        eventId,
        actorId,
        action: selectedAction || null,
        resourceType: selectedResource || null,
        startDate: startDate || null,
        endDate: endDate || null,
        searchQuery: searchQuery || null,
        pageSize: 15,
        lastDoc: currentLastDoc
      });

      if (isInitial) {
        setItems(res.items);
      } else {
        setItems(prev => [...prev, ...res.items]);
      }

      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load activity timeline:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [studioId, eventId, actorId, selectedAction, selectedResource, startDate, endDate, searchQuery]);

  // Initial fetch when filters change
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const res = await timelineService.getStudioTimeline(studioId, {
          eventId,
          actorId,
          action: selectedAction || null,
          resourceType: selectedResource || null,
          startDate: startDate || null,
          endDate: endDate || null,
          searchQuery: searchQuery || null,
          pageSize: 15,
          lastDoc: null
        });
        if (isMounted) {
          setItems(res.items);
          setLastDoc(res.lastDoc);
          setHasMore(res.hasMore);
        }
      } catch (err) {
        console.error('Failed to load activity timeline:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [studioId, eventId, actorId, selectedAction, selectedResource, startDate, endDate, searchQuery]);

  // IntersectionObserver callback for Infinite Scroll
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchTimeline(false, lastDoc);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, lastDoc, fetchTimeline]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedResource('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Activity Timeline</h2>
          <p className="text-sm text-slate-400 mt-0.5">Real-time append-only audit trail of studio actions.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <TimelineFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAction={selectedAction}
        onActionChange={setSelectedAction}
        selectedResource={selectedResource}
        onResourceChange={setSelectedResource}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={handleResetFilters}
      />

      {/* Main List / Feed */}
      {loading ? (
        <TimelineLoading count={4} />
      ) : items.length === 0 ? (
        <TimelineEmpty message="No activities match your current query or filter criteria." />
      ) : (
        <div className="space-y-4">
          {items.map((activity, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <div key={activity.id || idx} ref={isLast ? lastElementRef : null}>
                <ActivityCard activity={activity} />
              </div>
            );
          })}

          {/* Load More Button & Infinite Scroll Indicator */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchTimeline(false, lastDoc)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Loading timeline...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Load More</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
