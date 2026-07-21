import React from 'react';

export function BatchDownloadBar({ 
  selectedCount = 0, 
  onDownloadSelected, 
  onClearSelection, 
  onSelectAll,
  isDownloading = false
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 transform animate-fade-in-up">
      <div className="flex items-center justify-between rounded-3xl border border-zinc-200/80 bg-white/80 p-4 shadow-2xl backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-colors duration-300">
        
        {/* Count and Clear */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
            <span className="text-sm font-black">{selectedCount}</span>
          </div>
          <div>
            <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Photos Selected</h5>
            <button
              onClick={onClearSelection}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-455 dark:hover:text-indigo-350 cursor-pointer transition-colors"
            >
              Clear selection
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2.5 text-xs font-bold dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-all cursor-pointer"
          >
            Select All
          </button>
          
          <button
            disabled={isDownloading}
            onClick={onDownloadSelected}
            className="flex items-center gap-2 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white px-5 py-2.5 text-xs font-black shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Selected</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default BatchDownloadBar;
