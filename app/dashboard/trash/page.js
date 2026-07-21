'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserStudios } from '@/lib/studioService';
import { RecoveryManager } from '@/components/recovery/RecoveryManager';

export default function TrashPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeStudio, setActiveStudio] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      try {
        const studios = await getUserStudios(currentUser.uid);
        if (studios && studios.length > 0) {
          const mainStudio = studios[0];
          setActiveStudio(mainStudio);
          setUserRole(mainStudio.userRole || 'viewer');
        }
      } catch (err) {
        console.error('Failed to load studio details:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6 transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-indigo-650 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm text-zinc-500 font-medium">Loading trash data...</span>
        </div>
      </div>
    );
  }

  // Permission check: Guests forbidden
  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <svg className="w-12 h-12 text-rose-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-light">
            Guests are not permitted to access Trash & Recovery.
          </p>
        </div>
      </div>
    );
  }

  if (!activeStudio) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <svg className="w-12 h-12 text-indigo-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h2 className="text-xl font-bold">No Active Studio</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-light">
            Please create or join a studio to access Trash & Recovery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300">
      <RecoveryManager studioId={activeStudio.studioId} user={user} />
    </div>
  );
}
