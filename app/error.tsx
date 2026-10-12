"use client";

import Link from "next/link";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="cinema-app cinema-page flex items-center justify-center px-5 py-10">
      <section className="cinema-card w-full max-w-md rounded-2xl border p-6 text-center" role="alert">
        <h1 className="text-2xl font-bold">Couldn&apos;t load this page</h1>
        <p className="cinema-muted mt-3 text-sm leading-relaxed">Please try again, or return to the film collection.</p>
        <button type="button" onClick={retry} className="cinema-accent-bg mt-5 min-h-11 rounded-xl px-5 py-2 font-bold">Try again</button>
        <Link href="/" className="cinema-accent-text mt-4 block text-sm font-semibold">Back to films</Link>
      </section>
    </main>
  );
}
