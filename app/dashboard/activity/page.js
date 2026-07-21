'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserStudios } from '@/lib/studioService';
import ActivityTimeline from '@/components/timeline/ActivityTimeline';

export default function ActivityTimelinePage() {
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    );
  }

  // Permissions check: Guests are forbidden. Owner, Admin, Photographer, Viewer allowed.
  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <svg className="w-12 h-12 text-rose-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-slate-400 mt-2">
            Guests are not permitted to view the Studio Activity Timeline.
          </p>
        </div>
      </div>
    );
  }

  if (!activeStudio) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <svg className="w-12 h-12 text-indigo-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h2 className="text-xl font-bold">No Active Studio</h2>
          <p className="text-sm text-slate-400 mt-2">
            Please create or join a studio to access the Activity Timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Studio Info Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{activeStudio.studioName}</h1>
            <p className="text-xs text-indigo-400 font-mono mt-1">Role: {userRole.toUpperCase()}</p>
          </div>
        </div>

        {/* Timeline Container */}
        <ActivityTimeline studioId={activeStudio.studioId} />
      </div>
    </div>
  );
}
