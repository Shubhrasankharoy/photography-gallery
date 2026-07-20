import { NextResponse } from "next/server";
import { storageFactory } from "@/lib/storageFactory";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uid = formData.get("uid");
    const folderId = formData.get("folderId");
    const studioId = formData.get("studioId") || "";

    if (!file || !uid) {
      return NextResponse.json({ error: "Missing file or uid" }, { status: 400 });
    }

    const providerDetails = await storageFactory.getProvider(uid, studioId);

    // Mock Upload
    if (providerDetails.isMock) {
      const mockFileId = `mock_file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      return NextResponse.json({
        id: mockFileId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
    }

    // Audit Log: Upload Started
    try {
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        userId: uid,
        studioId: studioId || "",
        action: "Upload Started",
        details: `File upload started: ${file.name} (${file.size} bytes)`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal: Failed to log upload start:", e);
    }

    // Real upload via resolved provider
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const data = await providerDetails.provider.uploadFile(
      fileBuffer,
      file.name,
      file.type,
      providerDetails.accessToken,
      folderId
    );

    // Audit Log: Upload Completed
    try {
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        userId: uid,
        studioId: studioId || "",
        action: "Upload Completed",
        details: `File upload completed successfully: ${file.name} (File ID: ${data.id})`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal: Failed to log upload completion:", e);
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      connectionId: providerDetails.connectionId || "legacy",
      provider: providerDetails.providerName,
    });
  } catch (error) {
    console.error("Upload to Drive error:", error);
    
    // Audit Log: Upload Failed
    try {
      const formData = await request.clone().formData().catch(() => null);
      const file = formData?.get("file");
      const uid = formData?.get("uid");
      const studioId = formData?.get("studioId") || "";

      if (uid && file) {
        const activityRef = doc(collection(db, "activities"));
        await setDoc(activityRef, {
          activityId: activityRef.id,
          userId: uid,
          studioId: studioId || "",
          action: "Upload Failed",
          details: `File upload failed: ${file.name}. Error: ${error.message}`,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Non-fatal: Failed to log upload failure:", e);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
