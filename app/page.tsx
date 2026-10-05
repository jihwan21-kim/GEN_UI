import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Caption, Restaurant, Score } from "@/lib/captions";
import RestaurantCaptions from "./restaurant-captions";
export const dynamic = "force-dynamic";
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [restaurants, captions, scores, votes] = await Promise.all([
    supabase.from("restaurants").select("id, name, category").order("id"),
    supabase
      .from("generations")
      .select(
        "id, restaurant_id, topic, tone, caption, prompt, model, created_at",
      )
      .not("restaurant_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("caption_scores"),
    user
      ? supabase
          .from("votes")
          .select("generation_id, value")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const captionError = !!(captions.error || scores.error || votes.error);
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <section className="mx-auto max-w-2xl">
        <nav aria-label="Main navigation" className="mb-8 flex flex-wrap gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold"
              >
                Profile
              </Link>
              <Link
                href="/private"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold"
              >
                Private page
              </Link>
              <form action="/auth/signout" method="post">
                <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Google sign in
            </Link>
          )}
        </nav>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          My NYC collection
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          My Favorite Restaurants
        </h1>
        <p className="mt-3 text-zinc-600">
          Explore the list, create an AI caption for a restaurant, and vote for
          your favorites.
        </p>
        {restaurants.error ? (
          <p
            role="alert"
            className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            Unable to load restaurants. Please try again later.
          </p>
        ) : (
          <ul className="mt-10 grid gap-4">
            {((restaurants.data || []) as Restaurant[]).map((restaurant) => (
              <li
                key={restaurant.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                <p className="mt-1 text-zinc-600">{restaurant.category}</p>
                <RestaurantCaptions
                  restaurant={restaurant}
                  captions={((captions.data || []) as Caption[]).filter(
                    (c) => Number(c.restaurant_id) === restaurant.id,
                  )}
                  scores={(scores.data || []) as Score[]}
                  votes={votes.data || []}
                  userId={user?.id || null}
                  loadError={captionError}
                />
              </li>
            ))}
          </ul>
        )}
        {!restaurants.error && !restaurants.data?.length && (
          <p className="mt-10 text-zinc-600">No restaurants found.</p>
        )}
      </section>
    </main>
  );
}
