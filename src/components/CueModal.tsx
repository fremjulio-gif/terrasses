"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Quote } from "lucide-react";
import { ScriptCue } from "@/types";

interface CueModalProps {
  cue: ScriptCue | null;
  onClose: () => void;
}

export function CueModal({ cue, onClose }: CueModalProps) {
  if (!cue) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/70 dark:border-white/15 shadow-2xl z-10"
        >
          <div className="flex items-center justify-between p-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                Page {cue.page} du Script
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                {cue.speaker}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="relative pl-5 py-1 border-l-2 border-blue-500/50 italic text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm sm:text-base font-serif">
              <Quote className="absolute -left-2 -top-1 w-3.5 h-3.5 text-blue-500/30 fill-current" />
              {cue.fullText}
            </div>

            {cue.mood && (
              <p className="text-xs text-zinc-400 pt-1">
                Tonalité de la scène : <strong className="text-zinc-600 dark:text-zinc-300 font-normal">{cue.mood}</strong>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
