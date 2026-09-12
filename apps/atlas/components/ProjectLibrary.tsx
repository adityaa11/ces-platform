"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFixtureProject, projectCardStressLimits, projectIdPattern, type AccessRole, type MembershipFixture, type PrdFileMetadata, type ProjectCreateRequest, type ProjectFixture, type ProjectWorkspaceFixture } from "@atlas/fixtures";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { ProjectCard } from "./ProjectCard";
import { demoHref } from "./WorkspaceLens";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type PendingAccessChange = { memberId: string; nextRole?: AccessRole; type: "role" | "remove" };
type FieldErrors = Partial<Record<"projectId" | "projectName" | "projectDescription" | "prdFiles", string>>;
const roleLabels: Record<AccessRole, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };
const encodeFile = async (file: File) => { const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return { name: file.name, base64: btoa(binary) }; };
const workspaceTokenCandidates = () => Array.from({ length: 3 }, () => Array.from(crypto.randomUUID().replaceAll("-", "").slice(0, 12), (character) => "abcdefghijklmnopqrstuvwxyz234567"[Number.parseInt(character, 16) * 2]).join(""));

export function ProjectLibrary({ user, projects, workspace, scenario }: { user: User; projects: ProjectFixture[]; workspace?: ProjectWorkspaceFixture; scenario?: string }) {
  const projectGridRef = useRef<HTMLDivElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [libraryProjects, setLibraryProjects] = useState(projects);
  const [knownWorkspaceIds, setKnownWorkspaceIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingJob, setProcessingJob] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [shareProject, setShareProject] = useState<ProjectFixture | null>(null);
  const [membersByProject, setMembersByProject] = useState<Record<string, MembershipFixture[]>>(() => Object.fromEntries(projects.map((project) => [project.id, project.id === workspace?.project.id ? workspace.memberships : []])));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AccessRole>("viewer");
  const [pendingAccessChange, setPendingAccessChange] = useState<PendingAccessChange | null>(null);
  const canCreate = user.role === "owner" || user.role === "editor";
  const canShare = user.role === "owner";
  const members = shareProject ? (membersByProject[shareProject.id] ?? []) : [];
  useEffect(() => { fetch("/api/local-fixtures").then(async (response) => response.ok ? response.json() : []).then((records: Array<{ project: ProjectFixture; initialDraftWorkspace: { workspaceId: string } }>) => { setLibraryProjects((current) => [...current, ...records.map((record) => record.project).filter((project) => !current.some((item) => item.id === project.id))]); setKnownWorkspaceIds(records.map((record) => record.initialDraftWorkspace.workspaceId)); }).catch(() => {}); }, []);
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
      const columns = Math.max(1, Math.min(libraryProjects.length || 1, candidateColumns));
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
  }, [libraryProjects.length]);
  function resetCreateForm() { setProjectId(""); setProjectName(""); setProjectDescription(""); setSelectedFiles([]); setErrors({}); setSubmitState("idle"); }
  function deriveProjectId(name: string) { return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, projectCardStressLimits.id); }
  function validateCreateRequest(): FieldErrors {
    const next: FieldErrors = {};
    if (!projectId.trim()) next.projectId = "Enter a project ID.";
    else if (projectId.length < 3 || projectId.length > projectCardStressLimits.id || !projectIdPattern.test(projectId)) next.projectId = "Use 3–48 lowercase letters, numbers, and hyphens, for example customer-portal-v2.";
    else if (libraryProjects.some((project) => project.id === projectId)) next.projectId = "That project ID is already in use.";
    if (!projectName.trim()) next.projectName = "Enter a project name.";
    else if (projectName.length > projectCardStressLimits.name) next.projectName = "Project name must be 80 characters or fewer.";
    if (projectDescription.length > projectCardStressLimits.description) next.projectDescription = "Project description must be 280 characters or fewer.";
    if (!selectedFiles.length) next.prdFiles = "Select at least one PRD PDF.";
    else if (selectedFiles.some((file) => file.type !== "application/pdf")) next.prdFiles = "Only PDF files can be added.";
    return next;
  }
  async function createProject(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const nextErrors = validateCreateRequest(); setErrors(nextErrors); if (Object.keys(nextErrors).length) { setSubmitState("error"); return; } setSubmitState("loading"); try { const request: ProjectCreateRequest = { projectId, projectName: projectName.trim(), projectDescription: projectDescription.trim(), prdFiles: selectedFiles.map((file): PrdFileMetadata => ({ name: file.name, type: "application/pdf", size: file.size })) }; const created = createFixtureProject(request, workspaceTokenCandidates(), knownWorkspaceIds); const response = await fetch("/api/local-fixtures", { body: JSON.stringify({ ...created, files: await Promise.all(selectedFiles.map(encodeFile)) }), headers: { "content-type": "application/json" }, method: "POST" }); const saved = await response.json(); if (!response.ok) throw new Error(saved.error); setLibraryProjects((current) => [...current, saved.project]); setKnownWorkspaceIds((current) => [...current, saved.initialDraftWorkspace.workspaceId]); setProcessingJob(saved.processingJob.message); setProcessing(true); setCreateOpen(false); resetCreateForm(); } catch (error) { setSubmitState("error"); setErrors({ prdFiles: error instanceof Error ? error.message : "Project could not be saved." }); } }
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
  return <AppShell contentClassName="project-library-content" projectNavigation={Boolean(workspace)} projects={libraryProjects} user={user} workspace={workspace}>
    <div className="project-library-page">
      <section className="workspace-heading">
        <p className="eyebrow">Your workspace</p>
        <div className="library-heading-row">
          <div>
            <h1>Projects</h1>
            <p>See what each project is, whether it has accepted Master work, and what to do next.</p>
          </div>
          {canCreate && <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }} type="button">+ New project</Button>}
        </div>
      </section>

      <section aria-labelledby="project-lifecycle-title" className="project-lifecycle-guide"><div><span aria-hidden="true" className="project-lifecycle-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span><div><h2 id="project-lifecycle-title">Quick guide</h2><p>Get from PRDs to a published project in four simple steps.</p></div></div><ol><li><strong>Create</strong><span>Start a project and upload PRDs.</span></li><li><strong>Extract</strong><span>Atlas builds Initial Draft work.</span></li><li><strong>Review</strong><span>Check the draft before publication.</span></li><li><strong>Publish</strong><span>Accept the first Master version.</span></li></ol></section>

      <section aria-labelledby="project-list-title" className="repository-projects"><header><h2 id="project-list-title">Your projects</h2><span>{libraryProjects.length} repositories</span></header><div aria-label="Projects" className="project-grid" ref={projectGridRef}>
        {libraryProjects.map((project) => {
          const href = demoHref({ projectId: project.id, scenario, view: "workflow" });
          return <ProjectCard canShare={canShare} href={href} key={project.id} onShare={setShareProject} project={project} />;
        })}
      </div></section>

      {libraryProjects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}
      {processing && <aside aria-live="polite" className="processing-notice"><strong>{processingJob ? `Project ${libraryProjects.at(-1)?.name ?? ""} created. Extraction has started.` : "Atlas is processing your project"}</strong><span>{processingJob ?? "Extracting text and structure"}</span><button onClick={() => setProcessing(false)} type="button">Dismiss</button></aside>}
      {createOpen && <Dialog closeOnBackdrop={false} closeOnEscape={false} onClose={() => { setCreateOpen(false); resetCreateForm(); }} title="Create a project"><form className="create-project-form" noValidate onSubmit={createProject}>
        <label htmlFor="project-id">Project ID <span>* Required · 3–48 lowercase letters, numbers, and hyphens</span><input aria-describedby="project-id-count project-id-error" aria-invalid={Boolean(errors.projectId)} id="project-id" maxLength={projectCardStressLimits.id} onChange={(event) => setProjectId(event.target.value)} placeholder="Example: project-id-001" required value={projectId} /></label><p className="field-count" id="project-id-count">{projectId.length}/48 characters</p>{errors.projectId && <p className="field-error" id="project-id-error" role="alert">{errors.projectId}</p>}
        <label htmlFor="project-name">Project Name <span>* Required</span><input aria-describedby="project-name-count project-name-error" id="project-name" maxLength={projectCardStressLimits.name} onChange={(event) => { const value = event.target.value; setProjectName(value); if (!projectId) setProjectId(deriveProjectId(value)); }} required value={projectName} /></label><p className="field-count" id="project-name-count">{projectName.length}/80 characters</p>{errors.projectName && <p className="field-error" id="project-name-error" role="alert">{errors.projectName}</p>}
        <label htmlFor="project-description">Project Description <span>Optional</span><textarea aria-describedby="project-description-count project-description-error" id="project-description" maxLength={projectCardStressLimits.description} onChange={(event) => setProjectDescription(event.target.value)} value={projectDescription} /></label><p className="field-count" id="project-description-count">{projectDescription.length}/280 characters</p>{errors.projectDescription && <p className="field-error" id="project-description-error" role="alert">{errors.projectDescription}</p>}
        <label htmlFor="project-prds">PRD PDFs <span>* Required</span><input accept="application/pdf,.pdf" aria-describedby="project-prds-help project-prds-error" id="project-prds" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))} required type="file" /></label><p className="field-help" id="project-prds-help">{selectedFiles.length ? `${selectedFiles.length} PDF${selectedFiles.length === 1 ? "" : "s"} selected. Files and processing are simulated in this prototype.` : "Select one or more PDF files."}</p>{errors.prdFiles && <p className="field-error" id="project-prds-error" role="alert">{errors.prdFiles}</p>}
        <div className="dialog-actions"><Button disabled={submitState === "loading"} type="submit">{submitState === "loading" ? "Creating…" : "Create and process"}</Button></div></form></Dialog>}
      {shareProject && !pendingAccessChange && <Dialog onClose={() => setShareProject(null)} title={`Share ${shareProject.name}`}><div className="share-panel"><p>Only people invited by email can access this private project.</p><form className="invite-form" onSubmit={inviteMember}><label>Email<input onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" required type="email" value={inviteEmail} /></label><label>Role<select onChange={(event) => setInviteRole(event.target.value as AccessRole)} value={inviteRole}><option value="viewer">Viewer — can inspect</option><option value="editor">Editor — can contribute</option></select></label><Button type="submit">Invite</Button></form><section aria-label="Collaborators" className="collaborator-list"><h3>People with access</h3>{members.map((member) => <div className={`collaborator ${member.status === "removed" ? "collaborator-removed" : ""}`} key={member.id}><div><strong>{member.name}</strong><span>{member.email}</span></div>{member.status === "removed" ? <em>Access removed</em> : member.role === "owner" ? <em>Owner</em> : <><select aria-label={`Role for ${member.name}`} onChange={(event) => setPendingAccessChange({ memberId: member.id, nextRole: event.target.value as AccessRole, type: "role" })} value={member.role}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><Button className="remove-access" onClick={() => setPendingAccessChange({ memberId: member.id, type: "remove" })} tone="quiet" type="button">Remove</Button><em>{member.status === "invited" ? "Invite sent" : "Active"}</em></>}</div>)}</section></div></Dialog>}
      {pendingAccessChange && changingMember && <Dialog onClose={() => setPendingAccessChange(null)} title={pendingAccessChange.type === "remove" ? "Remove project access?" : "Change project access?"}><div className="access-confirmation"><p>{pendingAccessChange.type === "remove" ? `${changingMember.name} will no longer be able to open this project.` : `${changingMember.name} will become a ${roleLabels[pendingAccessChange.nextRole ?? changingMember.role]}.`}</p><div className="dialog-actions"><Button onClick={() => setPendingAccessChange(null)} tone="secondary" type="button">Cancel</Button><Button onClick={confirmAccessChange} type="button">Confirm change</Button></div></div></Dialog>}
    </div>
  </AppShell>;
}
