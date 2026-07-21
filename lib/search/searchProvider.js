/**
 * Base Search Provider class.
 * Defines the contract that all search providers (Firestore, Algolia, Typesense, etc.) must implement.
 */
export class SearchProvider {
  /**
   * Performs a general search across all entities.
   * @param {string} queryText 
   * @param {Object} filters 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async search(queryText, filters = {}, options = {}) {
    throw new Error("Method 'search' must be implemented.");
  }

  /**
   * Search specifically for studios.
   */
  async searchStudios(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchStudios' must be implemented.");
  }

  /**
   * Search specifically for members.
   */
  async searchMembers(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchMembers' must be implemented.");
  }

  /**
   * Search specifically for events.
   */
  async searchEvents(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchEvents' must be implemented.");
  }

  /**
   * Search specifically for bride names.
   */
  async searchBrides(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchBrides' must be implemented.");
  }

  /**
   * Search specifically for groom names.
   */
  async searchGrooms(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchGrooms' must be implemented.");
  }

  /**
   * Search specifically for locations.
   */
  async searchLocations(queryText, filters = {}, options = {}) {
    throw new Error("Method 'searchLocations' must be implemented.");
  }

  /**
   * Search suggestions.
   */
  async searchSuggestions(queryText, options = {}) {
    throw new Error("Method 'searchSuggestions' must be implemented.");
  }
}
