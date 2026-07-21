/**
 * Base Vision Provider interface
 */
export class VisionProvider {
  /**
   * Detects the primary regions of interest (e.g. subject / face) inside the photo.
   * @param {string|HTMLImageElement|File|Blob} imageSource - The source photo
   * @returns {Promise<Array<Object>>} List of detected bounding boxes and metadata
   */
  async detectRegion(imageSource) {
    throw new Error('detectRegion method not implemented');
  }

  /**
   * Generates a numerical feature embedding vector for a cropped region.
   * @param {string|HTMLImageElement|File|Blob} imageSource - The source photo
   * @param {number} regionIndex - The index of the target region
   * @param {Object} boundingBox - The bounding box { x, y, width, height }
   * @returns {Promise<Array<number>>} The generated feature embedding vector
   */
  async generateEmbedding(imageSource, regionIndex, boundingBox) {
    throw new Error('generateEmbedding method not implemented');
  }

  /**
   * Compares two embedding vectors and returns similarity distance.
   * @param {Array<number>} emb1
   * @param {Array<number>} emb2
   * @returns {number} Cosine similarity score
   */
  async compareEmbeddings(emb1, emb2) {
    throw new Error('compareEmbeddings method not implemented');
  }
}
