"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { AccessRole, MembershipFixture, ProjectFixture, ProjectWorkspaceFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { demoHref } from "./WorkspaceLens";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type PendingAccessChange = { memberId: string; nextRole?: AccessRole; type: "role" | "remove" };
const roleLabels: Record<AccessRole, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

export function ProjectLibrary({ user, projects, workspace, scenario }: { user: User; projects: ProjectFixture[]; workspace?: ProjectWorkspaceFixture; scenario?: string }) {
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
            <p>Projects are private unless you explicitly share them. Open a ready project or create a new one from PRD PDFs.</p>
          </div>
          {canCreate && <Button onClick={() => setCreateOpen(true)} type="button">+ New project</Button>}
        </div>
      </section>

      <section aria-label="Projects" className="project-grid">
        {projects.map((project) => {
          const isReady = project.status === "ready";
          const href = typeof window === "undefined" ? `/demo?${new URLSearchParams({ ...(scenario ? { scenario } : {}), projectId: project.id, view: "workflow" }).toString()}` : demoHref({ projectId: project.id, view: "workflow" });
          return <article className="project-card" key={project.id}>
            <div className="card-topline"><span className="project-mark">{project.name[0]}</span><StatusBadge status={project.status} /></div>
            <h2>{isReady ? <Link href={href}>{project.name}</Link> : <span>{project.name}</span>}</h2>
            <p>{project.lastActivity}</p>
            <footer><span>{project.prdCount} PRDs</span><span>{project.collaborators} collaborators</span>{project.isShared && <span>Shared with you</span>}</footer>
            <div className="project-card-actions">
              {isReady ? <Link className="project-open" href={href}>Open project →</Link> : <span className="project-unavailable">{project.status === "needs-attention" ? "Review required before opening" : "Available after processing"}</span>}
              {canShare && <Button className="card-share" onClick={() => setShareProject(project)} tone="secondary" type="button">Share</Button>}
            </div>
          </article>;
        })}
      </section>

      {projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}
      {processing && <aside aria-live="polite" className="processing-notice"><strong>Atlas is processing your project</strong><span>Extracting text and structure</span><button onClick={() => setProcessing(false)} type="button">Dismiss</button></aside>}
      {createOpen && <Dialog onClose={() => setCreateOpen(false)} title="Create a project"><form className="create-project-form" onSubmit={(event) => { event.preventDefault(); createProject(); }}><label>Project name<input onChange={(event) => setProjectName(event.target.value)} required value={projectName} /></label><label>PRD PDFs<input accept="application/pdf" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))} required type="file" /></label><p>{selectedFiles.length ? `${selectedFiles.length} PDF${selectedFiles.length > 1 ? "s" : ""} selected. Files and processing are simulated in this prototype.` : "Select at least one PDF to create a project."}</p><div className="dialog-actions"><Button tone="secondary" onClick={() => setCreateOpen(false)} type="button">Cancel</Button><Button disabled={!projectName.trim() || !selectedFiles.length} type="submit">Create and process</Button></div></form></Dialog>}
      {shareProject && !pendingAccessChange && <Dialog onClose={() => setShareProject(null)} title={`Share ${shareProject.name}`}><div className="share-panel"><p>Only people invited by email can access this private project.</p><form className="invite-form" onSubmit={inviteMember}><label>Email<input onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" required type="email" value={inviteEmail} /></label><label>Role<select onChange={(event) => setInviteRole(event.target.value as AccessRole)} value={inviteRole}><option value="viewer">Viewer — can inspect</option><option value="editor">Editor — can contribute</option></select></label><Button type="submit">Invite</Button></form><section aria-label="Collaborators" className="collaborator-list"><h3>People with access</h3>{members.map((member) => <div className={`collaborator ${member.status === "removed" ? "collaborator-removed" : ""}`} key={member.id}><div><strong>{member.name}</strong><span>{member.email}</span></div>{member.status === "removed" ? <em>Access removed</em> : member.role === "owner" ? <em>Owner</em> : <><select aria-label={`Role for ${member.name}`} onChange={(event) => setPendingAccessChange({ memberId: member.id, nextRole: event.target.value as AccessRole, type: "role" })} value={member.role}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button className="remove-access" onClick={() => setPendingAccessChange({ memberId: member.id, type: "remove" })} tone="quiet" type="button">Remove</Button><em>{member.status === "invited" ? "Invite sent" : "Active"}</em></>}</div>)}</section></div></Dialog>}
      {pendingAccessChange && changingMember && <Dialog onClose={() => setPendingAccessChange(null)} title={pendingAccessChange.type === "remove" ? "Remove project access?" : "Change project access?"}><div className="access-confirmation"><p>{pendingAccessChange.type === "remove" ? `${changingMember.name} will no longer be able to open this project.` : `${changingMember.name} will become a ${roleLabels[pendingAccessChange.nextRole ?? changingMember.role]}.`}</p><div className="dialog-actions"><Button onClick={() => setPendingAccessChange(null)} tone="secondary" type="button">Cancel</Button><Button onClick={confirmAccessChange} type="button">Confirm change</Button></div></div></Dialog>}
    </div>
  </AppShell>;
}
