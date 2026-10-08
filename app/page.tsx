import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Movie, MovieReview, MovieScore, MovieVote, reviewScore, sortMovieReviews } from "@/lib/movies";
import { buildAuthorMap, PublicAuthor } from "@/lib/community";
import MovieDirectory from "./movie-directory";
import MovieForm from "./movie-form";
import MovieSpotlightLink from "./movie-spotlight-link";
import CinemaNavigation from "./cinema-navigation";
import { MovieSelectionProvider } from "./movie-selection-context";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [moviesResult, reviewsResult, scoresResult, votesResult, authorsResult] = await Promise.all([
    supabase.from("movies")
      .select("id, title, release_year, genres, poster_path, created_by, created_at")
      .order("title", { ascending: true })
      .limit(500),
    supabase.from("movie_reviews")
      .select("id, movie_id, user_id, one_liner, tone, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.rpc("movie_review_scores"),
    user
      ? supabase.from("movie_review_votes")
          .select("review_id, value")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as MovieVote[], error: null }),
    supabase.from("movie_public_profiles")
      .select("user_id, handle, bio, avatar_url")
      .limit(2000),
  ]);
  // Keep the old movie-only experience working until the additive community SQL is applied.
  const oldReviewsResult = reviewsResult.error
    ? await supabase.from("movie_reviews")
        .select("id, movie_id, one_liner, tone, created_at")
        .order("created_at", { ascending: false }).limit(2000)
    : null;
  const movies = (moviesResult.data || []) as Movie[];
  const reviews = (reviewsResult.data || oldReviewsResult?.data || []) as MovieReview[];
  const authors = buildAuthorMap((authorsResult.data || []) as PublicAuthor[]);
  const scores = (scoresResult.data || []) as MovieScore[];
  const votes = (votesResult.data || []) as MovieVote[];
  const loadError = !!((reviewsResult.error && oldReviewsResult?.error) || scoresResult.error || votesResult.error);
  const topThisWeek = sortMovieReviews(
    reviews.filter((review) =>
      new Date(review.created_at).getTime() >= Date.now() - 7 * 86_400_000),
    scores,
  ).find((review) => {
    const score = scores.find((entry) => entry.review_id === review.id);
    return reviewScore(score) > 0;
  });
  const topMovie = movies.find((movie) => movie.id === topThisWeek?.movie_id);

  return (
    <main className="cinema-app cinema-page pb-20">
      <MovieSelectionProvider>
      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8 sm:pt-10">
        <CinemaNavigation signedIn={Boolean(user)} />
        <section className="cinema-hero relative mt-10 overflow-hidden rounded-[2rem] border px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-5 select-none text-[12rem] leading-none text-white/[0.035] sm:text-[18rem]">✦</div>
          <div className="relative max-w-3xl">
            <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.27em]">
              Film reviews, distilled.
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Your thoughts.<br />
              <span className="cinema-accent-text">One unforgettable line.</span>
            </h1>
            <p className="cinema-muted mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
              Write what a movie made you feel. Let AI shape your impression into
              three sharp one-liners. Pick one, publish, and let the audience vote.
            </p>
            <div className="mt-7 flex flex-wrap items-start gap-3">
              <a href="#movie-collection-title" className="cinema-accent-bg inline-flex h-12 w-[180px] items-center justify-center rounded-xl px-5 text-sm font-bold">
                Explore films ↓
              </a>
              {user ? <MovieForm userId={user.id} /> : (
                <Link href="/login" className="cinema-outline inline-flex h-12 w-[180px] items-center justify-center rounded-xl px-5 text-sm font-bold transition-colors">
                  Sign in to write
                </Link>
              )}
            </div>
            <div className="cinema-muted mt-8 flex flex-wrap gap-5 text-sm">
              <span><strong className="cinema-text">{movies.length}</strong> films</span>
              <span><strong className="cinema-text">{reviews.length}</strong> one-liners</span>
              <span>4 writing voices · 3 choices per review</span>
            </div>
          </div>
        </section>

        {topThisWeek && topMovie && (
          <section className="cinema-card mt-8 rounded-2xl border p-5 sm:p-7" aria-labelledby="weekly-title">
            <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.2em]">✦ Community spotlight</p>
            <h2 id="weekly-title" className="mt-2 text-xl font-bold cinema-text">One-liner of the week</h2>
            <blockquote className="cinema-text mt-3 max-w-3xl text-lg font-semibold leading-relaxed sm:text-2xl">
              “{topThisWeek.one_liner}”
            </blockquote>
            <div className="cinema-muted mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span>{topMovie.title} ({topMovie.release_year})</span>
              <span>·</span>
              <span>{topThisWeek.tone}</span>
              {topThisWeek.user_id && authors[topThisWeek.user_id] && (
                <Link href={`/u/${authors[topThisWeek.user_id].handle}`} className="cinema-accent-text font-bold hover:underline">
                  By @{authors[topThisWeek.user_id].handle}
                </Link>
              )}
              <MovieSpotlightLink movieId={topMovie.id} />
            </div>
          </section>
        )}

        {moviesResult.error ? (
          <section role="alert" className="cinema-status mt-10 rounded-2xl border p-6">
            <h2 className="text-xl font-bold">Movie database setup needed</h2>
            <p className="cinema-muted mt-2 text-sm">
              Apply <code className="cinema-accent-text">supabase/movie_oneliners.sql</code> in Supabase SQL Editor.
              The restaurant database and production app are not modified by this movie branch.
            </p>
          </section>
        ) : (
          <MovieDirectory
            movies={movies}
            reviews={reviews}
            authors={authors}
            scores={scores}
            votes={votes}
            userId={user?.id || null}
            loadError={loadError}
          />
        )}
        <footer className="cinema-muted cinema-separator mt-16 border-t pt-8 text-xs leading-relaxed">
          Original thoughts stay private. Published one-liners are AI-assisted and reflect their authors&apos; impressions.
          Community artwork must be used with permission.
        </footer>
      </div>
      </MovieSelectionProvider>
    </main>
  );
}
