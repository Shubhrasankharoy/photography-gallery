import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore";
import { encryptToken, decryptToken } from "./encryption";

// Helper for fetch with exponential backoff retry
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Retry on transient server errors (5xx) or rate limiting (429)
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (i === retries - 1) throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
      } else {
        return response;
      }
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    
    // Exponential backoff delay with jitter
    const delay = backoff * Math.pow(2, i) + Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Validates Google Drive token for a Connection and refreshes it if needed.
 */
export async function getValidTokenForConnection(connectionDoc) {
  if (!connectionDoc) throw new Error("Connection not found");
  const data = typeof connectionDoc.data === "function" ? connectionDoc.data() : connectionDoc;
  const connectionId = data.connectionId || connectionDoc.id;

  if (data.isMock) {
    return "mock_access_token";
  }

  const decryptedAccessToken = decryptToken(data.accessToken);
  const decryptedRefreshToken = decryptToken(data.refreshToken);

  // Refresh token if expired or close to expiring (within 5 minutes)
  if (Date.now() + 300 * 1000 >= data.expiresAt) {
    console.log(`Refreshing expired Google OAuth token for connection: ${connectionId}`);
    if (!decryptedRefreshToken) {
      throw new Error("Missing refresh token. Re-authorization required.");
    }

    const tokenResponse = await fetchWithRetry("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token refresh failed: ${errText}`);
    }

    const refreshed = await tokenResponse.json();
    const newAccessToken = refreshed.access_token;
    const expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;

    const docRef = doc(db, "driveConnections", connectionId);
    await setDoc(docRef, {
      accessToken: encryptToken(newAccessToken),
      expiresAt: expiresAt,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Log refresh activity
    try {
      const activitiesRef = doc(collection(db, "activities"));
      await setDoc(activitiesRef, {
        activityId: activitiesRef.id,
        userId: data.userId,
        studioId: data.studioId || "",
        action: "Token Refreshed",
        details: "Google Drive OAuth token refreshed successfully",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal error logging token refresh activity:", e);
    }

    return newAccessToken;
  }

  return decryptedAccessToken;
}

/**
 * Validates and refreshes legacy photographer tokens (backward compatibility).
 */
export async function getValidTokenLegacy(uid) {
  const docRef = doc(db, "photographers", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Photographer profile not found");
  }
  const data = docSnap.data();
  const token = data.googleDriveToken;
  if (!token) {
    throw new Error("Google Drive not connected");
  }

  if (token.isMock) {
    return "mock_access_token";
  }

  let decryptedAccessToken = token.access_token;
  let decryptedRefreshToken = token.refresh_token;
  if (token.access_token && token.access_token.includes(":")) {
    decryptedAccessToken = decryptToken(token.access_token);
  }
  if (token.refresh_token && token.refresh_token.includes(":")) {
    decryptedRefreshToken = decryptToken(token.refresh_token);
  }

  const expiryDate = token.expiry_date || token.expiresAt || 0;
  if (Date.now() + 300 * 1000 >= expiryDate) {
    console.log("Refreshing expired legacy Google OAuth token...");
    if (!decryptedRefreshToken) {
      throw new Error("Missing refresh token. Re-authorization required.");
    }

    const response = await fetchWithRetry("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token refresh failed: ${errText}`);
    }

    const refreshed = await response.json();
    const updatedToken = {
      ...token,
      access_token: encryptToken(refreshed.access_token),
      expiry_date: Date.now() + (refreshed.expires_in || 3600) * 1000,
    };

    await setDoc(docRef, { googleDriveToken: updatedToken }, { merge: true });
    return refreshed.access_token;
  }

  return decryptedAccessToken;
}
