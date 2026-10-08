import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rankAuthors, readableCount } from "@/lib/community";
import { loadCommunityRankings } from "@/lib/community-server";
import CinemaNavigation from "../cinema-navigation";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, publicProfileResult, rankingResult] = await Promise.all([
    supabase.from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("movie_public_profiles")
      .select("user_id, handle, bio, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadCommunityRankings(supabase),
  ]);

  const profile = profileResult.data;
  const publicProfile = publicProfileResult.data;
  const rankings = rankingResult.authors;
  const stats = rankings.find((entry) => entry.user_id === user.id);
  const position = stats && Number(stats.published_count) > 0
    ? rankAuthors(rankings.filter((entry) => Number(entry.published_count) > 0), "top_reviews")
        .findIndex((entry) => entry.user_id === user.id) + 1
    : null;
  const needsProfile = !profile?.first_name?.trim() || !profile?.last_name?.trim();
  const communityNotReady = Boolean(publicProfileResult.error || rankingResult.error);

  return (
    <main className="cinema-app cinema-page px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <CinemaNavigation signedIn />
        <section className="mx-auto mt-10 max-w-3xl sm:mt-14">
          <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.22em]">
            OneLine Cinema / Account
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Your <span className="cinema-accent-text">profile</span>
          </h1>
          <p className="cinema-muted mt-3 text-sm leading-relaxed">
            Create your public @username, share a little about yourself, and track your movie-review achievements.
          </p>

          {communityNotReady && (
            <p role="alert" className="cinema-status mt-6 rounded-xl p-4 text-sm">
              Community database could not load. Check the movie community migration or permissions.
              {rankingResult.error && <span className="mt-2 block text-xs">{rankingResult.error}</span>}
              {publicProfileResult.error && <span className="mt-2 block text-xs">{publicProfileResult.error.message}</span>}
            </p>
          )}
          {needsProfile && (
            <p className="cinema-status mt-6 rounded-xl p-4 text-sm">
              Welcome! Add your name and pick your creator username below.
            </p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {[
              { value: stats?.published_count, label: "Published AI lines", icon: "✦" },
              { value: stats?.likes_received, label: "Likes received", icon: "👍" },
              { value: stats?.top_reviews, label: "#1 movie reviews", icon: "🏆" },
              { value: position, label: "Leaderboard position", icon: "★", rank: true },
            ].map((item) => (
              <div key={item.label} className="cinema-card rounded-2xl border p-4">
                <span aria-hidden="true" className="cinema-accent-text text-lg">{item.icon}</span>
                <p className="mt-2 text-2xl font-black">{item.rank && item.value ? "#" : ""}
                  {item.value == null ? (item.rank ? "Unranked" : "0") : readableCount(item.value)}
                </p>
                <p className="cinema-muted mt-1 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="cinema-muted mt-2 text-xs">
            Counts include published reviews only, even if you have not created a public username. A #1 review has the highest positive net vote score for its movie; ties count.
          </p>

          <div className="cinema-card mt-8 rounded-3xl border p-5 shadow-xl sm:p-8">
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialFirstName={profile?.first_name ?? ""}
              initialLastName={profile?.last_name ?? ""}
              initialAvatarUrl={profile?.avatar_url ?? ""}
              initialHandle={publicProfile?.handle ?? ""}
              initialBio={publicProfile?.bio ?? ""}
            />
          </div>
          <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/leaderboard" className="cinema-accent-text hover:underline">See community rankings →</Link>
            <Link href="/" className="cinema-muted hover:underline">← Back to movie collection</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
