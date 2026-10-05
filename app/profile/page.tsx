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
    <main id="main-content" className="page-shell">
      <section className="mx-auto max-w-5xl">
        <header className="page-heading">
          <p className="eyebrow">Make yourself at home</p>
          <h1 className="page-title">Your profile.</h1>
          <p className="hero-description">
            A familiar face in a very big city.
          </p>
        </header>
        <div className="profile-layout">
          <aside>
            <span className="pill">YOUR ACCOUNT</span>
            <h2 className="mt-5 text-xl font-semibold">
              The basics, beautifully simple.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Add your name and a photo to make your space feel like you. Your
              profile details are visible only to you.
            </p>
            <Link href="/private" className="text-link mt-6 inline-block">
              ← Back to my space
            </Link>
          </aside>
          <div className="surface profile-card">
            {needsProfile && (
              <div className="notice mb-6">
                Welcome! Add your first and last name to finish setting up your
                profile.
              </div>
            )}
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialFirstName={profile?.first_name ?? ""}
              initialLastName={profile?.last_name ?? ""}
              initialAvatarUrl={profile?.avatar_url ?? ""}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
