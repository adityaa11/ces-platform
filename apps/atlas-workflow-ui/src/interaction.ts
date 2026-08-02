import type { AtlasWorkspacePayload, DetailProjection } from "./contracts.js";

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

function renderDetail(detail: DetailProjection): string {
  const nodes = detail.nodes.map(({ node_id, label, node_kind }) =>
    `<li data-concept-id="${escapeHtml(node_id)}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(node_kind)}</span></li>`).join("");
  const edges = detail.edges.filter(({ relationship_status }) =>
    relationship_status !== "rejected").map((edge) =>
    `<li class="relationship ${edge.relationship_status}">${escapeHtml(edge.from_node_id)} <span>${escapeHtml(edge.relationship_kind)}</span> ${escapeHtml(edge.to_node_id)}</li>`).join("");
  return `<div class="detail-heading"><div><p class="eyebrow">Selected projection</p><h2>${escapeHtml(detail.label)}</h2></div><div><button type="button" class="secondary" data-action="minimize-detail">Minimize</button><button type="button" class="secondary" data-action="close-detail">Close</button></div></div><div class="detail-content"><ul class="detail-nodes">${nodes}</ul><ol class="ordered-graph-summary" aria-label="Ordered relationship summary">${edges}</ol></div>`;
}

export function bindWorkspaceInteractions(input: {
  readonly root: HTMLElement;
  readonly payload: AtlasWorkspacePayload;
  readonly fetcher?: typeof fetch;
}): WorkspaceInteractionController {
  const controller = new WorkspaceInteractionController();
  const overview = input.root.querySelector<HTMLElement>("#project-overview");
  const detail = input.root.querySelector<HTMLElement>("#selected-detail");
  if (!overview || !detail) throw new Error("Workspace interaction regions are missing");

  input.root.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-action], [data-subject-id], [data-concept-id]") : null;
    if (!target) return;
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
      .then((projection) => { detail.innerHTML = renderDetail(projection); })
      .catch((error: unknown) => { detail.innerHTML = `<p role="alert">${escapeHtml(error instanceof Error ? error.message : "Projection unavailable")}</p>`; });
  });
  return controller;
}
