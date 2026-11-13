"use client";

import React from "react";
import { useAudio } from "@/context/AudioContext";
import { motion } from "framer-motion";

export function AmbientBackground() {
  const { isPlaying, currentTrack } = useAudio();

  // Determine ambient accent color based on active Act or mood
  const getMoodGlow = () => {
    if (!currentTrack) return "from-blue-500/15 via-indigo-500/10 to-transparent";
    switch (currentTrack.sectionId) {
      case "seq-1":
        return "from-amber-400/20 via-orange-400/10 to-transparent"; // La terrasse
      case "seq-2":
        return "from-rose-500/25 via-red-600/15 to-transparent"; // L'attaque
      case "seq-3":
        return "from-purple-600/25 via-indigo-700/15 to-transparent"; // Le Bataclan
      case "seq-4":
        return "from-sky-500/20 via-teal-500/15 to-transparent"; // Les secours / le baiser
      default:
        return "from-blue-500/15 via-indigo-500/10 to-transparent";
    }
  };

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
      {/* Dynamic Ambient Gradient 1 */}
      <motion.div
        animate={{
          x: isPlaying ? [0, 40, -30, 0] : [0, 15, -15, 0],
          y: isPlaying ? [0, -30, 20, 0] : [0, -10, 10, 0],
          scale: isPlaying ? [1, 1.15, 0.95, 1] : [1, 1.05, 1],
          opacity: isPlaying ? 0.75 : 0.45,
        }}
        transition={{
          duration: isPlaying ? 12 : 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] bg-gradient-to-br ${getMoodGlow()}`}
      />

      {/* Dynamic Ambient Gradient 2 */}
      <motion.div
        animate={{
          x: isPlaying ? [0, -50, 30, 0] : [0, -20, 20, 0],
          y: isPlaying ? [0, 35, -25, 0] : [0, 15, -15, 0],
          scale: isPlaying ? [1.1, 0.95, 1.15, 1.1] : [1, 1.04, 1],
          opacity: isPlaying ? 0.65 : 0.4,
        }}
        transition={{
          duration: isPlaying ? 15 : 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full blur-[130px] bg-gradient-to-tl from-indigo-500/15 via-sky-400/10 to-transparent dark:from-indigo-600/20 dark:via-blue-900/15"
      />

      {/* Dynamic Ambient Gradient 3 (bottom subtle floor) */}
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isPlaying ? 0.5 : 0.3,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 left-1/4 w-[700px] h-[500px] rounded-full blur-[140px] bg-gradient-to-t from-emerald-500/10 via-cyan-500/5 to-transparent dark:from-teal-900/15 dark:via-slate-800/10"
      />

      {/* Glass noise texture overlay (Apple visionOS film grain effect) */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
    </div>
  );
}
