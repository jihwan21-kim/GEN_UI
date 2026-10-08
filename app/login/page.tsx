"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CinemaNavigation from "../cinema-navigation";

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
    <main className="cinema-app cinema-page px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <CinemaNavigation />

        <section className="cinema-hero relative mx-auto mt-12 max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl shadow-black/20 sm:mt-16 sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative">
            <p className="cinema-accent-text text-xs font-bold uppercase tracking-[0.22em]">
              OneLine Cinema / Account
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Sign in</h1>
            <p className="cinema-muted mt-4 text-sm leading-relaxed">
              Sign in with Google to turn your movie thoughts into memorable one-liners,
              share your favorite, and vote for the best.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="cinema-accent-bg mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            {errorMessage && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <Link href="/" className="cinema-accent-text mt-7 inline-block text-sm font-semibold hover:underline">
              ← Back to movie collection
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
