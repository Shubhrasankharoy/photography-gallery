import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { SearchProvider } from "./searchProvider";
import { toSearchResult, normalizeText } from "./searchIndex";

export class FirestoreSearchProvider extends SearchProvider {
  /**
   * General search across all categories.
   */
  async search(queryText, filters = {}, options = {}) {
    const [studios, members, events, brides, grooms, locations] = await Promise.all([
      this.searchStudios(queryText, filters, options),
      this.searchMembers(queryText, filters, options),
      this.searchEvents(queryText, filters, options),
      this.searchBrides(queryText, filters, options),
      this.searchGrooms(queryText, filters, options),
      this.searchLocations(queryText, filters, options)
    ]);

    let allResults = [
      ...studios,
      ...members,
      ...events,
      ...brides,
      ...grooms,
      ...locations
    ];

    if (queryText) {
      allResults = allResults.filter(item => item.score > 0);
    }

    // Apply sorting
    allResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.priority - b.priority;
    });

    // Pagination/Cursor
    const limitVal = options.limit || 50;
    const offset = options.cursor ? parseInt(options.cursor, 10) : 0;
    const paginated = allResults.slice(offset, offset + limitVal);
    const nextCursor = offset + limitVal < allResults.length ? (offset + limitVal).toString() : null;

    return {
      results: paginated,
      nextCursor
    };
  }

  /**
   * Search Studios
   */
  async searchStudios(queryText, filters = {}, options = {}) {
    if (!db) return [];
    try {
      const q = query(collection(db, "studios"));
      const snap = await getDocs(q);
      let rawStudios = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Apply filters and search query in-memory
      if (filters.status) {
        rawStudios = rawStudios.filter(s => s.status === filters.status);
      }
      if (filters.location) {
        rawStudios = rawStudios.filter(s => normalizeText(s.location).includes(normalizeText(filters.location)));
      }
      if (filters.studioId) {
        rawStudios = rawStudios.filter(s => (s.id || s.studioId) === filters.studioId);
      }

      if (queryText) {
        const normQuery = normalizeText(queryText);
        rawStudios = rawStudios.filter(s => 
          normalizeText(s.studioName).includes(normQuery) ||
          normalizeText(s.studioSlug).includes(normQuery) ||
          normalizeText(s.location).includes(normQuery) ||
          normalizeText(s.description).includes(normQuery)
        );
      }

      return rawStudios.map(studio => 
        toSearchResult({
          id: studio.id || studio.studioId,
          type: "studio",
          title: studio.studioName,
          subtitle: studio.location || studio.description || "",
          description: studio.description || "",
          thumbnail: studio.logo || studio.coverImage || null,
          badge: "Studio",
          url: `/studio/${studio.studioSlug}`,
          queryText,
          metadata: {
            slug: studio.studioSlug,
            email: studio.email,
            phone: studio.phone,
            website: studio.website,
            location: studio.location
          }
        })
      );
    } catch (e) {
      console.error("FirestoreSearchProvider searchStudios failed:", e);
      return [];
    }
  }

  /**
   * Search Studio Members
   */
  async searchMembers(queryText, filters = {}, options = {}) {
    if (!db) return [];
    try {
      let memberDocs = [];
      const constraints = [];

      if (filters.studioId) {
        constraints.push(where("studioId", "==", filters.studioId));
      }

      const q = query(collection(db, "studioMembers"), ...constraints);
      const snap = await getDocs(q);
      memberDocs = snap.docs.map(d => d.data());

      const members = [];
      await Promise.all(memberDocs.map(async (m) => {
        const userRef = doc(db, "users", m.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          
          if (filters.role && m.role !== filters.role) return;

          members.push({
            id: m.userId,
            displayName: u.displayName || u.email || "Active Member",
            email: u.email || "",
            role: m.role || "member",
            studioId: m.studioId,
            joinedAt: m.joinedAt
          });
        }
      }));

      // Match queryText client-side
      const filtered = queryText
        ? members.filter(m => 
            normalizeText(m.displayName).includes(normalizeText(queryText)) ||
            normalizeText(m.email).includes(normalizeText(queryText)) ||
            normalizeText(m.role).includes(normalizeText(queryText))
          )
        : members;

      return filtered.map(m => 
        toSearchResult({
          id: m.id,
          type: "member",
          title: m.displayName,
          subtitle: `${m.role} | ${m.email}`,
          description: `Joined at: ${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "unknown"}`,
          badge: m.role.toUpperCase(),
          url: `/dashboard/studio/members`,
          queryText,
          metadata: {
            email: m.email,
            role: m.role,
            studioId: m.studioId
          }
        })
      );
    } catch (e) {
      console.error("FirestoreSearchProvider searchMembers failed:", e);
      return [];
    }
  }

  /**
   * Search Events
   */
  async searchEvents(queryText, filters = {}, options = {}) {
    if (!db) return [];
    try {
      let rawEvents = [];
      
      // Fetch events matching studioId constraint if set, else fetch all
      if (filters.studioId) {
        const q = query(collection(db, "events"), where("studioId", "==", filters.studioId));
        const snap = await getDocs(q);
        rawEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const q = query(collection(db, "events"));
        const snap = await getDocs(q);
        rawEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // Apply queryText search in-memory (handles case insensitivity & middle-of-word substrings)
      if (queryText) {
        const normQuery = normalizeText(queryText);
        rawEvents = rawEvents.filter(e => 
          normalizeText(e.eventName).includes(normQuery) ||
          normalizeText(e.brideName).includes(normQuery) ||
          normalizeText(e.groomName).includes(normQuery) ||
          normalizeText(e.location).includes(normQuery) ||
          normalizeText(e.description).includes(normQuery)
        );
      }

      // Apply other filters in-memory
      if (filters.studioId) {
        rawEvents = rawEvents.filter(e => e.studioId === filters.studioId);
      }
      if (filters.status) {
        rawEvents = rawEvents.filter(e => e.status === filters.status);
      } else {
        rawEvents = rawEvents.filter(e => e.status !== "trashed");
      }
      if (filters.location) {
        rawEvents = rawEvents.filter(e => 
          e.location && normalizeText(e.location).includes(normalizeText(filters.location))
        );
      }
      if (filters.startDate || filters.endDate) {
        rawEvents = rawEvents.filter(e => {
          if (!e.eventDate) return false;
          const ed = new Date(e.eventDate);
          if (filters.startDate && ed < new Date(filters.startDate)) return false;
          if (filters.endDate && ed > new Date(filters.endDate)) return false;
          return true;
        });
      }

      return rawEvents.map(event => 
        toSearchResult({
          id: event.id || event.eventId,
          type: "event",
          title: event.eventName,
          subtitle: `${event.brideName} & ${event.groomName} | ${event.location || "No Location"}`,
          description: event.description || "",
          thumbnail: event.coverImage || null,
          badge: event.status ? event.status.toUpperCase() : "EVENT",
          url: `/event/${event.id || event.eventId}`,
          queryText,
          metadata: {
            brideName: event.brideName,
            groomName: event.groomName,
            location: event.location,
            eventDate: event.eventDate,
            studioId: event.studioId
          }
        })
      );
    } catch (e) {
      console.error("FirestoreSearchProvider searchEvents failed:", e);
      return [];
    }
  }

  /**
   * Search Brides
   */
  async searchBrides(queryText, filters = {}, options = {}) {
    const events = await this.searchEvents(queryText, filters, options);
    const queryNorm = normalizeText(queryText);
    const brides = events
      .filter(item => !queryNorm || normalizeText(item.metadata.brideName).includes(queryNorm))
      .map(item => 
        toSearchResult({
          id: `${item.id}_bride`,
          type: "bride",
          title: item.metadata.brideName,
          subtitle: `Bride in: ${item.title}`,
          description: `Location: ${item.metadata.location} | Date: ${item.metadata.eventDate}`,
          thumbnail: item.thumbnail,
          badge: "BRIDE",
          url: item.url,
          queryText,
          metadata: item.metadata
        })
      );
    return brides;
  }

  /**
   * Search Grooms
   */
  async searchGrooms(queryText, filters = {}, options = {}) {
    const events = await this.searchEvents(queryText, filters, options);
    const queryNorm = normalizeText(queryText);
    const grooms = events
      .filter(item => !queryNorm || normalizeText(item.metadata.groomName).includes(queryNorm))
      .map(item => 
        toSearchResult({
          id: `${item.id}_groom`,
          type: "groom",
          title: item.metadata.groomName,
          subtitle: `Groom in: ${item.title}`,
          description: `Location: ${item.metadata.location} | Date: ${item.metadata.eventDate}`,
          thumbnail: item.thumbnail,
          badge: "GROOM",
          url: item.url,
          queryText,
          metadata: item.metadata
        })
      );
    return grooms;
  }

  /**
   * Search Locations (Locations from Studios & Events)
   */
  async searchLocations(queryText, filters = {}, options = {}) {
    // Fetch unique locations
    const [studios, events] = await Promise.all([
      this.searchStudios(queryText, filters, options),
      this.searchEvents(queryText, filters, options)
    ]);

    const locationsMap = new Map();
    const queryNorm = normalizeText(queryText);

    const processLocation = (loc, type, parentTitle) => {
      if (!loc) return;
      const normLoc = normalizeText(loc);
      if (queryNorm && !normLoc.includes(queryNorm)) return;

      if (!locationsMap.has(normLoc)) {
        locationsMap.set(normLoc, {
          id: `location_${normLoc}`,
          type: "location",
          title: loc,
          subtitle: `${type}: ${parentTitle}`,
          description: `Found in ${type.toLowerCase()}`,
          thumbnail: null,
          badge: "LOCATION",
          url: `/events?location=${encodeURIComponent(loc)}`,
          queryText,
          metadata: { location: loc }
        });
      }
    };

    studios.forEach(s => processLocation(s.metadata.location || s.subtitle, "Studio", s.title));
    events.forEach(e => processLocation(e.metadata.location, "Event", e.title));

    return Array.from(locationsMap.values()).map(locObj => toSearchResult(locObj));
  }

  /**
   * Suggestions (pre-typing or based on prefix matches)
   */
  async searchSuggestions(queryText, options = {}) {
    const filters = options.filters || {};
    const [studios, events] = await Promise.all([
      this.searchStudios(queryText, filters, { limit: 5 }),
      this.searchEvents(queryText, filters, { limit: 5 })
    ]);

    const suggestions = [];

    events.slice(0, 4).forEach(e => {
      suggestions.push({
        text: e.title,
        category: "Recent Events",
        result: e
      });
    });

    studios.slice(0, 3).forEach(s => {
      suggestions.push({
        text: s.title,
        category: "Featured Studios",
        result: s
      });
    });

    return suggestions;
  }
}
