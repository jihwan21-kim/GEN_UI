import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Caption, Restaurant, Score } from "@/lib/captions";
import RestaurantPhoto from "@/app/restaurant-photo";
import RestaurantCaptions from "@/app/restaurant-captions";

export const dynamic = "force-dynamic";

export default async function RestaurantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [restaurantResult, captionsResult, scoresResult, votesResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, address, photo_path, created_by")
      .eq("id", Number(id))
      .maybeSingle(),
    supabase
      .from("generations")
      .select("id, restaurant_id, topic, tone, caption, model, created_at")
      .eq("restaurant_id", Number(id))
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.rpc("caption_scores"),
    user
      ? supabase.from("votes").select("generation_id, value").eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (!restaurantResult.data && !restaurantResult.error) notFound();
  const restaurant = restaurantResult.data as Restaurant | null;
  const loadError = !!(captionsResult.error || scoresResult.error || votesResult.error);

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-900 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
            ← All restaurants
          </Link>
          {user ? (
            <Link href="/profile" className="text-sm font-medium text-zinc-600 hover:text-emerald-800">
              My profile
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-emerald-800 hover:underline">
              Sign in
            </Link>
          )}
        </nav>
        {!restaurant ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load this restaurant. Please try again later.
          </p>
        ) : (
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="rounded-xl">
              <RestaurantPhoto restaurant={restaurant} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              {restaurant.category}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{restaurant.name}</h1>
            {restaurant.address && (
              <p className="mt-2 text-sm text-zinc-500">{restaurant.address}</p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Explore AI captions, vote for your favorite, or share an idea of your own.
            </p>
            <RestaurantCaptions
              variant="full"
              restaurant={restaurant}
              captions={(captionsResult.data || []) as Caption[]}
              scores={(scoresResult.data || []) as Score[]}
              votes={votesResult.data || []}
              userId={user?.id || null}
              loadError={loadError}
            />
          </article>
        )}
      </div>
    </main>
  );
}
