"use client";

import React, { useState } from "react";
import { ScriptStructure } from "@/types";
import { Book, ChevronDown, ChevronRight, Music, Users, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScriptSummaryDrawerProps {
  scriptStructure: ScriptStructure;
  isOpen: boolean;
  onClose: () => void;
  onSelectCue?: (cueId: string) => void;
}

export function ScriptSummaryDrawer({ scriptStructure, isOpen, onClose, onSelectCue }: ScriptSummaryDrawerProps) {
  const [expandedAct, setExpandedAct] = useState<string>("act-1");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl h-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl backdrop-saturate-200 border-l border-white/60 dark:border-white/10 shadow-2xl p-6 overflow-y-auto space-y-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                Structure Dramatique & Musicale
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Book className="w-5 h-5 text-blue-500" />
                TERRASSES — Laurent Gaudé
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Extrait de {scriptStructure.metadata.sourcePdf} ({scriptStructure.metadata.totalPages} pages) & Note de direction musicale
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Personnages */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Personnages clés</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {scriptStructure.characters.map((char) => (
                <div key={char.name} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
                  <strong className="text-zinc-900 dark:text-zinc-100 block">{char.name}</strong>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">{char.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Les 4 Actes & Axes Musicaux */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>Découpage par Actes & Axes Musicaux (DT)</span>
            </h3>

            <div className="space-y-3">
              {scriptStructure.acts.map((act) => {
                const isExpanded = expandedAct === act.id;
                return (
                  <div
                    key={act.id}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden bg-white/40 dark:bg-zinc-800/40"
                  >
                    <button
                      onClick={() => setExpandedAct(isExpanded ? "" : act.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {act.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {act.pageRange}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {act.subtitle}
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 pt-0 space-y-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
                        {/* Musical direction details */}
                        <div className="p-3 rounded-xl bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 space-y-1">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {act.musical.title} ({act.musical.tempo})
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            <strong>Mode & Clé :</strong> {act.musical.keyMode}
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            <strong>Harmonie :</strong> {act.musical.chords}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            <strong>Sonorités VST :</strong> {act.musical.vstTools}
                          </div>
                        </div>

                        {/* Scenes list */}
                        <div className="space-y-2">
                          <strong className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Scènes :</strong>
                          {act.scenes.map((scene) => (
                            <div key={scene.id} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] space-y-1">
                              <div className="flex items-center justify-between font-medium text-zinc-900 dark:text-zinc-100">
                                <span>{scene.title}</span>
                                <span className="text-[10px] text-zinc-400">P. {scene.pageStart}–{scene.pageEnd}</span>
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" />
                                <span>{scene.location}</span>
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                                {scene.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
