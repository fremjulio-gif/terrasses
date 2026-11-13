"use client";

import React, { useState } from "react";
import { ScriptStructure } from "@/types";
import { Book, ChevronDown, ChevronRight, Users, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScriptSummaryDrawerProps {
  scriptStructure: ScriptStructure;
  isOpen: boolean;
  onClose: () => void;
  onSelectCue?: (cueId: string) => void;
}

export function ScriptSummaryDrawer({ scriptStructure, isOpen, onClose }: ScriptSummaryDrawerProps) {
  const [expandedSeq, setExpandedSeq] = useState<string>("seq-1");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 350 }}
          className="relative w-full max-w-md h-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl border-l border-white/60 dark:border-white/10 shadow-2xl p-5 sm:p-6 overflow-y-auto space-y-5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Book className="w-4 h-4 text-blue-500" />
                TERRASSES — Laurent Gaudé
              </h2>
              <p className="text-xs text-zinc-400">
                Script de {scriptStructure.metadata.totalPages} pages
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Personnages */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Personnages
            </h3>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {scriptStructure.characters?.map((char) => (
                <div key={char.name} className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] flex items-baseline justify-between gap-2">
                  <strong className="text-zinc-900 dark:text-zinc-100">{char.name}</strong>
                  <span className="text-[11px] text-zinc-500 truncate">{char.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Séquences du texte */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Déroulé du Texte
            </h3>

            <div className="space-y-2">
              {scriptStructure.sections?.map((sec) => {
                const isExpanded = expandedSeq === sec.id;
                return (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-black/[0.05] dark:border-white/[0.08] overflow-hidden bg-black/[0.01] dark:bg-white/[0.02]"
                  >
                    <button
                      onClick={() => setExpandedSeq(isExpanded ? "" : sec.id)}
                      className="w-full flex items-center justify-between p-3 text-left transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {sec.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {sec.pageRange}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {sec.subtitle}
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">Intention : </span>
                        {sec.intention}
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
