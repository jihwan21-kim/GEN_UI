"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CinemaDisplaySettings } from "./cinema-theme";

export default function CinemaNavigation({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const tabs = [
    { href: "/", label: "Films", active: pathname === "/" || pathname.startsWith("/movies/") },
    { href: "/leaderboard", label: "Rankings", active: pathname === "/leaderboard" || pathname.startsWith("/u/") },
    ...(signedIn ? [{ href: "/profile", label: "Profile", active: pathname === "/profile" }] : []),
  ];

  useEffect(() => setSettingsOpen(false), [pathname]);
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [settingsOpen]);

  return (
    <nav aria-label="Main navigation" className="relative">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="OneLine Cinema home" className="inline-flex min-w-0 items-center gap-2.5 font-black tracking-tight cinema-text">
          <span className="cinema-accent-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" aria-hidden="true">✦</span>
          <span className="truncate text-base sm:text-lg">OneLine <span className="cinema-accent-text">Cinema</span></span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-colors ${tab.active ? "cinema-muted-card" : "cinema-card cinema-muted"}`}
            >
              {tab.label}
            </Link>
          ))}
          <CinemaDisplaySettings />
          {signedIn ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="cinema-outline rounded-xl px-4 py-2 text-sm font-bold">Sign out</button>
            </form>
          ) : (
            <Link href="/login" className="cinema-outline rounded-xl px-4 py-2 text-sm font-bold">Sign in</Link>
          )}
        </div>

        <div ref={settingsRef} className="relative lg:hidden">
          <button
            type="button"
            aria-expanded={settingsOpen}
            aria-controls="mobile-display-menu"
            onClick={() => setSettingsOpen((open) => !open)}
            className="cinema-card flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
            aria-label="Open display and account settings"
          >
            <span aria-hidden="true">⚙</span>
          </button>
          {settingsOpen && (
            <div id="mobile-display-menu" className="cinema-card absolute right-0 top-14 z-50 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border p-4 shadow-2xl">
              <CinemaDisplaySettings compact />
              <div className="cinema-separator mt-4 border-t pt-4">
                {signedIn ? (
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="cinema-outline w-full rounded-xl px-4 py-2.5 text-sm font-bold">Sign out</button>
                  </form>
                ) : (
                  <Link href="/login" className="cinema-accent-bg flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold">Sign in</Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-5 grid gap-2 lg:hidden ${tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} aria-label="Primary sections">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${tab.active ? "cinema-accent-bg" : "cinema-card"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
