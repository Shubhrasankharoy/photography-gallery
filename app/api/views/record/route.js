import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, collection, setDoc, updateDoc, increment } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, photographerId } = body;

    if (!eventId || !photographerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    // 1. Record individual pageview log doc
    const viewRef = doc(collection(db, "views"));
    await setDoc(viewRef, {
      eventId,
      photographerId,
      timestamp,
      userAgent
    });

    // 2. Increment aggregated views count on the event document
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      views: increment(1)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record view:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
