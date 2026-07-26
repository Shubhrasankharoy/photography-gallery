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
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-headline">Activity Timeline</h2>
          <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Real-time append-only audit trail of studio actions.</p>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200/60 dark:bg-[#262626] dark:border-zinc-800/40 dark:hover:bg-[#2D2D2D] text-zinc-800 dark:text-zinc-350 text-xs font-bold rounded-[12px] transition-all duration-200 disabled:opacity-50 select-none shadow-xs"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading timeline...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
