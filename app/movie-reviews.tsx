"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Movie, MovieReview, MovieScore, MovieVote, reviewScore, sortMovieReviews,
} from "@/lib/movies";
import MovieReviewComposer from "./movie-review-composer";
import type { PublicAuthor } from "@/lib/community";

export default function MovieReviews({
  movie,
  reviews,
  scores,
  votes,
  userId,
  loadError,
  variant = "full",
  onOpenDetails,
  authors = {},
}: {
  movie: Movie;
  reviews: MovieReview[];
  scores: MovieScore[];
  votes: MovieVote[];
  userId: string | null;
  loadError: boolean;
  variant?: "preview" | "full";
  onOpenDetails?: () => void;
  authors?: Record<string, PublicAuthor>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [refreshing, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  const ranked = sortMovieReviews(reviews, scores);
  const visible = variant === "preview" ? ranked.slice(0, 1) : showAll ? ranked : ranked.slice(0, 8);
  const myVotes = Object.fromEntries(votes.map((vote) => [vote.review_id, vote.value]));
  const counts = Object.fromEntries(scores.map((score) => [score.review_id, score]));

  async function vote(reviewId: string, value: 1 | -1) {
    if (!userId || pending || refreshing) return;
    setMessage("");
    setPending(reviewId);
    try {
      const db = createClient();
      const previous = myVotes[reviewId];
      const query = previous === value
        ? db.from("movie_review_votes").delete()
          .eq("review_id", reviewId).eq("user_id", userId)
        : previous
          ? db.from("movie_review_votes").update({ value })
            .eq("review_id", reviewId).eq("user_id", userId)
          : db.from("movie_review_votes").insert({
              review_id: reviewId, user_id: userId, value,
            });
      const { error } = await query;
      if (error) {
        setMessage("Your vote wasn't saved. Please try again.");
        return;
      }
      setMessage(previous === value ? "Vote removed." : "Vote saved.");
      startTransition(() => router.refresh());
    } catch {
      setMessage("Couldn't save your vote. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section aria-label={`Community one-line reviews for ${movie.title}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={variant === "preview" ? "cinema-text text-sm font-bold" : "cinema-text text-xl font-bold"}>
            One-line reviews <span className="cinema-muted font-normal">({ranked.length})</span>
          </h2>
          {variant === "full" && <p className="cinema-muted mt-1 text-sm">Ranked by likes minus dislikes.</p>}
        </div>
        {variant === "preview" && <span className="cinema-muted text-xs">Top rated</span>}
      </div>
      {message && <p role="status" aria-live="polite" className="cinema-status mt-2 rounded-lg p-2 text-xs">{message}</p>}

      {loadError ? (
        <p className="cinema-muted-card mt-3 rounded-xl border p-4 text-sm">
          Reviews are unavailable until the movie database migration is applied.
        </p>
      ) : ranked.length === 0 ? (
        <p className="cinema-muted-card mt-3 rounded-xl border border-dashed px-4 py-5 text-sm">
          No reviews yet. Be the first to find the perfect line.
        </p>
      ) : (
        <ul className={variant === "preview" ? "mt-3" : "mt-5 grid gap-3"}>
          {visible.map((review, index) => {
            const score = counts[review.id];
            const selected = myVotes[review.id];
            const net = reviewScore(score);
            return (
              <li
                key={review.id}
                className={variant === "preview"
                  ? "cinema-muted-card rounded-xl border p-3"
                  : "cinema-muted-card rounded-xl border p-4 sm:p-5"}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="cinema-accent-text text-xs font-bold uppercase tracking-wider">
                    {index === 0 && net > 0 ? "✦ Top one-liner" : "AI-assisted review"}
                  </span>
                  <span className="cinema-muted text-xs">{review.tone}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="cinema-muted">By</span>
                  {review.user_id && authors[review.user_id] ? (
                    <Link href={`/u/${authors[review.user_id].handle}`} className="cinema-accent-text font-bold hover:underline">
                      @{authors[review.user_id].handle}
                    </Link>
                  ) : (
                    <span className="cinema-muted font-semibold">Film fan</span>
                  )}
                </div>
                <p className={variant === "preview"
                  ? "cinema-text mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-relaxed"
                  : "cinema-text mt-3 text-base font-medium leading-relaxed"}
                >
                  “{review.one_liner}”
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {([1, -1] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value === 1 ? "Like" : "Dislike"} movie review for ${movie.title}`}
                      aria-pressed={selected === value}
                      title={!userId ? "Sign in to vote" : selected === value ? "Click to undo" : "Vote"}
                      onClick={() => void vote(review.id, value)}
                      disabled={!userId || pending !== null || refreshing}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${selected === value
                        ? "cinema-accent-bg"
                        : "cinema-card hover:opacity-75 disabled:opacity-60"}`}
                    >
                      <span aria-hidden="true">{value === 1 ? "👍" : "👎"}</span>
                      <span>{selected === value ? "✓ " : ""}{value === 1 ? "Like" : "Dislike"}</span>
                      {Number(value === 1 ? score?.upvotes || 0 : score?.downvotes || 0)}
                    </button>
                  ))}
                  {selected && variant === "full" && (
                    <span className="cinema-muted text-xs">Tap again to remove your vote</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {variant === "full" && ranked.length > 8 && !loadError && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
          className="cinema-outline mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold"
        >
          {showAll ? "Show fewer ↑" : `View more reviews (${ranked.length - 8}) ↓`}
        </button>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {variant === "preview" && (onOpenDetails ? (
          <button type="button" onClick={onOpenDetails}
            className="cinema-outline inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-bold">
            View all reviews →
          </button>
        ) : (
          <Link href={`/movies/${movie.id}`}
            className="cinema-outline inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-bold">
            View all reviews →
          </Link>
        ))}
        {!loadError && (userId ? (
          <MovieReviewComposer movie={movie} />
        ) : (
          <Link href="/login" className="cinema-accent-text text-sm font-semibold hover:underline">
            Sign in to write & vote
          </Link>
        ))}
      </div>
    </section>
  );
}
