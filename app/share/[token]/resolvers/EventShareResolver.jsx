'use client';

import React, { useState, useEffect } from 'react';
import { getGalleryPhotos } from '@/lib/galleryService';
import EventGalleryView from '@/components/EventGalleryView';

export default function EventShareResolver({ share, studioId, resourceId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventPhotos = async () => {
      if (!resourceId) return;
      try {
        setLoading(true);
        const list = await getGalleryPhotos({ eventId: resourceId });
        setPhotos(list || []);
      } catch (err) {
        console.error('Failed to load shared event photos:', err);
        setError('Failed to load event photos. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventPhotos();
  }, [resourceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading shared gallery workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl max-w-md w-full p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  const dummyEvent = {
    eventId: resourceId,
    eventName: share.title || 'Shared Event Gallery',
    description: share.description || '',
    studioId: studioId || '',
    allowDownload: share.allowDownload
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <EventGalleryView 
        event={dummyEvent} 
        initialPhotos={photos} 
        clientPin="" 
      />
    </div>
  );
}
