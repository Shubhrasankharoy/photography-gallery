import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri = `${request.nextUrl.origin}/api/oauth/google/callback`;

  // Fallback to mock authorization if client credentials are not configured in environment
  if (!clientId || !clientSecret) {
    console.log("Google Client ID/Secret missing in .env. Falling back to Mock OAuth flow.");
    const mockCallbackUrl = `${redirectUri}?code=mock_auth_code_success&state=${uid}`;
    return NextResponse.redirect(mockCallbackUrl);
  }

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.file")}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${uid}`;

  return NextResponse.redirect(oauthUrl);
}
