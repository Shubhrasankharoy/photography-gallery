/**
 * Vision & Face Search constants
 */

export const CONFIDENCE_LEVELS = {
  VERY_HIGH: 'Very High',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NO_MATCH: 'No Match'
};

export const CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: 0.92,
  HIGH: 0.85,
  MEDIUM: 0.75,
  LOW: 0.65
};

export const INDEX_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused'
};

export const DEFAULT_VISION_SETTINGS = {
  provider: 'canvas',
  engine: 'color-layout',
  autoIndex: true,
  searchEnabled: true,
  minimumConfidence: 0.65,
  cacheDuration: 300, // 5 minutes in seconds
  batchSize: 25
};

export const EMITTING_VERSIONS = {
  canvas: {
    engine: 'color-layout',
    version: 'v1',
    length: 192
  }
};
