/**
 * Normalizes text for consistent searching.
 * Removes accents, uppercase letters, punctuation, and extra spaces.
 */
export function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s-]/g, "")        // Remove punctuation (keep alphanumeric, space, hyphen)
    .replace(/\s+/g, " ")            // Normalize spaces
    .trim();
}

/**
 * Calculates search score based on match characteristics.
 * Matches are graded: Exact Match (100) > Starts With (90) > Contains (70) > Subtitle Match (50) > Description Match (30) > Metadata Match (20).
 */
export function calculateScore(queryText, title, subtitle = "", description = "", metadata = {}) {
  const normQuery = normalizeText(queryText);
  if (!normQuery) return 0;

  const normTitle = normalizeText(title);
  const normSubtitle = normalizeText(subtitle);
  const normDescription = normalizeText(description);

  if (normTitle === normQuery) {
    return 100;
  }
  if (normTitle.startsWith(normQuery)) {
    return 90;
  }
  if (normTitle.includes(normQuery)) {
    return 70;
  }
  if (normSubtitle.includes(normQuery)) {
    return 50;
  }
  if (normDescription.includes(normQuery)) {
    return 30;
  }

  // Check metadata
  for (const value of Object.values(metadata)) {
    if (value && normalizeText(value).includes(normQuery)) {
      return 20;
    }
  }

  return 0;
}

/**
 * Transforms any entity into the standard search result object.
 */
export function toSearchResult({
  id,
  type,
  title,
  subtitle = "",
  description = "",
  thumbnail = null,
  badge = null,
  url,
  queryText = "",
  metadata = {}
}) {
  const score = queryText ? calculateScore(queryText, title, subtitle, description, metadata) : 0;
  
  // Set Category and Sorting Priority based on Type
  let category = "General";
  let priority = 10;

  switch (type) {
    case "studio":
      category = "Business";
      priority = 1;
      badge = badge || "Studio";
      break;
    case "member":
      category = "Person";
      priority = 2;
      badge = badge || "Member";
      break;
    case "event":
      category = "Event";
      priority = 3;
      badge = badge || "Event";
      break;
    case "bride":
      category = "Person";
      priority = 4;
      badge = badge || "Bride";
      break;
    case "groom":
      category = "Person";
      priority = 5;
      badge = badge || "Groom";
      break;
    case "location":
      category = "Location";
      priority = 6;
      badge = badge || "Location";
      break;
  }

  return {
    id,
    type,
    category,
    priority,
    title: title || "",
    subtitle: subtitle || "",
    description: description || "",
    thumbnail: thumbnail || null,
    badge: badge || null,
    url: url || "",
    score,
    embeddingId: null,
    metadata
  };
}
