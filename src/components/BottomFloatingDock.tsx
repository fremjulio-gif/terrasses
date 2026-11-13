"use client";

import React from "react";
import { useAudio } from "@/context/AudioContext";
import { AudioTrack } from "@/types";
import {
  Play,
  Pause,
  Repeat,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Download,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomFloatingDockProps {
  tracks: AudioTrack[];
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BottomFloatingDock({ tracks }: BottomFloatingDockProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isLooping,
    toggleLoop,
  } = useAudio();

  if (!currentTrack) return null;

  const activeDuration = duration > 0 ? duration : currentTrack.duration || 60;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / activeDuration) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="fixed bottom-0 inset-x-0 z-40 px-3 sm:px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl pointer-events-auto bg-white/85 dark:bg-zinc-900/90 backdrop-blur-3xl backdrop-saturate-200 border border-white/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.6)] p-3 sm:px-6 sm:py-3.5 space-y-2">
          {/* Top specular line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent pointer-events-none" />

          {/* DESKTOP & TABLET LAYOUT : 3 Centered Balanced Columns */}
          <div className="hidden sm:grid grid-cols-12 items-center gap-4">
            {/* Left Column (3 cols): Track Title & Script Reference */}
            <div className="col-span-3 min-w-0 space-y-0.5">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                {currentTrack.pdfPage && (
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    P. {currentTrack.pdfPage}
                  </span>
                )}
                {currentTrack.tempo && (
                  <span>• {currentTrack.tempo}</span>
                )}
              </p>
            </div>

            {/* Center Column (6 cols) : Transport Controls & Centered Timeline */}
            <div className="col-span-6 flex flex-col items-center justify-center gap-1.5 w-full">
              {/* Transport Buttons Centered */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => seekTo(currentTime - 5)}
                  title="Reculer de 5 secondes"
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md hover:scale-105 active:scale-95 transition-all"
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekTo(currentTime + 5)}
                  title="Avancer de 5 secondes"
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={toggleLoop}
                  title={isLooping ? "Boucle active" : "Mettre en boucle"}
                  className={`p-1.5 rounded-full transition-colors ml-1 ${
                    isLooping
                      ? "text-blue-600 dark:text-blue-400 bg-blue-500/15"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrubber Timeline Bar Centered with Left & Right Timers */}
              <div className="flex items-center gap-2.5 w-full max-w-md">
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-8 text-right select-none">
                  {formatTime(currentTime)}
                </span>

                <div
                  className="relative flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 cursor-pointer overflow-hidden group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    seekTo(ratio * activeDuration);
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-blue-600 dark:bg-sky-400 rounded-full transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-8 text-left select-none">
                  {formatTime(activeDuration)}
                </span>
              </div>
            </div>

            {/* Right Column (3 cols) : Volume & Download aligned right */}
            <div className="col-span-3 flex items-center justify-end gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Muet"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <a
                href={`/api/audio/${currentTrack.id}?download=true`}
                download={currentTrack.fileName}
                title="Télécharger l'audio source"
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* MOBILE LAYOUT : Ultra-Clean, Touch-friendly (≥44px touch targets) */}
          <div className="sm:hidden space-y-2">
            {/* Top: Track title & play button */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentTrack.pdfPage ? `Page ${currentTrack.pdfPage}` : "Terrasses"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLoop}
                  className={`p-2 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center ${
                    isLooping ? "text-blue-600 bg-blue-500/15" : "text-zinc-400"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md active:scale-95 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Bottom: Centered Scrubber with times */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-mono text-zinc-500 w-7 text-right">
                {formatTime(currentTime)}
              </span>

              <div
                className="relative flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 cursor-pointer overflow-hidden py-2"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seekTo(ratio * activeDuration);
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-blue-600 dark:bg-sky-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="text-[10px] font-mono text-zinc-400 w-7 text-left">
                {formatTime(activeDuration)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
