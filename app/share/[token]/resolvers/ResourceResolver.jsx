'use client';

import React from 'react';
import { RESOURCE_TYPES } from '@/lib/share/shareConstants';
import EventShareResolver from './EventShareResolver';

export default function ResourceResolver({ share, studioId, resourceId, resourceType }) {
  switch (resourceType) {
    case RESOURCE_TYPES.EVENT:
      return <EventShareResolver share={share} studioId={studioId} resourceId={resourceId} />;

    case RESOURCE_TYPES.GALLERY:
    case RESOURCE_TYPES.ALBUM:
    case RESOURCE_TYPES.PHOTO:
    case RESOURCE_TYPES.FACE_SEARCH:
    case RESOURCE_TYPES.DOWNLOAD:
    case RESOURCE_TYPES.INVOICE:
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-3">
            <h2 className="text-xl font-bold capitalize">{resourceType} Shared Resource</h2>
            <p className="text-xs text-slate-400">
              Support for sharing {resourceType} resources will be enabled in an upcoming phase.
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-3">
            <h2 className="text-xl font-bold">Unsupported Resource</h2>
            <p className="text-xs text-slate-400">
              This shared resource type is not recognized.
            </p>
          </div>
        </div>
      );
  }
}
