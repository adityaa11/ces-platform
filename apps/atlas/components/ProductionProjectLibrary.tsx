"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { ProductionProjectCard } from "./ProductionProjectCard";
import { productionProjectLimits, submitProductionProject, validateProductionProject, type ProductionProjectErrors } from "./production-project-create";
import type { AuthenticatedUser } from "./authenticated-user";
import type { ProjectCardViewModel } from "./project-card-view-model";

export function ProductionProjectLibrary({ projects, user }: { projects: readonly ProjectCardViewModel[]; user: AuthenticatedUser }) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [projectId, setProjectId] = useState(""), [projectName, setProjectName] = useState(""), [projectDescription, setProjectDescription] = useState(""), [files, setFiles] = useState<File[]>([]), [errors, setErrors] = useState<ProductionProjectErrors>({}), [submitState, setSubmitState] = useState<"idle" | "loading" | "error">("idle"), [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const grid = gridRef.current; if (!grid) return;
    const update = () => { const gap = 16, minimum = 304, maximum = 400, width = grid.clientWidth, columns = Math.max(1, Math.min(projects.length || 1, Math.floor((width + gap) / (minimum + gap)))); grid.style.setProperty("--project-column-count", String(columns)); grid.style.setProperty("--project-card-width", `${Math.min(maximum, (width - gap * (columns - 1)) / columns)}px`); };
    const observer = new ResizeObserver(update); observer.observe(grid); update(); return () => observer.disconnect();
  }, [projects.length]);
  const reset = () => { setProjectId(""); setProjectName(""); setProjectDescription(""); setFiles([]); setErrors({}); setSubmitState("idle"); };
  const close = () => { setOpen(false); reset(); };
  const deriveProjectId = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, productionProjectLimits.id);
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const input = { projectId, projectName, projectDescription, files }, nextErrors = validateProductionProject(input); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setSubmitState("error"); return; }
    setSubmitState("loading");
    try { const created = await submitProductionProject(input); setNotice(`${created.project.name} was created. Its PRDs are waiting for extraction.`); close(); router.refresh(); }
    catch (error) { setSubmitState("error"); setErrors({ prdFiles: error instanceof Error ? error.message : "Unable to create the project. Please try again." }); }
  }
  return <AppShell contentClassName="project-library-content" homeHref="/home" projectNavigation={false} projects={[]} signOutMode="session" user={user}>
    <div className="project-library-page">
      <section className="workspace-heading"><p className="eyebrow">Your workspace</p><div className="library-heading-row"><div><h1>Projects</h1><p>See what each project is, whether it has accepted Master work, and what to do next.</p></div><Button onClick={() => { reset(); setOpen(true); }} type="button">+ New project</Button></div></section>
      <section aria-labelledby="project-lifecycle-title" className="project-lifecycle-guide"><div><span aria-hidden="true" className="project-lifecycle-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span><div><h2 id="project-lifecycle-title">Quick guide</h2><p>Get from PRDs to a published project in four simple steps.</p></div></div><ol><li><strong>Create</strong><span>Start a project and upload PRDs.</span></li><li><strong>Extract</strong><span>Atlas builds Initial Draft work.</span></li><li><strong>Review</strong><span>Check the draft before publication.</span></li><li><strong>Publish</strong><span>Accept the first Master version.</span></li></ol></section>
      {notice && <p className="production-project-notice" role="status">{notice}</p>}
      <section aria-labelledby="project-list-title" className="repository-projects"><header><h2 id="project-list-title">Your projects</h2><span>{projects.length} repositories</span></header><div aria-label="Projects" className="project-grid" ref={gridRef}>{projects.map((project) => <ProductionProjectCard key={project.id} project={project} />)}</div></section>
      {projects.length === 0 && <EmptyState title="No projects yet" description="Create a project to begin reviewing your PRDs." />}
      {open && <Dialog onClose={submitState === "loading" ? () => {} : close} title="Create a project"><form className="create-project-form" noValidate onSubmit={createProject}>
        <label htmlFor="production-project-id">Project ID <span>* Required · 3–48 lowercase letters, numbers, and hyphens</span><input aria-describedby="production-project-id-count production-project-id-error" aria-invalid={Boolean(errors.projectId)} disabled={submitState === "loading"} id="production-project-id" maxLength={productionProjectLimits.id} onChange={(event) => setProjectId(event.target.value)} placeholder="Example: customer-portal-v2" required value={projectId} /></label><p className="field-count" id="production-project-id-count">{projectId.length}/48 characters</p>{errors.projectId && <p className="field-error" id="production-project-id-error" role="alert">{errors.projectId}</p>}
        <label htmlFor="production-project-name">Project Name <span>* Required</span><input aria-describedby="production-project-name-count production-project-name-error" aria-invalid={Boolean(errors.projectName)} disabled={submitState === "loading"} id="production-project-name" maxLength={productionProjectLimits.name} onChange={(event) => { const value = event.target.value; setProjectName(value); if (!projectId) setProjectId(deriveProjectId(value)); }} required value={projectName} /></label><p className="field-count" id="production-project-name-count">{projectName.length}/80 characters</p>{errors.projectName && <p className="field-error" id="production-project-name-error" role="alert">{errors.projectName}</p>}
        <label htmlFor="production-project-description">Project Description <span>Optional</span><textarea aria-describedby="production-project-description-count production-project-description-error" aria-invalid={Boolean(errors.projectDescription)} disabled={submitState === "loading"} id="production-project-description" maxLength={productionProjectLimits.description} onChange={(event) => setProjectDescription(event.target.value)} value={projectDescription} /></label><p className="field-count" id="production-project-description-count">{projectDescription.length}/280 characters</p>{errors.projectDescription && <p className="field-error" id="production-project-description-error" role="alert">{errors.projectDescription}</p>}
        <label htmlFor="production-project-prds">PRD PDFs <span>* Required · Up to 10 PDFs, 20 MiB each</span><input accept="application/pdf,.pdf" aria-describedby="production-project-prds-help production-project-prds-error" aria-invalid={Boolean(errors.prdFiles)} disabled={submitState === "loading"} id="production-project-prds" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} required type="file" /></label><p className="field-help" id="production-project-prds-help">{files.length ? `${files.length} PDF${files.length === 1 ? "" : "s"} selected. They will wait for extraction after creation.` : "Select one or more PDF files."}</p>{errors.prdFiles && <p className="field-error" id="production-project-prds-error" role="alert">{errors.prdFiles}</p>}
        <div className="dialog-actions"><Button disabled={submitState === "loading"} type="submit">{submitState === "loading" ? "Creating…" : "Create project"}</Button></div>
      </form></Dialog>}
    </div>
  </AppShell>;
}
