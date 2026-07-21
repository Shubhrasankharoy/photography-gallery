import { CanvasProvider } from './canvasProvider';

class VisionFactory {
  constructor() {
    this.providers = {};
    // Register the default Canvas provider
    this.register('canvas', new CanvasProvider());
  }

  /**
   * Register a new vision provider.
   * @param {string} name 
   * @param {VisionProvider} providerInstance 
   */
  register(name, providerInstance) {
    this.providers[name.toLowerCase()] = providerInstance;
  }

  /**
   * Get active provider. Falls back to canvas if not found.
   * @param {string} name 
   * @returns {VisionProvider}
   */
  getProvider(name = 'canvas') {
    const key = name.toLowerCase();
    const provider = this.providers[key] || this.providers['canvas'];
    if (!provider) {
      throw new Error(`Vision provider '${name}' is not registered and fallback 'canvas' is unavailable.`);
    }
    return provider;
  }
}

export const visionFactory = new VisionFactory();
export default visionFactory;
