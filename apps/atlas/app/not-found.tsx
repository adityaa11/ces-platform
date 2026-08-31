import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-card">
        <p className="eyebrow">Atlas workspace</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>
          This Atlas route is unavailable or may have moved. Return to the
          workspace to continue with the available project views.
        </p>
        <Link className="button-link" href="/demo">Go to projects</Link>
      </section>
    </main>
  );
}
