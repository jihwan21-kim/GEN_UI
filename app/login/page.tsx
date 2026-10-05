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
    <main id="main-content" className="page-shell auth-page">
      <section className="auth-layout">
        <div className="auth-story">
          <p className="eyebrow">Your corner of the city</p>
          <h1 className="hero-title">
            Good company.
            <br />
            Great punchlines.
          </h1>
          <p className="hero-description">
            A home for your campus humor, city discoveries, and very strong food
            opinions.
          </p>
          <div className="story-note">
            <span aria-hidden="true">↗</span>
            <p>
              From the dorm room to the downtown detour.
              <br />
              <strong>Make yourself at home.</strong>
            </p>
          </div>
        </div>
        <div className="surface auth-card">
          <span className="pill">WELCOME TO SIDE OF NYC</span>
          <h2 className="section-title mt-6">Come on in.</h2>
          <p className="mt-3 text-zinc-600 leading-relaxed">
            Sign in to make AI captions, rate your favorites, and join the
            conversation.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="button mt-8 w-full"
          >
            {isLoading ? "Redirecting to Google…" : "Continue with Google"}
            <span aria-hidden="true">↗</span>
          </button>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            New here? After your first sign-in, we’ll help you set up your
            profile.
          </p>
          {errorMessage && (
            <p role="alert" className="notice notice-error mt-5">
              {errorMessage}
            </p>
          )}
          <Link href="/" className="text-link mt-8 inline-block">
            ← Explore the feed first
          </Link>
        </div>
      </section>
    </main>
  );
}
