import type { ProjectWorkspaceFixture } from "@atlas/fixtures";

type Props = {
  workspace: ProjectWorkspaceFixture;
  middleMetric?: { label: string; value: number };
  className?: string;
};

export function OperationalModel({ workspace, middleMetric, className }: Props) {
  const metric = middleMetric ?? { label: "Detailed pages", value: workspace.workflows.length };
  return <section className={`workflow-operational-model ${className ?? ""}`}><h2>Operational model</h2><p>One accumulated model, read through major scopes and focused semantic workflow pages.</p><dl><div><dt>{workspace.workflowGroups.length}</dt><dd>Major scopes</dd></div><div><dt>{metric.value}</dt><dd>{metric.label}</dd></div><div><dt>{workspace.prds.length}</dt><dd>Source PRDs</dd></div></dl></section>;
}
