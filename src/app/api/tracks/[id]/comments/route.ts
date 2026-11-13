import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/drive";
import { TrackComment } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { content, author, timestampSeconds } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Contenu de commentaire requis" }, { status: 400 });
    }

    const { db } = await getDatabase();
    const track = db.tracks.find((t) => t.id === id);

    if (!track) {
      return NextResponse.json({ success: false, error: "Piste introuvable" }, { status: 404 });
    }

    const newComment: TrackComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: author?.trim() || "Metteuse en scène",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      timestampSeconds: typeof timestampSeconds === "number" ? Math.round(timestampSeconds) : null,
    };

    if (!track.comments) {
      track.comments = [];
    }
    track.comments.push(newComment);
    track.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return NextResponse.json({ success: true, comment: newComment, track });
  } catch (error: any) {
    console.error("POST /api/tracks/[id]/comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add comment" },
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
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ success: false, error: "commentId requis" }, { status: 400 });
    }

    const { db } = await getDatabase();
    const track = db.tracks.find((t) => t.id === id);

    if (!track) {
      return NextResponse.json({ success: false, error: "Piste introuvable" }, { status: 404 });
    }

    track.comments = (track.comments || []).filter((c) => c.id !== commentId);
    track.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return NextResponse.json({ success: true, deletedCommentId: commentId });
  } catch (error: any) {
    console.error("DELETE /api/tracks/[id]/comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}
