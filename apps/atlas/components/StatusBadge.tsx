import type { ProjectStatus } from "@atlas/fixtures";

const labels: Record<ProjectStatus, string> = {
  ready: "Ready to review",
  processing: "Processing",
  "needs-attention": "Needs attention",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
