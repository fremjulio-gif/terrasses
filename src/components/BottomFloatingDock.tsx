"use client";

import React, { useState } from "react";
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
  Music,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomFloatingDockProps {
  tracks: AudioTrack[];
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  const [isHovered, setIsHovered] = useState(false);

  if (!currentTrack) return null;

  const activeDuration = duration > 0 ? duration : currentTrack.duration || 60;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / activeDuration) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[94%] max-w-4xl z-40"
      >
        <div className="relative overflow-hidden rounded-3xl glass-dock bg-white/80 dark:bg-zinc-900/85 backdrop-blur-3xl backdrop-saturate-200 border border-white/80 dark:border-white/15 shadow-2xl p-3 sm:px-6 sm:py-3.5 space-y-2">
          {/* Top specular reflection line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent pointer-events-none" />

          {/* Interactive Compact Scrubber Bar */}
          <div
            className="relative w-full h-2 rounded-full bg-black/10 dark:bg-white/10 cursor-pointer overflow-hidden group"
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

          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Track Info */}
            <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[30%]">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {currentTrack.keyMode || "Mode Dorien"} • {currentTrack.bpm || "72 BPM"}
                </p>
              </div>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Skip -5s */}
              <button
                onClick={() => seekTo(currentTime - 5)}
                title="Reculer de 5 secondes"
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={togglePlayPause}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                )}
              </motion.button>

              {/* Skip +5s */}
              <button
                onClick={() => seekTo(currentTime + 5)}
                title="Avancer de 5 secondes"
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Time display */}
              <div className="hidden sm:flex items-baseline gap-1 text-xs font-mono select-none pl-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatTime(currentTime)}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">/</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {formatTime(activeDuration)}
                </span>
              </div>
            </div>

            {/* Right: Loop, Volume & Direct Download */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Loop Button */}
              <button
                onClick={toggleLoop}
                title={isLooping ? "Boucle activée" : "Mettre en boucle"}
                className={`p-2 rounded-full transition-colors ${
                  isLooping
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Repeat className={`w-4 h-4 ${isLooping ? "stroke-[2.5]" : ""}`} />
              </button>

              {/* Volume Scrubber (hidden on tiny screens) */}
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                  className="w-16 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Download */}
              <a
                href={`/api/audio/${currentTrack.id}?download=true`}
                download={currentTrack.fileName}
                title="Télécharger la source (.wav/.mp3)"
                className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
