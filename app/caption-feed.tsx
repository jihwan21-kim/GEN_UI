"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Caption, Score, tones } from "@/lib/captions";

export default function CaptionFeed({
  captions,
  scores,
  votes,
  userId,
  today,
  loadError,
}: {
  captions: Caption[];
  scores: Score[];
  votes: { generation_id: string; value: number }[];
  userId: string | null;
  today: string;
  loadError: boolean;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(today);
  const [tone, setTone] = useState<string>(tones[0]);
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sort, setSort] = useState("new");
  const [filter, setFilter] = useState("all");
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});
  const mine = Object.fromEntries(votes.map((v) => [v.generation_id, v.value]));
  const counts = Object.fromEntries(scores.map((s) => [s.generation_id, s]));
  const shown = captions
    .filter((c) => filter !== "today" || c.topic === today)
    .sort((a, b) =>
      sort === "top"
        ? (counts[b.id]?.upvotes || 0) -
          (counts[b.id]?.downvotes || 0) -
          ((counts[a.id]?.upvotes || 0) - (counts[a.id]?.downvotes || 0))
        : b.created_at.localeCompare(a.created_at),
    );

  async function generate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Could not generate. Try again.");
        return;
      }
      setMessage("Your caption is live! See it in Newest.");
      setSort("new");
      setFilter("all");
      router.refresh();
    } catch {
      setMessage("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: string, value: number) {
    if (!userId || voting || mine[id] || localVotes[id]) return;
    setVoting(id);
    setMessage("");
    try {
      const { error } = await createClient()
        .from("votes")
        .insert({ generation_id: id, user_id: userId, value });
      if (error) {
        setMessage(
          error.code === "23505"
            ? "You already rated this caption."
            : "Your vote wasn't saved. Please try again.",
        );
        router.refresh();
        return;
      }
      setLocalVotes((previous) => ({ ...previous, [id]: value }));
      setMessage("Vote saved.");
      router.refresh();
    } catch {
      setMessage("Couldn't save your vote. Please try again.");
    } finally {
      setVoting(null);
    }
  }

  return (
    <>
      <section
        className="surface create-panel my-10 grid gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:p-8"
        aria-labelledby="create-heading"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Daily campus prompt
          </p>
          <h2 id="create-heading" className="mt-3 text-2xl font-bold">
            {today}
          </h2>
          <p className="mt-4 text-zinc-600">
            Same city. Different punchlines. Make an AI caption and let campus
            decide if it hits.
          </p>
          <button
            className="mt-5 text-sm font-semibold underline"
            onClick={() => setTopic(today)}
          >
            Use today’s topic
          </button>
        </div>
        {userId ? (
          <form onSubmit={generate} className="grid gap-4">
            <label className="text-sm font-semibold">
              Your NYC moment
              <textarea
                required
                minLength={5}
                maxLength={200}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 p-3"
                rows={3}
              />
              <span className="text-xs font-normal text-zinc-500">
                {topic.length}/200 · Topics and prompts are public. Keep
                personal details out.
              </span>
            </label>
            <label className="text-sm font-semibold">
              Caption energy
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 p-3"
              >
                {tones.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <button disabled={busy || loadError} className="button w-full">
              {busy ? "Making your caption…" : "Generate & publish"}
            </button>
            <p className="text-xs text-zinc-500">
              10 attempts per day. Captions publish automatically and are
              labeled AI generated.
            </p>
          </form>
        ) : (
          <div className="flex flex-col items-start justify-center rounded-2xl bg-emerald-50 p-6">
            <h3 className="text-xl font-bold">
              Your campus humor belongs here.
            </h3>
            <p className="mt-2 text-zinc-600">
              Browse freely. Sign in to create a caption or cast a vote.
            </p>
            <Link href="/login" className="button mt-5">
              Sign in with Google
            </Link>
          </div>
        )}
      </section>
      <p
        role="status"
        aria-live="polite"
        className="mb-4 min-h-6 text-sm font-medium text-emerald-800"
      >
        {message}
      </p>
      <section aria-labelledby="feed-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 id="feed-heading" className="text-2xl font-bold">
            The campus feed
          </h2>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              View
              <select
                className="ml-2 rounded-lg border border-zinc-300 bg-white p-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All topics</option>
                <option value="today">Today’s topic</option>
              </select>
            </label>
            <label className="text-sm">
              Sort
              <select
                className="ml-2 rounded-lg border border-zinc-300 bg-white p-2"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="new">Newest</option>
                <option value="top">Top rated</option>
              </select>
            </label>
          </div>
        </div>
        {loadError ? (
          <div role="alert" className="notice">
            The feed couldn’t load. Please try again later.
          </div>
        ) : shown.length === 0 ? (
          <div className="surface p-10 text-center text-zinc-600">
            No captions here yet. Be the first to turn a NYC moment into a
            punchline.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {shown.map((c) => {
              const selected = localVotes[c.id] || mine[c.id];
              const score = counts[c.id] || { upvotes: 0, downvotes: 0 };
              return (
                <article
                  key={c.id}
                  className="surface caption-card flex flex-col p-6"
                  id={`caption-${c.id}`}
                >
                  <div className="flex justify-between gap-3 text-xs font-semibold text-zinc-500">
                    <span>AI GENERATED · {c.tone}</span>
                    <time dateTime={c.created_at}>
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        timeZone: "America/New_York",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-5 flex-1 whitespace-pre-wrap text-2xl font-semibold leading-snug">
                    {c.caption}
                  </p>
                  <p className="mt-5 text-sm text-zinc-500">{c.topic}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {userId ? (
                      <>
                        {[1, -1].map((value) => (
                          <button
                            key={value}
                            aria-label={
                              value === 1
                                ? "Upvote caption"
                                : "Downvote caption"
                            }
                            aria-pressed={selected === value}
                            disabled={!!selected || voting !== null}
                            onClick={() => vote(c.id, value)}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-default ${selected === value ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-zinc-200 disabled:opacity-60"}`}
                          >
                            {value === 1 ? "↑ Hits" : "↓ Misses"}{" "}
                            {value === 1 ? score.upvotes : score.downvotes}
                          </button>
                        ))}
                        {selected && (
                          <span className="text-xs text-emerald-700">
                            Your vote is saved
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-zinc-500">
                          ↑ {score.upvotes} · ↓ {score.downvotes}
                        </span>
                        <Link
                          href="/login"
                          className="ml-auto text-sm font-semibold text-emerald-700 underline"
                        >
                          Sign in to rate
                        </Link>
                      </>
                    )}
                  </div>
                  <details className="mt-5 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                    <summary className="cursor-pointer">
                      How this was generated
                    </summary>
                    <p className="mt-2">Model: {c.model}</p>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      {c.prompt}
                    </p>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
