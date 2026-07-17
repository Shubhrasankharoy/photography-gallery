import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const uid = searchParams.get("state"); // state holds the uid

  if (!code || !uid) {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=error&message=Missing code or state`);
  }

  try {
    let tokenData = {};

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
        refresh_token: tokens.refresh_token || "", // Refresh token might not be returned on subsequent consent
        expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
        token_type: tokens.token_type || "Bearer",
        isMock: false,
      };
    }

    // Save tokens in Firestore photographer profile
    const photographerRef = doc(db, "photographers", uid);
    
    // We fetch the current photographer document first to avoid overwriting existing data
    // using setDoc with merge: true is standard and safe
    const updatePayload = {
      googleDriveConnected: true,
      googleDriveToken: tokenData,
    };

    // If it's a new connection, reset selected folder
    if (code === "mock_auth_code_success") {
      updatePayload.googleDriveFolderId = "mock_root_folder_id";
      updatePayload.googleDriveFolderName = "Root (My Drive)";
    }

    await setDoc(photographerRef, updatePayload, { merge: true });

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?status=success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
}
