import { VisionProvider } from './visionProvider';

/**
 * Helper to load an image source into an HTMLImageElement
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('CanvasProvider can only run in browser environments'));
      return;
    }

    if (src instanceof HTMLImageElement) {
      if (src.complete) {
        resolve(src);
      } else {
        src.onload = () => resolve(src);
        src.onerror = (e) => reject(e);
      }
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    if (src instanceof Blob || src instanceof File) {
      const url = URL.createObjectURL(src);
      img.src = url;
      // Clean up URL after loading finishes
      const originalOnload = img.onload;
      img.onload = () => {
        URL.revokeObjectURL(url);
        originalOnload();
      };
    } else if (typeof src === 'string') {
      img.src = src;
    } else {
      reject(new Error('Invalid image source type'));
    }
  });
}

/**
 * L2 normalization helper for float arrays
 */
function l2Normalize(vector) {
  let sumSquares = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSquares += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sumSquares);
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

export class CanvasProvider extends VisionProvider {
  /**
   * Mock a region detection by isolating the central 60% of the image.
   */
  async detectRegion(imageSource) {
    try {
      const img = await loadImage(imageSource);
      // Determine rotation and detection confidence
      return [
        {
          x: 0.2,
          y: 0.2,
          width: 0.6,
          height: 0.6,
          rotation: 0,
          confidence: 1.0,
          detectedAt: new Date().toISOString()
        }
      ];
    } catch (err) {
      console.error('Error loading image for region detection:', err);
      // Fallback region without loading
      return [
        {
          x: 0.2,
          y: 0.2,
          width: 0.6,
          height: 0.6,
          rotation: 0,
          confidence: 1.0,
          detectedAt: new Date().toISOString()
        }
      ];
    }
  }

  /**
   * Generates a 192-dimensional color-layout embedding by scaling the cropped region to 8x8.
   */
  async generateEmbedding(imageSource, regionIndex, boundingBox) {
    const img = await loadImage(imageSource);
    
    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D canvas context');
    }

    // Resolve source dimensions
    const sx = Math.floor(boundingBox.x * img.naturalWidth);
    const sy = Math.floor(boundingBox.y * img.naturalHeight);
    const sWidth = Math.floor(boundingBox.width * img.naturalWidth);
    const sHeight = Math.floor(boundingBox.height * img.naturalHeight);

    // Draw crop onto the 8x8 grid
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 8, 8);

    // Get pixel values
    const imgData = ctx.getImageData(0, 0, 8, 8);
    const data = imgData.data; // 8 * 8 * 4 values (RGBA)
    const embedding = [];

    // Extract RGB features and scale to [0, 1]
    for (let i = 0; i < data.length; i += 4) {
      embedding.push(data[i] / 255.0);     // Red
      embedding.push(data[i + 1] / 255.0); // Green
      embedding.push(data[i + 2] / 255.0); // Blue
    }

    // Return the L2 normalized vector
    return l2Normalize(embedding);
  }

  /**
   * Cosine similarity of two L2 normalized vectors is just their dot product.
   */
  async compareEmbeddings(emb1, emb2) {
    if (!emb1 || !emb2 || emb1.length !== emb2.length) return 0;
    let dot = 0;
    for (let i = 0; i < emb1.length; i++) {
      dot += emb1[i] * emb2[i];
    }
    // Safeguard bounds
    return Math.max(0, Math.min(1, dot));
  }
}
export default CanvasProvider;
