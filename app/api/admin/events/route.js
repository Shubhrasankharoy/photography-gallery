import { NextResponse } from "next/server";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const eventsRef = collection(db, "events");
    const querySnapshot = await getDocs(eventsRef);
    const events = [];

    querySnapshot.forEach((doc) => {
      events.push({ eventId: doc.id, ...doc.data() });
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Admin Events GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const eventDocRef = doc(db, "events", eventId);
    await deleteDoc(eventDocRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Events DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
