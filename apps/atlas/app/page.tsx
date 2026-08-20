import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "../components/PublicHeader";

export const metadata: Metadata = {
  title: "Atlas workspace",
  description: "Project understanding, made visible.",
};

export default function Home() {
  return (
    <main className="landing">
      <PublicHeader />

      <section className="hero" aria-labelledby="landing-title">
        <h1 id="landing-title">Project understanding, made visible.</h1>
        <p>
          Atlas turns evolving PRDs into source-grounded workflows, facts, and
          baseline awareness - without losing the original wording.
        </p>
        <div className="hero-actions">
          <Link className="button-link" href="/sign-up">Sign up</Link>
          <Link className="button-link button-secondary" href="/demo">Explore demo</Link>
        </div>
      </section>
    </main>
  );
}
