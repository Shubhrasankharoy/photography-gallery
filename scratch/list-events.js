const fs = require("fs");
const path = require("path");

// Load .env file manually
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim().replace(/(^['"]|['"]$)/g, "");
      process.env[key] = value;
    }
  });
}

const { collection, getDocs } = require("firebase/firestore");
const { db } = require("../lib/firebase");

async function checkEvents() {
  if (!db) {
    console.log("DB not initialized.");
    return;
  }
  const snap = await getDocs(collection(db, "events"));
  snap.forEach(doc => {
    console.log("ID:", doc.id);
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
    console.log("-----------------------------------------");
  });
}

checkEvents();
