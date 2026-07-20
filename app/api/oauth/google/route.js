import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const studioId = searchParams.get("studioId") || "";

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri = `${request.nextUrl.origin}/api/oauth/google/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  // Save the OAuth state mapping in firestore
  try {
    const stateRef = doc(db, "oauthStates", state);
    await setDoc(stateRef, {
      state,
      uid,
      studioId,
      createdAt: serverTimestamp(),
      expiresAt: Date.now() + 15 * 60 * 1000, // Expires in 15 minutes
    });
  } catch (err) {
    console.error("Failed to save oauth state nonce:", err);
    return NextResponse.json({ error: "Database error during initialization" }, { status: 500 });
  }

  // Fallback to mock authorization if client credentials are not configured in environment
  if (!clientId || !clientSecret) {
    console.log("Google Client ID/Secret missing in .env. Falling back to Mock OAuth flow.");
    const mockCallbackUrl = `${redirectUri}?code=mock_auth_code_success&state=${state}`;
    return NextResponse.redirect(mockCallbackUrl);
  }

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email")}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  return NextResponse.redirect(oauthUrl);
}

