"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudio } from "@/context/AudioContext";
import { AudioTrack, TrackComment } from "@/types";
import { Play, Pause, Repeat, Volume2, VolumeX, MessageSquare, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface WaveformPlayerProps {
  track: AudioTrack;
  onCommentClick?: (comment: TrackComment) => void;
  onAddCommentAtTimecode?: (timeSeconds: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({ track, onCommentClick, onAddCommentAtTimecode }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [localHoverTime, setLocalHoverTime] = useState<number | null>(null);
  const [abLoop, setAbLoop] = useState<{ start: number; end: number } | null>(null);
  const [settingLoopPoint, setSettingLoopPoint] = useState<"none" | "start" | "end">("none");

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playTrack,
    togglePlayPause,
    seekTo,
    isLooping,
    toggleLoop,
    setLoopRegion,
  } = useAudio();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const activeDuration = isCurrentTrack && duration > 0 ? duration : track.duration || 60;
  const activeCurrentTime = isCurrentTrack ? currentTime : 0;

  // Initialize WaveSurfer with peaks optimization
  useEffect(() => {
    if (!containerRef.current) return;

    // Detect dark mode for waveform colors
    const isDark = document.documentElement.classList.contains("dark");
    const progressColor = isDark ? "#38bdf8" : "#0284c7"; // Sky / Apple Light Blue
    const waveColor = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(15, 23, 42, 0.16)";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor: isDark ? "#ffffff" : "#0f172a",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 3,
      height: 56,
      normalize: true,
      backend: "WebAudio",
      // Pre-calculated peaks optimization: loads waveform in < 10ms without fetching full 50MB audio!
      peaks: track.peaks && track.peaks.length > 0 ? [track.peaks] : undefined,
      duration: track.duration,
    });

    ws.on("ready", () => {
      setIsReady(true);
    });

    // When clicking on waveform, seek audio
    ws.on("interaction", (newTime) => {
      if (isCurrentTrack) {
        seekTo(newTime);
      } else {
        playTrack(track, newTime);
      }
    });

    wavesurferRef.current = ws;

    // Load peaks or stream url
    if (track.peaks && track.peaks.length > 0) {
      ws.load("", [track.peaks], track.duration);
    } else {
      ws.load(`/api/audio/${track.id}`);
    }

    return () => {
      ws.destroy();
    };
  }, [track.id, track.duration, track.peaks]);

  // Sync WaveSurfer progress with AudioContext playback
  useEffect(() => {
    if (wavesurferRef.current && isCurrentTrack && activeDuration > 0) {
      const progress = activeCurrentTime / activeDuration;
      wavesurferRef.current.seekTo(Math.min(1, Math.max(0, progress)));
    } else if (wavesurferRef.current && !isCurrentTrack) {
      wavesurferRef.current.seekTo(0);
    }
  }, [activeCurrentTime, activeDuration, isCurrentTrack]);

  // Handle Play/Pause toggle
  const handlePlayToggle = () => {
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  // Handle A-B loop point creation
  const handleSetLoopStart = () => {
    const cur = isCurrentTrack ? currentTime : 0;
    setAbLoop((prev) => ({ start: cur, end: prev?.end && prev.end > cur ? prev.end : Math.min(track.duration, cur + 10) }));
    setSettingLoopPoint("end");
  };

  const handleSetLoopEnd = () => {
    const cur = isCurrentTrack ? currentTime : (abLoop?.start || 0) + 10;
    if (abLoop && cur > abLoop.start) {
      const newLoop = { start: abLoop.start, end: cur };
      setAbLoop(newLoop);
      setLoopRegion(newLoop);
    }
    setSettingLoopPoint("none");
  };

  const clearAbLoop = () => {
    setAbLoop(null);
    setLoopRegion(null);
    setSettingLoopPoint("none");
  };

  // Timestamped comments
  const timestampedComments = (track.comments || []).filter(
    (c) => typeof c.timestampSeconds === "number" && c.timestampSeconds !== null
  );

  return (
    <div className="w-full space-y-3">
      {/* Waveform Canvas & Timecode Markers */}
      <div className="relative group">
        <div
          ref={containerRef}
          className="w-full h-14 rounded-xl cursor-pointer overflow-hidden transition-opacity duration-200"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setLocalHoverTime(Math.max(0, ratio * activeDuration));
          }}
          onMouseLeave={() => setLocalHoverTime(null)}
        />

        {/* Hover Time Pill */}
        {localHoverTime !== null && (
          <div
            className="absolute top-0 transform -translate-x-1/2 -translate-y-6 pointer-events-none px-2 py-0.5 rounded-md bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900 text-[10px] font-mono shadow-md backdrop-blur-md"
            style={{
              left: `${Math.min(96, Math.max(4, (localHoverTime / activeDuration) * 100))}%`,
            }}
          >
            {formatTime(localHoverTime)}
          </div>
        )}

        {/* A-B Loop highlight overlay */}
        {abLoop && activeDuration > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-blue-500/20 border-x-2 border-blue-500/80 pointer-events-none z-10"
            style={{
              left: `${(abLoop.start / activeDuration) * 100}%`,
              width: `${((abLoop.end - abLoop.start) / activeDuration) * 100}%`,
            }}
          >
            <span className="absolute top-1 left-1 text-[9px] font-bold text-blue-600 dark:text-blue-300 bg-white/70 dark:bg-black/70 px-1 rounded">
              Boucle A-B
            </span>
          </div>
        )}

        {/* Timestamped Comment Markers underneath waveform */}
        <div className="relative w-full h-4 mt-1">
          {timestampedComments.map((comment) => {
            const pct = Math.min(100, Math.max(0, ((comment.timestampSeconds || 0) / activeDuration) * 100));
            return (
              <button
                key={comment.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (comment.timestampSeconds !== undefined && comment.timestampSeconds !== null) {
                    if (isCurrentTrack) {
                      seekTo(comment.timestampSeconds);
                    } else {
                      playTrack(track, comment.timestampSeconds);
                    }
                    onCommentClick?.(comment);
                  }
                }}
                title={`[${formatTime(comment.timestampSeconds || 0)}] ${comment.author}: ${comment.content}`}
                className="group/marker absolute top-0 -translate-x-1/2 flex items-center justify-center p-0.5 hover:scale-125 transition-transform"
                style={{ left: `${pct}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 border border-white shadow-sm ring-2 ring-amber-500/20" />
                {/* Tooltip on hover */}
                <div className="hidden group-hover/marker:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900/90 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs shadow-lg backdrop-blur-md">
                  <span className="font-mono text-[10px] text-amber-400 dark:text-amber-600 mr-1.5 font-bold">
                    {formatTime(comment.timestampSeconds || 0)}
                  </span>
                  <span className="truncate max-w-[200px]">{comment.content}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Controls & Timers */}
      <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
        {/* Play/Pause Button + Time display */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={handlePlayToggle}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all"
            aria-label={isCurrentlyPlaying ? "Pause" : "Lecture"}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </motion.button>

          <div className="flex items-baseline gap-1 text-xs font-mono select-none">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatTime(activeCurrentTime)}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">/</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {formatTime(activeDuration)}
            </span>
          </div>
        </div>

        {/* Repetition & Loop Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Global Track Loop Button */}
          <button
            onClick={toggleLoop}
            title={isLooping ? "Boucle activée (cliquez pour désactiver)" : "Mettre la piste en boucle"}
            className={`p-2 rounded-full transition-all text-xs flex items-center gap-1.5 ${
              isLooping
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-500/30"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Repeat className={`w-3.5 h-3.5 ${isLooping ? "stroke-[2.5]" : ""}`} />
            <span className="hidden sm:inline text-[11px]">Boucle</span>
          </button>

          {/* A-B Loop Controls */}
          {abLoop ? (
            <button
              onClick={clearAbLoop}
              title="Supprimer la boucle A-B"
              className="px-2 py-1 rounded-md text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors font-medium"
            >
              Annuler A-B [{formatTime(abLoop.start)} - {formatTime(abLoop.end)}]
            </button>
          ) : (
            <button
              onClick={handleSetLoopStart}
              title="Définir une boucle de travail A-B sur la position actuelle"
              className="px-2 py-1 rounded-md text-[10px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              Boucle A-B
            </button>
          )}

          {/* Add Timestamped Comment shortcut */}
          {onAddCommentAtTimecode && (
            <button
              onClick={() => onAddCommentAtTimecode(activeCurrentTime)}
              title={`Ajouter un commentaire à ${formatTime(activeCurrentTime)}`}
              className="p-2 rounded-full text-zinc-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
