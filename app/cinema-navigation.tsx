import Link from "next/link";
import { CinemaDisplaySettings } from "./cinema-theme";

export default function CinemaNavigation({
  signedIn = false,
}: {
  signedIn?: boolean;
}) {
  return (
    <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="inline-flex items-center gap-3 text-base font-black tracking-tight cinema-text sm:text-lg">
        <span className="cinema-accent-bg flex h-10 w-10 items-center justify-center rounded-xl text-xl" aria-hidden="true">✦</span>
        OneLine <span className="cinema-accent-text">Cinema</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold cinema-muted hover:underline">
          Films
        </Link>
        <Link href="/leaderboard" className="rounded-lg px-3 py-2 text-sm font-semibold cinema-muted hover:underline">
          Rankings
        </Link>
        <CinemaDisplaySettings />
        {signedIn ? (
          <>
            <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-semibold cinema-muted hover:underline">
              Profile
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-lg border px-3 py-2 text-sm font-semibold cinema-card hover:underline">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="cinema-outline rounded-xl px-4 py-2 text-sm font-bold">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
