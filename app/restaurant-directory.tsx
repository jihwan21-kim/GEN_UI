"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Caption, Restaurant, Score } from "@/lib/captions";
import AddRestaurant from "./add-restaurant";
import RestaurantCaptions from "./restaurant-captions";
import RestaurantPhoto from "./restaurant-photo";

type Props = {
  restaurants: Restaurant[];
  captions: Caption[];
  scores: Score[];
  votes: { generation_id: string; value: number }[];
  userId: string | null;
  loadError: boolean;
};

export default function RestaurantDirectory({
  restaurants,
  captions,
  scores,
  votes,
  userId,
  loadError,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(restaurants.map((r) => r.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [restaurants],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesCategory = category === "All" || restaurant.category === category;
      const matchesSearch = !query ||
        [restaurant.name, restaurant.category, restaurant.address || ""]
          .some((field) => field.toLocaleLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [restaurants, search, category]);

  return (
    <section className="mt-10" aria-labelledby="restaurants-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="restaurants-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
            Explore restaurants
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Find a favorite, then explore its best community captions.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm text-zinc-600 ring-1 ring-zinc-200">
          {filtered.length} {filtered.length === 1 ? "restaurant" : "restaurants"}
        </span>
      </div>
      <label className="block" htmlFor="restaurant-search">
        <span className="sr-only">Search restaurants by name, cuisine or address</span>
        <div className="relative">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400">
            <circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" />
          </svg>
          <input
            id="restaurant-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by restaurant, cuisine, or neighborhood"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-emerald-600"
          />
        </div>
      </label>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter restaurants by cuisine">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${category === item
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-800"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <ul className="mt-5 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((restaurant) => (
            <li
              key={restaurant.id}
              id={`restaurant-${restaurant.id}`}
              className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <RestaurantPhoto key={restaurant.photo_path || "empty"} restaurant={restaurant} />
              <div className="min-h-[104px]">
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="text-xl font-bold tracking-tight text-zinc-900 hover:text-emerald-800 hover:underline"
                >
                  {restaurant.name}
                </Link>
                <p className="mt-1 text-sm font-medium text-emerald-800">{restaurant.category}</p>
                {restaurant.address && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{restaurant.address}</p>
                )}
              </div>
              {userId && restaurant.created_by === userId && (
                <AddRestaurant userId={userId} available restaurant={restaurant} />
              )}
              <div className="mt-auto">
                <RestaurantCaptions
                  variant="preview"
                  restaurant={restaurant}
                  captions={captions.filter((c) => Number(c.restaurant_id) === Number(restaurant.id))}
                  scores={scores}
                  votes={votes}
                  userId={userId}
                  loadError={loadError}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-zinc-800">No restaurants found</p>
          <p className="mt-2 text-sm text-zinc-500">Try another search or cuisine filter.</p>
          <button
            type="button"
            onClick={() => { setSearch(""); setCategory("All"); }}
            className="mt-4 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
