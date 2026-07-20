import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { encryptToken, decryptToken } from "@/lib/encryption";
import { fetchWithRetry } from "@/lib/googleOAuthService";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=error&message=Missing code or state`);
  }

  try {
    // 1. Fetch and validate state nonce
    const stateRef = doc(db, "oauthStates", state);
    const stateSnap = await getDoc(stateRef);

    if (!stateSnap.exists()) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=error&message=Invalid OAuth state nonce`);
    }

    const stateData = stateSnap.data();
    if (Date.now() > stateData.expiresAt) {
      await deleteDoc(stateRef);
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=error&message=OAuth state nonce expired`);
    }

    const { uid, studioId } = stateData;

    // Delete state nonce to prevent replay attacks
    await deleteDoc(stateRef);

    let tokenData = {};
    let driveEmail = "mock-user@gmail.com";

    // 2. Exchange authorization code for tokens
    if (code === "mock_auth_code_success") {
      tokenData = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expiry_date: Date.now() + 3600 * 1000,
        isMock: true,
      };
    } else {
      const redirectUri = `${request.nextUrl.origin}/api/oauth/google/callback`;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "", // Might be empty on reconnect unless prompt=consent is used
        expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
        token_type: tokens.token_type || "Bearer",
        isMock: false,
      };

      // Fetch user info to get email address
      try {
        const userinfoRes = await fetchWithRetry("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        if (userinfoRes.ok) {
          const userinfo = await userinfoRes.json();
          driveEmail = userinfo.email || "unknown@gmail.com";
        }
      } catch (err) {
        console.warn("Could not fetch userinfo email:", err);
      }
    }

    // 3. Resolve existing connection to support update/reconnect without duplicating documents
    let connectionId;
    let existingConnectionData = null;

    const connQuery = query(
      collection(db, "driveConnections"),
      where("userId", "==", uid),
      where("studioId", "==", studioId),
      where("provider", "==", "google-drive")
    );
    const connQuerySnap = await getDocs(connQuery);
    
    if (!connQuerySnap.empty) {
      const existingDoc = connQuerySnap.docs[0];
      connectionId = existingDoc.id;
      existingConnectionData = existingDoc.data();
    } else {
      const newConnRef = doc(collection(db, "driveConnections"));
      connectionId = newConnRef.id;
    }

    // Encrypt sensitive credentials
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    // Google only sends refresh token on first consent. Keep existing refresh token if missing on reconnect
    const resolvedRefreshToken = tokenData.refresh_token || (existingConnectionData ? decryptToken(existingConnectionData.refreshToken) : "");
    const encryptedRefreshToken = encryptToken(resolvedRefreshToken);

    const updatePayload = {
      connectionId,
      userId: uid,
      studioId,
      provider: "google-drive",
      driveEmail,
      rootFolderId: existingConnectionData?.rootFolderId || "root",
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: tokenData.expiry_date,
      status: "connected",
      isMock: tokenData.isMock || false,
      updatedAt: serverTimestamp(),
      lastSyncAt: serverTimestamp(),
      syncStatus: "idle",
      syncError: null,
      disconnectedAt: null,
    };

    if (!existingConnectionData) {
      updatePayload.connectedAt = serverTimestamp();
    }

    await setDoc(doc(db, "driveConnections", connectionId), updatePayload, { merge: true });

    // Also update legacy photographer document to maintain backward compatibility for old codebase parts
    const photographerRef = doc(db, "photographers", uid);
    const legacyPayload = {
      googleDriveConnected: true,
      googleDriveToken: {
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expiry_date: tokenData.expiry_date,
        isMock: tokenData.isMock || false,
      },
      googleDriveFolderId: existingConnectionData?.rootFolderId || "root",
      googleDriveFolderName: existingConnectionData?.googleDriveFolderName || "Root (My Drive)",
    };
    await setDoc(photographerRef, legacyPayload, { merge: true });

    // 4. Log the audit activity (Drive Connected / Drive Reconnected)
    try {
      const actionType = existingConnectionData ? "Drive Reconnected" : "Drive Connected";
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        userId: uid,
        studioId: studioId,
        action: actionType,
        details: `${actionType} for ${driveEmail} on provider google-drive`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal: Failed to log OAuth connection activity:", e);
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
}
