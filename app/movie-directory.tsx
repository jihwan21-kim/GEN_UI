"use client";

import { useCallback, useMemo, useState } from "react";
import { Movie, MovieReview, MovieScore, MovieVote } from "@/lib/movies";
import MoviePoster from "./movie-poster";
import MovieReviews from "./movie-reviews";
import MovieDetailOverlay from "./movie-detail-overlay";

export default function MovieDirectory({
  movies, reviews, scores, votes, userId, loadError,
}: {
  movies: Movie[];
  reviews: MovieReview[];
  scores: MovieScore[];
  votes: MovieVote[];
  userId: string | null;
  loadError: boolean;
}) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<"title" | "year">("title");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const closeDetails = useCallback(() => setSelectedId(null), []);
  const selectedMovie = movies.find((movie) => movie.id === selectedId);
  const genres = useMemo(
    () => ["All", ...Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort()],
    [movies],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return movies
      .filter((movie) =>
        (genre === "All" || movie.genres.includes(genre)) &&
        (!query || movie.title.toLocaleLowerCase().includes(query) ||
          String(movie.release_year).includes(query) ||
          movie.genres.some((value) => value.toLocaleLowerCase().includes(query)))
      )
      .sort((a, b) => sort === "title"
        ? a.title.localeCompare(b.title)
        : b.release_year - a.release_year || a.title.localeCompare(b.title));
  }, [movies, search, genre, sort]);

  return (
    <section aria-labelledby="movie-collection-title" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">The collection</p>
          <h2 id="movie-collection-title" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Find your next film
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Browse by genre, read a great line, or add your take.
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300">
          {filtered.length} {filtered.length === 1 ? "film" : "films"}
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="search-movies" className="relative flex-1">
          <span className="sr-only">Search movie titles, release years or genres</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400">
            <circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" />
          </svg>
          <input id="search-movies" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, genre, or year…"
            className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-amber-400" />
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-zinc-300">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as "title" | "year")}
            className="flex-1 bg-transparent font-semibold text-white [&>option]:text-zinc-900">
            <option value="title">Title A–Z</option>
            <option value="year">Newest first</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by movie genre">
        {genres.map((value) => (
          <button key={value} type="button" aria-pressed={genre === value} onClick={() => setGenre(value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${genre === value
              ? "border-amber-400 bg-amber-400 text-zinc-950"
              : "border-white/15 bg-white/5 text-zinc-300 hover:border-amber-400 hover:text-white"}`}
          >{value}</button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 grid items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((movie) => (
            <li id={`movie-${movie.id}`} key={movie.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-black/10">
              <div className="flex gap-4">
                <button type="button" onClick={() => setSelectedId(movie.id)} aria-label={`View details for ${movie.title}`}
                  className="w-[38%] shrink-0 self-start rounded-xl text-left focus-visible:outline-amber-500">
                  <MoviePoster movie={movie} className="shadow-md" />
                </button>
                <div className="min-w-0 flex-1 py-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    {movie.release_year}
                  </p>
                  <button type="button" onClick={() => setSelectedId(movie.id)}
                    className="mt-2 block break-words text-left text-lg font-bold leading-tight tracking-tight text-zinc-900 hover:text-amber-700 hover:underline sm:text-xl">
                    {movie.title}
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {movie.genres.map((value) => (
                      <span key={value} className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600">
                        {value}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                    Real thoughts, distilled into memorable lines.
                  </p>
                </div>
              </div>
              <div className="mt-auto border-t border-zinc-100 pt-4">
                <MovieReviews
                  variant="preview"
                  onOpenDetails={() => setSelectedId(movie.id)}
                  movie={movie}
                  reviews={reviews.filter((review) => Number(review.movie_id) === Number(movie.id))}
                  scores={scores}
                  votes={votes}
                  userId={userId}
                  loadError={loadError}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="text-lg font-bold text-white">{movies.length ? "No matching films" : "Your cinema is waiting"}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {movies.length ? "Try another title or genre." : "Add the first movie to start collecting one-liners."}
          </p>
          {movies.length > 0 && (
            <button type="button" onClick={() => { setSearch(""); setGenre("All"); }}
              className="mt-4 rounded-xl border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-white/10">
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
          scores={scores}
          votes={votes}
          userId={userId}
          loadError={loadError}
          onClose={closeDetails}
        />
      )}
    </section>
  );
}
