"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Movie } from "@/lib/movies";

export default function MoviePoster({
  movie,
  className = "",
}: {
  movie: Movie;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = movie.poster_path
    ? createClient().storage.from("movie-posters").getPublicUrl(movie.poster_path).data.publicUrl
    : null;
  const palette = [
    "from-slate-800 via-indigo-900 to-slate-950",
    "from-amber-900 via-red-950 to-zinc-950",
    "from-teal-900 via-slate-900 to-zinc-950",
    "from-rose-900 via-purple-950 to-slate-950",
  ];
  const gradient = palette[Number(movie.id) % palette.length];

  return (
    <figure className={`relative isolate aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 ${className}`}>
      {url && !failed ? (
        // Community-owned/licensed uploaded posters use dynamic Supabase Storage URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Community artwork for ${movie.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={`flex h-full flex-col justify-between bg-gradient-to-br ${gradient} p-5 text-white`}>
          <div className="flex justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            <span>OneLine Cinema</span>
            <span aria-hidden="true">✦</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="h-14 w-14 text-white/60" stroke="currentColor" strokeWidth="2">
              <rect x="12" y="21" width="40" height="30" rx="4" />
              <path d="M13 21 19 9h34l-7 12M22 9l-6 12M36 9l-6 12M49 9l-6 12" />
              <path d="m28 29 12 7-12 7V29Z" />
            </svg>
            <span className="break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {movie.title}
            </span>
          </div>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-white/60">
            {movie.release_year} · {movie.genres[0] || "Film"}
          </p>
        </div>
      )}
      {url && !failed && (
        <figcaption className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white">
          Community artwork
        </figcaption>
      )}
    </figure>
  );
}
