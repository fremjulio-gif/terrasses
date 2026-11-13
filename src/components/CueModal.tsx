"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Quote, Sparkles } from "lucide-react";
import { ScriptCue } from "@/types";

interface CueModalProps {
  cue: ScriptCue | null;
  actTitle?: string;
  sceneTitle?: string;
  onClose: () => void;
}

export function CueModal({ cue, actTitle, sceneTitle, onClose }: CueModalProps) {
  if (!cue) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window in Apple Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl backdrop-saturate-200 border border-white/70 dark:border-white/15 shadow-2xl z-10"
        >
          {/* Top specular line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  Page {cue.page} du Script
                </span>
                {cue.stageDirection && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] italic font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                    {cue.stageDirection}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                {cue.speaker}
              </h3>
              {(actTitle || sceneTitle) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {actTitle} — {sceneTitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Full script quote */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="relative pl-6 pr-2 py-2 border-l-2 border-blue-500/60 italic text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm sm:text-base font-serif">
              <Quote className="absolute -left-2 -top-1 w-4 h-4 text-blue-500 fill-current opacity-30" />
              {cue.fullText}
            </div>

            {cue.suggestedTrack && (
              <div className="flex items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-500 dark:text-zinc-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Piste suggérée par le compositeur : <strong className="text-zinc-800 dark:text-zinc-200">{cue.suggestedTrack}</strong> ({cue.modeBpm})</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full text-sm font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Fermer la citation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
