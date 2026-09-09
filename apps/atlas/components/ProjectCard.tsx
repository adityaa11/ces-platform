import Link from "next/link";
import type { ProjectFixture } from "@atlas/fixtures";
import { Button } from "./Button";

type Props = {
  canShare: boolean;
  href: string;
  onShare: (project: ProjectFixture) => void;
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
    <span aria-hidden="true" className="repository-state-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span>
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

export function ProjectCard({ canShare, href, onShare, project }: Props) {
  const { action, metrics, state, summary } = project.repository;
  const actionHint = action.unavailableReason ?? (state === "extracting" ? "Extraction is in progress. This project cannot be opened yet." : "");
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
      <div className={`repository-card-actions${canShare ? "" : " repository-card-actions-single"}`}>
        {action.enabled ? <Link className="repository-primary-action" href={href}>{action.label} <span aria-hidden="true">→</span></Link> : <><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{actionHint}</span></>}
        {canShare && <Button className="repository-share-action" disabled={!action.enabled} onClick={() => onShare(project)} tone="secondary" type="button">Share</Button>}
      </div>
    </footer>
  </article>;
}
