import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Movie, MovieReview, MovieScore, MovieVote, reviewScore, reviewToneLabels, sortMovieReviews } from "@/lib/movies";
import { buildAuthorMap, PublicAuthor } from "@/lib/community";
import MovieDirectory from "./movie-directory";
import MovieForm from "./movie-form";
import MovieSpotlightLink from "./movie-spotlight-link";
import CinemaNavigation from "./cinema-navigation";
import { MovieSelectionProvider } from "./movie-selection-context";
import { parseMovieId } from "@/lib/movie-navigation";
import { signInDestination } from "@/lib/profile-onboarding";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ film?: string | string[] }> }) {
  const initialMovieId = parseMovieId((await searchParams).film);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const destination = await signInDestination(supabase, user.id, initialMovieId);
    if (destination.startsWith("/profile")) redirect(destination);
  }
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
      <MovieSelectionProvider initialMovieId={initialMovieId}>
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-8 sm:pt-10">
        <CinemaNavigation signedIn={Boolean(user)} />
        <section className="cinema-hero relative mt-5 overflow-hidden rounded-2xl border px-5 py-6 sm:mt-7 sm:px-8 sm:py-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-5 select-none text-[12rem] leading-none text-white/[0.035] sm:text-[18rem]">✦</div>
          <div className="relative max-w-3xl">
            <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.27em]">
              A little insight. A better movie night.
            </p>
            <h1 className="mt-3 text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl">
              What should you watch?<br />
              <span className="cinema-accent-text">Find out in one line.</span>
            </h1>
            <p className="cinema-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Find a film that fits your mood with short, AI-assisted viewer reviews.
              Save your next pick, or share an insight that helps someone else choose.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-start">
              <a href="#movie-collection-title" className="cinema-accent-bg inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold sm:w-[180px] sm:px-5">
                Explore films ↓
              </a>
              {user ? <MovieForm userId={user.id} /> : (
                <Link href="/login" className="cinema-outline inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors sm:w-[180px] sm:px-5">
                  Sign in to write
                </Link>
              )}
            </div>
            <div className="cinema-muted mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <span><strong className="cinema-text">{movies.length}</strong> films</span>
              <span><strong className="cinema-text">{reviews.length}</strong> viewer reviews</span>
              <span>New AI drafts use spoiler-free guidance</span>
            </div>
          </div>
        </section>

        {topThisWeek && topMovie && (
          <section className="cinema-card mt-5 rounded-2xl border p-4 sm:p-5" aria-labelledby="weekly-title">
            <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.2em]">✦ Community spotlight</p>
            <h2 id="weekly-title" className="mt-1 text-base font-bold cinema-text">Helpful review of the week</h2>
            <blockquote className="cinema-text mt-2 max-w-3xl text-base font-semibold leading-relaxed sm:text-lg">
              “{topThisWeek.one_liner}”
            </blockquote>
            <div className="cinema-muted mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span>{topMovie.title} ({topMovie.release_year})</span>
              <span>·</span>
              <span>{reviewToneLabels[topThisWeek.tone]}</span>
              {topThisWeek.user_id && authors[topThisWeek.user_id] && (
                <Link href={`/u/${authors[topThisWeek.user_id].handle}`} className="cinema-accent-text font-bold hover:underline">
                  By @{authors[topThisWeek.user_id].handle}
                </Link>
              )}
              <MovieSpotlightLink movieId={topMovie.id} />
            </div>
          </section>
        )}

        {!moviesResult.error && authorsResult.error && (
          <section role="status" className="cinema-status mt-8 rounded-xl p-4 text-sm">
            Creator profiles and rankings need one more setup step. Run
            <code className="mx-1 font-semibold">supabase/movie_community.sql</code>
            in Supabase SQL Editor to enable public @usernames and leaderboard scores.
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
          Original thoughts stay private. AI-assisted reviews reflect viewers&apos; experiences; helpfulness votes rate the review, not the film.
          Community artwork must be used with permission.
        </footer>
      </div>
      </MovieSelectionProvider>
    </main>
  );
}
