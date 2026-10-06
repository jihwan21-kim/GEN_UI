import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Caption, Restaurant, Score } from "@/lib/captions";
import RestaurantCaptions from "./restaurant-captions";
import RestaurantPhoto from "./restaurant-photo";
import AddRestaurant from "./add-restaurant";
export const dynamic = "force-dynamic";
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [restaurantResult, captions, scores, votes, popularity] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, category, address, photo_path")
        .order("id"),
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
      supabase.rpc("restaurant_popularity"),
    ]);
  // Keep the original list available until the additive migration is applied.
  const restaurants =
    restaurantResult.error?.code === "42703" ||
    restaurantResult.error?.code === "PGRST204"
      ? await supabase
          .from("restaurants")
          .select("id, name, category")
          .order("id")
      : restaurantResult;
  const popular = (popularity.data || []) as {
    restaurant_id: number;
    likes: number;
    dislikes: number;
  }[];
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
        {user && (
          <AddRestaurant userId={user.id} available={!restaurantResult.error} />
        )}
        {!popularity.error && popular.length > 0 && (
          <section
            aria-labelledby="popular-heading"
            className="mt-8 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 id="popular-heading" className="text-lg font-semibold">
              Restaurants with popular captions
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ranked by caption likes minus dislikes. This is not a restaurant
              review score.
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {popular.map((entry, index) => {
                const restaurant = (
                  restaurants.data as Restaurant[] | null
                )?.find((r) => Number(r.id) === Number(entry.restaurant_id));
                return restaurant ? (
                  <li key={entry.restaurant_id}>
                    <Link
                      href={`#restaurant-${restaurant.id}`}
                      className="block rounded-lg bg-zinc-50 p-3 hover:bg-emerald-50"
                    >
                      <span className="text-xs font-semibold text-emerald-700">
                        #{index + 1}
                      </span>
                      <p className="mt-1 text-sm font-semibold">
                        {restaurant.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {Number(entry.likes)} caption likes ·{" "}
                        {Number(entry.likes) - Number(entry.dislikes)} net votes
                      </p>
                    </Link>
                  </li>
                ) : null;
              })}
            </ol>
          </section>
        )}
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
                id={`restaurant-${restaurant.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <RestaurantPhoto restaurant={restaurant} />
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                <p className="mt-1 text-zinc-600">{restaurant.category}</p>
                {restaurant.address && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {restaurant.address}
                  </p>
                )}
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
