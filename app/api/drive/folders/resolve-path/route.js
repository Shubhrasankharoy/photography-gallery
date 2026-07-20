import { NextResponse } from "next/server";
import { storageFactory } from "@/lib/storageFactory";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { fetchWithRetry } from "@/lib/googleOAuthService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, studioId, parentFolderId, path } = body;

    if (!uid || !path || !Array.isArray(path) || path.length === 0) {
      return NextResponse.json({ error: "Missing uid or path array" }, { status: 400 });
    }

    const providerDetails = await storageFactory.getProvider(uid, studioId);
    
    if (providerDetails.isMock) {
      // Mock resolve path: return mock ID based on the last segment
      const lastSegment = path[path.length - 1];
      const mockId = `mock_folder_${lastSegment.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      return NextResponse.json({ folderId: mockId });
    }

    const accessToken = providerDetails.accessToken;
    let currentParentId = parentFolderId || providerDetails.rootFolderId || "root";

    // Traverse the path array and resolve/create each folder
    for (let i = 0; i < path.length; i++) {
      const folderName = path[i];
      const sanitizedSegments = path.slice(0, i + 1).map(s => s.replace(/\//g, "-"));
      const cacheKey = `folder_path_${uid}_${studioId}_${sanitizedSegments.join("_")}`;
      
      // 1. Check folderCache in Firestore
      const cacheRef = doc(db, "folderCache", cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        currentParentId = cacheSnap.data().folderId;
        continue;
      }

      // 2. Query Google Drive to see if a folder with this name exists in currentParentId
      const parentQuery = currentParentId && currentParentId !== "root" ? `'${currentParentId}' in parents` : "'root' in parents";
      const q = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and ${parentQuery} and trashed = false`;
      const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;

      const response = await fetchWithRetry(driveUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to query folder existence: ${await response.text()}`);
      }

      const queryData = await response.json();
      let folderId = "";

      if (queryData.files && queryData.files.length > 0) {
        folderId = queryData.files[0].id;
      } else {
        // Create the folder
        const createRes = await providerDetails.provider.createFolder(folderName, accessToken, currentParentId);
        folderId = createRes.id;

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
          console.warn("Failed to log activity:", e);
        }
      }

      // Write to folderCache in Firestore
      await setDoc(cacheRef, {
        cacheId: cacheKey,
        studioId,
        folderType: i === path.length - 1 ? "original" : "path_segment",
        folderId,
        createdAt: serverTimestamp(),
      });

      currentParentId = folderId;
    }

    return NextResponse.json({ folderId: currentParentId });
  } catch (error) {
    console.error("Resolve path error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
