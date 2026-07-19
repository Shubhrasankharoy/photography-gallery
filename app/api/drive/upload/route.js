import { NextResponse } from "next/server";
import { getValidToken } from "../folders/route";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uid = formData.get("uid");
    const folderId = formData.get("folderId");

    if (!file || !uid) {
      return NextResponse.json({ error: "Missing file or uid" }, { status: 400 });
    }

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

    // Mock Upload
    if (token.isMock) {
      const mockFileId = `mock_file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      return NextResponse.json({
        id: mockFileId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
    }

    // Real Google Drive multipart upload
    const accessToken = await getValidToken(uid);
    const boundary = "-------314159265358979323846";
    const CRLF = "\r\n";

    const parents = folderId && folderId !== "root" && folderId !== "mock_root_folder_id" ? [folderId] : [];
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: parents,
    };

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Build proper multipart/related body with raw binary content
    const metadataJson = JSON.stringify(metadata);
    const preamble =
      `--${boundary}${CRLF}` +
      `Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}` +
      `${metadataJson}${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Type: ${file.type}${CRLF}${CRLF}`;
    const postamble = `${CRLF}--${boundary}--`;

    const body = Buffer.concat([
      Buffer.from(preamble, "utf-8"),
      fileBuffer,
      Buffer.from(postamble, "utf-8"),
    ]);

    const uploadResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body: body,
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Google Drive upload failed: ${errText}`);
    }

    const data = await uploadResponse.json();

    // Make the file publicly accessible or accessible to anyone with the link
    // so we can fetch it, or let the proxy handle it (no sharing permissions required if proxy uses OAuth token!).
    // Utilizing the proxy with Authorization header is more secure since we don't have to change Drive files permissions!

    return NextResponse.json({
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
    });
  } catch (error) {
    console.error("Upload to Drive error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
