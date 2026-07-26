import React, { useEffect, useState } from 'react';
import { ConfirmationDialog } from '../ConfirmationDialog';

export function FaceSearchHistory({ eventId, onSelectSearch }) {
  const [history, setHistory] = useState([]);
  const [isClearOpen, setIsClearOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    try {
      const stored = localStorage.getItem(`vision_search_history_${eventId}`);
      if (stored) {
        Promise.resolve().then(() => setHistory(JSON.parse(stored)));
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
    }
  }, [eventId]);

  const handleClearHistory = () => {
    setIsClearOpen(true);
  };

  const confirmClearHistory = () => {
    try {
      localStorage.removeItem(`vision_search_history_${eventId}`);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    } finally {
      setIsClearOpen(false);
    }
  };

  if (history.length === 0) return null;

  return (
    <>
      <div className="w-full bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-900 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-250/20 dark:border-zinc-900 pb-3">
          <div>
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Recent Searches</h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Quick lookup from this browser</p>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* History Grid */}
        <div className="flex flex-wrap gap-3">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectSearch(item.embedding)}
              className="group relative flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white p-1 pr-4 shadow-sm hover:border-zinc-350 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all text-left cursor-pointer shrink-0"
            >
              <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-100 dark:border-zinc-900 bg-zinc-150 shrink-0">
                <img
                  src={item.thumbnail}
                  alt="Search query"
                  className="h-full w-full object-cover grayscale-30 group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-250">
                  Visual Query
                </span>
                <span className="text-[8px] font-medium text-zinc-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={confirmClearHistory}
        title="Clear Search History?"
        description="Are you sure you want to clear your visual search history? This action cannot be undone."
        confirmText="Clear History"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

/**
 * Utility helper to append a search item to localStorage history safely
 */
export function addSearchToHistory(eventId, embedding, fileOrUrl) {
  if (typeof window === 'undefined' || !eventId || !embedding) return;

  const saveHistoryItem = (thumbnailDataUrl) => {
    try {
      const storageKey = `vision_search_history_${eventId}`;
      const stored = localStorage.getItem(storageKey);
      const list = stored ? JSON.parse(stored) : [];

      // Deduplicate: remove any items matching the same thumbnail string or embedding
      const filtered = list.filter(item => item.thumbnail !== thumbnailDataUrl);

      const newItem = {
        id: 'search_' + Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        embedding,
        thumbnail: thumbnailDataUrl
      };

      // Limit history to 6 items to keep storage neat
      const updated = [newItem, ...filtered].slice(0, 6);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not add item to search history:', err);
    }
  };

  // Convert search source to a compact 64x64 thumbnail
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 64, 64);
        saveHistoryItem(canvas.toDataURL('image/jpeg', 0.8));
      }
    };

    if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
      const url = URL.createObjectURL(fileOrUrl);
      img.src = url;
      // Clean up object URL after loading
      const originalOnload = img.onload;
      img.onload = () => {
        URL.revokeObjectURL(url);
        originalOnload();
      };
    } else if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    }
  } catch (err) {
    console.error('Failed to generate thumbnail for history:', err);
  }
}

export default FaceSearchHistory;
