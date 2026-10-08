import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Movie, MovieReview, MovieScore, MovieVote } from "@/lib/movies";
import MoviePoster from "@/app/movie-poster";
import MovieReviews from "@/app/movie-reviews";
import MovieForm from "@/app/movie-form";

export const dynamic = "force-dynamic";

export default async function MovieDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [movieResult, reviewsResult, scoresResult, votesResult] = await Promise.all([
    supabase.from("movies")
      .select("id, title, release_year, genres, poster_path, created_by, created_at")
      .eq("id", Number(id))
      .maybeSingle(),
    supabase.from("movie_reviews")
      .select("id, movie_id, one_liner, tone, created_at")
      .eq("movie_id", Number(id))
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.rpc("movie_review_scores"),
    user ? supabase.from("movie_review_votes")
      .select("review_id, value")
      .eq("user_id", user.id)
      : Promise.resolve({ data: [] as MovieVote[], error: null }),
  ]);
  if (!movieResult.data && !movieResult.error) notFound();
  const movie = movieResult.data as Movie | null;
  const loadError = !!(reviewsResult.error || scoresResult.error || votesResult.error);

  return (
    <main className="min-h-screen bg-[#101115] px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-amber-300 hover:underline">
            ← All movies
          </Link>
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-white/10">
              Sign in
            </Link>
          )}
        </nav>
        {movieResult.error || !movie ? (
          <p role="alert" className="rounded-xl border border-red-300/40 bg-red-950/40 p-5 text-red-100">
            Could not load this movie. Please check database setup.
          </p>
        ) : (
          <>
            <div className="grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#25222d] to-[#16171d] p-5 sm:grid-cols-[200px_1fr] sm:p-8">
              <MoviePoster movie={movie} className="mx-auto max-w-[200px] shadow-2xl sm:mx-0" />
              <div className="self-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  Film · {movie.release_year}
                </p>
                <h1 className="mt-3 break-words text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  {movie.title}
                </h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span key={genre} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                      {genre}
                    </span>
                  ))}
                </div>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-300">
                  Put your own experience into words. AI helps turn your thoughts into three punchy,
                  authentic one-liners. You choose what the community sees.
                </p>
                {user && movie.created_by === user.id && (
                  <div className="mt-4">
                    <MovieForm userId={user.id} movie={movie} />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 rounded-3xl bg-white p-5 text-zinc-900 shadow-xl sm:p-8">
              <MovieReviews
                movie={movie}
                reviews={(reviewsResult.data || []) as MovieReview[]}
                scores={(scoresResult.data || []) as MovieScore[]}
                votes={(votesResult.data || []) as MovieVote[]}
                userId={user?.id || null}
                loadError={loadError}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
