"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Movie, ReviewTone, reviewTones } from "@/lib/movies";

type DraftResult = { draftId: string; options: string[] };

export default function MovieReviewComposer({ movie }: { movie: Movie }) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const impressionRef = useRef<HTMLTextAreaElement>(null);
  const busyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [impression, setImpression] = useState("");
  const [tone, setTone] = useState<ReviewTone>("Witty");
  const [spoilerFree, setSpoilerFree] = useState(true);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [working, setWorking] = useState<"generate" | "publish" | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    if (!draft) impressionRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
      )).filter((element) => element.getClientRects().length > 0);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      (triggerRef.current || previousFocus)?.focus();
    };
  // Focus is captured when dialog opens; state changes inside it must not reopen the trap.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busyRef.current || impression.trim().length < 20 || impression.trim().length > 5000) {
      setMessage("Write at least 20 characters about how the movie made you feel.");
      return;
    }
    busyRef.current = true;
    setWorking("generate");
    setMessage("");
    try {
      const response = await fetch("/api/movies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie.id, impression, tone, spoilerFree }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Couldn't generate one-liners. Please try again.");
        return;
      }
      if (
        typeof result.draftId !== "string" ||
        !Array.isArray(result.options) || result.options.length !== 3
      ) {
        setMessage("AI didn't return three choices. Please try again.");
        return;
      }
      setDraft({ draftId: result.draftId, options: result.options });
      setSelected(null);
    } catch {
      setMessage("Couldn't contact the AI server. Please try again.");
    } finally {
      busyRef.current = false;
      setWorking(null);
    }
  }

  async function publish() {
    if (busyRef.current || !draft || selected === null) return;
    busyRef.current = true;
    setWorking("publish");
    setMessage("");
    try {
      const response = await fetch("/api/movies/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.draftId, selection: selected }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Couldn't publish this review.");
        return;
      }
      setSuccess("Your one-liner is now published!");
      setOpen(false);
      setImpression("");
      setDraft(null);
      setSelected(null);
      startTransition(() => router.refresh());
    } catch {
      setMessage("Couldn't publish your one-liner. Please try again.");
    } finally {
      busyRef.current = false;
      setWorking(null);
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => { setMessage(""); setOpen(true); }}
        disabled={refreshing}
        className="cinema-accent-bg inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
      >
        ✨ Write with AI
      </button>
      {success && <p aria-live="polite" role="status" className="cinema-status rounded-lg p-2 text-xs">{success}</p>}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/80 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !busyRef.current) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`movie-composer-heading-${movie.id}`}
            className="cinema-card max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.2em]">
                  {draft ? "Step 2 of 2 · Choose your line" : "Step 1 of 2 · Your own thoughts"}
                </p>
                <h2 id={`movie-composer-heading-${movie.id}`} className="mt-2 text-2xl font-bold tracking-tight">
                  {draft ? "Pick your favorite" : "Your review, one line"}
                </h2>
                <p className="cinema-muted mt-2 text-sm leading-relaxed">
                  {draft
                    ? "These three lines were written from your impressions. Only your selection will be public."
                    : `Tell us what you really thought of ${movie.title}. AI will turn your thoughts into three punchy options.`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close review editor"
                disabled={!!working}
                onClick={() => setOpen(false)}
                className="cinema-muted-card rounded-lg border p-1 text-2xl disabled:opacity-50"
              >×</button>
            </div>
            {!draft ? (
              <form onSubmit={generate} className="mt-6 grid gap-4">
                <label htmlFor={`movie-impression-${movie.id}`} className="text-sm font-semibold">
                  Your thoughts <span className="cinema-muted font-normal">(private)</span>
                </label>
                <textarea
                  id={`movie-impression-${movie.id}`}
                  ref={impressionRef}
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={6}
                  value={impression}
                  onChange={(event) => setImpression(event.target.value)}
                  placeholder="What stayed with you? What moved you, surprised you or annoyed you? Write freely. Your original thoughts won't be shown publicly."
                  className="cinema-input w-full resize-y rounded-xl p-4 text-sm leading-relaxed"
                />
                <p className="cinema-muted -mt-2 text-right text-xs">{impression.length.toLocaleString()} / 5,000 characters</p>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Choose a voice</legend>
                  <div className="flex flex-wrap gap-2">
                    {reviewTones.map((value) => (
                      <label key={value} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${tone === value
                        ? "cinema-accent-bg"
                        : "cinema-muted-card"}`}>
                        <input type="radio" name="tone" value={value} checked={tone === value}
                          onChange={() => setTone(value)} className="sr-only" />
                        {tone === value ? "✓ " : ""}{value}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="cinema-muted-card flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold">
                  <input type="checkbox" checked={spoilerFree}
                    onChange={(event) => setSpoilerFree(event.target.checked)} />
                  Keep it spoiler-free
                </label>
                <p className="cinema-muted text-xs leading-relaxed">
                  AI aims for 5–12 words per line (15 maximum). Your full review and unselected drafts
                  stay private. You get 10 generations per day.
                </p>
                {message && <p role="alert" className="cinema-status rounded-lg p-3 text-sm">{message}</p>}
                <button disabled={!!working || refreshing || impression.trim().length < 20}
                  className="cinema-accent-bg rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
                  {working === "generate" ? "Crafting three one-liners…" : "✨ Generate 3 one-liners"}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-3">
                <p className="cinema-muted text-xs font-semibold uppercase tracking-wider">
                  {tone} · {spoilerFree ? "Spoiler-free" : "Spoilers allowed"}
                </p>
                {draft.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed transition-colors ${selected === index
                      ? "cinema-accent-bg ring-2 ring-[var(--cinema-accent)]"
                      : "cinema-muted-card"}`}
                  >
                    <input
                      type="radio"
                      name={`movie-line-choice-${movie.id}`}
                      checked={selected === index}
                      onChange={() => setSelected(index)}
                      className="mt-1 accent-[var(--cinema-accent)]"
                    />
                    <span className="flex-1 font-medium">{selected === index ? "✓ " : ""}{option}</span>
                  </label>
                ))}
                <p className="cinema-muted text-xs">Only one selected line will be published and receive votes.</p>
                {message && <p role="alert" className="cinema-status rounded-lg p-3 text-sm">{message}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setDraft(null); setSelected(null); setMessage(""); }}
                    disabled={!!working}
                    className="cinema-outline rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    ← Edit thoughts
                  </button>
                  <button type="button" onClick={() => void generate()} disabled={!!working}
                    className="cinema-outline rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50">
                    {working === "generate" ? "Regenerating…" : "↻ Regenerate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void publish()}
                    disabled={selected === null || !!working}
                    className="cinema-accent-bg min-w-36 flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
                  >
                    {working === "publish" ? "Publishing…" : "Publish selected →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
