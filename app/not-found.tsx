import Link from "next/link";

export default function NotFound() {
  return (
    <main className="cinema-app cinema-page flex items-center justify-center px-5 py-10">
      <section className="cinema-card w-full max-w-md rounded-2xl border p-6 text-center">
        <p className="cinema-accent-text text-sm font-bold">404</p>
        <h1 className="mt-2 text-2xl font-bold">This page isn&apos;t in the collection</h1>
        <p className="cinema-muted mt-3 text-sm">The film or profile may have been removed. Find another film to explore.</p>
        <Link href="/" className="cinema-accent-bg mt-5 inline-flex min-h-11 items-center rounded-xl px-5 py-2 font-bold">Explore films</Link>
      </section>
    </main>
  );
}
