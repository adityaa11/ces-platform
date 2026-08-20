import type { Metadata } from "next";
import { atlasWorkspaceFixture } from "@atlas/fixtures";
import { StatusBadge } from "../components/StatusBadge";

export const metadata: Metadata = {
  title: "Atlas workspace",
  description: "Project understanding, made visible.",
};

export default function Home() {
  return (
    <main className="atlas-home">
      <header className="topbar">
        <a className="brand" href="#projects" aria-label="Atlas home">
          <span aria-hidden="true">A</span>
          Atlas
        </a>
        <div className="profile" aria-label={`Signed in as ${atlasWorkspaceFixture.user.name}`}>
          <span className="avatar" aria-hidden="true">NH</span>
          <span>
            <strong>{atlasWorkspaceFixture.user.name}</strong>
            <small>{atlasWorkspaceFixture.user.email}</small>
          </span>
        </div>
      </header>

      <section className="intro" aria-labelledby="workspace-title">
        <p className="eyebrow">Fixture-powered prototype</p>
        <h1 id="workspace-title">Project understanding, made visible.</h1>
        <p>
          Atlas turns evolving PRDs into source-grounded workflows, facts, and
          baseline awareness - without losing the original wording.
        </p>
      </section>

      <section id="projects" className="projects" aria-labelledby="projects-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h2 id="projects-title">Projects</h2>
          </div>
          <button type="button">New project</button>
        </div>
        <div className="project-grid">
          {atlasWorkspaceFixture.projects.map((project) => (
            <article key={project.id} className="project-card">
              <div className="card-topline">
                <span className="project-mark" aria-hidden="true">{project.name.charAt(0)}</span>
                <StatusBadge status={project.status} />
              </div>
              <h3>{project.name}</h3>
              <p>{project.lastActivity}</p>
              <footer>
                <span>{project.prdCount} PRDs</span>
                <span>{project.collaborators} collaborators</span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
