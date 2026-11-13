import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { getDatabase, isDriveConfigured } from "@/lib/drive";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "true";

    const { db } = await getDatabase();
    // Match by ID, driveFileId, or filename
    const track = db.tracks.find(
      (t) => t.id === id || t.driveFileId === id || t.fileName === id
    );

    if (!track) {
      return NextResponse.json({ error: "Piste audio introuvable" }, { status: 404 });
    }

    const rangeHeader = req.headers.get("range");

    // Case 1: Stream from Google Drive if driveFileId is available
    if (track.driveFileId && isDriveConfigured()) {
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Request stream from Drive API
      const driveHeaders: Record<string, string> = {};
      if (rangeHeader) {
        driveHeaders["Range"] = rangeHeader;
      }

      const driveRes = await drive.files.get(
        { fileId: track.driveFileId, alt: "media" },
        { responseType: "stream", headers: driveHeaders }
      );

      const stream = driveRes.data as unknown as ReadableStream;
      const headers = new Headers();

      headers.set("Content-Type", track.mimeType || "audio/wav");
      headers.set("Accept-Ranges", "bytes");
      headers.set("Access-Control-Allow-Origin", "*");

      if (isDownload) {
        headers.set(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(track.fileName || "track.wav")}"`
        );
      }

      if (driveRes.headers["content-range"]) {
        headers.set("Content-Range", driveRes.headers["content-range"] as string);
      }
      if (driveRes.headers["content-length"]) {
        headers.set("Content-Length", driveRes.headers["content-length"] as string);
      }

      return new NextResponse(stream as any, {
        status: driveRes.status === 206 ? 206 : 200,
        headers,
      });
    }

    // Case 2: Local File fallback
    let localFilePath = "";
    if (track.localPath) {
      localFilePath = path.join(process.cwd(), "public", track.localPath.replace(/^\//, ""));
    }

    if (!fs.existsSync(localFilePath)) {
      // Look in public/audio/
      localFilePath = path.join(process.cwd(), "public", "audio", track.fileName);
    }

    if (!fs.existsSync(localFilePath)) {
      // Look in ../COMPO folders as fallback
      const compoSearch = [
        path.join(process.cwd(), "..", "COMPO", "V03", "blue", track.fileName),
        path.join(process.cwd(), "..", "COMPO", "V03", "larmes_238_redorian Project", track.fileName),
        path.join(process.cwd(), "..", "COMPO", "V02", "spicca Project", track.fileName),
        path.join(process.cwd(), "..", "COMPO", "V00", "Fragile Project", track.fileName),
      ];
      for (const candidate of compoSearch) {
        if (fs.existsSync(candidate)) {
          localFilePath = candidate;
          break;
        }
      }
    }

    if (!fs.existsSync(localFilePath)) {
      return NextResponse.json({ error: "Fichier audio introuvable sur le disque" }, { status: 404 });
    }

    const stat = fs.statSync(localFilePath);
    const fileSize = stat.size;
    const mimeType = track.mimeType || (localFilePath.endsWith(".mp3") ? "audio/mpeg" : "audio/wav");

    // HTTP Range Request Handling (206 Partial Content)
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(localFilePath, { start, end });
      const webStream = Readable.toWeb(fileStream);

      const headers = new Headers({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": mimeType,
        "Access-Control-Allow-Origin": "*",
      });

      if (isDownload) {
        headers.set(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(track.fileName || path.basename(localFilePath))}"`
        );
      }

      return new NextResponse(webStream as any, {
        status: 206,
        headers,
      });
    }

    // Full File Delivery (200 OK)
    const fileStream = fs.createReadStream(localFilePath);
    const webStream = Readable.toWeb(fileStream);

    const headers = new Headers({
      "Content-Length": fileSize.toString(),
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
    });

    if (isDownload) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(track.fileName || path.basename(localFilePath))}"`
      );
    }

    return new NextResponse(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("GET /api/audio/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur de lecture audio" },
      { status: 500 }
    );
  }
}
