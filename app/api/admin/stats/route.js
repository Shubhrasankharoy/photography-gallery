import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const [usersSnap, eventsSnap, photosSnap, downloadsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "photos")),
      getDocs(collection(db, "downloads")),
    ]);

    const totalUsers = usersSnap.size;
    const totalEvents = eventsSnap.size;
    const totalPhotos = photosSnap.size;
    const totalDownloads = downloadsSnap.size;

    let totalStorageBytes = 0;
    photosSnap.forEach((doc) => {
      const data = doc.data();
      totalStorageBytes += (data.size || 0);
    });

    return NextResponse.json({
      totalUsers,
      totalEvents,
      totalPhotos,
      totalDownloads,
      totalStorageBytes,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
