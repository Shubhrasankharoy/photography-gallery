"use client";

import { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchService } from "@/lib/search/searchService";
import { useAuth } from "@/context/AuthContext";
import { StudioContext, useStudio } from "@/context/StudioContext";

export const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentStudio } = useStudio() || {};

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters and Sorting
  const [activeFilters, setActiveFilters] = useState({
    studioId: "",
    status: "",
    location: "",
    startDate: "",
    endDate: "",
    type: "" // 'studio' | 'member' | 'event' | 'bride' | 'groom' | 'location'
  });
  const [sortOrder, setSortOrder] = useState("score");

  // Local history state
  const [history, setHistory] = useState({ recent: [], pinned: [], frequentlyUsed: [], lastViewed: null });

  // Cache & Debouncing/Cancellation REFs
  const cacheRef = useRef({});
  const querySeq = useRef(0);
  const debounceTimer = useRef(null);

  // Sync Studio Context automatically if it changes
  useEffect(() => {
    const newStudioId = currentStudio?.studioId || "";
    Promise.resolve().then(() => {
      setActiveFilters((prev) => ({ ...prev, studioId: newStudioId }));
    });
  }, [currentStudio]);

  // Load history from service
  const loadHistory = useCallback(() => {
    setHistory(searchService.getHistory());
  }, []);

  // Initialize history on mount/window focus
  useEffect(() => {
    Promise.resolve().then(() => loadHistory());
    if (typeof window !== "undefined") {
      window.addEventListener("focus", loadHistory);
      return () => window.removeEventListener("focus", loadHistory);
    }
  }, [loadHistory]);

  // Perform search
  const performSearch = useCallback(async (searchQuery, filters, sort) => {
    const seq = ++querySeq.current;
    
    // Check cache
    const cacheKey = `${searchQuery.trim()}:${JSON.stringify(filters)}:${sort}`;
    if (cacheRef.current[cacheKey]) {
      setResults(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build options
      const options = {
        limit: 50,
        sort
      };

      // Call searchService
      let searchResults = [];
      
      // If we filter by a specific entity type, call that method directly, else search globally
      if (filters.type) {
        if (filters.type === "studio") {
          searchResults = await searchService.searchStudios(searchQuery, filters, options);
        } else if (filters.type === "member") {
          searchResults = await searchService.searchMembers(searchQuery, filters, options);
        } else if (filters.type === "event") {
          searchResults = await searchService.searchEvents(searchQuery, filters, options);
        } else if (filters.type === "bride") {
          const provider = searchService.getProvider();
          searchResults = await provider.searchBrides(searchQuery, filters, options);
        } else if (filters.type === "groom") {
          const provider = searchService.getProvider();
          searchResults = await provider.searchGrooms(searchQuery, filters, options);
        } else if (filters.type === "location") {
          const provider = searchService.getProvider();
          searchResults = await provider.searchLocations(searchQuery, filters, options);
        }
      } else {
        const response = await searchService.search(searchQuery, filters, options);
        searchResults = response.results || [];
      }

      // Check if this query is still valid (not cancelled/superseded)
      if (seq === querySeq.current) {
        // Cache the result
        cacheRef.current[cacheKey] = searchResults;
        setResults(searchResults);
        setLoading(false);
      }
    } catch (err) {
      console.error("Global search error:", err);
      if (seq === querySeq.current) {
        setError("Failed to fetch search results. Please try again.");
        setLoading(false);
      }
    }
  }, []);

  // Fetch suggestions when query changes (or popular list if empty)
  const loadSuggestions = useCallback(async (searchQuery, filters) => {
    try {
      const response = await searchService.searchSuggestions(searchQuery, { filters });
      setSuggestions(response || []);
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    }
  }, []);

  // Trigger search on query/filter/sort changes (debounced)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = query.trim();

    // If query is empty, clear results but load suggestions (recent items, popular etc.)
    if (!trimmed) {
      Promise.resolve().then(() => {
        setResults([]);
        setLoading(false);
        loadSuggestions("", activeFilters);
      });
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(trimmed, activeFilters, sortOrder);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, activeFilters, sortOrder, performSearch, loadSuggestions]);

  // Preloading result page for high-performance feel
  const preloadPage = useCallback((url) => {
    if (url && typeof window !== "undefined") {
      router.prefetch(url);
    }
  }, [router]);

  // When result is clicked
  const selectResult = useCallback((item) => {
    searchService.saveHistory(item);
    searchService.saveLastViewed(item);
    loadHistory();
    setIsModalOpen(false);
    
    if (item.url) {
      router.push(item.url);
    }
  }, [router, loadHistory]);

  const pinItem = useCallback((item) => {
    searchService.pinSearch(item);
    loadHistory();
  }, [loadHistory]);

  const removeItemFromHistory = useCallback((itemId) => {
    searchService.removeHistory(itemId);
    loadHistory();
  }, [loadHistory]);

  const clearAllHistory = useCallback(() => {
    searchService.clearHistory(false); // clear recent & popular, keep pinned
    loadHistory();
  }, [loadHistory]);

  return (
    <SearchContext.Provider
      value={{
        isModalOpen,
        setIsModalOpen,
        query,
        setQuery,
        results,
        suggestions,
        loading,
        error,
        activeFilters,
        setActiveFilters,
        sortOrder,
        setSortOrder,
        history,
        pinItem,
        removeItemFromHistory,
        clearAllHistory,
        selectResult,
        preloadPage
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
