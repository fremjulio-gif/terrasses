import { NextRequest, NextResponse } from "next/server";
import { isDriveConfigured, createResumableUploadUrl } from "@/lib/drive";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, mimeType, adminPin } = body;

    const expectedPin = process.env.ADMIN_PIN || "0000";
    if (adminPin !== expectedPin) {
      return NextResponse.json({ success: false, error: "Code PIN invalide" }, { status: 401 });
    }

    if (!fileName) {
      return NextResponse.json({ success: false, error: "Nom de fichier requis" }, { status: 400 });
    }

    if (isDriveConfigured()) {
      const uploadUrl = await createResumableUploadUrl(fileName, mimeType || "audio/wav");
      return NextResponse.json({
        success: true,
        mode: "drive_resumable",
        uploadUrl,
      });
    } else {
      // Local fallback mode: client will post FormData to /api/upload/local
      return NextResponse.json({
        success: true,
        mode: "local_direct",
        uploadUrl: "/api/upload/local",
      });
    }
  } catch (error: any) {
    console.error("POST /api/upload/init-resumable error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize upload" },
      { status: 500 }
    );
  }
}
