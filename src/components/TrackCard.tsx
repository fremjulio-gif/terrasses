"use client";

import React, { useState } from "react";
import { AudioTrack, ScriptStructure, ValidationStatus, TrackComment } from "@/types";
import { GlassCard } from "./GlassCard";
import { WaveformPlayer } from "./WaveformPlayer";
import { useAudio } from "@/context/AudioContext";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  BookOpen,
  MessageSquare,
  Music2,
  Sparkles,
  ShieldCheck,
  Send,
  Trash2,
  Edit3,
  Clock,
  User,
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
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
  const { currentTrack, currentTime, isPlaying, seekTo, playTrack } = useAudio();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Metteuse en scène");
  const [linkToTimecode, setLinkToTimecode] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingValidation, setIsUpdatingValidation] = useState(false);

  const isThisTrackActive = currentTrack?.id === track.id;

  // Resolve matching Act and Scene details from scriptStructure
  const act = scriptStructure.acts.find((a) => a.id === track.actId);
  const scene = act?.scenes.find((s) => s.id === track.sceneId);
  const cue = scriptStructure.cues.find((c) => c.id === track.cueId);

  // Quick 1-click validation status update
  const handleValidationChange = async (status: ValidationStatus) => {
    setIsUpdatingValidation(true);
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
    } finally {
      setIsUpdatingValidation(false);
    }
  };

  // Submit new comment (general or timestamped)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
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
      setIsSubmittingComment(false);
    }
  };

  // Delete a comment
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

  // Category badge label & color
  const getCategoryBadge = () => {
    switch (track.category) {
      case "original":
        return { label: "Compo originale", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "remix":
        return { label: "Remix / Relecture", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "sound_design":
        return { label: "Sound Design", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "ambience":
        return { label: "Bruitage / Ambiance", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      default:
        return { label: "Composition", color: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" };
    }
  };

  const catBadge = getCategoryBadge();

  return (
    <GlassCard glow={isThisTrackActive} className="p-5 sm:p-6 space-y-5">
      {/* Top Header: Title, Category Badge, Version, Admin Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {track.title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catBadge.color}`}>
              {catBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
              {track.version || "V1"}
            </span>
          </div>

          {/* Technical and Legal badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
            {track.bpm && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Music2 className="w-3.5 h-3.5 text-zinc-400" />
                {track.bpm}
              </span>
            )}
            {track.keyMode && (
              <>
                <span>•</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{track.keyMode}</span>
              </>
            )}
            {track.rightsStatus && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  {track.rightsStatus}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Direct Download & Admin buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Direct Download Button (.wav / .mp3 source for régie son) */}
          <a
            href={`/api/audio/${track.id}?download=true`}
            download={track.fileName}
            title="Télécharger le fichier original (.wav/.mp3) pour la régie son"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>

          {/* Admin Edit & Delete buttons */}
          {isAdmin && (
            <div className="flex items-center gap-1 pl-2 border-l border-black/10 dark:border-white/10">
              <button
                onClick={() => onEditTrack?.(track)}
                title="Éditer la piste (métadonnées, repère PDF, version)"
                className="p-1.5 rounded-full text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer définitivement la piste "${track.title}" ?`)) {
                    onTrackDeleted?.(track.id);
                  }
                }}
                title="Supprimer la piste"
                className="p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cue / Repère Texte du script V3 terrasses.pdf */}
      {(track.cueQuote || cue) && (
        <div className="group/cue relative p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {act ? act.title : "Acte"} {scene ? `— ${scene.title}` : ""}
                {track.pdfPage ? ` (Page ${track.pdfPage})` : ""}
              </span>
            </div>

            <button
              onClick={() => onOpenCue(track.cueId || cue?.id || "")}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              Extrait complet
            </button>
          </div>

          <p className="text-xs sm:text-sm italic font-serif text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {track.cueQuote || cue?.cueText}
          </p>

          {track.notes && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
              <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Note d'intention :</strong> {track.notes}
            </p>
          )}
        </div>
      )}

      {/* Waveform Player (WaveSurfer.js avec barres arrondies et gradient) */}
      <WaveformPlayer
        track={track}
        onCommentClick={(comm) => {
          setShowComments(true);
        }}
        onAddCommentAtTimecode={(time) => {
          setShowComments(true);
          setLinkToTimecode(true);
        }}
      />

      {/* Bottom Bar: Metteuse en Scène 1-Click Validation & Comments Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Validation Status Buttons (1 clic) */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mr-1 hidden sm:inline">
            Statut :
          </span>

          <button
            onClick={() => handleValidationChange("validated")}
            disabled={isUpdatingValidation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              track.validationStatus === "validated"
                ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20"
                : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-600"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validé</span>
          </button>

          <button
            onClick={() => handleValidationChange("needs_work")}
            disabled={isUpdatingValidation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              track.validationStatus === "needs_work"
                ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20"
                : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/10 hover:text-amber-600"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>À ajuster</span>
          </button>

          <button
            onClick={() => handleValidationChange("discussing")}
            disabled={isUpdatingValidation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              track.validationStatus === "discussing"
                ? "bg-sky-500 text-white shadow-sm ring-2 ring-sky-500/20"
                : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-sky-500/10 hover:text-sky-600"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>En réflexion</span>
          </button>
        </div>

        {/* Comments Toggle Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Commentaires ({track.comments?.length || 0})</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-4 overflow-hidden"
          >
            {/* List of existing comments */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {(!track.comments || track.comments.length === 0) ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-1">
                  Aucun commentaire pour le moment. Laissez vos retours ci-dessous.
                </p>
              ) : (
                track.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-white/5 shadow-sm space-y-1 group/item"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{comment.author}</span>

                        {/* Timestamp marker pill */}
                        {typeof comment.timestampSeconds === "number" && comment.timestampSeconds !== null && (
                          <button
                            onClick={() => {
                              if (isThisTrackActive) {
                                seekTo(comment.timestampSeconds!);
                              } else {
                                playTrack(track, comment.timestampSeconds!);
                              }
                            }}
                            title="Écouter à ce timecode"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {formatSeconds(comment.timestampSeconds)}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">
                          {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {(isAdmin || comment.author === "Metteuse en scène") && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-rose-500 transition-opacity"
                            title="Supprimer ce commentaire"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Votre nom / rôle"
                  className="w-1/3 px-3 py-1.5 rounded-xl text-xs bg-white/40 dark:bg-zinc-800/40 border border-white/60 dark:border-white/10 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Auto Timecode Link Checkbox */}
                <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={linkToTimecode}
                    onChange={(e) => setLinkToTimecode(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-0"
                  />
                  <span>
                    Lier au timecode{" "}
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      [{formatSeconds(isThisTrackActive ? currentTime : 0)}]
                    </strong>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrire une remarque, une demande d'ajustement sonore..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
