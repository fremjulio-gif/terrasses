"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className, glow = false, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={twMerge(
        clsx(
          "relative overflow-hidden rounded-3xl",
          // Glass surface & specular border
          "bg-white/60 dark:bg-zinc-900/60",
          "backdrop-blur-2xl backdrop-saturate-180",
          "border border-white/70 dark:border-white/10",
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]",
          glow && "ring-1 ring-blue-500/30 dark:ring-blue-400/30",
          "transition-all duration-300",
          className
        )
      )}
      {...props}
    >
      {/* Specular top highlight (Apple Liquid Glass signature line) */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
