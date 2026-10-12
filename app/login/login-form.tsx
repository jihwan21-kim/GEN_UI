"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CinemaNavigation from "../cinema-navigation";
import { movieReturnPath, returnMovieStorageKey } from "@/lib/movie-navigation";

export default function LoginForm({ movieId, callbackFailed = false }: { movieId: number | null; callbackFailed?: boolean }) {
  const [errorMessage, setErrorMessage] = useState(callbackFailed ? "Sign-in could not be completed. Please try again." : "");
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      // Keep the existing allowlisted OAuth callback URL unchanged.
      try {
        if (movieId) sessionStorage.setItem(returnMovieStorageKey, String(movieId));
        else sessionStorage.removeItem(returnMovieStorageKey);
      } catch {
        // Sign-in still returns home when browser storage is unavailable.
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) {
        setErrorMessage("Could not connect to Google sign-in. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Could not start sign-in. Check your connection and try again.");
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
              Sign in with Google to create a useful AI-assisted review and rate the
              insights that help you choose a film.
            </p>
            <p className="cinema-muted mt-3 text-xs leading-relaxed">New here? You&apos;ll set up your name and @username first.</p>
            {movieId && <p className="cinema-status mt-3 rounded-xl p-3 text-sm">Once your profile is ready, we&apos;ll reopen your selected film on the home page.</p>}

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isLoading}
              className="cinema-accent-bg mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            {errorMessage && (
              <p role="alert" className="cinema-status mt-4 rounded-xl p-4 text-sm">
                {errorMessage}
              </p>
            )}

            <Link href={movieReturnPath(movieId)} className="cinema-accent-text mt-7 inline-block text-sm font-semibold hover:underline">
              {movieId ? "← Back to selected film" : "← Back to movie collection"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
