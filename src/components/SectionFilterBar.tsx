"use client";

import React from "react";
import { ScriptStructure, ValidationStatus } from "@/types";

interface SectionFilterBarProps {
  scriptStructure: ScriptStructure;
  selectedSectionId: string | null;
  selectedStatus: ValidationStatus | "all";
  onSelectSection: (sectionId: string | null) => void;
  onSelectStatus: (status: ValidationStatus | "all") => void;
  trackCountsBySection: Record<string, number>;
  totalTracks: number;
}

export function SectionFilterBar({
  scriptStructure,
  selectedSectionId,
  selectedStatus,
  onSelectSection,
  onSelectStatus,
  trackCountsBySection,
  totalTracks,
}: SectionFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 select-none">
      {/* Séquences scéniques du texte (sans inventer d'actes) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectSection(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedSectionId === null
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
              : "bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.12]"
          }`}
        >
          <span>Toute la pièce</span>
          <span className="text-[10px] font-mono opacity-70">({totalTracks})</span>
        </button>

        {scriptStructure.sections?.map((sec) => {
          const count = trackCountsBySection[sec.id] || 0;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedSectionId === sec.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.12]"
              }`}
            >
              <span>{sec.title}</span>
              <span className="text-[10px] font-mono opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Validation Status Filter Tabs */}
      <div className="flex items-center gap-1 text-[11px] self-start sm:self-center">
        <button
          onClick={() => onSelectStatus("all")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            selectedStatus === "all"
              ? "font-semibold text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Tous
        </button>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <button
          onClick={() => onSelectStatus("validated")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            selectedStatus === "validated"
              ? "font-semibold text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Validés
        </button>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <button
          onClick={() => onSelectStatus("needs_work")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            selectedStatus === "needs_work"
              ? "font-semibold text-amber-600 dark:text-amber-400"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          À ajuster
        </button>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <button
          onClick={() => onSelectStatus("discussing")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            selectedStatus === "discussing"
              ? "font-semibold text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          En réflexion
        </button>
      </div>
    </div>
  );
}
