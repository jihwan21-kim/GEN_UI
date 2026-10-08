import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Movie, MovieReview, MovieScore, MovieVote, reviewScore, sortMovieReviews } from "@/lib/movies";
import MovieDirectory from "./movie-directory";
import MovieForm from "./movie-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [moviesResult, reviewsResult, scoresResult, votesResult] = await Promise.all([
    supabase.from("movies")
      .select("id, title, release_year, genres, poster_path, created_by, created_at")
      .order("title", { ascending: true })
      .limit(500),
    supabase.from("movie_reviews")
      .select("id, movie_id, one_liner, tone, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.rpc("movie_review_scores"),
    user
      ? supabase.from("movie_review_votes")
          .select("review_id, value")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as MovieVote[], error: null }),
  ]);
  const movies = (moviesResult.data || []) as Movie[];
  const reviews = (reviewsResult.data || []) as MovieReview[];
  const scores = (scoresResult.data || []) as MovieScore[];
  const votes = (votesResult.data || []) as MovieVote[];
  const loadError = !!(reviewsResult.error || scoresResult.error || votesResult.error);
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
    <main className="min-h-screen bg-[#101115] pb-20 text-white">
      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8 sm:pt-10">
        <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-black tracking-tight text-white sm:text-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xl text-zinc-950" aria-hidden="true">✦</span>
            OneLine <span className="text-amber-300">Cinema</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white">
                  Profile
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-xl border border-amber-400 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-400 hover:text-zinc-950">
                Sign in
              </Link>
            )}
          </div>
        </nav>
        <section className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#27232c] via-[#191a23] to-[#101115] px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-5 select-none text-[12rem] leading-none text-white/[0.035] sm:text-[18rem]">✦</div>
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.27em] text-amber-300">
              Film reviews, distilled.
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Your thoughts.<br />
              <span className="text-amber-300">One unforgettable line.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Write what a movie made you feel. Let AI shape your impression into
              three sharp one-liners. Pick one, publish, and let the audience vote.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#movie-collection-title" className="inline-flex min-h-12 min-w-[180px] items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-300">
                Explore films ↓
              </a>
              {user ? <MovieForm userId={user.id} /> : (
                <Link href="/login" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                  Sign in to write
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-zinc-400">
              <span><strong className="text-white">{movies.length}</strong> films</span>
              <span><strong className="text-white">{reviews.length}</strong> one-liners</span>
              <span>4 writing voices · 3 choices per review</span>
            </div>
          </div>
        </section>

        {topThisWeek && topMovie && (
          <section className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 sm:p-7" aria-labelledby="weekly-title">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">✦ Community spotlight</p>
            <h2 id="weekly-title" className="mt-2 text-xl font-bold text-white">One-liner of the week</h2>
            <blockquote className="mt-3 max-w-3xl text-lg font-semibold leading-relaxed text-white sm:text-2xl">
              “{topThisWeek.one_liner}”
            </blockquote>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span>{topMovie.title} ({topMovie.release_year})</span>
              <span>·</span>
              <span>{topThisWeek.tone}</span>
              <Link href={`/movies/${topMovie.id}`} className="font-bold text-amber-300 hover:underline">
                Explore reviews →
              </Link>
            </div>
          </section>
        )}

        {moviesResult.error ? (
          <section role="alert" className="mt-10 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-zinc-100">
            <h2 className="text-xl font-bold">Movie database setup needed</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Apply <code className="text-amber-200">supabase/movie_oneliners.sql</code> in Supabase SQL Editor.
              The restaurant database and production app are not modified by this movie branch.
            </p>
          </section>
        ) : (
          <MovieDirectory
            movies={movies}
            reviews={reviews}
            scores={scores}
            votes={votes}
            userId={user?.id || null}
            loadError={loadError}
          />
        )}
        <footer className="mt-16 border-t border-white/10 pt-8 text-xs leading-relaxed text-zinc-500">
          Original thoughts stay private. Published one-liners are AI-assisted and reflect their authors&apos; impressions.
          Community artwork must be used with permission.
        </footer>
      </div>
    </main>
  );
}
