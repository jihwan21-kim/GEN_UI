import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: number;
  name: string;
  category: string;
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, category")
    .order("id");

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <section className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          HW2 / jk4908
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          My Favorite Restaurants
        </h1>
        <p className="mt-3 text-zinc-600">
          A list of restaurants loaded from Supabase.
        </p>

        {error ? (
          <p className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Unable to load restaurants: {error.message}
          </p>
        ) : (
          <ul className="mt-10 grid gap-4">
            {(restaurants as Restaurant[]).map((restaurant) => (
              <li
                key={restaurant.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                <p className="mt-1 text-zinc-600">{restaurant.category}</p>
              </li>
            ))}
          </ul>
        )}

        {!error && restaurants.length === 0 && (
          <p className="mt-10 text-zinc-600">No restaurants found.</p>
        )}
      </section>
    </main>
  );
}
