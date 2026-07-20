import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
import { decryptToken } from "@/lib/encryption";
import { googleDriveProvider } from "@/lib/googleDriveProvider";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const studioId = searchParams.get("studioId") || "";

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    // 1. Find and update active connection in driveConnections
    const connQuery = query(
      collection(db, "driveConnections"),
      where("userId", "==", uid),
      where("studioId", "==", studioId),
      where("status", "==", "connected")
    );
    const connQuerySnap = await getDocs(connQuery);

    if (!connQuerySnap.empty) {
      for (const connectionDoc of connQuerySnap.docs) {
        const connectionData = connectionDoc.data();
        const decryptedRefreshToken = decryptToken(connectionData.refreshToken);
        
        // Revoke token via googleDriveProvider
        try {
          await googleDriveProvider.disconnect({ refreshToken: decryptedRefreshToken });
        } catch (err) {
          console.warn("Failed to revoke token on Google side:", err);
        }

        // Mark as disconnected in DB
        await setDoc(connectionDoc.ref, {
          status: "disconnected",
          disconnectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    // 2. Backward compatibility: update legacy photographer document
    const photographerRef = doc(db, "photographers", uid);
    const profileSnap = await getDoc(photographerRef);
    if (profileSnap.exists()) {
      await setDoc(
        photographerRef,
        {
          googleDriveConnected: false,
          googleDriveToken: null,
          googleDriveFolderId: null,
          googleDriveFolderName: null,
        },
        { merge: true }
      );
    }

    // 3. Log disconnect activity
    try {
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        userId: uid,
        studioId: studioId || "",
        action: "Drive Disconnected",
        details: `Google Drive storage account was disconnected`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Non-fatal: Failed to log disconnect activity:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
