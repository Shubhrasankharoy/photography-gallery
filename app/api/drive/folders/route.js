import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { storageFactory } from "@/lib/storageFactory";

// Keep exported getValidToken helper for other endpoints but update it to use storageFactory
export async function getValidToken(uid, studioId = "") {
  const providerDetails = await storageFactory.getProvider(uid, studioId);
  return providerDetails.accessToken;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const studioId = searchParams.get("studioId") || "";

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const providerDetails = await storageFactory.getProvider(uid, studioId);
    
    // Handle mock connection
    if (providerDetails.isMock) {
      const mockFolders = [
        { id: "mock_root_folder_id", name: "Root (My Drive)" },
        { id: "mock_folder_events", name: "CaptureSpace_Uploads" },
        { id: "mock_folder_weddings", name: "Weddings_2026" },
        { id: "mock_folder_portraits", name: "Portraits_Gallery" },
      ];
      return NextResponse.json({ folders: mockFolders });
    }

    // Call provider's list folder equivalent
    const accessToken = providerDetails.accessToken;
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
    const { uid, studioId, folderName, parentFolderId } = body;

    if (!uid || !folderName) {
      return NextResponse.json({ error: "Missing uid or folderName" }, { status: 400 });
    }

    const providerDetails = await storageFactory.getProvider(uid, studioId);

    // Mock folder creation
    if (providerDetails.isMock) {
      const newMockFolder = {
        id: `mock_folder_${Date.now()}`,
        name: folderName,
      };
      return NextResponse.json(newMockFolder);
    }

    // Create real folder via resolved provider
    const accessToken = providerDetails.accessToken;
    const result = await providerDetails.provider.createFolder(folderName, accessToken, parentFolderId);

    // Log folder creation activity
    try {
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        userId: uid,
        studioId: studioId || "",
        action: "Folder Created",
        details: `Folder "${folderName}" created in Google Drive`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal: Failed to log folder creation activity:", e);
    }

    return NextResponse.json({ id: result.id, name: result.name });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
