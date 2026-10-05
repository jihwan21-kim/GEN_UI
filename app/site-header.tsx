"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const links = [
    ["/", "The feed"],
    ["/restaurants", "City bites"],
    ...(signedIn
      ? [
          ["/private", "My space"],
          ["/profile", "Profile"],
        ]
      : []),
  ];
  return (
    <header className="site-header">
      <div className="site-nav">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            S.
          </span>
          <span>
            SIDE OF NYC
            <span className="brand-caption">
              A little campus. A lot of city.
            </span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="nav-links">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`nav-link ${path === href ? "is-active" : ""}`}
            >
              {label}
            </Link>
          ))}
          {signedIn ? (
            <form action="/auth/signout" method="post">
              <button className="button button-small button-secondary">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className="button button-small">
              Sign in <span aria-hidden="true">↗</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
