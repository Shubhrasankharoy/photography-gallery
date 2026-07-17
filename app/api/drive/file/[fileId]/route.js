import { NextResponse } from "next/server";
import { getValidToken } from "../../folders/route";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const fileId = resolvedParams.fileId;
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "photographers", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }
    const profile = docSnap.data();
    const token = profile.googleDriveToken;

    if (!token) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 401 });
    }

    // Mock Image Response
    if (token.isMock || fileId.startsWith("mock_")) {
      // Fetch a beautiful placeholder photography image from Unsplash
      const placeholderUrl = "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";
      const response = await fetch(placeholderUrl);
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // Real Google Drive download stream
    const accessToken = await getValidToken(uid);
    const driveFileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const driveResponse = await fetch(driveFileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      throw new Error(`Failed to stream from Google Drive: ${errText}`);
    }

    // Get Content-Type of the file from Drive response or default to image/jpeg
    const contentType = driveResponse.headers.get("content-type") || "image/jpeg";
    const fileStream = driveResponse.body;

    return new Response(fileStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Proxy file stream error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const fileId = resolvedParams.fileId;
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "photographers", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }
    const profile = docSnap.data();
    const token = profile.googleDriveToken;

    if (!token) {
      return NextResponse.json({ error: "Google Drive is not connected" }, { status: 401 });
    }

    if (token.isMock || fileId.startsWith("mock_")) {
      console.log(`Mock deleted file ${fileId} from Drive`);
      return NextResponse.json({ success: true });
    }

    const accessToken = await getValidToken(uid);
    const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errText = await deleteResponse.text();
      throw new Error(`Failed to delete file from Google Drive: ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proxy file delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
