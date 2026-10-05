import Link from "next/link";
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
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Google sign in
          </Link>
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
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          HW3 / jk4908
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          My Favorite Restaurants
        </h1>
        <p className="mt-3 text-zinc-600">
          Assignment #2 restaurant data, now extended with Google authentication
          and user profiles.
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
