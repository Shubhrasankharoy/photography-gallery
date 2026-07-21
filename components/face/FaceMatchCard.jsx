import React, { useState } from 'react';
import FaceConfidenceBadge from './FaceConfidenceBadge';
import FacePreview from './FacePreview';

export function FaceMatchCard({ 
  match, 
  isSelected, 
  onToggleSelect, 
  onView, 
  onDownload, 
  isDownloading 
}) {
  const [hovered, setHovered] = useState(false);
  const { photo, similarity, distance, confidenceLevel, rank, boundingBox, provider } = match;

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleCardClick = (e) => {
    // If user clicked checkbox or download button, don't trigger view/lightbox
    if (e.target.closest('.no-trigger-view')) return;
    onView(photo);
  };

  // Dimensions of the high-tech highlight crop
  const cropHighlightStyle = boundingBox ? {
    left: `${boundingBox.x * 100}%`,
    top: `${boundingBox.y * 100}%`,
    width: `${boundingBox.width * 100}%`,
    height: `${boundingBox.height * 100}%`,
  } : null;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white dark:bg-zinc-950 transition-all duration-300 cursor-zoom-in ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg' 
          : 'border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800/80 hover:shadow-xl'
      }`}
    >
      {/* Visual Header / Rank Badge */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 backdrop-blur-md text-xs font-black text-white dark:bg-zinc-900/85">
          #{rank}
        </span>
        <FaceConfidenceBadge level={confidenceLevel} similarity={similarity} />
      </div>

      {/* Selector Checkbox (no-trigger-view) */}
      <div className="absolute right-4 top-4 z-20 no-trigger-view">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(photo.photoId);
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-zinc-950/40 border-white/40 text-transparent hover:bg-zinc-950/60 hover:border-white/60'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* Photo Wrapper */}
      <div className="relative aspect-3/2 overflow-hidden bg-zinc-150 dark:bg-zinc-900 shrink-0">
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.name || 'Matched Asset'}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
            hovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Bounding Box Highlight Overlay */}
        {boundingBox && (
          <div
            style={cropHighlightStyle}
            className={`absolute border-2 border-indigo-500 rounded-lg pointer-events-none transition-opacity duration-300 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Corner Bracket decorations */}
            <span className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-white rounded-tl-sm"></span>
            <span className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-white rounded-tr-sm"></span>
            <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-white rounded-bl-sm"></span>
            <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-white rounded-br-sm"></span>
          </div>
        )}

        {/* Hover Dimming & Subject Preview overlay */}
        <div
          className={`absolute inset-0 bg-black/35 backdrop-blur-xxs flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <FacePreview 
              src={photo.thumbnailUrl || photo.url} 
              boundingBox={boundingBox} 
              className="h-14 w-14 ring-2 ring-white/60"
            />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">
              Matched Subject View
            </span>
          </div>
        </div>
      </div>

      {/* Info Body */}
      <div className="flex flex-col p-5 grow justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate" title={photo.fileName || photo.name}>
            {photo.fileName || photo.name}
          </h3>
          <p className="text-[10px] text-zinc-400 font-light mt-0.5 truncate uppercase tracking-wider">
            Uploaded by {photo.uploaderName || 'Photographer'}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="inline-block rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-[9px] font-semibold text-zinc-650 dark:text-zinc-350">
              ⚡ {formatDate(photo.createdAt)}
            </span>
            <span className="inline-block rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-[9px] font-semibold text-zinc-650 dark:text-zinc-350">
              📊 Dist: {distance.toFixed(3)}
            </span>
            {provider && (
              <span className="inline-block rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-[9px] font-semibold text-zinc-650 dark:text-zinc-350 uppercase">
                ⚙️ {provider}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between no-trigger-view">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Match Accuracy</span>
            <span className="text-sm font-black text-indigo-650 dark:text-indigo-400">{(similarity * 100).toFixed(1)}%</span>
          </div>

          <button
            disabled={isDownloading}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(photo);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-650 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            title="Download Image"
          >
            {isDownloading ? (
              <svg className="h-4 w-4 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FaceMatchCard;
