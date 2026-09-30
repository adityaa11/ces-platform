import type { ProjectCardViewModel } from "./project-card-view-model";

const statusLabels = {
  "waiting-for-extraction": "Waiting for extraction",
  extracting: "Extracting",
  "needs-attention": "Needs attention",
  "ready-for-review": "Ready for review",
} satisfies Record<ProjectCardViewModel["state"], string>;

/** Presentation-only labels and bounded copy for an already approved card model. */
export function toProductionProjectCardPresentation(project: ProjectCardViewModel) {
  const statusLabel = statusLabels[project.state];
  const [statusValue, ...statusDescription] = statusLabel.split(/\s+/);
  return {
    attentionReason: project.state === "needs-attention" ? project.attentionReason : undefined,
    metrics: [
      { label: "published facts", value: project.metrics.publishedFacts },
      { label: "PRDs uploaded", value: project.metrics.uploadedPrds },
      { label: statusDescription.join(" "), value: statusValue },
    ],
    status: { label: statusLabel, tone: project.state },
  };
}
