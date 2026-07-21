import { searchFactory } from "./searchFactory";

const HISTORY_KEY = "capture_space_search_history_v1";

class SearchService {
  constructor(providerName = "firestore") {
    this.providerName = providerName;
  }

  /**
   * Retrieves the current active provider from the factory.
   */
  getProvider() {
    return searchFactory.getProvider(this.providerName);
  }

  async search(queryText, filters = {}, options = {}) {
    return this.getProvider().search(queryText, filters, options);
  }

  async searchStudios(queryText, filters = {}, options = {}) {
    return this.getProvider().searchStudios(queryText, filters, options);
  }

  async searchMembers(queryText, filters = {}, options = {}) {
    return this.getProvider().searchMembers(queryText, filters, options);
  }

  async searchEvents(queryText, filters = {}, options = {}) {
    return this.getProvider().searchEvents(queryText, filters, options);
  }

  async searchSuggestions(queryText, options = {}) {
    return this.getProvider().searchSuggestions(queryText, options);
  }

  // --- HISTORY MANAGEMENT ---

  _getHistoryData() {
    if (typeof window === "undefined") {
      return { recent: [], pinned: [], frequentlyUsed: [], lastViewed: null };
    }
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed || { recent: [], pinned: [], frequentlyUsed: [], lastViewed: null };
    } catch (e) {
      console.error("Failed to load search history from localStorage:", e);
      return { recent: [], pinned: [], frequentlyUsed: [], lastViewed: null };
    }
  }

  _saveHistoryData(data) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save search history to localStorage:", e);
    }
  }

  getHistory() {
    return this._getHistoryData();
  }

  /**
   * Saves a clicked search item to history (recent & frequently used).
   */
  saveHistory(item) {
    const data = this._getHistoryData();

    // 1. Add/Move to front of Recent Searches
    const recentFiltered = data.recent.filter((r) => r.id !== item.id);
    recentFiltered.unshift(item);
    data.recent = recentFiltered.slice(0, 10); // Limit to top 10 recent

    // 2. Update Frequently Used (based on click count)
    const freqIndex = data.frequentlyUsed.findIndex((f) => f.item.id === item.id);
    if (freqIndex > -1) {
      data.frequentlyUsed[freqIndex].count += 1;
    } else {
      data.frequentlyUsed.push({ item, count: 1 });
    }
    
    // Sort frequently used by count descending
    data.frequentlyUsed.sort((a, b) => b.count - a.count);
    data.frequentlyUsed = data.frequentlyUsed.slice(0, 10); // Keep top 10

    this._saveHistoryData(data);
  }

  /**
   * Pin or unpin a search item.
   */
  pinSearch(item) {
    const data = this._getHistoryData();
    const isPinned = data.pinned.some((p) => p.id === item.id);

    if (isPinned) {
      data.pinned = data.pinned.filter((p) => p.id !== item.id);
    } else {
      data.pinned.push(item);
    }

    this._saveHistoryData(data);
    return !isPinned; // Return new pinned state
  }

  /**
   * Remove a single item from all history categories.
   */
  removeHistory(itemId) {
    const data = this._getHistoryData();
    data.recent = data.recent.filter((r) => r.id !== itemId);
    data.pinned = data.pinned.filter((p) => p.id !== itemId);
    data.frequentlyUsed = data.frequentlyUsed.filter((f) => f.item.id !== itemId);
    if (data.lastViewed && data.lastViewed.id === itemId) {
      data.lastViewed = null;
    }
    this._saveHistoryData(data);
  }

  /**
   * Clear all history (keeping pinned searches by default).
   */
  clearHistory(clearPinned = false) {
    const data = this._getHistoryData();
    data.recent = [];
    data.frequentlyUsed = [];
    data.lastViewed = null;
    if (clearPinned) {
      data.pinned = [];
    }
    this._saveHistoryData(data);
  }

  /**
   * Tracks the last viewed result.
   */
  saveLastViewed(item) {
    const data = this._getHistoryData();
    data.lastViewed = item;
    this._saveHistoryData(data);
  }
}

export const searchService = new SearchService();
export default searchService;
