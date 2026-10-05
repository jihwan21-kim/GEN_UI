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
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Protected route
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Private Member Area
        </h1>
        <p className="mt-4 text-zinc-600">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}. This
          page is only rendered for signed-in users.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white"
          >
            Edit profile
          </Link>
          <Link
            href="/restaurants"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-semibold text-zinc-900"
          >
            Restaurant list
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-semibold"
          >
            Create & rate captions
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-semibold text-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
