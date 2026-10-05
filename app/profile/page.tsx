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
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <section className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Your profile
            </h1>
          </div>

          <div className="flex gap-2">
            <Link
              href="/private"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100"
            >
              Private page
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {needsProfile && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            This is your first login. Please add your first and last name to
            finish setting up your profile.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          className="mt-6 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          Back to caption feed
        </Link>
      </section>
    </main>
  );
}
