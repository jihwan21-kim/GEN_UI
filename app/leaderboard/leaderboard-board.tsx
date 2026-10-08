"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthorStats, rankAuthors, rankingModes, RankingSort, readableCount } from "@/lib/community";

export default function LeaderboardBoard({ authors }: { authors: AuthorStats[] }) {
  const [mode, setMode] = useState<RankingSort>("top_reviews");
  const ranked = useMemo(() => rankAuthors(authors, mode), [authors, mode]);
  const active = rankingModes.find((entry) => entry.value === mode)!;

  return (
    <section aria-label="Community leaderboard" className="mt-7">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Ranking categories">
        {rankingModes.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={mode === option.value}
            onClick={() => setMode(option.value)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${mode === option.value
              ? "cinema-accent-bg"
              : "cinema-outline"}`}
          >
            {option.title}
          </button>
        ))}
      </div>
      <p className="cinema-muted mt-3 text-sm">{active.description}. Every published author is ranked, even before choosing a public username. Ties are broken by net votes.</p>
      {ranked.length ? (
        <ol className="mt-6 grid gap-3">
          {ranked.map((author, index) => (
            <li key={author.user_id} className="cinema-card flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5">
              <div className="cinema-accent-text w-9 shrink-0 text-center text-xl font-black" aria-label={`Rank ${index + 1}`}>
                {index + 1}
              </div>
              {author.avatar_url ? (
                // User-supplied profile images use dynamic Supabase storage URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={author.avatar_url} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="cinema-tag flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                  {author.handle?.[0]?.toUpperCase() || "F"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {author.handle ? (
                  <Link href={`/u/${author.handle}`} className="cinema-accent-text break-all text-base font-bold hover:underline">
                    @{author.handle}
                  </Link>
                ) : (
                  <span className="cinema-text text-base font-bold">Film fan</span>
                )}
                <p className="cinema-muted mt-1 line-clamp-2 text-xs">
                  {author.bio || (author.handle ? "Movie one-liner creator" : "Public username not set yet")}
                </p>
              </div>
              <div className="ml-auto min-w-[105px] text-right">
                <p className="cinema-text text-2xl font-black">{readableCount(author[mode])}</p>
                <p className="cinema-muted text-xs">{mode === "top_reviews" ? "movie #1s" : mode === "likes_received" ? "likes" : "published lines"}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="cinema-card mt-6 rounded-2xl border p-9 text-center">
          <p className="text-lg font-bold">Your film community starts here.</p>
          <p className="cinema-muted mt-2 text-sm">Publish a movie one-liner to enter the rankings. Add a public username to show your creator identity.</p>
          <Link href="/profile" className="cinema-accent-text mt-4 inline-block text-sm font-bold hover:underline">Create a profile →</Link>
        </div>
      )}
    </section>
  );
}
