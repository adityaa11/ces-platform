import Link from "next/link";
import type { ProjectFixture } from "@atlas/fixtures";
import { Button } from "./Button";

type Props = {
  href: string;
  project: ProjectFixture;
};

const lifecycleLabels = {
  published: "Published",
  extracting: "Extracting",
  "ready-for-review": "Ready for review",
} as const;

function MasterState({ project }: Pick<Props, "project">) {
  const { master } = project.repository;
  return <section className="repository-master-state" aria-label={`Master: ${master.summary}`}>
    <span aria-hidden="true" className="repository-state-icon">▣</span>
    <div>
      <strong>Master</strong>
      <span>{master.summary}</span>
      <small>{master.detail}</small>
    </div>
  </section>;
}

function InitialDraftState({ project }: Pick<Props, "project">) {
  const draft = project.repository.initialDraft;
  if (!draft) return null;
  const progress = Math.max(0, Math.min(100, draft.progress));
  const processed = `${draft.processedPrds} of ${draft.totalPrds} PRDs processed`;
  return <section className="repository-draft-state" aria-label={`Initial draft: ${processed}`}>
    <div className="repository-draft-heading"><span><strong>Initial draft</strong> · {processed}</span><strong>{progress}%</strong></div>
    <progress aria-label={`Extraction progress: ${processed}`} className="repository-progress" max={100} value={progress}>{progress}%</progress>
  </section>;
}

export function ProjectCard({ href, project }: Props) {
  const { action, metrics, state, summary } = project.repository;
  const actionHint = state === "extracting" ? "Extraction is in progress. This project cannot be opened yet." : "";
  return <article aria-labelledby={`${project.id}-title`} className="repository-card">
    <header className="repository-card-header">
      <span aria-hidden="true" className="repository-project-mark">{project.name[0]}</span>
      <div className="repository-identity"><h2 id={`${project.id}-title`}>{project.name}</h2><code>project-id: {project.id}</code></div>
      <span className={`repository-status repository-status-${state}`}>{lifecycleLabels[state]}</span>
    </header>
    <p className="repository-summary">{summary}</p>
    <div className="repository-state-stack"><MasterState project={project} /><InitialDraftState project={project} /></div>
    <footer className="repository-card-footer">
      <dl className="repository-metrics">{metrics.map((metric) => <div key={metric.label}><dd>{metric.value}</dd><dt>{metric.label}</dt></div>)}</dl>
      <div className="repository-card-actions">
        {action.enabled ? <Link className="repository-primary-action" href={href}>{action.label} <span aria-hidden="true">→</span></Link> : <><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{actionHint}</span></>}
      </div>
    </footer>
  </article>;
}
