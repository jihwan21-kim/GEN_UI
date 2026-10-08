"use client";

import { useRequiredMovieSelection } from "./movie-selection-context";

export default function MovieSpotlightLink({ movieId }: { movieId: number }) {
  const { showMovie } = useRequiredMovieSelection();

  return (
    <button
      type="button"
      onClick={() => showMovie(movieId)}
      aria-label="Explore reviews for the spotlight movie"
      className="font-bold text-amber-300 hover:text-amber-200 hover:underline"
    >
      Explore reviews →
    </button>
  );
}
