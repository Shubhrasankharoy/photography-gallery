"use client";

import { useAuth } from "@/context/AuthContext";

export default function AuthLoadingWrapper({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        {/* Sleek rotating ring loader */}
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-zinc-150 dark:border-zinc-900" />
          <div className="absolute h-16 w-16 rounded-full border-t-2 border-indigo-600 dark:border-indigo-400 animate-spin" />
        </div>
        
        {/* Modern text indicators */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
          <h3 className="text-sm font-bold tracking-widest text-zinc-900 dark:text-zinc-50 uppercase animate-pulse">
            CaptureSpace
          </h3>
          <p className="text-xs text-zinc-500 font-light">
            Establishing secure credentials...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
