import React from 'react';
import { CONFIDENCE_LEVELS } from '../../lib/vision/visionConstants';

export function FaceConfidenceBadge({ level, similarity }) {
  let colorClasses = '';
  
  switch (level) {
    case CONFIDENCE_LEVELS.VERY_HIGH:
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      break;
    case CONFIDENCE_LEVELS.HIGH:
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50';
      break;
    case CONFIDENCE_LEVELS.MEDIUM:
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/50';
      break;
    case CONFIDENCE_LEVELS.LOW:
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50';
      break;
    case CONFIDENCE_LEVELS.NO_MATCH:
    default:
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/50';
      break;
  }

  const similarityPercent = similarity ? `${Math.round(similarity * 100)}%` : '';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase shadow-sm ${colorClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {level} {similarityPercent && `(${similarityPercent})`}
    </span>
  );
}

export default FaceConfidenceBadge;
