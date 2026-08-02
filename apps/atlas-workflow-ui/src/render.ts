import { modelLabel, visibleModels } from "./adapter.js";
import type { AtlasWorkspacePayload, WorkspaceState } from "./contracts.js";

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function statusView(message: string, detail: string): string {
  return `<main class="workspace-state" aria-live="polite"><h1>${escapeHtml(message)}</h1><p>${escapeHtml(detail)}</p></main>`;
}

function renderWorkspace(payload: AtlasWorkspacePayload, stale: boolean): string {
  const lifecycle = payload.lifecycle === "approved" ? "Approved" : "Proposed — not approved";
  const authority = payload.authoritative ? "Authoritative" : "Non-authoritative";
  const downstream = payload.downstream_execution_allowed
    ? "Downstream allowed" : "Downstream blocked";
  const models = visibleModels(payload.model_support);
  const workflows = payload.project_overview.workflows.map((workflow) =>
    `<li><button type="button" class="nav-item" data-workflow-id="${escapeHtml(workflow.workflow_id)}"><span>${escapeHtml(workflow.label)}</span><small>${workflow.operation_count} operations</small></button></li>`).join("");
  const modelItems = models.map((model) => {
    const incomplete = model.support_status !== "supported";
    const missing = model.missing_evidence.length > 0
      ? `<small>Missing: ${escapeHtml(model.missing_evidence.join(", "))}</small>` : "";
    return `<li><button type="button" class="nav-item${incomplete ? " incomplete" : ""}" data-model-kind="${model.model_kind}" aria-description="${escapeHtml(model.rationale)}"><span>${escapeHtml(modelLabel(model.model_kind))}</span>${incomplete ? "<strong>Review-only</strong>" : ""}${missing}</button></li>`;
  }).join("");
  const nodes = payload.project_overview.nodes.map((node) =>
    `<li><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(node.node_kind)}</span></li>`).join("");
  const edges = payload.project_overview.edges.map((edge) =>
    `<tr><td>${escapeHtml(edge.from_node_id)}</td><td>${escapeHtml(edge.relationship_kind)}</td><td>${escapeHtml(edge.to_node_id)}</td></tr>`).join("");
  const documents = payload.source_documents.map((document) =>
    `<li><button type="button" class="document-item" data-document-id="${escapeHtml(document.document_id)}"><span>${escapeHtml(document.label)}</span><small>${escapeHtml(document.media_type)}</small></button></li>`).join("");
  return `<div class="app-shell">
    <header class="project-header">
      <div><p class="eyebrow">CES Atlas</p><h1>${escapeHtml(payload.project.label)}</h1></div>
      <div class="status-strip" aria-label="Project lifecycle"><strong>${lifecycle}</strong><span>${authority}</span><span>${downstream}</span>${stale ? "<span class=\"danger\">Stale data</span>" : ""}</div>
      <dl class="summary"><div><dt>Workflows</dt><dd>${payload.project_overview.workflows.length}</dd></div><div><dt>Records</dt><dd>${payload.summaries.records}</dd></div><div><dt>Eligible</dt><dd>${payload.summaries.eligible}</dd></div><div><dt>Exceptions</dt><dd>${payload.summaries.exceptions}</dd></div></dl>
    </header>
    <main class="workspace-grid">
      <nav class="pane navigation-pane" aria-label="Semantic navigation"><h2>Models</h2><ul>${modelItems || "<li class=\"empty-note\">No supported models</li>"}</ul><h2>Workflows</h2><ul>${workflows || "<li class=\"empty-note\">No workflow projection</li>"}</ul></nav>
      <section class="pane graph-pane" aria-labelledby="overview-title"><div class="pane-heading"><div><p class="eyebrow">Integrated graph</p><h2 id="overview-title">Project overview</h2></div><button type="button" class="secondary" aria-expanded="true" data-action="minimize-overview">Minimize</button></div><div class="graph-canvas" role="img" aria-label="Integrated project graph"><ul>${nodes || "<li class=\"empty-note\">No graph nodes</li>"}</ul></div><details class="accessible-graph"><summary>Graph connections as a table</summary><table><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>${edges}</tbody></table></details><section id="selected-detail" aria-live="polite"><p>Select a model or workflow to inspect its backend projection below the overview.</p></section></section>
      <aside class="pane source-pane" aria-labelledby="source-title"><p class="eyebrow">Evidence</p><h2 id="source-title">Source documents</h2><ul>${documents || "<li class=\"empty-note\">No source document available</li>"}</ul><div class="source-preview"><p>Select evidence to inspect its exact original representation.</p></div></aside>
    </main>
  </div>`;
}

export function renderWorkspaceState(state: WorkspaceState): string {
  switch (state.kind) {
    case "loading": return statusView("Loading Atlas workspace", "Reading backend-owned projections.");
    case "empty": return statusView("No project selected", "Choose a project to review its supported models.");
    case "error": return statusView("Atlas workspace unavailable", state.message);
    case "missing_projection": return statusView("No supported projection", `${state.projectLabel} has no supported diagram to display. Source evidence remains unchanged.`);
    case "stale": return renderWorkspace(state.payload, true);
    case "ready": return renderWorkspace(state.payload, false);
  }
}
