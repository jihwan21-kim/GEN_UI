import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthorStats } from "@/lib/community";
import CinemaNavigation from "../cinema-navigation";
import LeaderboardBoard from "./leaderboard-board";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("movie_author_stats"),
  ]);
  const authors = (data || []) as AuthorStats[];

  return (
    <main className="cinema-app cinema-page px-5 py-8 pb-20 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <CinemaNavigation signedIn={Boolean(user)} />
        <header className="mt-12">
          <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.22em]">The community</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Creator <span className="cinema-accent-text">rankings</span></h1>
          <p className="cinema-muted mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            Meet the people behind your favorite one-liners. Vote for the best reviews,
            discover new creators and climb the movie leaderboard.
          </p>
        </header>
        {error ? (
          <div role="alert" className="cinema-status mt-8 rounded-xl p-5">
            To enable the rankings, run <code>supabase/movie_community.sql</code> in your Supabase SQL Editor first.
          </div>
        ) : (
          <LeaderboardBoard authors={authors} />
        )}
        <Link href="/" className="cinema-accent-text mt-9 inline-block text-sm font-bold hover:underline">← Back to movies</Link>
      </div>
    </main>
  );
}
