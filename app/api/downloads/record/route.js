import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, writeBatch, increment } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, photographerId, photoIds } = body;

    if (!eventId || !photographerId || !photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    const eventRef = doc(db, "events", eventId);
    const batch = writeBatch(db);

    for (const photoId of photoIds) {
      const photoRef = doc(db, "photos", photoId);
      const photoSnap = await getDoc(photoRef);
      const photoData = photoSnap.exists() ? photoSnap.data() : null;
      const photoName = photoData ? (photoData.name || photoData.fileName || "Unknown Photo") : "Unknown Photo";
      const studioId = photoData ? photoData.studioId : null;

      const downloadRef = doc(collection(db, "downloads"));
      const downloadPayload = {
        eventId,
        photoId,
        photoName,
        photographerId,
        timestamp,
        userAgent
      };
      if (studioId) {
        downloadPayload.studioId = studioId;
      }
      batch.set(downloadRef, downloadPayload);

      batch.update(photoRef, {
        downloadCount: increment(1)
      });
    }

    batch.update(eventRef, {
      downloads: increment(photoIds.length)
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: photoIds.length });
  } catch (error) {
    console.error("Failed to record downloads:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
