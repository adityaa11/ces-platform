import Link from "next/link";
import type { ProjectFixture } from "@atlas/fixtures";
import { Button } from "./Button";
import { ProjectCardPresentation } from "./ProjectCardPresentation";

type Props = { canShare: boolean; href: string; onShare: (project: ProjectFixture) => void; project: ProjectFixture };

const lifecycleLabels = { published: "Published", extracting: "Extracting", "needs-attention": "Needs attention", "ready-for-review": "Ready for review" } as const;

export function ProjectCard({ canShare, href, onShare, project }: Props) {
  const { action, initialDraft, master, metrics, state, summary } = project.repository;
  const actionHint = action.unavailableReason ?? (state === "extracting" ? "Extraction is in progress. This project cannot be opened yet." : "");
  return <ProjectCardPresentation
    actions={<div className={`repository-card-actions${canShare ? "" : " repository-card-actions-single"}`}>
      {action.enabled ? <Link className="repository-primary-action" href={href}>{action.label} <span aria-hidden="true">→</span></Link> : <><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{actionHint}</span></>}
      {canShare && <Button aria-describedby={state === "extracting" ? `${project.id}-action-hint` : undefined} className="repository-share-action" disabled={state === "extracting"} onClick={() => onShare(project)} tone="secondary" type="button">Share</Button>}
    </div>}
    initialDraft={initialDraft ? { processedLabel: `${initialDraft.processedPrds} of ${initialDraft.totalPrds} PRDs processed`, progressPercent: Math.max(0, Math.min(100, initialDraft.progress)) } : undefined}
    master={{ detail: master.detail, summary: master.summary }} metrics={metrics} project={{ id: project.id, name: project.name, projectId: project.id, summary }} status={{ label: lifecycleLabels[state], tone: state }}
  />;
}
