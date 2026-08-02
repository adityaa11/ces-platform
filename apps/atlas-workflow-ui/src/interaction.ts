import type { AtlasWorkspacePayload, DetailProjection } from "./contracts.js";
import { fetchSourceEvidence, renderSourceEvidence } from "./source.js";
import { renderApprovalPanel, submitDecision } from "./approval.js";

export interface InteractionSnapshot {
  readonly selectedSubjectId?: string;
  readonly overviewMinimized: boolean;
  readonly detailState: "closed" | "open" | "minimized";
}

export class WorkspaceInteractionController {
  #selectedSubjectId?: string;
  #overviewMinimized = false;
  #detailState: "closed" | "open" | "minimized" = "closed";

  select(subjectId: string): void {
    this.#selectedSubjectId = subjectId;
    this.#detailState = "open";
  }

  toggleOverview(): void { this.#overviewMinimized = !this.#overviewMinimized; }
  toggleDetail(): void {
    if (this.#detailState !== "closed") {
      this.#detailState = this.#detailState === "open" ? "minimized" : "open";
    }
  }
  closeDetail(): void { this.#detailState = "closed"; }

  snapshot(): InteractionSnapshot {
    return {
      ...(this.#selectedSubjectId ? { selectedSubjectId: this.#selectedSubjectId } : {}),
      overviewMinimized: this.#overviewMinimized,
      detailState: this.#detailState,
    };
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function fetchDetail(input: {
  readonly payload: AtlasWorkspacePayload;
  readonly subjectId: string;
  readonly fetcher?: typeof fetch;
}): Promise<DetailProjection> {
  const entry = input.payload.detail_index.find(({ subject_id }) =>
    subject_id === input.subjectId);
  if (!entry) throw new Error("Selected projection is unavailable");
  if (entry.revision !== input.payload.revision) throw new Error("Selected projection index is stale");
  const response = await (input.fetcher ?? fetch)(entry.href, {
    headers: { Accept: "application/json", "If-Match": String(entry.revision) },
  });
  if (!response.ok) throw new Error(`Detail projection request failed (${response.status})`);
  const detail = await response.json() as DetailProjection;
  if (detail.schema_version !== "1.0.0" || detail.subject_id !== input.subjectId
    || detail.revision !== input.payload.revision || !Array.isArray(detail.nodes)
    || !Array.isArray(detail.edges)) throw new Error("Detail projection revision mismatch");
  return detail;
}

export function renderDetail(detail: DetailProjection): string {
  const nodes = detail.nodes.map(({ node_id, label, node_kind }) =>
    `<li data-concept-id="${escapeHtml(node_id)}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(node_kind)}</span></li>`).join("");
  const edges = detail.edges.filter(({ relationship_status }) =>
    relationship_status !== "rejected").map((edge) =>
    `<li class="relationship ${edge.relationship_status}">${escapeHtml(edge.from_node_id)} <span>${escapeHtml(edge.relationship_kind)}</span> ${escapeHtml(edge.to_node_id)}</li>`).join("");
  const flowVisible = detail.tabs.some(({ tab, explicitly_empty }) =>
    tab === "flow" && !explicitly_empty);
  const flow = flowVisible
    ? `<section><h3>Flow</h3><ul class="detail-nodes">${nodes}</ul><ol class="ordered-graph-summary" aria-label="Ordered relationship summary">${edges}</ol></section>` : "";
  const tabs = detail.tabs.filter(({ tab, explicitly_empty }) =>
    tab !== "flow" && tab !== "approval" && !explicitly_empty).map((tab) =>
    `<section class="focused-tab" data-tab="${tab.tab}"><h3>${escapeHtml(tab.tab[0]!.toUpperCase() + tab.tab.slice(1))}</h3><ul>${tab.items.map((item) => `<li class="${item.equivalence_status === "pending_review" ? "pending-equivalence" : ""}"><button type="button" ${item.evidence_id ? `data-evidence-id="${escapeHtml(item.evidence_id)}"` : "disabled"}><span>${escapeHtml(item.label)}</span>${item.equivalence_status === "pending_review" ? "<strong>Possible equivalence — human review pending</strong>" : ""}${item.representation_count > 1 ? `<small>${item.representation_count} exact source representations</small>` : ""}</button></li>`).join("")}</ul></section>`).join("");
  const approvalVisible = detail.tabs.some(({ tab, explicitly_empty }) =>
    tab === "approval" && !explicitly_empty);
  const approval = approvalVisible ? renderApprovalPanel(detail.review_subjects) : "";
  return `<div class="detail-heading"><div><p class="eyebrow">Selected projection</p><h2>${escapeHtml(detail.label)}</h2></div><div><button type="button" class="secondary" data-action="minimize-detail">Minimize</button><button type="button" class="secondary" data-action="close-detail">Close</button></div></div><p id="decision-status" role="status"></p><div class="detail-content">${flow}${tabs}${approval}</div>`;
}

export function bindWorkspaceInteractions(input: {
  readonly root: HTMLElement;
  readonly payload: AtlasWorkspacePayload;
  readonly fetcher?: typeof fetch;
}): WorkspaceInteractionController {
  const controller = new WorkspaceInteractionController();
  let activeReviewSubjects: DetailProjection["review_subjects"] = [];
  const overview = input.root.querySelector<HTMLElement>("#project-overview");
  const detail = input.root.querySelector<HTMLElement>("#selected-detail");
  if (!overview || !detail) throw new Error("Workspace interaction regions are missing");

  input.root.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-action], [data-subject-id], [data-concept-id], [data-evidence-id], [data-review-subject]") : null;
    if (!target) return;
    const reviewSubjectId = target.dataset.reviewSubject;
    const decisionAction = target.dataset.decisionAction;
    if (reviewSubjectId && decisionAction) {
      const subject = activeReviewSubjects.find(({ subject_id }) =>
        subject_id === reviewSubjectId);
      if (!subject) return;
      const confirmed = !subject.requires_explicit_confirmation
        || window.confirm("Confirm this governed topology decision?");
      const note = window.prompt("Review note")?.trim() ?? "";
      if (!confirmed || !note) return;
      target.setAttribute("disabled", "true");
      void submitDecision({ payload: input.payload, subject,
        action: decisionAction as import("./contracts.js").DecisionAction,
        note, confirmed, idempotencyKey: crypto.randomUUID(),
        ...(input.fetcher ? { fetcher: input.fetcher } : {}) })
        .then((receipt) => { location.assign(receipt.materialized_workspace_href); })
        .catch((error: unknown) => {
          target.removeAttribute("disabled");
          const status = input.root.querySelector<HTMLElement>("#decision-status");
          if (status) status.textContent = error instanceof Error ? error.message : "Decision failed";
        });
      return;
    }
    const evidenceId = target.dataset.evidenceId;
    if (evidenceId) {
      const source = input.root.querySelector<HTMLElement>(".source-preview");
      if (!source) return;
      source.innerHTML = "<p>Loading exact source evidence…</p>";
      void fetchSourceEvidence({ payload: input.payload, evidenceId,
        ...(input.fetcher ? { fetcher: input.fetcher } : {}) })
        .then((evidence) => { source.innerHTML = renderSourceEvidence(evidence); })
        .catch((error: unknown) => { source.innerHTML = `<p role="alert">${escapeHtml(error instanceof Error ? error.message : "Source evidence unavailable")}</p>`; });
      return;
    }
    const conceptId = target.dataset.conceptId;
    if (conceptId) {
      input.root.querySelectorAll("[data-concept-id]").forEach((item) =>
        item.classList.toggle("selected", item.getAttribute("data-concept-id") === conceptId));
      const source = input.root.querySelector<HTMLElement>(".source-preview");
      if (source) source.innerHTML = `<p><strong>Selected concept</strong></p><p>${escapeHtml(conceptId)}</p>`;
      return;
    }
    const action = target.dataset.action;
    if (action === "minimize-overview") {
      controller.toggleOverview();
      overview.classList.toggle("minimized", controller.snapshot().overviewMinimized);
      target.textContent = controller.snapshot().overviewMinimized ? "Restore" : "Minimize";
      target.setAttribute("aria-expanded", String(!controller.snapshot().overviewMinimized));
      return;
    }
    if (action === "minimize-detail") {
      controller.toggleDetail();
      detail.classList.toggle("minimized", controller.snapshot().detailState === "minimized");
      target.textContent = controller.snapshot().detailState === "minimized" ? "Restore" : "Minimize";
      return;
    }
    if (action === "close-detail") {
      controller.closeDetail();
      detail.hidden = true;
      return;
    }
    const subjectId = target.dataset.subjectId;
    if (!subjectId) return;
    controller.select(subjectId);
    input.root.querySelectorAll("[data-subject-id]").forEach((item) =>
      item.classList.toggle("selected", item.getAttribute("data-subject-id") === subjectId));
    input.root.querySelectorAll("[data-concept-id]").forEach((item) =>
      item.classList.toggle("selected", item.getAttribute("data-concept-id") === subjectId));
    detail.hidden = false;
    detail.classList.remove("minimized");
    detail.innerHTML = "<p>Loading selected projection…</p>";
    void fetchDetail({ payload: input.payload, subjectId,
      ...(input.fetcher ? { fetcher: input.fetcher } : {}) })
      .then((projection) => {
        activeReviewSubjects = projection.review_subjects;
        detail.innerHTML = renderDetail(projection);
      })
      .catch((error: unknown) => { detail.innerHTML = `<p role="alert">${escapeHtml(error instanceof Error ? error.message : "Projection unavailable")}</p>`; });
  });
  return controller;
}
