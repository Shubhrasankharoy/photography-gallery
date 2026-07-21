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
        className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
      >
        🔗 Share Event
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
