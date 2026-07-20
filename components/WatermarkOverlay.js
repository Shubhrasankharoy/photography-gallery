"use client";

import React from "react";

export default function WatermarkOverlay({ studioSettings = {}, preview = false }) {
  const isEnabled = studioSettings.watermarkEnabled || preview;
  if (!isEnabled) return null;

  const position = studioSettings.watermarkPosition || "center";
  const opacity = studioSettings.watermarkOpacity !== undefined ? parseFloat(studioSettings.watermarkOpacity) : 0.4;
  const scale = studioSettings.watermarkScale !== undefined ? parseFloat(studioSettings.watermarkScale) : 0.15;
  const text = studioSettings.watermarkText || studioSettings.studioName || "CaptureSpace Proofing";
  const logoUrl = studioSettings.watermarkLogoUrl || "";

  // Position classes
  let positionClass = "";
  switch (position) {
    case "top-left":
      positionClass = "top-6 left-6 origin-top-left";
      break;
    case "top-right":
      positionClass = "top-6 right-6 origin-top-right";
      break;
    case "bottom-left":
      positionClass = "bottom-6 left-6 origin-bottom-left";
      break;
    case "bottom-right":
      positionClass = "bottom-6 right-6 origin-bottom-right";
      break;
    case "center":
    default:
      positionClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center";
      break;
  }

  // Define scale styling
  // We can scale the element dynamically using CSS scale transform.
  // To avoid clipping, we use absolute positioning.
  const style = {
    opacity: opacity,
    transform: position === "center" ? `translate(-50%, -50%) scale(${scale * 5})` : `scale(${scale * 5})`,
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div 
      className={`absolute z-30 select-none pointer-events-none flex flex-col items-center gap-2 px-4 py-2 rounded bg-black/10 backdrop-blur-[1px] border border-white/5 whitespace-nowrap shadow-xs ${positionClass}`}
      style={style}
    >
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Watermark Logo" 
          className="h-10 w-auto object-contain max-w-[200px]"
          draggable="false"
        />
      ) : (
        <div className="flex items-center gap-1.5 text-white/90">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}
      <span className="text-xs font-bold tracking-wider text-white drop-shadow-md select-none uppercase">
        {text}
      </span>
    </div>
  );
}
