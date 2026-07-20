import { NextResponse } from "next/server";
import { storageFactory } from "@/lib/storageFactory";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const fileId = resolvedParams.fileId;
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const studioId = searchParams.get("studioId") || "";
  const filename = searchParams.get("filename") || "";

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const providerDetails = await storageFactory.getProvider(uid, studioId);

    // Mock Image Response
    if (providerDetails.isMock || fileId.startsWith("mock_")) {
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

    // Call real provider
    const driveResponse = await providerDetails.provider.getFile(fileId, providerDetails.accessToken);

    const contentType = driveResponse.headers.get("content-type") || "image/jpeg";
    const contentLength = driveResponse.headers.get("content-length");
    const fileStream = driveResponse.body;

    const responseHeaders = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    if (filename) {
      const safeFilename = filename.replace(/["\\]/g, "");
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
  const studioId = searchParams.get("studioId") || "";

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
  }

  try {
    const providerDetails = await storageFactory.getProvider(uid, studioId);

    if (providerDetails.isMock || fileId.startsWith("mock_")) {
      console.log(`Mock deleted file ${fileId} from Drive`);
      return NextResponse.json({ success: true });
    }

    // Call real provider
    await providerDetails.provider.deleteFile(fileId, providerDetails.accessToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proxy file delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
