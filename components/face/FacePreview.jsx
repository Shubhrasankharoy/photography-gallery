import React from 'react';

export function FacePreview({ src, boundingBox, className = 'h-16 w-16' }) {
  if (!src) return null;

  // If there's no bounding box, just show the whole image centered
  if (!boundingBox) {
    return (
      <div className={`relative overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-sm shrink-0 ${className}`}>
        <img
          src={src}
          alt="Subject Preview"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Calculate coordinates to scale and crop the region to fit 100% of the preview circle
  const { x, y, width, height } = boundingBox;
  const imageStyle = {
    position: 'absolute',
    left: `-${(x / width) * 100}%`,
    top: `-${(y / height) * 100}%`,
    width: `${(1 / width) * 100}%`,
    height: `${(1 / height) * 100}%`,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: 'cover'
  };

  return (
    <div className={`relative overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner shrink-0 ${className}`}>
      <img
        src={src}
        alt="Cropped Subject"
        style={imageStyle}
      />
    </div>
  );
}

export default FacePreview;
