import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, deleteDriveFile } from "@/lib/drive";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { updates, adminPin } = body;

    const expectedPin = process.env.ADMIN_PIN || "0000";
    if (adminPin !== expectedPin) {
      return NextResponse.json({ success: false, error: "Code PIN invalide" }, { status: 401 });
    }

    const { db } = await getDatabase();
    const trackIndex = db.tracks.findIndex((t) => t.id === id);

    if (trackIndex === -1) {
      return NextResponse.json({ success: false, error: "Piste introuvable" }, { status: 404 });
    }

    db.tracks[trackIndex] = {
      ...db.tracks[trackIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveDatabase(db);
    return NextResponse.json({ success: true, track: db.tracks[trackIndex] });
  } catch (error: any) {
    console.error("PUT /api/tracks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update track" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const adminPin = searchParams.get("pin");

    const expectedPin = process.env.ADMIN_PIN || "0000";
    if (adminPin !== expectedPin) {
      return NextResponse.json({ success: false, error: "Code PIN invalide" }, { status: 401 });
    }

    const { db } = await getDatabase();
    const track = db.tracks.find((t) => t.id === id);

    if (!track) {
      return NextResponse.json({ success: false, error: "Piste introuvable" }, { status: 404 });
    }

    // Attempt to delete file from Google Drive if it exists
    if (track.driveFileId) {
      await deleteDriveFile(track.driveFileId);
    }

    db.tracks = db.tracks.filter((t) => t.id !== id);
    await saveDatabase(db);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/tracks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete track" },
      { status: 500 }
    );
  }
}
