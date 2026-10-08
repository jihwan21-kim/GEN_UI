"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light";
type Vision = "standard" | "accessible";
type ThemeContextValue = {
  theme: Theme;
  vision: Vision;
  setTheme: (theme: Theme) => void;
  setVision: (vision: Vision) => void;
};

const CinemaThemeContext = createContext<ThemeContextValue | null>(null);

export function CinemaThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [vision, setVision] = useState<Vision>("standard");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("cinema-theme");
      const storedVision = localStorage.getItem("cinema-vision");
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
      if (storedVision === "standard" || storedVision === "accessible") setVision(storedVision);
    } catch {
      // Browser storage is optional. The app works without it.
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.cinemaTheme = theme;
    document.documentElement.dataset.cinemaVision = vision;
    try {
      localStorage.setItem("cinema-theme", theme);
      localStorage.setItem("cinema-vision", vision);
    } catch {
      // Keep in-memory preferences when storage is blocked.
    }
  }, [theme, vision]);

  const value = useMemo(() => ({ theme, vision, setTheme, setVision }), [theme, vision]);
  return <CinemaThemeContext.Provider value={value}>{children}</CinemaThemeContext.Provider>;
}

export function CinemaDisplaySettings() {
  const ctx = useContext(CinemaThemeContext);
  if (!ctx) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Display preferences">
      <label className="sr-only" htmlFor="cinema-theme-select">Appearance</label>
      <select
        id="cinema-theme-select"
        aria-label="Appearance: dark or light"
        value={ctx.theme}
        onChange={(event) => ctx.setTheme(event.target.value as Theme)}
        className="cinema-display-select rounded-lg px-2.5 py-2 text-xs font-semibold"
      >
        <option value="dark">☾ Dark</option>
        <option value="light">☀ Light</option>
      </select>
      <label className="sr-only" htmlFor="cinema-vision-select">Color accessibility</label>
      <select
        id="cinema-vision-select"
        aria-label="Color accessibility"
        value={ctx.vision}
        onChange={(event) => ctx.setVision(event.target.value as Vision)}
        className="cinema-display-select rounded-lg px-2.5 py-2 text-xs font-semibold"
      >
        <option value="standard">Standard colors</option>
        <option value="accessible">◉ Colorblind-friendly</option>
      </select>
    </div>
  );
}
