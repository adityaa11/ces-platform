import type { ReactNode } from "react";

type ProjectCardPresentationProps = {
  actions: ReactNode;
  initialDraft?: { processedLabel: string; progressPercent: number };
  master: { detail: string; summary: string };
  metrics: readonly { label: string; value: string | number }[];
  project: { id: string; name: string; projectId: string; summary: string };
  status: { label: string; tone: "extracting" | "needs-attention" | "published" | "ready-for-review" | "waiting-for-extraction" };
};

export function ProjectCardPresentation({ actions, initialDraft, master, metrics, project, status }: ProjectCardPresentationProps) {
  const progress = initialDraft ? `${initialDraft.progressPercent}%` : null;
  return <article aria-labelledby={`${project.id}-title`} className="repository-card">
    <header className="repository-card-header">
      <span aria-hidden="true" className="repository-project-mark">{project.name[0]}</span>
      <div className="repository-identity"><h2 id={`${project.id}-title`} title={project.name}>{project.name}</h2></div>
      <span className={`repository-status repository-status-${status.tone}`}>{status.label}</span>
      <code className="repository-project-id" title={`project-id: ${project.projectId}`}>project-id: {project.projectId}</code>
    </header>
    <p className="repository-summary" title={project.summary}>{project.summary}</p>
    <div className="repository-state-stack">
      <section aria-label={`Master: ${master.summary}`} className="repository-master-state"><span aria-hidden="true" className="repository-state-icon"><svg fill="none" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M5 5.5V21"/><path d="M19 3v16"/></svg></span><div><strong>Master</strong><span>{master.summary}</span><small>{master.detail}</small></div></section>
      {initialDraft && <section aria-label={`Initial draft: ${initialDraft.processedLabel}`} className="repository-draft-state"><div className="repository-draft-heading"><span><strong>Initial draft</strong> · {initialDraft.processedLabel}</span><strong>{progress}</strong></div><progress aria-label={`Extraction progress: ${initialDraft.processedLabel}`} className="repository-progress" max={100} value={initialDraft.progressPercent}>{progress}</progress></section>}
    </div>
    <footer className="repository-card-footer"><dl className="repository-metrics">{metrics.map((metric) => <div key={metric.label}><dd>{metric.value}</dd><dt>{metric.label}</dt></div>)}</dl>{actions}</footer>
  </article>;
}
