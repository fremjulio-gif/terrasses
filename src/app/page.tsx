"use client";

import React, { useState, useEffect, useRef } from "react";
import { AudioTrack, ScriptStructure, ValidationStatus, ScriptCue } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ActFilterBar } from "@/components/ActFilterBar";
import { TrackCard } from "@/components/TrackCard";
import { BottomFloatingDock } from "@/components/BottomFloatingDock";
import { CueModal } from "@/components/CueModal";
import { AdminModal } from "@/components/AdminModal";
import { ScriptSummaryDrawer } from "@/components/ScriptSummaryDrawer";
import defaultScriptStructure from "@/data/script-structure.json";
import {
  Compass,
  Plus,
  Cloud,
  HardDrive,
} from "lucide-react";

export default function HomePage() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [scriptStructure, setScriptStructure] = useState<ScriptStructure>(
    defaultScriptStructure as unknown as ScriptStructure
  );
  const [isDriveConfigured, setIsDriveConfigured] = useState<boolean>(false);
  const [storageSource, setStorageSource] = useState<"drive" | "local">("local");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedActId, setSelectedActId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ValidationStatus | "all">("all");

  // Modals state
  const [activeCue, setActiveCue] = useState<ScriptCue | null>(null);
  const [isScriptDrawerOpen, setIsScriptDrawerOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);

  // Admin secret state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState("0000");
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load tracks
  const loadData = async () => {
    try {
      const res = await fetch("/api/tracks");
      const data = await res.json();
      if (data.success) {
        setTracks(data.tracks || []);
        setIsDriveConfigured(Boolean(data.isDriveConfigured));
        setStorageSource(data.source || "local");
        if (data.scriptStructure) {
          setScriptStructure(data.scriptStructure);
        }
      }
    } catch (err) {
      console.error("Error loading tracks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Keyboard shortcut Cmd + Shift + M for Admin mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Easter Egg: 5 rapid clicks on "TERRASSES"
  const handleTitleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    const nextCount = easterEggClicks + 1;
    setEasterEggClicks(nextCount);

    if (nextCount >= 5) {
      setIsAdminModalOpen(true);
      setEasterEggClicks(0);
    } else {
      clickTimerRef.current = setTimeout(() => {
        setEasterEggClicks(0);
      }, 1200);
    }
  };

  const handleOpenCue = (cueId: string) => {
    const cue = scriptStructure.cues.find((c) => c.id === cueId);
    if (cue) {
      setActiveCue(cue);
    }
  };

  const trackCountsByAct = tracks.reduce((acc, t) => {
    if (t.actId) {
      acc[t.actId] = (acc[t.actId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredTracks = tracks.filter((t) => {
    if (selectedActId && t.actId !== selectedActId) return false;
    if (selectedStatus !== "all" && t.validationStatus !== selectedStatus) return false;
    return true;
  });

  const selectedAct = scriptStructure.acts.find((a) => a.id === selectedActId);

  return (
    <div className="min-h-screen pb-28">
      {/* Discreet Navigation Bar */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Title & Secret Easter Egg trigger */}
          <div
            onClick={handleTitleClick}
            className="cursor-pointer select-none group flex items-baseline gap-2"
          >
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans group-hover:opacity-80 transition-opacity">
              TERRASSES
            </h1>
            <span className="text-xs text-zinc-400 font-serif italic">
              Laurent Gaudé
            </span>
            {easterEggClicks > 1 && (
              <span className="text-[10px] font-mono font-bold text-amber-500">
                ({easterEggClicks}/5)
              </span>
            )}
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2">
            {/* Storage indicator */}
            <span
              title={isDriveConfigured ? "Google Drive synchronisé" : "Mode local actif"}
              className="p-1.5 text-zinc-400 dark:text-zinc-500"
            >
              {isDriveConfigured ? <Cloud className="w-3.5 h-3.5 text-blue-500" /> : <HardDrive className="w-3.5 h-3.5" />}
            </span>

            {/* Script Drawer */}
            <button
              onClick={() => setIsScriptDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Compass className="w-3 h-3" />
              <span>Texte</span>
            </button>

            {/* Admin Add */}
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTrack(null);
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Track List Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 space-y-4">
        {/* Act & Status Filter Bar */}
        <ActFilterBar
          scriptStructure={scriptStructure}
          selectedActId={selectedActId}
          selectedStatus={selectedStatus}
          onSelectAct={setSelectedActId}
          onSelectStatus={setSelectedStatus}
          trackCountsByAct={trackCountsByAct}
          totalTracks={tracks.length}
        />

        {/* Selected Act subtle subtitle (Discreet 1-liner, no heavy box) */}
        {selectedAct && (
          <div className="flex items-baseline justify-between text-xs text-zinc-500 dark:text-zinc-400 border-b border-black/[0.04] dark:border-white/[0.06] pb-1.5">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {selectedAct.title}
            </span>
            <span className="font-mono text-[11px]">
              {selectedAct.musical.keyMode} • {selectedAct.musical.tempo}
            </span>
          </div>
        )}

        {/* Tracks List */}
        <div className="space-y-2.5 pt-1">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400">
              Aucun morceau ne correspond aux filtres.
            </div>
          ) : (
            filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                scriptStructure={scriptStructure}
                isAdmin={isAdmin}
                adminPin={adminPin}
                onOpenCue={handleOpenCue}
                onTrackUpdated={(updated) => {
                  setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                }}
                onTrackDeleted={(deletedId) => {
                  setTracks((prev) => prev.filter((t) => t.id !== deletedId));
                }}
                onEditTrack={(tr) => {
                  setEditingTrack(tr);
                  setIsAdminModalOpen(true);
                }}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Dock Audio Player */}
      <BottomFloatingDock tracks={tracks} />

      {/* Cue Script Modal */}
      {activeCue && (
        <CueModal
          cue={activeCue}
          actTitle={scriptStructure.acts.find((a) => a.id === activeCue.actId)?.title}
          sceneTitle={
            scriptStructure.acts
              .find((a) => a.id === activeCue.actId)
              ?.scenes.find((s) => s.id === activeCue.sceneId)?.title
          }
          onClose={() => setActiveCue(null)}
        />
      )}

      {/* Script Summary Drawer */}
      <ScriptSummaryDrawer
        scriptStructure={scriptStructure}
        isOpen={isScriptDrawerOpen}
        onClose={() => setIsScriptDrawerOpen(false)}
      />

      {/* Composer Admin Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        isAdmin={isAdmin}
        adminPin={adminPin}
        scriptStructure={scriptStructure}
        editingTrack={editingTrack}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingTrack(null);
        }}
        onLoginSuccess={(pin) => {
          setIsAdmin(true);
          setAdminPin(pin);
        }}
        onLogout={() => {
          setIsAdmin(false);
          setIsAdminModalOpen(false);
        }}
        onTrackCreated={(newTrack) => {
          setTracks((prev) => [newTrack, ...prev]);
        }}
        onTrackUpdated={(updated) => {
          setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
      />
    </div>
  );
}
