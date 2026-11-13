"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { AudioTrack } from "@/types";

interface LoopRegion {
  start: number;
  end: number;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  loopRegion: LoopRegion | null;
  audioElement: HTMLAudioElement | null;
  playTrack: (track: AudioTrack, startTime?: number) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setLoopRegion: (region: LoopRegion | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [loopRegion, setLoopRegionState] = useState<LoopRegion | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio element once on client
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audio) return;
      setCurrentTime(audio.currentTime);

      // Handle A-B Loop if active
      if (loopRegion && audio.currentTime >= loopRegion.end) {
        audio.currentTime = loopRegion.start;
        audio.play().catch(() => {});
      }
    };

    const handleLoadedMetadata = () => {
      if (!audio) return;
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
    };
  }, [loopRegion, isLooping]);

  // Sync loop attribute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping && !loopRegion;
    }
  }, [isLooping, loopRegion]);

  // Sync volume attribute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playTrack = (track: AudioTrack, startTime?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.id === track.id) {
      if (startTime !== undefined) {
        audio.currentTime = startTime;
      }
      audio.play().catch((err) => console.log("Play error:", err));
      setIsPlaying(true);
      return;
    }

    setCurrentTrack(track);
    // Use the streaming API endpoint
    const streamUrl = `/api/audio/${track.id}`;
    audio.src = streamUrl;

    if (startTime !== undefined) {
      audio.currentTime = startTime;
    } else {
      audio.currentTime = 0;
    }

    audio.play().catch((err) => console.log("Play error:", err));
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      pauseTrack();
    } else {
      audioRef.current.play().catch((err) => console.log("Play error:", err));
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(audioRef.current.currentTime);
  };

  const setVolume = (level: number) => {
    const clamped = Math.max(0, Math.min(1, level));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const setLoopRegion = (region: LoopRegion | null) => {
    setLoopRegionState(region);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLooping,
        loopRegion,
        audioElement: audioRef.current,
        playTrack,
        pauseTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        toggleMute,
        toggleLoop,
        setLoopRegion,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
