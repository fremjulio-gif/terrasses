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
  Sparkles,
  BookOpen,
  Cloud,
  HardDrive,
  Music,
  Plus,
  Compass,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

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

  // Load tracks and script structure from API
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

  // Easter Egg: 5 rapid clicks on "TERRASSES" title
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

  // Open cue full text modal
  const handleOpenCue = (cueId: string) => {
    const cue = scriptStructure.cues.find((c) => c.id === cueId);
    if (cue) {
      setActiveCue(cue);
    }
  };

  // Track counts by act
  const trackCountsByAct = tracks.reduce((acc, t) => {
    if (t.actId) {
      acc[t.actId] = (acc[t.actId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    if (selectedActId && t.actId !== selectedActId) return false;
    if (selectedStatus !== "all" && t.validationStatus !== selectedStatus) return false;
    return true;
  });

  // Selected Act info
  const selectedAct = scriptStructure.acts.find((a) => a.id === selectedActId);

  return (
    <div className="min-h-screen pb-36">
      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06] bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl backdrop-saturate-180">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Secret Easter Egg Trigger */}
          <div
            onClick={handleTitleClick}
            className="cursor-pointer select-none group flex items-baseline gap-2.5"
            title="Cliquez 5 fois rapidement pour accéder à l'espace compositeur"
          >
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans group-hover:opacity-80 transition-opacity">
              TERRASSES
            </h1>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hidden md:inline">
              Laurent Gaudé
            </span>
            {easterEggClicks > 1 && (
              <span className="text-[10px] font-mono font-bold text-amber-500 animate-pulse">
                ({easterEggClicks}/5)
              </span>
            )}
          </div>

          {/* Right Header Navigation Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storage status badge */}
            <div
              title={
                isDriveConfigured
                  ? "Connecté et synchronisé à Google Drive (terrasses-db.json)"
                  : "Mode local (fallback actif — prêt pour configuration Drive)"
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400"
            >
              {isDriveConfigured ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Drive Sync</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                  <span>Stockage Local</span>
                </>
              )}
            </div>

            {/* Script Structure Drawer Button */}
            <button
              onClick={() => setIsScriptDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Dramaturgie</span>
            </button>

            {/* Add Track button if Admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTrack(null);
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau morceau</span>
              </button>
            )}

            {/* Theme Toggle (Light / Dark / Auto) */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Intro / Presentation Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/70 via-white/50 to-white/30 dark:from-zinc-900/70 dark:via-zinc-900/50 dark:to-zinc-900/30 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.35)]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Espace Répétition & Régie Son</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Création Musicale pour la scène
            </h2>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Bienvenue dans l'espace d'écoute et d'échange dédié à <em>TERRASSES</em>. Chaque proposition sonore est rattachée au texte, aux Actes et aux intentions scéniques. Écoutez, bouclez, validez en un clic et laissez vos remarques horodatées pour la création au plateau.
            </p>
          </div>
        </section>

        {/* Act & Scene Navigation Filter Bar */}
        <section className="space-y-4">
          <ActFilterBar
            scriptStructure={scriptStructure}
            selectedActId={selectedActId}
            selectedStatus={selectedStatus}
            onSelectAct={setSelectedActId}
            onSelectStatus={setSelectedStatus}
            trackCountsByAct={trackCountsByAct}
            totalTracks={tracks.length}
          />

          {/* Active Act Musical Context Card (from DT.rtf) */}
          {selectedAct && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-3xl bg-blue-500/[0.04] dark:bg-blue-400/[0.04] border border-blue-500/15 text-xs sm:text-sm space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Music className="w-4 h-4 text-blue-500" />
                  {selectedAct.title} — {selectedAct.musical.title}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  {selectedAct.musical.keyMode} • {selectedAct.musical.tempo}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-400 text-xs">
                <div>
                  <strong className="text-zinc-800 dark:text-zinc-200">Harmonies :</strong> {selectedAct.musical.chords}
                </div>
                <div>
                  <strong className="text-zinc-800 dark:text-zinc-200">Outils & VST :</strong> {selectedAct.musical.vstTools}
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Track Cards List */}
        <section className="space-y-6">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Aucun morceau ne correspond aux filtres sélectionnés.
              </p>
              <button
                onClick={() => {
                  setSelectedActId(null);
                  setSelectedStatus("all");
                }}
                className="text-xs text-blue-600 dark:text-blue-400 underline font-medium"
              >
                Réinitialiser tous les filtres
              </button>
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
        </section>
      </main>

      {/* Persistent Floating Bottom Dock Audio Player */}
      <BottomFloatingDock tracks={tracks} />

      {/* Cue Script Reader Modal */}
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

      {/* Script Summary Architecture Drawer */}
      <ScriptSummaryDrawer
        scriptStructure={scriptStructure}
        isOpen={isScriptDrawerOpen}
        onClose={() => setIsScriptDrawerOpen(false)}
      />

      {/* Composer Admin Secret Modal */}
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
