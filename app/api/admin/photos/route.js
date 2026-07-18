import { NextResponse } from "next/server";
import { collection, getDocs, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const photosRef = collection(db, "photos");
    const querySnapshot = await getDocs(photosRef);
    const photos = [];

    querySnapshot.forEach((doc) => {
      photos.push({ photoId: doc.id, ...doc.data() });
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Admin Photos GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { photoIds } = await request.json();
    if (!photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json({ error: "photoIds array is required" }, { status: 400 });
    }

    const batch = writeBatch(db);
    photoIds.forEach((id) => {
      const docRef = doc(db, "photos", id);
      batch.delete(docRef);
    });

    await batch.commit();
    return NextResponse.json({ success: true, count: photoIds.length });
  } catch (error) {
    console.error("Admin Photos POST delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
