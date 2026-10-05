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
    <main id="main-content" className="page-shell">
      <div className="mx-auto max-w-5xl">
        <header className="feed-hero">
          <p className="eyebrow">Campus life, city-sized punchlines</p>
          <h1 className="hero-title">
            New to New York.
            <br />
            Already have opinions.
          </h1>
          <p className="hero-description">
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
      </div>
    </main>
  );
}
