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
    <main id="main-content" className="page-shell">
      <section className="mx-auto max-w-5xl">
        <header className="page-heading">
          <p className="eyebrow">A taste of the city</p>
          <h1 className="page-title">Good bites. Great detours.</h1>
          <p className="hero-description">
            The restaurant collection for your next between-classes craving or
            weekend food run.
          </p>
        </header>
        {error ? (
          <p role="alert" className="notice notice-error">
            We couldn’t load the restaurants. Please try again later.
          </p>
        ) : (
          <ul className="restaurant-grid">
            {((restaurants || []) as Restaurant[]).map((restaurant, index) => (
              <li key={restaurant.id} className="surface restaurant-card">
                <div className="restaurant-art" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-3xl">↗</span>
                </div>
                <div className="p-6">
                  <span className="pill">{restaurant.category}</span>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                    {restaurant.name}
                  </h2>
                  <p className="mt-3 text-sm text-zinc-500">
                    From the city collection
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!error && !restaurants?.length && (
          <div className="surface p-10 text-center text-zinc-600">
            The collection is getting started. Check back for more city bites.
          </div>
        )}
        <Link href="/" className="text-link mt-8 inline-block">
          ← Back to the campus feed
        </Link>
      </section>
    </main>
  );
}
