"use client";

import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudio } from "@/context/AudioContext";
import { AudioTrack, TrackComment } from "@/types";
import { Play, Pause, Repeat, Bookmark } from "lucide-react";

interface WaveformPlayerProps {
  track: AudioTrack;
  compact?: boolean;
  onCommentClick?: (comment: TrackComment) => void;
  onAddCommentAtTimecode?: (timeSeconds: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({
  track,
  compact = false,
  onCommentClick,
  onAddCommentAtTimecode,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [localHoverTime, setLocalHoverTime] = useState<number | null>(null);
  const [abLoop, setAbLoop] = useState<{ start: number; end: number } | null>(null);

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

  // Initialize WaveSurfer with peaks
  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    const progressColor = isDark ? "#38bdf8" : "#0284c7";
    const waveColor = isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.12)";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor: isDark ? "#ffffff" : "#0f172a",
      cursorWidth: 1.5,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: compact ? 30 : 36,
      normalize: true,
      backend: "WebAudio",
      peaks: track.peaks && track.peaks.length > 0 ? [track.peaks] : undefined,
      duration: track.duration,
    });

    ws.on("interaction", (newTime) => {
      if (isCurrentTrack) {
        seekTo(newTime);
      } else {
        playTrack(track, newTime);
      }
    });

    wavesurferRef.current = ws;

    if (track.peaks && track.peaks.length > 0) {
      ws.load("", [track.peaks], track.duration);
    } else {
      ws.load(`/api/audio/${track.id}`);
    }

    return () => {
      ws.destroy();
    };
  }, [track.id, track.duration, track.peaks, compact]);

  // Sync progress
  useEffect(() => {
    if (wavesurferRef.current && isCurrentTrack && activeDuration > 0) {
      const progress = activeCurrentTime / activeDuration;
      wavesurferRef.current.seekTo(Math.min(1, Math.max(0, progress)));
    } else if (wavesurferRef.current && !isCurrentTrack) {
      wavesurferRef.current.seekTo(0);
    }
  }, [activeCurrentTime, activeDuration, isCurrentTrack]);

  const handlePlayToggle = () => {
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleSetLoopStart = () => {
    const cur = isCurrentTrack ? currentTime : 0;
    const end = Math.min(activeDuration, cur + 10);
    const newLoop = { start: cur, end };
    setAbLoop(newLoop);
    setLoopRegion(newLoop);
  };

  const clearAbLoop = () => {
    setAbLoop(null);
    setLoopRegion(null);
  };

  const timestampedComments = (track.comments || []).filter(
    (c) => typeof c.timestampSeconds === "number" && c.timestampSeconds !== null
  );

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Waveform and Markers */}
      <div className="relative group/wave flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayToggle}
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 ${
            isCurrentlyPlaying
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
              : "bg-black/5 text-zinc-800 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/20"
          }`}
          aria-label={isCurrentlyPlaying ? "Pause" : "Lecture"}
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Waveform Canvas */}
        <div className="relative flex-1">
          <div
            ref={containerRef}
            className="w-full h-8 cursor-pointer rounded-lg overflow-hidden"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setLocalHoverTime(Math.max(0, ratio * activeDuration));
            }}
            onMouseLeave={() => setLocalHoverTime(null)}
          />

          {/* Hover Time */}
          {localHoverTime !== null && (
            <div
              className="absolute -top-5 transform -translate-x-1/2 pointer-events-none px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-mono shadow-sm"
              style={{
                left: `${Math.min(96, Math.max(4, (localHoverTime / activeDuration) * 100))}%`,
              }}
            >
              {formatTime(localHoverTime)}
            </div>
          )}

          {/* A-B Loop highlight */}
          {abLoop && activeDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-blue-500/20 border-x border-blue-500/70 pointer-events-none"
              style={{
                left: `${(abLoop.start / activeDuration) * 100}%`,
                width: `${((abLoop.end - abLoop.start) / activeDuration) * 100}%`,
              }}
            />
          )}

          {/* Timestamped Comment dots */}
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
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white dark:ring-zinc-900 shadow-sm z-10 hover:scale-150 transition-transform"
                style={{ left: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Time counter */}
        <div className="flex-shrink-0 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 select-none min-w-[58px] text-right">
          {formatTime(activeCurrentTime)} / {formatTime(activeDuration)}
        </div>

        {/* Micro repetition button */}
        <button
          onClick={toggleLoop}
          title={isLooping ? "Boucle active" : "Mettre en boucle"}
          className={`p-1.5 rounded-md transition-colors ${
            isLooping
              ? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        {/* A-B loop button */}
        {abLoop ? (
          <button
            onClick={clearAbLoop}
            title="Annuler la boucle A-B"
            className="text-[10px] font-mono text-rose-500 px-1 py-0.5 rounded bg-rose-500/10"
          >
            A-B✕
          </button>
        ) : (
          <button
            onClick={handleSetLoopStart}
            title="Définir une boucle A-B de 10s"
            className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-1 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
          >
            A-B
          </button>
        )}
      </div>
    </div>
  );
}
