import { Button } from "./Button";
import { ProjectCardPresentation } from "./ProjectCardPresentation";
import type { ProjectCardViewModel } from "./project-card-view-model";

export function ProductionProjectCard({ project }: { project: ProjectCardViewModel }) {
  return <ProjectCardPresentation
    actions={<div className="repository-card-actions"><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{project.action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{project.action.unavailableReason}</span><Button aria-label="Sharing unavailable until production sharing is supported" className="repository-share-action" disabled type="button">Share</Button></div>}
    initialDraft={{ processedLabel: project.initialDraft.processedLabel, progressPercent: project.initialDraft.progressPercent }}
    master={{ detail: "Published work becomes available after a later review and publication workflow.", summary: project.master.label }}
    metrics={[{ label: "published facts", value: project.metrics.publishedFacts }, { label: "PRDs uploaded", value: project.metrics.uploadedPrds }, { label: "for extraction", value: "Waiting" }]}
    project={project} status={{ label: "Waiting for extraction", tone: "waiting-for-extraction" }}
  />;
}
