"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Movie } from "@/lib/movies";
import { parseMovieId, returnMovieStorageKey } from "@/lib/movie-navigation";

type MovieSelection = {
  newlyAddedMovie: Movie | null;
  openMovieId: number | null;
  showMovie: (id: number) => void;
  closeMovie: () => void;
  movieCreated: (movie: Movie) => void;
  movieDeleted: (id: number) => void;
};

const MovieSelectionContext = createContext<MovieSelection | null>(null);

/**
 * Allows the home-page Add Movie form to immediately open the same movie
 * detail overlay used by cards, without navigating or waiting for a
 * Supabase server refresh. Direct-link movie pages can omit the provider.
 */
export function MovieSelectionProvider({ children, initialMovieId = null }: { children: ReactNode; initialMovieId?: number | null }) {
  const [newlyAddedMovie, setNewlyAddedMovie] = useState<Movie | null>(null);
  const [openMovieId, setOpenMovieId] = useState<number | null>(initialMovieId);

  useEffect(() => {
    try {
      const returnedId = parseMovieId(sessionStorage.getItem(returnMovieStorageKey));
      sessionStorage.removeItem(returnMovieStorageKey);
      if (!initialMovieId && returnedId) setOpenMovieId(returnedId);
    } catch {
      // Browsing and direct film links work when storage is unavailable.
    }
  }, [initialMovieId]);

  const showMovie = useCallback((id: number) => setOpenMovieId(id), []);
  const closeMovie = useCallback(() => setOpenMovieId(null), []);
  const movieCreated = useCallback((movie: Movie) => {
    setNewlyAddedMovie(movie);
    setOpenMovieId(movie.id);
  }, []);
  const movieDeleted = useCallback((id: number) => {
    setNewlyAddedMovie((previous) => previous?.id === id ? null : previous);
    setOpenMovieId((previous) => previous === id ? null : previous);
  }, []);

  const value = useMemo(
    () => ({
      newlyAddedMovie,
      openMovieId,
      showMovie,
      closeMovie,
      movieCreated,
      movieDeleted,
    }),
    [newlyAddedMovie, openMovieId, showMovie, closeMovie, movieCreated, movieDeleted],
  );

  return (
    <MovieSelectionContext.Provider value={value}>
      {children}
    </MovieSelectionContext.Provider>
  );
}

export function useMovieSelection() {
  return useContext(MovieSelectionContext);
}

export function useRequiredMovieSelection() {
  const context = useMovieSelection();
  if (!context) throw new Error("MovieDirectory must be inside MovieSelectionProvider");
  return context;
}
