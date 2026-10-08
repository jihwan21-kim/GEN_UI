import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readableCount } from "@/lib/community";
import { loadCommunityRankings } from "@/lib/community-server";
import type { Movie, MovieReview, MovieScore } from "@/lib/movies";
import { reviewScore } from "@/lib/movies";
import CinemaNavigation from "../../cinema-navigation";

export const dynamic = "force-dynamic";

export default async function PublicCreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(handle)) notFound();

  const supabase = await createClient();
  const [
    { data: { user } },
    { data: author, error: profileError },
    { authors: allStats },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("movie_public_profiles")
      .select("user_id, handle, bio, avatar_url")
      .eq("handle", handle).maybeSingle(),
    loadCommunityRankings(supabase),
  ]);
  if (profileError || !author) notFound();

  const [reviewsResult, scoresResult] = await Promise.all([
    supabase.from("movie_reviews")
      .select("id, user_id, movie_id, one_liner, tone, created_at")
      .eq("user_id", author.user_id)
      .order("created_at", { ascending: false }).limit(500),
    supabase.rpc("movie_review_scores"),
  ]);
  const reviews = (reviewsResult.data || []) as MovieReview[];
  const scores = (scoresResult.data || []) as MovieScore[];
  const movieIds = Array.from(new Set(reviews.map((review) => review.movie_id)));
  const movieResult = movieIds.length
    ? await supabase.from("movies").select("id, title, release_year").in("id", movieIds)
    : { data: [] };
  const films = new Map((movieResult.data || []).map((movie) => [movie.id, movie as Pick<Movie, "id" | "title" | "release_year">]));
  const byReview = new Map(scores.map((entry) => [entry.review_id, entry]));
  const stats = allStats.find((entry) => entry.user_id === author.user_id);

  return (
    <main className="cinema-app cinema-page px-5 py-8 pb-20 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <CinemaNavigation signedIn={Boolean(user)} />
        <div className="mt-10">
          <Link href="/leaderboard" className="cinema-accent-text text-sm font-bold hover:underline">← Creator rankings</Link>
        </div>
        <section className="cinema-card mt-6 rounded-3xl border p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            {author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={author.avatar_url} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="cinema-tag flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold">
                {author.handle.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="cinema-accent-text text-xs font-bold uppercase tracking-wider">OneLine Cinema creator</p>
              <h1 className="mt-2 break-all text-3xl font-black sm:text-4xl">@{author.handle}</h1>
              <p className="cinema-muted mt-3 whitespace-pre-line text-sm leading-relaxed">
                {author.bio || "This film lover hasn't added a bio yet."}
              </p>
              {user?.id === author.user_id && (
                <Link href="/profile" className="cinema-accent-text mt-3 inline-block text-sm font-bold hover:underline">Edit my profile →</Link>
              )}
            </div>
          </div>
          <div className="cinema-separator mt-7 grid gap-3 border-t pt-5 sm:grid-cols-3">
            {[
              { label: "Published AI lines", value: stats?.published_count ?? 0, icon: "✦" },
              { label: "Likes received", value: stats?.likes_received ?? 0, icon: "👍" },
              { label: "#1 movie reviews", value: stats?.top_reviews ?? 0, icon: "🏆" },
            ].map((item) => (
              <div key={item.label} className="cinema-muted-card rounded-xl border p-4">
                <span aria-hidden="true">{item.icon}</span>
                <p className="cinema-text mt-2 text-2xl font-black">{readableCount(item.value)}</p>
                <p className="cinema-muted mt-1 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="cinema-muted mt-3 text-xs">#1 means the highest positive net votes for a film; tied leaders count.</p>
        </section>
        <section aria-label="Published movie reviews" className="mt-9">
          <h2 className="text-2xl font-black">Published one-liners <span className="cinema-muted">({reviews.length})</span></h2>
          <p className="cinema-muted mt-2 text-sm">Only published one-liners are visible. Original impressions and other AI choices remain private.</p>
          {reviewsResult.error ? (
            <p role="alert" className="cinema-status mt-5 rounded-xl p-4">Could not load this creator's published reviews. Check the community database migration.</p>
          ) : reviews.length ? (
            <ul className="mt-5 grid gap-3">
              {reviews.map((review) => {
                const movie = films.get(review.movie_id);
                const score = byReview.get(review.id);
                return (
                  <li key={review.id} className="cinema-card rounded-2xl border p-5">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <Link href={`/movies/${review.movie_id}`} className="cinema-accent-text font-bold hover:underline">
                        {movie ? `${movie.title} (${movie.release_year})` : "View film"}
                      </Link>
                      <span className="cinema-muted text-xs">{review.tone}</span>
                    </div>
                    <blockquote className="cinema-text mt-3 text-base font-semibold leading-relaxed">“{review.one_liner}”</blockquote>
                    <p className="cinema-muted mt-3 text-xs">
                      👍 {Number(score?.upvotes || 0)} · 👎 {Number(score?.downvotes || 0)} · Net {reviewScore(score)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="cinema-muted-card mt-5 rounded-2xl border p-6 text-sm">No published one-liners yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
