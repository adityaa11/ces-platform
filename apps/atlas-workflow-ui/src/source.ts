import type { AtlasWorkspacePayload, SourceEvidenceProjection } from "./contracts.js";

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export async function fetchSourceEvidence(input: {
  readonly payload: AtlasWorkspacePayload;
  readonly evidenceId: string;
  readonly fetcher?: typeof fetch;
}): Promise<SourceEvidenceProjection> {
  const entry = input.payload.evidence_index.find(({ evidence_id }) =>
    evidence_id === input.evidenceId);
  if (!entry) throw new Error("Source evidence is unavailable");
  if (entry.revision !== input.payload.revision) throw new Error("Source evidence index is stale");
  const response = await (input.fetcher ?? fetch)(entry.access_href, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "If-Match": String(entry.revision),
      "X-CES-Project-Id": input.payload.project.id,
    },
  });
  if (!response.ok) throw new Error(`Source evidence request failed (${response.status})`);
  const evidence = await response.json() as SourceEvidenceProjection;
  if (evidence.schema_version !== "1.0.0"
    || evidence.project_id !== input.payload.project.id
    || evidence.revision !== input.payload.revision
    || evidence.evidence_id !== input.evidenceId
    || typeof evidence.access_event?.audit_event_id !== "string"
    || typeof evidence.access_event?.accessed_at !== "string"
    || evidence.representations.length === 0
    || !evidence.representations.some(({ representation_id }) =>
      representation_id === evidence.primary_representation_id)) {
    throw new Error("Source evidence scope or revision mismatch");
  }
  return evidence;
}

export function renderSourceEvidence(evidence: SourceEvidenceProjection): string {
  const representations = [...evidence.representations]
    .sort((left, right) => left.representation_id.localeCompare(right.representation_id))
    .map((representation) => {
      const primary = representation.representation_id === evidence.primary_representation_id;
      const box = representation.bounding_box
        ? `<p>Bounding box: ${representation.bounding_box.join(", ")}</p>` : "";
      return `<article class="source-representation${primary ? " primary" : ""}"><p class="eyebrow">${primary ? "Primary original" : "Exact original representation"}</p><blockquote>${escapeHtml(representation.exact_text)}</blockquote><dl><div><dt>Language</dt><dd>${escapeHtml(representation.language)}</dd></div><div><dt>Page</dt><dd>${representation.page}</dd></div><div><dt>Section</dt><dd>${escapeHtml(representation.section)}</dd></div><div><dt>Source unit</dt><dd>${escapeHtml(representation.source_unit_id)}</dd></div><div><dt>Text span</dt><dd>${representation.span_start}–${representation.span_end}</dd></div></dl>${box}</article>`;
    }).join("");
  const interpretation = evidence.canonical_wording
    ? `<aside class="interpretation-aid"><p class="eyebrow">Interpretation aid — not original wording</p><p>${escapeHtml(evidence.canonical_wording)}</p><small>${escapeHtml(evidence.canonical_language ?? "language not supplied")}</small></aside>` : "";
  const trace = Object.entries(evidence.trace).filter((entry): entry is [string, string] =>
    typeof entry[1] === "string").map(([kind, id]) =>
    `<li><span>${escapeHtml(kind.replaceAll("_", " "))}</span><strong>${escapeHtml(id)}</strong></li>`).join("");
  return `<div class="evidence-detail"><p><strong>Primary selection:</strong> ${escapeHtml(evidence.primary_selection_reason)}</p>${representations}${interpretation}<h3>Traceability</h3><ol class="trace-chain">${trace}</ol></div>`;
}
