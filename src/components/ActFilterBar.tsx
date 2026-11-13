"use client";

import React from "react";
import { ScriptStructure, ValidationStatus } from "@/types";
import { GlassPill } from "./GlassPill";
import { motion } from "framer-motion";
import { Filter, Layers, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface ActFilterBarProps {
  scriptStructure: ScriptStructure;
  selectedActId: string | null;
  selectedStatus: ValidationStatus | "all";
  onSelectAct: (actId: string | null) => void;
  onSelectStatus: (status: ValidationStatus | "all") => void;
  trackCountsByAct: Record<string, number>;
  totalTracks: number;
}

export function ActFilterBar({
  scriptStructure,
  selectedActId,
  selectedStatus,
  onSelectAct,
  onSelectStatus,
  trackCountsByAct,
  totalTracks,
}: ActFilterBarProps) {
  return (
    <div className="w-full space-y-3">
      {/* Acts Horizontal Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar select-none">
        {/* All Acts */}
        <GlassPill
          active={selectedActId === null}
          onClick={() => onSelectAct(null)}
          className="whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Toute la pièce</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/15">
            {totalTracks}
          </span>
        </GlassPill>

        {/* Individual Acts */}
        {scriptStructure.acts.map((act) => {
          const count = trackCountsByAct[act.id] || 0;
          return (
            <GlassPill
              key={act.id}
              active={selectedActId === act.id}
              onClick={() => onSelectAct(act.id)}
              className="whitespace-nowrap"
            >
              <span>{act.number === 1 ? "I" : act.number === 2 ? "II" : act.number === 3 ? "III" : "IV"}. {act.title.split(":")[1]?.trim() || act.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/15">
                {count}
              </span>
            </GlassPill>
          );
        })}
      </div>

      {/* Validation Status Filter Pills */}
      <div className="flex items-center gap-2 text-xs select-none">
        <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" />
          <span>Filtre :</span>
        </span>

        <button
          onClick={() => onSelectStatus("all")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedStatus === "all"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          Tous ({totalTracks})
        </button>

        <button
          onClick={() => onSelectStatus("validated")}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedStatus === "validated"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-600"
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Validés</span>
        </button>

        <button
          onClick={() => onSelectStatus("needs_work")}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedStatus === "needs_work"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/10 hover:text-amber-600"
          }`}
        >
          <AlertCircle className="w-3 h-3 text-amber-500" />
          <span>À ajuster</span>
        </button>

        <button
          onClick={() => onSelectStatus("discussing")}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedStatus === "discussing"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-sky-500/10 hover:text-sky-600"
          }`}
        >
          <HelpCircle className="w-3 h-3 text-sky-500" />
          <span>En réflexion</span>
        </button>
      </div>
    </div>
  );
}
