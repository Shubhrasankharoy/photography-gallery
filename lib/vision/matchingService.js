import { visionFactory } from './visionFactory';
import { CONFIDENCE_LEVELS, CONFIDENCE_THRESHOLDS } from './visionConstants';

export class MatchingService {
  /**
   * Compares two embedding vectors and outputs structured similarity and level metrics
   * @param {Array<number>} emb1
   * @param {Array<number>} emb2
   * @param {string} providerName - Provider key
   * @returns {Promise<Object>} Similarity score, distance, and confidence classification
   */
  async compare(emb1, emb2, providerName = 'canvas') {
    const provider = visionFactory.getProvider(providerName);
    const similarity = await provider.compareEmbeddings(emb1, emb2);
    const distance = 1 - similarity;
    
    let level = CONFIDENCE_LEVELS.NO_MATCH;
    if (similarity >= CONFIDENCE_THRESHOLDS.VERY_HIGH) {
      level = CONFIDENCE_LEVELS.VERY_HIGH;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.HIGH) {
      level = CONFIDENCE_LEVELS.HIGH;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      level = CONFIDENCE_LEVELS.MEDIUM;
    } else if (similarity >= CONFIDENCE_THRESHOLDS.LOW) {
      level = CONFIDENCE_LEVELS.LOW;
    }

    return {
      similarity,
      distance,
      level
    };
  }
}

export const matchingService = new MatchingService();
export default matchingService;
