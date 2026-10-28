export default function Loading() {
  return (
    <main className="cinema-app cinema-page px-4 py-8 sm:px-8" aria-busy="true" aria-label="Loading movie page">
      <div className="mx-auto max-w-7xl">
        <p role="status" className="cinema-muted text-sm">Loading films and reviews…</p>
        <div aria-hidden="true" className="cinema-card mt-5 h-52 rounded-2xl border" />
        <div aria-hidden="true" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="cinema-muted-card h-72 rounded-2xl border" />)}
        </div>
      </div>
    </main>
  );
}
