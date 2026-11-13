import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/drive";
import { ValidationStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body as { status: ValidationStatus };

    if (!["validated", "needs_work", "discussing"].includes(status)) {
      return NextResponse.json({ success: false, error: "Statut invalide" }, { status: 400 });
    }

    const { db } = await getDatabase();
    const track = db.tracks.find((t) => t.id === id);

    if (!track) {
      return NextResponse.json({ success: false, error: "Piste introuvable" }, { status: 404 });
    }

    track.validationStatus = status;
    track.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return NextResponse.json({ success: true, track });
  } catch (error: any) {
    console.error("POST /api/tracks/[id]/validation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update validation" },
      { status: 500 }
    );
  }
}
