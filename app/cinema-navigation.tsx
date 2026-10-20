"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CinemaDisplaySettings } from "./cinema-theme";

export default function CinemaNavigation({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Films", active: pathname === "/" || pathname.startsWith("/movies/") },
    { href: "/leaderboard", label: "Rankings", active: pathname === "/leaderboard" || pathname.startsWith("/u/") },
    ...(signedIn ? [{ href: "/profile", label: "Profile", active: pathname === "/profile" }] : []),
  ];

  return (
    <nav aria-label="Main navigation" className="w-full">
      {/* Branding has its own row, so controls do not crowd the logo or drift to the edge. */}
      <Link
        href="/"
        aria-label="OneLine Cinema home"
        className="inline-flex max-w-full items-center gap-2.5 font-black tracking-tight cinema-text"
      >
        <span className="cinema-accent-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" aria-hidden="true">✦</span>
        <span className="truncate text-base sm:text-lg">
          OneLine <span className="cinema-accent-text">Cinema</span>
        </span>
      </Link>

      {/* Consistent left edge on every page and every screen size. */}
      <div className="mt-4 flex flex-col items-start gap-3 sm:mt-5">
        <div
          className={`grid w-full gap-1.5 sm:gap-2 lg:flex lg:w-auto lg:flex-wrap ${signedIn ? "grid-cols-4" : "grid-cols-3"}`}
          aria-label="Primary sections"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className="cinema-nav-tab inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border px-1 py-2.5 text-xs font-bold transition-colors sm:px-3.5 sm:text-sm"
            >
              {tab.label}
            </Link>
          ))}
          {signedIn ? (
            <form action="/auth/signout" method="post" className="min-w-0">
              <button
                type="submit"
                className="cinema-outline min-h-11 w-full rounded-xl px-1 py-2.5 text-xs font-bold sm:px-4 sm:text-sm"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="cinema-outline inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl px-1 py-2.5 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Sign in
            </Link>
          )}
        </div>
        <CinemaDisplaySettings />
      </div>
    </nav>
  );
}
