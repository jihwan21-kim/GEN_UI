import { createClient } from "@/lib/supabase/server";
import type { AuthorStats, PublicAuthor } from "@/lib/community";

/**
 * Rank every author of a published movie one-liner, even if their username
 * has not been set up yet. The previous movie_author_stats RPC started from
 * movie_public_profiles, accidentally dropping all unregistered authors.
 *
 * Uses ONLY publicly readable published-review IDs, author IDs, and
 * aggregate counts from movie_review_scores. Never loads drafts or voters.
 */
export async function loadCommunityRankings(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ authors: AuthorStats[]; error: string | null }> {
  const [reviewsResult, scoresResult, profilesResult] = await Promise.all([
    supabase.from("movie_reviews")
      .select("id, user_id, movie_id")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.rpc("movie_review_scores"),
    supabase.from("movie_public_profiles")
      .select("user_id, handle, bio, avatar_url")
      .limit(5000),
  ]);

  if (reviewsResult.error || scoresResult.error || profilesResult.error) {
    const message = reviewsResult.error?.message
      || scoresResult.error?.message
      || profilesResult.error?.message
      || "Unknown community database error";
    return { authors: [], error: message };
  }

  const reviews = reviewsResult.data || [];
  const scores = scoresResult.data || [];
  const profiles = (profilesResult.data || []) as PublicAuthor[];
  // Populate the map explicitly to keep TypeScript's key/value types stable.
  const scoreById = new Map<string, { likes: number; dislikes: number }>();
  for (const score of scores) {
    scoreById.set(String(score.review_id), {
      likes: Number(score.upvotes || 0),
      dislikes: Number(score.downvotes || 0),
    });
  }
  const highestByMovie = new Map<number, number>();

  for (const review of reviews) {
    const entry = scoreById.get(review.id);
    const net = (entry?.likes || 0) - (entry?.dislikes || 0);
    highestByMovie.set(review.movie_id, Math.max(highestByMovie.get(review.movie_id) ?? -Infinity, net));
  }

  const authorsById = new Map<string, AuthorStats>();
  for (const review of reviews) {
    const userId = review.user_id;
    if (!userId) continue;
    let author = authorsById.get(userId);
    if (!author) {
      author = {
        user_id: userId,
        handle: null,
        bio: null,
        avatar_url: null,
        published_count: 0,
        likes_received: 0,
        net_votes: 0,
        top_reviews: 0,
      };
      authorsById.set(userId, author);
    }
    const score = scoreById.get(review.id);
    const likes = score?.likes || 0;
    const net = likes - (score?.dislikes || 0);
    author.published_count += 1;
    author.likes_received += likes;
    author.net_votes += net;
    if (net > 0 && net === highestByMovie.get(review.movie_id)) author.top_reviews += 1;
  }

  for (const profile of profiles) {
    const author = authorsById.get(profile.user_id);
    if (!author) continue;
    author.handle = profile.handle;
    author.bio = profile.bio;
    author.avatar_url = profile.avatar_url;
  }

  return { authors: Array.from(authorsById.values()), error: null };
}
