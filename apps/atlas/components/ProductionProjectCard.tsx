import { Button } from "./Button";
import { ProjectCardPresentation } from "./ProjectCardPresentation";
import type { ProjectCardViewModel } from "./project-card-view-model";

const statusLabels = {
  "waiting-for-extraction": "Waiting for extraction",
} satisfies Record<ProjectCardViewModel["state"], string>;

export function ProductionProjectCard({ project }: { project: ProjectCardViewModel }) {
  const status = { label: statusLabels[project.state], tone: project.state };
  const [statusValue = status.label, ...statusDescription] = status.label.split(/\s+/);
  return <ProjectCardPresentation
    actions={<div className="repository-card-actions"><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{project.action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{project.action.unavailableReason}</span><Button aria-label="Sharing unavailable until production sharing is supported" className="repository-share-action" disabled type="button">Share</Button></div>}
    initialDraft={{ processedLabel: project.initialDraft.processedLabel, progressPercent: project.initialDraft.progressPercent }}
    master={{ detail: "Published work becomes available after a later review and publication workflow.", summary: project.master.label }}
    metrics={[{ label: "published facts", value: project.metrics.publishedFacts }, { label: "PRDs uploaded", value: project.metrics.uploadedPrds }, { label: statusDescription.join(" "), value: statusValue }]}
    project={project} status={status}
  />;
}
