import { NextResponse } from "next/server";
import { getValidToken } from "../../folders/route";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const fileId = resolvedParams.fileId;
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const filename = searchParams.get("filename") || "";

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
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="#18181b"/>
        <circle cx="400" cy="260" r="60" fill="none" stroke="#6366f1" stroke-width="4" stroke-dasharray="8 4"/>
        <path d="M380 260l15 15 30-30" fill="none" stroke="#6366f1" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="50%" y="380" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#f4f4f5">
          CaptureSpace Sandbox
        </text>
        <text x="50%" y="420" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#a1a1aa">
          Mock file streamed successfully via proxy
        </text>
      </svg>`;
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
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

    // Get Content-Type and Content-Length from the Drive response
    const contentType = driveResponse.headers.get("content-type") || "image/jpeg";
    const contentLength = driveResponse.headers.get("content-length");
    const fileStream = driveResponse.body;

    // Build response headers
    const responseHeaders = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    };

    // Forward Content-Length so the browser can show real download progress
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    // When a filename is provided, force a file-download attachment with the real name
    if (filename) {
      const safeFilename = filename.replace(/["\\]/g, ""); // strip quotes/backslashes
      const encodedFilename = encodeURIComponent(safeFilename);
      responseHeaders["Content-Disposition"] =
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
    }

    return new Response(fileStream, { headers: responseHeaders });
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
