"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101115] px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Main navigation" className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-black tracking-tight text-white sm:text-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xl text-zinc-950" aria-hidden="true">✦</span>
            OneLine <span className="text-amber-300">Cinema</span>
          </Link>
          <Link href="/" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10 hover:text-white">
            ← Explore films
          </Link>
        </nav>

        <section className="relative mx-auto mt-12 max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#27232c] via-[#1b1c24] to-[#17181e] p-6 shadow-2xl shadow-black/20 sm:mt-16 sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
              OneLine Cinema / Account
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Sign in</h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              Sign in with Google to turn your movie thoughts into memorable one-liners,
              share your favorite, and vote for the best.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            {errorMessage && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <Link href="/" className="mt-7 inline-block text-sm font-semibold text-amber-300 hover:text-amber-200 hover:underline">
              ← Back to movie collection
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
