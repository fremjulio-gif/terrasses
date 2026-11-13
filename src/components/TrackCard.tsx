"use client";

import React, { useState } from "react";
import { AudioTrack, ScriptStructure, ValidationStatus } from "@/types";
import { WaveformPlayer } from "./WaveformPlayer";
import { useAudio } from "@/context/AudioContext";
import {
  Download,
  BookOpen,
  MessageSquare,
  Trash2,
  Edit3,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackCardProps {
  track: AudioTrack;
  scriptStructure: ScriptStructure;
  isAdmin: boolean;
  adminPin?: string;
  onOpenCue: (cueId: string) => void;
  onTrackUpdated: (updatedTrack: AudioTrack) => void;
  onTrackDeleted?: (trackId: string) => void;
  onEditTrack?: (track: AudioTrack) => void;
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackCard({
  track,
  scriptStructure,
  isAdmin,
  adminPin,
  onOpenCue,
  onTrackUpdated,
  onTrackDeleted,
  onEditTrack,
}: TrackCardProps) {
  const { currentTrack, currentTime, seekTo, playTrack } = useAudio();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Metteuse en scène");
  const [linkToTimecode, setLinkToTimecode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isThisTrackActive = currentTrack?.id === track.id;
  const cue = scriptStructure.cues.find((c) => c.id === track.cueId);

  const handleValidationChange = async (status: ValidationStatus) => {
    try {
      const res = await fetch(`/api/tracks/${track.id}/validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success && data.track) {
        onTrackUpdated(data.track);
      }
    } catch (err) {
      console.error("Error updating validation:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const timestampSeconds = linkToTimecode && isThisTrackActive ? currentTime : null;
      const res = await fetch(`/api/tracks/${track.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          author: commentAuthor.trim() || "Metteuse en scène",
          timestampSeconds,
        }),
      });
      const data = await res.json();
      if (data.success && data.track) {
        onTrackUpdated(data.track);
        setCommentText("");
        setLinkToTimecode(false);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/tracks/${track.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        const updated = {
          ...track,
          comments: (track.comments || []).filter((c) => c.id !== commentId),
        };
        onTrackUpdated(updated);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const commentsCount = track.comments?.length || 0;

  return (
    <div
      className={`rounded-2xl transition-all duration-150 border ${
        isThisTrackActive
          ? "bg-white/85 dark:bg-zinc-900/85 border-blue-500/40 dark:border-blue-400/30 shadow-md ring-1 ring-blue-500/20"
          : "bg-white/50 dark:bg-zinc-900/50 border-white/70 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 shadow-xs"
      } backdrop-blur-xl p-3.5 sm:p-4 space-y-2`}
    >
      {/* Top Row : Title, tempo, validation, actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Track Title & Version */}
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {track.title}
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">
            {track.version || "V1"}
          </span>
          {track.tempo && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
              • {track.tempo}
            </span>
          )}
        </div>

        {/* Action icons & Validation */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Validation Status Selector */}
          <div className="flex items-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-0.5 text-[11px]">
            <button
              onClick={() => handleValidationChange("validated")}
              title="Valider"
              className={`px-2 py-0.5 rounded-md transition-all ${
                track.validationStatus === "validated"
                  ? "bg-emerald-500 text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Validé
            </button>
            <button
              onClick={() => handleValidationChange("needs_work")}
              title="À ajuster"
              className={`px-2 py-0.5 rounded-md transition-all ${
                track.validationStatus === "needs_work"
                  ? "bg-amber-500 text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Ajuster
            </button>
            <button
              onClick={() => handleValidationChange("discussing")}
              title="En réflexion"
              className={`px-2 py-0.5 rounded-md transition-all ${
                track.validationStatus === "discussing"
                  ? "bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Réflexion
            </button>
          </div>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(!showComments)}
            title="Commentaires"
            className={`relative p-1.5 rounded-lg transition-colors ${
              showComments || commentsCount > 0
                ? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {commentsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 text-[9px] font-bold rounded-full bg-blue-600 text-white">
                {commentsCount}
              </span>
            )}
          </button>

          {/* Download button */}
          <a
            href={`/api/audio/${track.id}?download=true`}
            download={track.fileName}
            title="Télécharger le fichier source"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {/* Admin Edit/Delete */}
          {isAdmin && (
            <div className="flex items-center gap-0.5 pl-1 border-l border-black/10 dark:border-white/10">
              <button
                onClick={() => onEditTrack?.(track)}
                className="p-1 text-zinc-400 hover:text-blue-500"
                title="Modifier"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer "${track.title}" ?`)) {
                    onTrackDeleted?.(track.id);
                  }
                }}
                className="p-1 text-zinc-400 hover:text-rose-500"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Discrete Cue / Script Text Link */}
      {(track.cueQuote || cue) && (
        <div className="flex items-baseline gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => onOpenCue(track.cueId || cue?.id || "")}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
          >
            <BookOpen className="w-3 h-3" />
            <span>P. {track.pdfPage || cue?.page}</span>
          </button>
          <span className="italic truncate font-serif text-zinc-600 dark:text-zinc-300">
            {track.cueQuote || cue?.cueText}
          </span>
        </div>
      )}

      {/* Centered Waveform Player */}
      <WaveformPlayer
        track={track}
        onCommentClick={() => setShowComments(true)}
      />

      {/* Expandable Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16 }}
            className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2 overflow-hidden"
          >
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {commentsCount === 0 ? (
                <p className="text-[11px] text-zinc-400 italic py-0.5">
                  Aucun retour pour le moment.
                </p>
              ) : (
                track.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04] text-xs flex items-start justify-between gap-2 group/comm"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {comment.author}
                        </span>
                        {typeof comment.timestampSeconds === "number" && comment.timestampSeconds !== null && (
                          <button
                            onClick={() => {
                              if (isThisTrackActive) {
                                seekTo(comment.timestampSeconds!);
                              } else {
                                playTrack(track, comment.timestampSeconds!);
                              }
                            }}
                            className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            [{formatSeconds(comment.timestampSeconds)}]
                          </button>
                        )}
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-400">
                          {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs">
                        {comment.content}
                      </p>
                    </div>

                    {(isAdmin || comment.author === "Metteuse en scène") && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover/comm:opacity-100 text-zinc-400 hover:text-rose-500 transition-opacity p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Laisser une remarque..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={linkToTimecode}
                  onChange={(e) => setLinkToTimecode(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span>@{formatSeconds(isThisTrackActive ? currentTime : 0)}</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Envoyer
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
