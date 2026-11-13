"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassPillProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function GlassPill({ children, active = false, className, ...props }: GlassPillProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={twMerge(
        clsx(
          "relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 select-none",
          active
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md border border-zinc-900/10 dark:border-white/20"
            : "bg-white/50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-white/60 dark:border-white/10 shadow-sm",
          "backdrop-blur-xl backdrop-saturate-180",
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
