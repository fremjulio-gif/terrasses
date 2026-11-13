import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const adminPin = formData.get("adminPin") as string | null;

    const expectedPin = process.env.ADMIN_PIN || "0000";
    if (adminPin !== expectedPin) {
      return NextResponse.json({ success: false, error: "Code PIN invalide" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier reçu" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadDir = path.join(process.cwd(), "public", "audio");
    fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileName: safeName,
      fileSize: buffer.length,
      mimeType: file.type || "audio/wav",
      localPath: `/audio/${safeName}`,
    });
  } catch (error: any) {
    console.error("POST /api/upload/local error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de l'upload local" },
      { status: 500 }
    );
  }
}
