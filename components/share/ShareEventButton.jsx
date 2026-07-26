'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ShareManager from '@/components/share/ShareManager';

export default function ShareEventButton({ eventId, studioId, createdBy, eventName }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setCanShare(false);
        return;
      }

      // 1. Check if user is the direct creator or photographer
      if (user.uid === createdBy) {
        setCanShare(true);
        return;
      }

      // 2. Check if user is a member of the event's studio
      if (studioId && db) {
        try {
          const memberRef = doc(db, 'studioMembers', `${studioId}_${user.uid}`);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            setCanShare(true);
            return;
          }
        } catch (err) {
          console.error('Error checking studio membership:', err);
        }
      }

      setCanShare(false);
    }

    checkPermission();
  }, [user, studioId, createdBy]);

  if (!canShare) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 px-4 py-2 bg-[#D4AF37] hover:bg-[#E0C55B] text-[#181818] text-xs font-bold rounded-[12px] shadow-[var(--shadow-soft)] transition-all duration-150 flex items-center gap-2 cursor-pointer select-none"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        <span>Share Event</span>
      </button>

      <ShareManager
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resourceType="event"
        resourceId={eventId}
        studioId={studioId}
        createdBy={createdBy}
        resourceTitle={eventName}
      />
    </>
  );
}
