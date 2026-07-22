/**
 * Production InsightFace Face Constants
 */

export const CONFIDENCE_LEVELS = {
  VERY_HIGH: 'Very High',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NO_MATCH: 'No Match'
};

export const CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: 0.80,
  HIGH: 0.65,
  MEDIUM: 0.50,
  LOW: 0.35
};

export const DETECTOR_INFO = {
  PROVIDER: 'insightface',
  MODEL: 'buffalo_l',
  EMBEDDING_VERSION: 'buffalo_l_512_v1'
};

export const FACE_PROVIDERS = {
  INSIGHTFACE: 'insightface',
  CANVAS: 'canvas',
  MOCK: 'mock'
};
