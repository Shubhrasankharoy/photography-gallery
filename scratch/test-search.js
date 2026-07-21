const { normalizeText, calculateScore, toSearchResult } = require("../lib/search/searchIndex");

console.log("=== Testing Text Normalization ===");
const tests = [
  { input: "Shubhra & Priya Wedding", expected: "shubhra priya wedding" },
  { input: "New York City, NY!", expected: "new york city ny" },
  { input: "John-Doe's Portfolio", expected: "john-does portfolio" },
  { input: "   Multiple   Spaces   ", expected: "multiple spaces" }
];

tests.forEach(({ input, expected }) => {
  const result = normalizeText(input);
  const pass = result === expected;
  console.log(`Input: "${input}"`);
  console.log(`Result: "${result}" (Pass: ${pass})`);
  console.log("-------------------");
});

console.log("\n=== Testing Search Ranking / Scoring ===");
const queryText = "priya";

const scoringTests = [
  { title: "Priya", subtitle: "Wedding", desc: "", expected: 100 }, // Exact Match
  { title: "Priya Wedding", subtitle: "Event", desc: "", expected: 90 }, // Starts with
  { title: "Shubhra & Priya", subtitle: "Event", desc: "", expected: 70 }, // Contains
  { title: "Wedding", subtitle: "Priya's Photos", desc: "", expected: 50 }, // Subtitle contains
  { title: "Photos", subtitle: "Wedding", desc: "Featuring Priya and Shubhra", expected: 30 } // Description contains
];

scoringTests.forEach(({ title, subtitle, desc, expected }) => {
  const score = calculateScore(queryText, title, subtitle, desc);
  const pass = score === expected;
  console.log(`Query: "${queryText}" | Title: "${title}" | Subtitle: "${subtitle}" | Desc: "${desc}"`);
  console.log(`Calculated Score: ${score} (Expected: ${expected}) -> Pass: ${pass}`);
  console.log("-------------------");
});

console.log("\n=== Testing standard SearchResult mapper ===");
const resultObj = toSearchResult({
  id: "event_123",
  type: "event",
  title: "Priya & Shubhra Wedding",
  subtitle: "New York",
  description: "Beautiful summer wedding",
  url: "/event/event_123",
  queryText: "priya",
  metadata: { brideName: "Priya", groomName: "Shubhra", location: "New York" }
});

console.log(JSON.stringify(resultObj, null, 2));
