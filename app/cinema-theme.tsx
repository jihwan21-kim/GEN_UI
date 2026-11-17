"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "system" | "dark" | "light";
type Vision = "standard" | "accessible";
type ThemeContextValue = {
  theme: Theme;
  vision: Vision;
  setTheme: (theme: Theme) => void;
  setVision: (vision: Vision) => void;
};

const CinemaThemeContext = createContext<ThemeContextValue | null>(null);

export function CinemaThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [vision, setVision] = useState<Vision>("standard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("cinema-theme");
      const storedVision = localStorage.getItem("cinema-vision");
      if (storedTheme === "system" || storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
      if (storedVision === "standard" || storedVision === "accessible") setVision(storedVision);
    } catch {
      // Browser storage is optional. The app works without it.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const applyPreferences = () => {
      const resolvedTheme = theme === "system"
        ? systemDark.matches ? "dark" : "light"
        : theme;
      document.documentElement.dataset.cinemaTheme = resolvedTheme;
      document.documentElement.dataset.cinemaVision = vision;
    };
    applyPreferences();
    if (theme !== "system") return;
    systemDark.addEventListener("change", applyPreferences);
    return () => systemDark.removeEventListener("change", applyPreferences);
  }, [theme, vision, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("cinema-theme", theme);
      localStorage.setItem("cinema-vision", vision);
    } catch {
      // Keep in-memory preferences when storage is blocked.
    }
  }, [theme, vision, ready]);

  const value = useMemo(() => ({ theme, vision, setTheme, setVision }), [theme, vision]);
  return <CinemaThemeContext.Provider value={value}>{children}</CinemaThemeContext.Provider>;
}

export function CinemaDisplaySettings({ compact = false }: { compact?: boolean }) {
  const ctx = useContext(CinemaThemeContext);
  if (!ctx) return null;

  if (compact) {
    return (
      <div className="grid gap-4">
        <fieldset>
          <legend className="cinema-muted mb-2 text-xs font-bold uppercase tracking-wider">Appearance</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["system", "dark", "light"] as Theme[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={ctx.theme === value}
                onClick={() => ctx.setTheme(value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${ctx.theme === value ? "cinema-accent-bg" : "cinema-card"}`}
              >
                {value === "system" ? "System" : value === "dark" ? "☾ Dark" : "☀ Light"}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="cinema-muted mb-2 text-xs font-bold uppercase tracking-wider">Colors</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["standard", "accessible"] as Vision[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={ctx.vision === value}
                onClick={() => ctx.setVision(value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${ctx.vision === value ? "cinema-accent-bg" : "cinema-card"}`}
              >
                {value === "standard" ? "Standard" : "Color-friendly"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label="Display preferences">
      <div className="relative">
        <label className="sr-only" htmlFor="cinema-theme-select">Appearance</label>
        <select
          id="cinema-theme-select"
          aria-label="Appearance: system, dark, or light"
          value={ctx.theme}
          onChange={(event) => ctx.setTheme(event.target.value as Theme)}
          className="cinema-display-select min-h-10 appearance-none rounded-lg py-2 pl-3 pr-9 text-xs font-semibold"
        >
          <option value="system">System</option>
          <option value="dark">☾ Dark</option>
          <option value="light">☀ Light</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </div>
      <div className="relative">
        <label className="sr-only" htmlFor="cinema-vision-select">Color accessibility</label>
        <select
          id="cinema-vision-select"
          aria-label="Color accessibility"
          value={ctx.vision}
          onChange={(event) => ctx.setVision(event.target.value as Vision)}
          className="cinema-display-select min-h-10 appearance-none rounded-lg py-2 pl-3 pr-9 text-xs font-semibold"
        >
          <option value="standard">Standard colors</option>
          <option value="accessible">◉ Colorblind-friendly</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </div>
    </div>
  );
}
