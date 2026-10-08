import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadCommunityRankings } from "@/lib/community-server";
import CinemaNavigation from "../cinema-navigation";
import LeaderboardBoard from "./leaderboard-board";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { authors, error }] = await Promise.all([
    supabase.auth.getUser(),
    loadCommunityRankings(supabase),
  ]);

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
            Could not load community rankings. Please verify the movie community migration and database permissions.
            <span className="mt-2 block text-xs">{error}</span>
          </div>
        ) : (
          <LeaderboardBoard authors={authors} viewerId={user?.id ?? null} />
        )}
        <Link href="/" className="cinema-accent-text mt-9 inline-block text-sm font-bold hover:underline">← Back to movies</Link>
      </div>
    </main>
  );
}
