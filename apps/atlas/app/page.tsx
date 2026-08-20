import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Atlas workspace",
  description: "Project understanding, made visible.",
};

export default function Home() {
  return (
    <main className="landing">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Atlas home">
          <span aria-hidden="true">A</span>
          Atlas
        </Link>
        <nav className="landing-nav" aria-label="Account actions">
          <a href="#signin">Sign in</a>
          <a className="button-link" href="#signup">Sign up</a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="landing-title">
        <h1 id="landing-title">Project understanding, made visible.</h1>
        <p>
          Atlas turns evolving PRDs into source-grounded workflows, facts, and
          baseline awareness - without losing the original wording.
        </p>
        <div className="hero-actions">
          <a className="button-link" href="#signup">Sign up</a>
          <a className="button-link button-secondary" href="/demo">Explore demo</a>
        </div>
      </section>
    </main>
  );
}
