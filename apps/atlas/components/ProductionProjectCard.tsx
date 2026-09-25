import { Button } from "./Button";
import type { ProjectCardViewModel } from "./project-card-view-model";

export function ProductionProjectCard({ project }: { project: ProjectCardViewModel }) {
  const processed = `0 of ${project.documentCount} PRDs processed`;
  return <article aria-labelledby={`${project.id}-title`} className="repository-card">
    <header className="repository-card-header">
      <span aria-hidden="true" className="repository-project-mark">{project.name[0]}</span>
      <div className="repository-identity"><h2 id={`${project.id}-title`} title={project.name}>{project.name}</h2></div>
      <span className="repository-status repository-status-waiting-for-extraction">Waiting for extraction</span>
      <code className="repository-project-id" title={`project-id: ${project.projectId}`}>project-id: {project.projectId}</code>
    </header>
    <p className="repository-summary">{project.summary}</p>
    <div className="repository-state-stack">
      <section aria-label="Master: No published work" className="repository-master-state"><div><strong>Master</strong><span>No published work</span><small>Published work becomes available after a later review and publication workflow.</small></div></section>
      <section aria-label={`Initial draft: ${processed}`} className="repository-draft-state"><div className="repository-draft-heading"><span><strong>Initial draft</strong> · {processed}</span><strong>0%</strong></div><progress aria-label={`Extraction progress: ${processed}`} className="repository-progress" max={100} value={0}>0%</progress></section>
    </div>
    <footer className="repository-card-footer"><dl className="repository-metrics"><div><dd>0</dd><dt>published facts</dt></div><div><dd>{project.documentCount}</dd><dt>PRDs uploaded</dt></div></dl><div className="repository-card-actions repository-card-actions-single"><Button aria-describedby={`${project.id}-action-hint`} className="repository-primary-action" disabled type="button">{project.action.label} <span aria-hidden="true">→</span></Button><span className="sr-only" id={`${project.id}-action-hint`}>{project.action.unavailableReason}</span></div></footer>
  </article>;
}
