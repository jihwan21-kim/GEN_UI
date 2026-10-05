"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Caption, Restaurant, Score, tones } from "@/lib/captions";
export default function RestaurantCaptions({
  restaurant,
  captions,
  scores,
  votes,
  userId,
  loadError,
}: {
  restaurant: Restaurant;
  captions: Caption[];
  scores: Score[];
  votes: { generation_id: string; value: number }[];
  userId: string | null;
  loadError: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(
    `A weekend food run to ${restaurant.name}`,
  );
  const [tone, setTone] = useState<string>(tones[0]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<Caption | null>(null);
  const mine = Object.fromEntries(votes.map((v) => [v.generation_id, v.value]));
  const counts = Object.fromEntries(scores.map((s) => [s.generation_id, s]));
  const shown =
    added && !captions.some((c) => c.id === added.id)
      ? [added, ...captions]
      : captions;
  async function generate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, topic, tone }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Could not generate. Please try again.");
        return;
      }
      setAdded(result.caption);
      setMessage("Caption saved.");
      setOpen(false);
      router.refresh();
    } catch {
      setMessage("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function vote(id: string, value: number) {
    if (!userId || pending || mine[id] || saved[id]) return;
    setPending(id);
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
      setSaved((previous) => ({ ...previous, [id]: value }));
      setMessage("Vote saved.");
      router.refresh();
    } catch {
      setMessage("Couldn't save your vote. Please try again.");
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="mt-5 border-t border-zinc-100 pt-4">
      {userId ? (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`generate-${restaurant.id}`}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          {open ? "Close generator" : "Create AI caption"}
        </button>
      ) : (
        <Link
          href="/login"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Sign in to create captions and vote
        </Link>
      )}
      {open && userId && (
        <form
          id={`generate-${restaurant.id}`}
          onSubmit={generate}
          className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-4"
        >
          <label className="text-sm font-medium">
            Your idea
            <textarea
              required
              minLength={5}
              maxLength={200}
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white p-3"
            />
          </label>
          <label className="text-sm font-medium">
            Tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white p-2"
            >
              {tones.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-zinc-500">
            Your idea and prompt will be public. 10 generation attempts per day.
          </p>
          <button
            disabled={busy || loadError}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate & save"}
          </button>
        </form>
      )}
      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-sm text-emerald-800"
      >
        {message}
      </p>
      {loadError ? (
        <p className="mt-3 text-sm text-zinc-500">
          AI captions are currently unavailable. The restaurant list is still
          available.
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No AI captions yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {shown.map((c) => {
            const selected = saved[c.id] || mine[c.id];
            const score = counts[c.id];
            const delta = saved[c.id] && !mine[c.id] ? saved[c.id] : 0;
            return (
              <li key={c.id} className="rounded-lg border border-zinc-200 p-4">
                <p className="text-xs font-medium text-zinc-500">
                  AI generated · {c.tone}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-base">
                  {c.caption}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {[1, -1].map((value) => (
                    <button
                      key={value}
                      disabled={!userId || !!selected || pending !== null}
                      aria-label={`${value === 1 ? "Upvote" : "Downvote"} caption for ${restaurant.name}`}
                      aria-pressed={selected === value}
                      onClick={() => vote(c.id, value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm disabled:cursor-default ${selected === value ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-zinc-200 disabled:opacity-60"}`}
                    >
                      {value === 1 ? "↑ Like" : "↓ Dislike"}{" "}
                      {Number(
                        value === 1
                          ? score?.upvotes || 0
                          : score?.downvotes || 0,
                      ) + (delta === value ? 1 : 0)}
                    </button>
                  ))}
                  {selected && (
                    <span className="text-xs text-emerald-700">
                      Your vote is saved
                    </span>
                  )}
                </div>
                <details className="mt-3 text-xs text-zinc-500">
                  <summary className="cursor-pointer">View prompt</summary>
                  <p className="mt-2">Model: {c.model}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {c.prompt}
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
