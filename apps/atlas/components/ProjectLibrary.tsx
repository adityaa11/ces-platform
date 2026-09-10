"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AccessRole, MembershipFixture, ProjectFixture, ProjectWorkspaceFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { ProjectCard } from "./ProjectCard";
import { demoHref } from "./WorkspaceLens";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type PendingAccessChange = { memberId: string; nextRole?: AccessRole; type: "role" | "remove" };
const roleLabels: Record<AccessRole, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

export function ProjectLibrary({ user, projects, workspace, scenario }: { user: User; projects: ProjectFixture[]; workspace?: ProjectWorkspaceFixture; scenario?: string }) {
  const projectGridRef = useRef<HTMLDivElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [shareProject, setShareProject] = useState<ProjectFixture | null>(null);
  const [membersByProject, setMembersByProject] = useState<Record<string, MembershipFixture[]>>(() => Object.fromEntries(projects.map((project) => [project.id, project.id === workspace?.project.id ? workspace.memberships : []])));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AccessRole>("viewer");
  const [pendingAccessChange, setPendingAccessChange] = useState<PendingAccessChange | null>(null);
  const canCreate = user.role === "owner" || user.role === "editor";
  const canShare = user.role === "owner";
  const members = shareProject ? (membersByProject[shareProject.id] ?? []) : [];
  useEffect(() => {
    const grid = projectGridRef.current;
    if (!grid) return;
    const container = grid.parentElement ?? grid;
    const minimumCardWidth = 304;
    const maximumCardWidth = 400;
    const gap = 16;
    let previousFormula = "";
    let frame = 0;
    const updateGridFormula = () => {
      const availableWidth = grid.clientWidth;
      const candidateColumns = Math.floor((availableWidth + gap) / (minimumCardWidth + gap));
      const columns = Math.max(1, Math.min(projects.length || 1, candidateColumns));
      const fluidWidth = (availableWidth - gap * (columns - 1)) / columns;
      const cardWidth = Math.min(maximumCardWidth, Math.max(0, fluidWidth));
      const formula = `${columns}:${cardWidth}`;
      if (formula === previousFormula) return;
      previousFormula = formula;
      grid.style.setProperty("--project-column-count", String(columns));
      grid.style.setProperty("--project-card-width", `${cardWidth}px`);
    };
    const scheduleFormula = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateGridFormula);
    };
    const observer = new ResizeObserver(scheduleFormula);
    observer.observe(container);
    scheduleFormula();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [projects.length]);
  function createProject() { setCreateOpen(false); setProcessing(true); setProjectName(""); setSelectedFiles([]); }
  function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!shareProject) return;
    setMembersByProject((current) => ({ ...current, [shareProject.id]: [...(current[shareProject.id] ?? []).filter((member) => member.email !== email), { id: `invite-${email}`, name: email.split("@")[0], email, role: inviteRole, status: "invited" }] }));
    setInviteEmail("");
  }
  function confirmAccessChange() {
    if (!pendingAccessChange) return;
    if (shareProject) setMembersByProject((current) => ({ ...current, [shareProject.id]: (current[shareProject.id] ?? []).map((member) => member.id !== pendingAccessChange.memberId ? member : pendingAccessChange.type === "remove" ? { ...member, status: "removed" } : { ...member, role: pendingAccessChange.nextRole ?? member.role }) }));
    setPendingAccessChange(null);
  }
  const changingMember = members.find((member) => member.id === pendingAccessChange?.memberId);
  return <AppShell contentClassName="project-library-content" projectNavigation={Boolean(workspace)} projects={projects} user={user} workspace={workspace}>
    <div className="project-library-page">
      <section className="workspace-heading">
        <p className="eyebrow">Your workspace</p>
        <div className="library-heading-row">
          <div>
            <h1>Projects</h1>
            <p>See what each project is, whether it has accepted Master work, and what to do next.</p>
          </div>
          {canCreate && <Button onClick={() => setCreateOpen(true)} type="button">+ New project</Button>}
        </div>
      </section>

      <section aria-labelledby="project-lifecycle-title" className="project-lifecycle-guide"><div><span aria-hidden="true" className="project-lifecycle-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span><div><h2 id="project-lifecycle-title">Quick guide</h2><p>Get from PRDs to a published project in four simple steps.</p></div></div><ol><li><strong>Create</strong><span>Start a project and upload PRDs.</span></li><li><strong>Extract</strong><span>Atlas builds Initial Draft work.</span></li><li><strong>Review</strong><span>Check the draft before publication.</span></li><li><strong>Publish</strong><span>Accept the first Master version.</span></li></ol></section>

      <section aria-labelledby="project-list-title" className="repository-projects"><header><h2 id="project-list-title">Your projects</h2><span>{projects.length} repositories</span></header><div aria-label="Projects" className="project-grid" ref={projectGridRef}>
        {projects.map((project) => {
          const href = demoHref({ projectId: project.id, scenario, view: "workflow" });
          return <ProjectCard canShare={canShare} href={href} key={project.id} onShare={setShareProject} project={project} />;
        })}
      </div></section>

      {projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}
      {processing && <aside aria-live="polite" className="processing-notice"><strong>Atlas is processing your project</strong><span>Extracting text and structure</span><button onClick={() => setProcessing(false)} type="button">Dismiss</button></aside>}
      {createOpen && <Dialog onClose={() => setCreateOpen(false)} title="Create a project"><form className="create-project-form" onSubmit={(event) => { event.preventDefault(); createProject(); }}><label>Project name<input onChange={(event) => setProjectName(event.target.value)} required value={projectName} /></label><label>PRD PDFs<input accept="application/pdf" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))} required type="file" /></label><p>{selectedFiles.length ? `${selectedFiles.length} PDF${selectedFiles.length > 1 ? "s" : ""} selected. Files and processing are simulated in this prototype.` : "Select at least one PDF to create a project."}</p><div className="dialog-actions"><Button tone="secondary" onClick={() => setCreateOpen(false)} type="button">Cancel</Button><Button disabled={!projectName.trim() || !selectedFiles.length} type="submit">Create and process</Button></div></form></Dialog>}
      {shareProject && !pendingAccessChange && <Dialog onClose={() => setShareProject(null)} title={`Share ${shareProject.name}`}><div className="share-panel"><p>Only people invited by email can access this private project.</p><form className="invite-form" onSubmit={inviteMember}><label>Email<input onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" required type="email" value={inviteEmail} /></label><label>Role<select onChange={(event) => setInviteRole(event.target.value as AccessRole)} value={inviteRole}><option value="viewer">Viewer — can inspect</option><option value="editor">Editor — can contribute</option></select></label><Button type="submit">Invite</Button></form><section aria-label="Collaborators" className="collaborator-list"><h3>People with access</h3>{members.map((member) => <div className={`collaborator ${member.status === "removed" ? "collaborator-removed" : ""}`} key={member.id}><div><strong>{member.name}</strong><span>{member.email}</span></div>{member.status === "removed" ? <em>Access removed</em> : member.role === "owner" ? <em>Owner</em> : <><select aria-label={`Role for ${member.name}`} onChange={(event) => setPendingAccessChange({ memberId: member.id, nextRole: event.target.value as AccessRole, type: "role" })} value={member.role}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button className="remove-access" onClick={() => setPendingAccessChange({ memberId: member.id, type: "remove" })} tone="quiet" type="button">Remove</Button><em>{member.status === "invited" ? "Invite sent" : "Active"}</em></>}</div>)}</section></div></Dialog>}
      {pendingAccessChange && changingMember && <Dialog onClose={() => setPendingAccessChange(null)} title={pendingAccessChange.type === "remove" ? "Remove project access?" : "Change project access?"}><div className="access-confirmation"><p>{pendingAccessChange.type === "remove" ? `${changingMember.name} will no longer be able to open this project.` : `${changingMember.name} will become a ${roleLabels[pendingAccessChange.nextRole ?? changingMember.role]}.`}</p><div className="dialog-actions"><Button onClick={() => setPendingAccessChange(null)} tone="secondary" type="button">Cancel</Button><Button onClick={confirmAccessChange} type="button">Confirm change</Button></div></div></Dialog>}
    </div>
  </AppShell>;
}
