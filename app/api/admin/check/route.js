import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ isAdmin: false, error: "UID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ isAdmin: false, error: "Database not initialized" }, { status: 500 });
    }

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().isAdmin === true) {
      return NextResponse.json({ isAdmin: true });
    }

    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error("Admin check API error:", error);
    return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}
