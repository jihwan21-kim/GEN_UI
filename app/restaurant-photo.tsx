"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Restaurant } from "@/lib/captions";
const photos: Record<string, string> = {
  pizza: "photo-1513104890138-7c749659a591",
  mexican: "photo-1551504734-5ee1c4a1479b",
  burger: "photo-1568901346375-23c9450c58cd",
};
export default function RestaurantPhoto({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const [failed, setFailed] = useState(false);
  const uploaded = restaurant.photo_path
    ? createClient()
        .storage.from("restaurant-photos")
        .getPublicUrl(restaurant.photo_path).data.publicUrl
    : null;
  const stock =
    photos[restaurant.category.toLowerCase()] ||
    "photo-1414235077428-338989a2e8c0";
  return (
    <figure className="relative -mx-5 -mt-5 mb-5 overflow-hidden rounded-t-xl bg-zinc-100">
      {!failed ? (
        // Storage and category photos have dynamic URLs; the browser handles lazy loading.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            uploaded ||
            `https://images.unsplash.com/${stock}?auto=format&fit=crop&w=900&q=80`
          }
          alt={
            uploaded
              ? `Photo shared for ${restaurant.name}`
              : `${restaurant.category} food, representative photo`
          }
          width={900}
          height={450}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-48 w-full object-cover sm:h-56"
        />
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-zinc-500 sm:h-56">
          Photo unavailable
        </div>
      )}
      <figcaption className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-zinc-600">
        {uploaded ? "Community photo" : "Representative photo · Unsplash"}
      </figcaption>
    </figure>
  );
}
