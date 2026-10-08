import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const needsProfile =
    !profile?.first_name?.trim() || !profile?.last_name?.trim();

  return (
    <main className="min-h-screen bg-[#101115] px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-black tracking-tight text-white sm:text-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xl text-zinc-950" aria-hidden="true">✦</span>
            OneLine <span className="text-amber-300">Cinema</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white">
              ← Explore films
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>

        <section className="mx-auto mt-10 max-w-2xl sm:mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            OneLine Cinema / Account
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Your <span className="text-amber-300">profile</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Manage your name and profile photo. Your movie reviews and votes stay connected to your account.
          </p>

          {needsProfile && (
            <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              Welcome! Add your first and last name to complete your profile.
            </p>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#27232c] via-[#1b1c24] to-[#17181e] p-5 shadow-2xl shadow-black/20 sm:p-8">
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialFirstName={profile?.first_name ?? ""}
              initialLastName={profile?.last_name ?? ""}
              initialAvatarUrl={profile?.avatar_url ?? ""}
            />
          </div>

          <Link
            href="/"
            className="mt-7 inline-block text-sm font-semibold text-amber-300 hover:text-amber-200 hover:underline"
          >
            ← Back to movie collection
          </Link>
        </section>
      </div>
    </main>
  );
}
