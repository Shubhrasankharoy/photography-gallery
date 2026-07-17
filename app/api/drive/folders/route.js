import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Shared helper to retrieve or refresh access token
export async function getValidToken(uid) {
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

  // Refresh token if expired or close to expiring (within 5 minutes)
  if (Date.now() + 300 * 1000 >= token.expiry_date) {
    console.log("Refreshing expired Google OAuth token...");
    if (!token.refresh_token) {
      throw new Error("Missing refresh token. Re-authorization required.");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: token.refresh_token,
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
      access_token: refreshed.access_token,
      expiry_date: Date.now() + (refreshed.expires_in || 3600) * 1000,
    };

    await setDoc(docRef, { googleDriveToken: updatedToken }, { merge: true });
    return refreshed.access_token;
  }

  return token.access_token;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "photographers", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }
    const profile = docSnap.data();
    const token = profile.googleDriveToken;

    if (!token) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 401 });
    }

    // Mock folder list
    if (token.isMock) {
      const mockFolders = [
        { id: "mock_root_folder_id", name: "Root (My Drive)" },
        { id: "mock_folder_events", name: "CaptureSpace_Uploads" },
        { id: "mock_folder_weddings", name: "Weddings_2026" },
        { id: "mock_folder_portraits", name: "Portraits_Gallery" },
      ];
      return NextResponse.json({ folders: mockFolders });
    }

    // Real Google Drive API call
    const accessToken = await getValidToken(uid);
    const q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=100`;

    const response = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Failed to fetch folders from Google Drive");
    }

    const data = await response.json();
    
    // Always include a root folder option
    const folders = [{ id: "root", name: "Root (My Drive)" }, ...data.files];
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("List folders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, folderName } = body;

    if (!uid || !folderName) {
      return NextResponse.json({ error: "Missing uid or folderName" }, { status: 400 });
    }

    const docRef = doc(db, "photographers", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }
    const profile = docSnap.data();
    const token = profile.googleDriveToken;

    if (!token) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 401 });
    }

    // Mock folder creation
    if (token.isMock) {
      const newMockFolder = {
        id: `mock_folder_${Date.now()}`,
        name: folderName,
      };
      return NextResponse.json(newMockFolder);
    }

    // Real Google Drive folder creation
    const accessToken = await getValidToken(uid);
    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Failed to create folder in Google Drive");
    }

    const data = await response.json();
    return NextResponse.json({ id: data.id, name: data.name });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
