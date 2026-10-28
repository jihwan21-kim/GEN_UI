"use client";

import type { Movie } from "@/lib/movies";
import { useSavedMovies } from "./saved-movies-context";

export default function SaveMovieButton({ movie }: { movie: Movie }) {
  const saved = useSavedMovies();
  const active = saved.ids.includes(movie.id);
  return (
    <button type="button" disabled={!saved.ready}
      aria-label={`${active ? "Remove" : "Save"} ${movie.title} ${active ? "from saved films" : "for later"}`}
      aria-pressed={active} onClick={() => saved.toggle(movie.id)}
      title={saved.persistent ? "Saved films stay in this browser" : "Browser storage is unavailable; saved films last for this visit"}
      className={`${active ? "cinema-accent-bg" : "cinema-outline"} mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-60`}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M6 4h12v17l-6-4-6 4V4Z" />
      </svg>
      {active ? "Saved ✓" : "Save film"}
    </button>
  );
}
