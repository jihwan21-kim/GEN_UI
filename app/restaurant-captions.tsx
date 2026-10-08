"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Caption, Restaurant, Score, tones } from "@/lib/captions";

type Props = {
  restaurant: Restaurant;
  captions: Caption[];
  scores: Score[];
  votes: { generation_id: string; value: number }[];
  userId: string | null;
  loadError: boolean;
  variant?: "preview" | "full";
};

export default function RestaurantCaptions({
  restaurant, captions, scores, votes, userId, loadError, variant = "full",
}: Props) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<string>(tones[0]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState<Caption | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mine = Object.fromEntries(votes.map((v) => [v.generation_id, v.value]));
  const counts = Object.fromEntries(scores.map((s) => [s.generation_id, s]));
  const shown = added && !captions.some((c) => c.id === added.id)
    ? [added, ...captions]
    : captions;
  const ranked = [...shown].sort((a, b) => {
    const aScore = counts[a.id];
    const bScore = counts[b.id];
    const aNet = (aScore?.upvotes || 0) - (aScore?.downvotes || 0);
    const bNet = (bScore?.upvotes || 0) - (bScore?.downvotes || 0);
    return bNet - aNet || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const visible = variant === "preview" ? ranked.slice(0, 1) : showAll ? ranked : ranked.slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const formerOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textareaRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        // Keep the modal visible while a request is in progress.
        if (!busy) setOpen(false);
      }
      if (event.key === "Tab" && dialogRef.current) {
        const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]',
        ));
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = formerOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, busy]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !userId) return;
    setBusy(true);
    setFormError("");
    setMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, topic, tone }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error || "Could not generate. Please try again.");
        return;
      }
      setAdded(result.caption);
      setTopic("");
      setMessage("Caption saved successfully.");
      setOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setFormError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: string, value: number) {
    if (!userId || pending || refreshing) return;
    setPending(id);
    setMessage("");
    try {
      const db = createClient();
      const current = mine[id];
      const query = current === value
        ? db.from("votes").delete().eq("generation_id", id).eq("user_id", userId)
        : current
          ? db.from("votes").update({ value }).eq("generation_id", id).eq("user_id", userId)
          : db.from("votes").insert({ generation_id: id, user_id: userId, value });
      const { error } = await query;
      if (error) {
        setMessage("Your vote wasn't saved. Please refresh and try again.");
        return;
      }
      setMessage(current === value ? "Vote cancelled." : "Vote saved.");
      startTransition(() => router.refresh());
    } catch {
      setMessage("Couldn't save your vote. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-4 border-t border-zinc-100 pt-4" aria-label={`AI captions for ${restaurant.name}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-800">
          AI Captions <span className="font-normal text-zinc-500">({ranked.length})</span>
        </h3>
        <span className="text-xs text-zinc-500">
          {variant === "preview" ? "Top rated" : "Most liked first"}
        </span>
      </div>

      <p role="status" aria-live="polite" className={message ? "mt-2 text-sm text-emerald-800" : "sr-only"}>
        {message}
      </p>
      {loadError ? (
        <p className="mt-3 text-sm text-zinc-500">AI captions are currently unavailable.</p>
      ) : ranked.length === 0 ? (
        <div className="mt-3 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
          No captions yet. Be the first to share an idea!
        </div>
      ) : (
        <ul className={variant === "preview" ? "mt-3" : "mt-4 grid gap-3"}>
          {visible.map((caption, index) => {
            const selected = mine[caption.id];
            const score = counts[caption.id];
            return (
              <li
                key={caption.id}
                className={variant === "preview"
                  ? "rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"
                  : "rounded-xl border border-zinc-200 bg-white p-4"}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-800">
                    {index === 0 ? "🏆 Top caption" : "AI generated"}
                  </span>
                  <span className="text-xs text-zinc-500">{caption.tone}</span>
                </div>
                <p className={variant === "preview"
                  ? "mt-2 line-clamp-3 min-h-[60px] whitespace-pre-wrap text-sm leading-5 text-zinc-800"
                  : "mt-2 whitespace-pre-wrap text-base leading-relaxed text-zinc-800"}
                >
                  {caption.caption}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {([1, -1] as const).map((value) => (
                    <button
                      type="button"
                      key={value}
                      disabled={!userId || pending !== null || refreshing}
                      aria-label={`${value === 1 ? "Like" : "Dislike"} this caption for ${restaurant.name}`}
                      aria-pressed={selected === value}
                      title={!userId ? "Sign in to vote" : selected === value ? "Click again to cancel your vote" : "Vote"}
                      onClick={() => vote(caption.id, value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${selected === value
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"}`}
                    >
                      <span aria-hidden="true">{value === 1 ? "👍" : "👎"}</span>
                      <span>{Number(value === 1 ? score?.upvotes || 0 : score?.downvotes || 0)}</span>
                    </button>
                  ))}
                  {selected && variant === "full" && (
                    <span className="text-xs text-emerald-800">Tap again to undo</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {variant === "full" && !loadError && ranked.length > 8 && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((previous) => !previous)}
          className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
        >
          {showAll ? "Show fewer captions ↑" : `View more captions (${ranked.length - 8}) ↓`}
        </button>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {variant === "preview" && (
          <Link
            href={`/restaurants/${restaurant.id}`}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50"
          >
            View all captions →
          </Link>
        )}
        {userId ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => { setFormError(""); setOpen(true); }}
            disabled={loadError}
            aria-haspopup="dialog"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            + Create caption
          </button>
        ) : variant === "full" ? (
          <Link href="/login" className="text-sm font-semibold text-emerald-800 hover:underline">
            Sign in to create a caption or vote
          </Link>
        ) : null}
      </div>

      {open && userId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
          onMouseDown={(event) => {
            if (!busy && event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`caption-dialog-title-${restaurant.id}`}
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Create with AI</p>
                <h2 id={`caption-dialog-title-${restaurant.id}`} className="mt-2 text-xl font-bold text-zinc-900">
                  Caption for {restaurant.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">Share what makes this spot worth visiting.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                aria-label="Close caption dialog"
                className="rounded-lg px-2 py-1 text-2xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
              >
                ×
              </button>
            </div>
            <form onSubmit={generate} className="mt-5 grid gap-4">
              <label className="text-sm font-semibold text-zinc-800">
                Your idea
                <textarea
                  ref={textareaRef}
                  required
                  minLength={5}
                  maxLength={200}
                  rows={3}
                  value={topic}
                  placeholder="A dish, a special moment, or a local tip…"
                  onChange={(event) => setTopic(event.target.value)}
                  className="mt-2 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-zinc-800">
                Tone
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm font-normal"
                >
                  {tones.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <p className="text-xs leading-relaxed text-zinc-500">
                Your caption is public. Your idea and the generation prompt are saved privately.
                Limit: 10 generation attempts per day.
              </p>
              {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || refreshing || loadError}
                  className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {busy ? "Generating…" : "Generate & save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
