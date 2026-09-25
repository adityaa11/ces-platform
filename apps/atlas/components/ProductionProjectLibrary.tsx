import { AppShell } from "./AppShell";
import { EmptyState } from "./EmptyState";
import { ProductionProjectCard } from "./ProductionProjectCard";
import type { AuthenticatedUser } from "./authenticated-user";
import type { ProjectCardViewModel } from "./project-card-view-model";

/** Production-only library surface. It deliberately has no fixture dependency. */
export function ProductionProjectLibrary({ projects, user }: { projects: readonly ProjectCardViewModel[]; user: AuthenticatedUser }) {
  return <AppShell contentClassName="project-library-content" homeHref="/home" projectNavigation={false} projects={[]} signOutMode="session" user={user}>
    <div className="project-library-page">
      <section className="workspace-heading"><p className="eyebrow">Your workspace</p><div className="library-heading-row"><div><h1>Projects</h1><p>See what each project is, whether it has accepted Master work, and what to do next.</p></div></div></section>
      <section aria-labelledby="project-lifecycle-title" className="project-lifecycle-guide"><div><span aria-hidden="true" className="project-lifecycle-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span><div><h2 id="project-lifecycle-title">Quick guide</h2><p>Get from PRDs to a published project in four simple steps.</p></div></div><ol><li><strong>Create</strong><span>Start a project and upload PRDs.</span></li><li><strong>Extract</strong><span>Atlas builds Initial Draft work.</span></li><li><strong>Review</strong><span>Check the draft before publication.</span></li><li><strong>Publish</strong><span>Accept the first Master version.</span></li></ol></section>
      <section aria-labelledby="project-list-title" className="repository-projects"><header><h2 id="project-list-title">Your projects</h2><span>{projects.length} repositories</span></header><div aria-label="Projects" className="project-grid">{projects.map((project) => <ProductionProjectCard key={project.id} project={project} />)}</div></section>
      {projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}
    </div>
  </AppShell>;
}
