"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

export function ThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("terrasses_theme") as ThemeMode | null;
    if (saved) {
      setThemeMode(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", mode === "dark");
    }
  };

  const cycleTheme = () => {
    let next: ThemeMode = "system";
    if (themeMode === "system") next = "light";
    else if (themeMode === "light") next = "dark";
    else if (themeMode === "dark") next = "system";

    setThemeMode(next);
    localStorage.setItem("terrasses_theme", next);
    applyTheme(next);
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={cycleTheme}
      title={`Thème actuel : ${themeMode === "system" ? "Auto (OS)" : themeMode === "light" ? "Clair (Répétition)" : "Sombre (Régie)"}`}
      className="group relative flex items-center justify-center w-9 h-9 rounded-full glass-panel border border-white/40 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label="Basculer le thème"
    >
      {themeMode === "light" && <Sun className="w-4 h-4 text-amber-500 transition-transform group-hover:rotate-45" />}
      {themeMode === "dark" && <Moon className="w-4 h-4 text-sky-400 transition-transform group-hover:-rotate-12" />}
      {themeMode === "system" && <Monitor className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
    </button>
  );
}
