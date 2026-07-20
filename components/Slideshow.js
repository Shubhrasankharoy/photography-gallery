"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function Slideshow({ photos = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Local storage keys & state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("slideshow_speed") || "3000", 10);
    }
    return 3000;
  });
  const [loop, setLoop] = useState(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("slideshow_loop");
      return val === null ? true : val === "true";
    }
    return true;
  });
  const [fitToScreen, setFitToScreen] = useState(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("slideshow_fit");
      return val === null ? true : val === "true";
    }
    return true;
  });

  const [showControls, setShowControls] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const slideshowRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("slideshow_speed", speed.toString());
  }, [speed]);

  useEffect(() => {
    localStorage.setItem("slideshow_loop", loop.toString());
  }, [loop]);

  useEffect(() => {
    localStorage.setItem("slideshow_fit", fitToScreen.toString());
  }, [fitToScreen]);

  // Reduced motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Preloading: Previous, Current, Next, Next+1
  useEffect(() => {
    if (photos.length === 0 || currentIndex === null) return;
    const indicesToPreload = [
      (currentIndex - 1 + photos.length) % photos.length,
      (currentIndex + 1) % photos.length,
      (currentIndex + 2) % photos.length
    ];
    indicesToPreload.forEach((idx) => {
      const photo = photos[idx];
      if (photo && photo.url) {
        const img = new Image();
        img.src = photo.url;
      }
    });
  }, [currentIndex, photos]);

  // Handle slide advance
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev === photos.length - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [photos.length, loop]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return loop ? photos.length - 1 : prev;
      }
      return prev - 1;
    });
  }, [photos.length, loop]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      handleNext();
    }, speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, handleNext]);

  // Mouse activity monitoring to hide controls
  useEffect(() => {
    let timeoutId;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 2000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      slideshowRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard navigation inside slideshow
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.key === "ArrowRight") {
        handleNext();
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
      }
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (photos.length === 0) return null;
  const currentPhoto = photos[currentIndex];

  return (
    <div 
      ref={slideshowRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden transition-all duration-300"
    >
      {/* Background Blur */}
      {!reducedMotion && currentPhoto && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-105 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${currentPhoto.url})` }}
        />
      )}

      {/* Image Display */}
      {currentPhoto && (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src={currentPhoto.url} 
            alt={currentPhoto.name}
            className={`transition-all duration-500 ${
              fitToScreen ? "max-h-full max-w-full object-contain" : "w-full h-full object-cover"
            }`}
            style={{
              transitionDuration: reducedMotion ? "0ms" : "500ms"
            }}
          />
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full text-white">
          {/* Left panel: Info & Close */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all"
              title="Exit Slideshow"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <p className="text-xs font-bold">{currentPhoto?.name || "Untitled"}</p>
              <p className="text-[10px] text-white/50">{currentIndex + 1} of {photos.length}</p>
            </div>
          </div>

          {/* Center Playback controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrev}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-all"
              title="Previous"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setIsPlaying(p => !p)}
              className="p-4 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button 
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-all"
              title="Next"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right panel settings */}
          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <select
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              className="bg-black/60 border border-white/20 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-white/40 cursor-pointer"
              title="Slideshow Speed"
            >
              <option value="2000">2s Speed</option>
              <option value="3000">3s Speed</option>
              <option value="5000">5s Speed</option>
              <option value="10000">10s Speed</option>
            </select>

            {/* Loop Toggle */}
            <button
              onClick={() => setLoop(l => !l)}
              className={`p-2 rounded-full border transition-all ${
                loop ? "bg-white text-black border-white" : "border-white/20 text-white hover:bg-white/10"
              }`}
              title="Loop Slideshow"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>

            {/* Fit to Screen */}
            <button
              onClick={() => setFitToScreen(f => !f)}
              className={`p-2 rounded-full border transition-all ${
                fitToScreen ? "bg-white text-black border-white" : "border-white/20 text-white hover:bg-white/10"
              }`}
              title={fitToScreen ? "Fit to Screen" : "Fill Screen"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
              </svg>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full border border-white/20 hover:bg-white/10 text-white transition-all"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3 3m12 6V4.5M15 9h4.5M15 9l6-6M9 15v4.5M9 15H4.5M9 15l-6 6m12-6v4.5M15 15h4.5M15 15l6 6" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
