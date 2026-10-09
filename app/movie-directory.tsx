"use client";

import { useMemo, useState } from "react";
import { Movie, MovieReview, MovieScore, MovieVote } from "@/lib/movies";
import type { PublicAuthor } from "@/lib/community";
import MoviePoster from "./movie-poster";
import MovieReviews from "./movie-reviews";
import MovieDetailOverlay from "./movie-detail-overlay";
import { useRequiredMovieSelection } from "./movie-selection-context";

export default function MovieDirectory({
  movies, reviews, scores, votes, userId, loadError, authors,
}: {
  movies: Movie[];
  reviews: MovieReview[];
  scores: MovieScore[];
  votes: MovieVote[];
  authors: Record<string, PublicAuthor>;
  userId: string | null;
  loadError: boolean;
}) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<"title" | "year">("title");
  const { newlyAddedMovie, openMovieId, showMovie, closeMovie } = useRequiredMovieSelection();
  // Keep the new movie available instantly before router.refresh returns.
  const allMovies = useMemo(
    () => newlyAddedMovie && !movies.some((movie) => movie.id === newlyAddedMovie.id)
      ? [newlyAddedMovie, ...movies]
      : movies,
    [movies, newlyAddedMovie],
  );
  const selectedMovie = allMovies.find((movie) => movie.id === openMovieId);
  const genres = useMemo(
    () => ["All", ...Array.from(new Set(allMovies.flatMap((movie) => movie.genres))).sort()],
    [allMovies],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return allMovies
      .filter((movie) =>
        (genre === "All" || movie.genres.includes(genre)) &&
        (!query || movie.title.toLocaleLowerCase().includes(query) ||
          String(movie.release_year).includes(query) ||
          movie.genres.some((value) => value.toLocaleLowerCase().includes(query)))
      )
      .sort((a, b) => sort === "title"
        ? a.title.localeCompare(b.title)
        : b.release_year - a.release_year || a.title.localeCompare(b.title));
  }, [allMovies, search, genre, sort]);

  return (
    <section aria-labelledby="movie-collection-title" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.22em]">The collection</p>
          <h2 id="movie-collection-title" className="cinema-text mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Find your next film
          </h2>
          <p className="cinema-muted mt-2 text-sm">
            Browse by genre, read a great line, or add your take.
          </p>
        </div>
        <span className="cinema-card rounded-full border px-4 py-2 text-sm">
          {filtered.length} {filtered.length === 1 ? "film" : "films"}
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="search-movies" className="relative flex-1">
          <span className="sr-only">Search movie titles, release years or genres</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"
            className="cinema-muted pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2">
            <circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" />
          </svg>
          <input id="search-movies" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, genre, or year…"
            className="cinema-input w-full rounded-xl py-3 pl-12 pr-4 text-sm" />
        </label>
        <label className="cinema-input flex items-center gap-3 rounded-xl px-4 py-2 text-sm">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as "title" | "year")}
            className="cinema-text flex-1 bg-transparent font-semibold [&>option]:bg-[var(--cinema-card)] [&>option]:text-[var(--cinema-text)]">
            <option value="title">Title A–Z</option>
            <option value="year">Newest first</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by movie genre">
        {genres.map((value) => (
          <button key={value} type="button" aria-pressed={genre === value} onClick={() => setGenre(value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${genre === value
              ? "cinema-accent-bg"
              : "cinema-card hover:opacity-75"}`}
          >{value}</button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {filtered.map((movie) => (
            <li id={`movie-${movie.id}`} key={movie.id}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (!target.closest("button, a, input, textarea, select, label")) {
                  showMovie(movie.id);
                }
              }}
              className="cinema-card flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border p-4 xl:p-5 shadow-xl shadow-black/10 transition-shadow hover:shadow-2xl hover:shadow-black/25">
              <div className="flex gap-3 xl:gap-4">
                <button type="button" onClick={() => showMovie(movie.id)} aria-label={`View details for ${movie.title}`}
                  className="w-[38%] max-w-[180px] shrink-0 self-start rounded-xl text-left focus-visible:outline-amber-500">
                  <MoviePoster movie={movie} className="shadow-md" />
                </button>
                <div className="min-w-0 flex-1 py-1">
                  <p className="cinema-accent-text text-xs font-bold uppercase tracking-wider">
                    {movie.release_year}
                  </p>
                  <button type="button" onClick={() => showMovie(movie.id)}
                    className="cinema-text mt-2 block break-words text-left text-lg font-bold leading-tight tracking-tight hover:underline sm:text-xl">
                    {movie.title}
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {movie.genres.map((value) => (
                      <span key={value} className="cinema-tag rounded-full px-2 py-1 text-xs font-semibold">
                        {value}
                      </span>
                    ))}
                  </div>
                  <p className="cinema-muted mt-4 text-xs leading-relaxed">
                    Real thoughts, distilled into memorable lines.
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-5 sm:pt-6">
                <div className="cinema-separator border-t pt-4">
                <MovieReviews
                  variant="preview"
                  authors={authors}
                  onOpenDetails={() => showMovie(movie.id)}
                  movie={movie}
                  reviews={reviews.filter((review) => Number(review.movie_id) === Number(movie.id))}
                  scores={scores}
                  votes={votes}
                  userId={userId}
                  loadError={loadError}
                />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cinema-muted-card mt-6 rounded-2xl border border-dashed p-12 text-center">
          <p className="cinema-text text-lg font-bold">{allMovies.length ? "No matching films" : "Your cinema is waiting"}</p>
          <p className="cinema-muted mt-2 text-sm">
            {allMovies.length ? "Try another title or genre." : "Add the first movie to start collecting one-liners."}
          </p>
          {allMovies.length > 0 && (
            <button type="button" onClick={() => { setSearch(""); setGenre("All"); }}
              className="cinema-outline mt-4 rounded-xl px-4 py-2 text-sm font-semibold">
              Clear filters
            </button>
          )}
        </div>
      )}
      {selectedMovie && (
        <MovieDetailOverlay
          key={selectedMovie.id}
          movie={selectedMovie}
          reviews={reviews.filter((review) => Number(review.movie_id) === Number(selectedMovie.id))}
          authors={authors}
          scores={scores}
          votes={votes}
          userId={userId}
          loadError={loadError}
          onClose={closeMovie}
          isNewlyAdded={newlyAddedMovie?.id === selectedMovie.id}
        />
      )}
    </section>
  );
}
