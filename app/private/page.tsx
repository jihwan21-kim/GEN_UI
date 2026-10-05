import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PrivatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main id="main-content" className="page-shell">
      <section className="mx-auto max-w-5xl">
        <header className="page-heading">
          <p className="eyebrow">Your campus corner</p>
          <h1 className="page-title">
            Welcome back{profile?.first_name ? `, ${profile.first_name}` : ""}.
          </h1>
          <p className="hero-description">
            A fresh city moment. A new favorite caption. Where to next?
          </p>
        </header>
        <div className="member-grid">
          <Link
            href="/"
            className="surface destination-card destination-featured"
          >
            <span className="destination-icon" aria-hidden="true">
              ✳
            </span>
            <span className="eyebrow mt-8">Create & connect</span>
            <h2 className="section-title mt-3">Find your punchline.</h2>
            <p className="mt-3 text-zinc-600">
              Generate a campus caption and vote for the ones that get you.
            </p>
            <span className="text-link mt-8">
              Explore the feed <span aria-hidden="true">↗</span>
            </span>
          </Link>
          <Link href="/restaurants" className="surface destination-card">
            <span className="destination-icon" aria-hidden="true">
              ↗
            </span>
            <span className="eyebrow mt-8">Around the city</span>
            <h2 className="section-title mt-3">Your next bite.</h2>
            <p className="mt-3 text-zinc-600">
              Browse the restaurant collection for your next food run.
            </p>
            <span className="text-link mt-8">
              See city bites <span aria-hidden="true">↗</span>
            </span>
          </Link>
          <Link href="/profile" className="surface destination-card">
            <span className="destination-icon" aria-hidden="true">
              ◎
            </span>
            <span className="eyebrow mt-8">Make it yours</span>
            <h2 className="section-title mt-3">A little about you.</h2>
            <p className="mt-3 text-zinc-600">
              Update your name and photo. Settle into your corner of campus.
            </p>
            <span className="text-link mt-8">
              Edit your profile <span aria-hidden="true">↗</span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
