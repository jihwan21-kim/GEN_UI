"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { readSavedMovieIds, savedMoviesStorageKey } from "@/lib/saved-movies";

type SavedMovies = {
  ids: number[];
  ready: boolean;
  persistent: boolean;
  toggle: (id: number) => void;
};

const SavedMoviesContext = createContext<SavedMovies | null>(null);

export function SavedMoviesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    try {
      setIds(readSavedMovieIds(localStorage.getItem(savedMoviesStorageKey)));
    } catch {
      setPersistent(false);
    }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key === savedMoviesStorageKey || event.key === null) {
        setIds(readSavedMovieIds(event.newValue));
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(savedMoviesStorageKey, JSON.stringify(ids));
      setPersistent(true);
    } catch {
      setPersistent(false);
    }
  }, [ids, ready]);

  function toggle(id: number) {
    setIds((previous) => previous.includes(id)
      ? previous.filter((entry) => entry !== id)
      : [...previous, id]);
  }

  return <SavedMoviesContext.Provider value={{ ids, ready, persistent, toggle }}>{children}</SavedMoviesContext.Provider>;
}

export function useSavedMovies() {
  const saved = useContext(SavedMoviesContext);
  if (!saved) throw new Error("Saved movies require SavedMoviesProvider");
  return saved;
}
