import { getFixtureScenario } from "@atlas/fixtures";
import { AppShell } from "../../components/AppShell";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";

export default function DemoPage() {
  const scenario = getFixtureScenario("owner-ready");
  return <AppShell user={scenario.session}><section className="workspace-heading"><p className="eyebrow">Your workspace</p><h1>Projects</h1><p>Projects are private unless you explicitly share them.</p></section><section className="project-grid">{scenario.projects.map((project) => <article key={project.id} className="project-card"><div className="card-topline"><span className="project-mark">{project.name[0]}</span><StatusBadge status={project.status} /></div><h2>{project.name}</h2><p>{project.lastActivity}</p><footer><span>{project.prdCount} PRDs</span><span>{project.collaborators} collaborators</span></footer></article>)}</section>{scenario.projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}</AppShell>;
}
