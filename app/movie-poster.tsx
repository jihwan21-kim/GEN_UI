"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Movie } from "@/lib/movies";

/**
 * A text-only poster may be just ~100px wide on a phone, yet movie titles can
 * be up to 120 characters. Fit the *entire* title into the available area
 * instead of using fixed text-2xl/3xl and clipping the later lines.
 */
export default function MoviePoster({
  movie,
  className = "",
}: {
  movie: Movie;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const posterRef = useRef<HTMLElement>(null);
  const titleSpaceRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
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

  useLayoutEffect(() => {
    if (url && !failed) return;

    const poster = posterRef.current;
    const space = titleSpaceRef.current;
    const title = titleRef.current;
    if (!poster || !space || !title) return;

    let frame: number | null = null;
    function fitTitle() {
      if (!poster || !space || !title) return;
      const availableWidth = space.clientWidth;
      const availableHeight = space.clientHeight;
      if (!availableWidth || !availableHeight) return;

      // Calculate after responsive padding, header and footer have taken up
      // their own space. Allow wrapping inside long, unbroken movie titles.
      let low = 4;
      let high = Math.min(34, poster.clientWidth * 0.2);
      for (let i = 0; i < 12; i += 1) {
        const mid = (low + high) / 2;
        title.style.fontSize = `${mid}px`;
        const fits =
          title.scrollHeight <= availableHeight + 1 &&
          title.scrollWidth <= availableWidth + 1;
        if (fits) low = mid;
        else high = mid;
      }
      // A little breathing room for late-loading fonts and font rounding.
      title.style.fontSize = `${Math.max(4, low - 0.4)}px`;
    }

    const scheduleFit = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitTitle);
    };
    fitTitle();
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(poster);
    observer.observe(space);
    document.fonts?.ready.then(scheduleFit).catch(() => {});
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [movie.title, movie.release_year, movie.genres, url, failed]);

  return (
    <figure
      ref={posterRef}
      style={{ containerType: "inline-size" }}
      className={`relative isolate aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 ${className}`}
    >
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
        <div
          className={`flex h-full min-h-0 w-full flex-col bg-gradient-to-br text-white ${gradient}`}
          style={{ padding: "clamp(6px, 4cqw, 18px)" }}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-1 font-semibold uppercase leading-tight text-white/65"
            style={{ fontSize: "clamp(7px, 2.6cqw, 11px)", letterSpacing: "0.05em" }}
          >
            <span className="min-w-0">OneLine Cinema</span>
            <span aria-hidden="true">✦</span>
          </div>

          <div
            ref={titleSpaceRef}
            className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden py-1 text-center"
          >
            <span
              ref={titleRef}
              title={movie.title}
              className="block w-full shrink-0 font-black leading-[1.08] tracking-tight [overflow-wrap:anywhere]"
              style={{ fontSize: "12px", textWrap: "balance" }}
            >
              {movie.title}
            </span>
          </div>

          <div
            className="flex min-w-0 shrink-0 flex-col items-center gap-0.5 rounded-md bg-black/35 px-1 py-1 text-center leading-tight"
            style={{ fontSize: "clamp(12px, 3.6cqw, 15px)" }}
          >
            <span className="font-bold text-amber-200">{movie.release_year}</span>
            <span className="max-w-full font-semibold text-white [overflow-wrap:anywhere]">
              {movie.genres[0] || "Film"}
            </span>
          </div>
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
