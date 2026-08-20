import { atlasWorkspaceFixture } from "@atlas/fixtures";
import Link from "next/link";
import { StatusBadge } from "../../components/StatusBadge";

export default function DemoPage() {
  return <main className="demo"><header className="topbar"><Link className="brand" href="/"><span>A</span>Atlas</Link><Link href="/">Exit demo</Link></header><section className="projects"><h1>Demo workspace</h1><div className="project-grid">{atlasWorkspaceFixture.projects.map((project) => <article key={project.id} className="project-card"><StatusBadge status={project.status} /><h2>{project.name}</h2><p>{project.lastActivity}</p><small>{project.prdCount} PRDs · {project.collaborators} collaborators</small></article>)}</div></section></main>;
}
