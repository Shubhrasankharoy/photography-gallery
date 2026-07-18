import { NextResponse } from "next/server";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const users = [];

    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin Users GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { uid, isAdmin } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { isAdmin: !!isAdmin });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Users PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    const userDocRef = doc(db, "users", uid);
    await deleteDoc(userDocRef);

    // Also delete photographer profile if it exists
    const photoProfileRef = doc(db, "photographers", uid);
    await deleteDoc(photoProfileRef).catch((e) => console.log("Profile delete fallback:", e));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Users DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
