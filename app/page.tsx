import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Caption, Score, dailyTopic } from "@/lib/captions";
import CaptionFeed from "./caption-feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [feed, score, votes] = await Promise.all([
    supabase
      .from("generations")
      .select("id, topic, tone, caption, prompt, model, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("caption_scores"),
    user
      ? supabase
          .from("votes")
          .select("generation_id, value")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);
  return (
    <main className="min-h-screen bg-[#f5f5ef] px-5 py-8 text-zinc-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6"
        >
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            SIDE OF NYC<span className="text-emerald-700">.</span>
          </Link>
          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            <Link href="/restaurants">Restaurant list</Link>
            {user ? (
              <>
                <Link href="/profile">Profile</Link>
                <Link href="/private">Member area</Link>
                <form action="/auth/signout" method="post">
                  <button>Sign out</button>
                </form>
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </div>
        </nav>
        <header className="mt-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Campus life, city-sized punchlines
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            New to New York.
            <br />
            Already have opinions.
          </h1>
          <p className="mt-5 text-lg text-zinc-600">
            Turn food runs, dorm life, and weekend detours into AI captions.
            Vote for the ones that get you.
          </p>
        </header>
        <CaptionFeed
          captions={(feed.data || []) as Caption[]}
          scores={(score.data || []) as Score[]}
          votes={votes.data || []}
          userId={user?.id || null}
          today={dailyTopic()}
          loadError={!!(feed.error || score.error || votes.error)}
        />
        <footer className="mt-12 border-t border-zinc-200 py-6 text-xs text-zinc-500">
          Made for campus conversations. AI captions are entertainment, not
          verified city advice. Showing the latest 100 captions.
        </footer>
      </div>
    </main>
  );
}
