"use client";

import { useEffect, useRef } from "react";
import type { Movie, MovieReview, MovieScore, MovieVote } from "@/lib/movies";
import MoviePoster from "./movie-poster";
import MovieReviews from "./movie-reviews";
import MovieForm from "./movie-form";

export default function MovieDetailOverlay({
  movie,
  reviews,
  scores,
  votes,
  userId,
  loadError,
  onClose,
}: {
  movie: Movie;
  reviews: MovieReview[];
  scores: MovieScore[];
  votes: MovieVote[];
  userId: string | null;
  loadError: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function keyDown(event: KeyboardEvent) {
      const focusedDialog = (document.activeElement as HTMLElement | null)?.closest('[role="dialog"]');
      // The AI writer is a second, higher-level dialog. It owns Escape and Tab
      // while open, so this underlying film detail does not close or steal focus.
      if (focusedDialog && focusedDialog !== dialogRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
      )).filter((node) => node.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keyDown);
    return () => {
      document.removeEventListener("keydown", keyDown);
      document.body.style.overflow = oldOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-zinc-950/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`film-detail-heading-${movie.id}`}
        aria-describedby={`film-detail-description-${movie.id}`}
        className="relative my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white text-zinc-900 shadow-2xl sm:rounded-3xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close movie details"
          title="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-2xl text-zinc-600 shadow-sm hover:bg-zinc-100 hover:text-zinc-950"
        >
          ×
        </button>

        <div className="grid items-start gap-5 border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-amber-50/30 p-5 sm:grid-cols-[175px_1fr] sm:gap-7 sm:p-8">
          <MoviePoster movie={movie} className="mx-auto max-w-[150px] shadow-lg sm:mx-0 sm:max-w-none" />
          <div className="min-w-0 self-center pr-9 sm:pr-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Film · {movie.release_year}</p>
            <h2 id={`film-detail-heading-${movie.id}`} className="mt-2 break-words text-2xl font-black tracking-tight sm:text-4xl">
              {movie.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-zinc-200/70 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {genre}
                </span>
              ))}
            </div>
            <p id={`film-detail-description-${movie.id}`} className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600">
              Real movie thoughts, distilled into memorable one-liners. Vote for a favorite or write your own.
            </p>
            {userId && movie.created_by === userId && (
              <MovieForm userId={userId} movie={movie} />
            )}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <MovieReviews
            variant="full"
            movie={movie}
            reviews={reviews}
            scores={scores}
            votes={votes}
            userId={userId}
            loadError={loadError}
          />
        </div>

        <div className="border-t border-zinc-100 px-5 py-4 text-right sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
