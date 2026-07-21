import { FirestoreSearchProvider } from "./firestoreSearchProvider";

class SearchFactory {
  constructor() {
    this.providers = {};
    // Register the default Firestore provider
    this.register("firestore", new FirestoreSearchProvider());
  }

  /**
   * Register a new search provider.
   * @param {string} name 
   * @param {SearchProvider} providerInstance 
   */
  register(name, providerInstance) {
    this.providers[name.toLowerCase()] = providerInstance;
  }

  /**
   * Get provider by name. Falls back to firestore if not found.
   * @param {string} name 
   * @returns {SearchProvider}
   */
  getProvider(name = "firestore") {
    const key = name.toLowerCase();
    const provider = this.providers[key] || this.providers["firestore"];
    if (!provider) {
      throw new Error(`Search provider '${name}' is not registered and fallback 'firestore' is unavailable.`);
    }
    return provider;
  }
}

export const searchFactory = new SearchFactory();
export default searchFactory;
