import { NextRequest, NextResponse } from "next/server";
import { getDatabase, isDriveConfigured, saveDatabase } from "@/lib/drive";
import scriptStructure from "@/data/script-structure.json";
import { AudioTrack } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, source } = await getDatabase();
    return NextResponse.json({
      success: true,
      source,
      isDriveConfigured: isDriveConfigured(),
      tracks: db.tracks,
      lastUpdated: db.lastUpdated,
      scriptStructure,
    });
  } catch (error: any) {
    console.error("GET /api/tracks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load tracks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { track, adminPin } = body;

    const expectedPin = process.env.ADMIN_PIN || "0000";
    if (adminPin !== expectedPin) {
      return NextResponse.json({ success: false, error: "Code PIN invalide" }, { status: 401 });
    }

    if (!track || !track.title) {
      return NextResponse.json({ success: false, error: "Données de piste manquantes" }, { status: 400 });
    }

    const { db } = await getDatabase();

    const newTrack: AudioTrack = {
      id: track.id || `track-${Date.now()}`,
      title: track.title,
      category: track.category || "original",
      fileName: track.fileName || "audio.wav",
      fileSize: track.fileSize || 0,
      duration: track.duration || 0,
      mimeType: track.mimeType || "audio/wav",
      driveFileId: track.driveFileId,
      localPath: track.localPath,
      actId: track.actId,
      sceneId: track.sceneId,
      cueId: track.cueId,
      pdfPage: track.pdfPage,
      cueQuote: track.cueQuote,
      bpm: track.bpm || "72 BPM",
      keyMode: track.keyMode || "Ré Dorien",
      rightsStatus: track.rightsStatus || "100% Libre",
      notes: track.notes || "",
      version: track.version || "V1",
      peaks: track.peaks || [],
      validationStatus: track.validationStatus || "discussing",
      comments: track.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend new track to the beginning of the list
    db.tracks.unshift(newTrack);
    await saveDatabase(db);

    return NextResponse.json({ success: true, track: newTrack });
  } catch (error: any) {
    console.error("POST /api/tracks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add track" },
      { status: 500 }
    );
  }
}
