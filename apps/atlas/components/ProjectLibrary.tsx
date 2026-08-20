"use client";

import { useState } from "react";
import type { ProjectFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
export function ProjectLibrary({ user, projects }: { user: User; projects: ProjectFixture[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [processing, setProcessing] = useState(false);
  const canCreate = user.role === "owner" || user.role === "editor";
  function createProject() { setCreateOpen(false); setProcessing(true); }
  return <AppShell sidebarAction={canCreate ? <Button onClick={() => setCreateOpen(true)} type="button">+ New project</Button> : undefined} user={user}><section className="workspace-heading"><p className="eyebrow">Your workspace</p><h1>Projects</h1><p>Projects are private unless you explicitly share them.</p></section><section className="project-grid">{projects.map((project) => <article key={project.id} className="project-card"><div className="card-topline"><span className="project-mark">{project.name[0]}</span><StatusBadge status={project.status} /></div><h2>{project.name}</h2><p>{project.lastActivity}</p><footer><span>{project.prdCount} PRDs</span><span>{project.collaborators} collaborators</span>{project.isShared && <span>Shared with you</span>}</footer></article>)}</section>{projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}{processing && <aside aria-live="polite" className="processing-notice"><strong>Atlas is processing your project</strong><span>Extracting text and structure</span><button onClick={() => setProcessing(false)} type="button">Dismiss</button></aside>}{createOpen && <Dialog onClose={() => setCreateOpen(false)} title="Create a project"><form className="create-project-form" onSubmit={(event) => { event.preventDefault(); createProject(); }}><label>Project name<input onChange={(event) => setProjectName(event.target.value)} required value={projectName} /></label><label>PRD PDFs<input accept="application/pdf" multiple type="file" /></label><p>Files and processing are simulated in this prototype.</p><div className="dialog-actions"><Button tone="secondary" onClick={() => setCreateOpen(false)} type="button">Cancel</Button><Button disabled={!projectName.trim()} type="submit">Create and process</Button></div></form></Dialog>}</AppShell>;
}
