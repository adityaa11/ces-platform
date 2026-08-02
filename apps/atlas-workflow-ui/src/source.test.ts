import { describe, expect, it, vi } from "vitest";
import type { AtlasWorkspacePayload, SourceEvidenceProjection } from "./contracts.js";
import { fetchSourceEvidence, renderSourceEvidence } from "./source.js";

const payload = { project: { id: "project.example" }, revision: 4,
  evidence_index: [{ evidence_id: "project.evidence.one", revision: 4,
    access_href: "/evidence/one" }] } as unknown as AtlasWorkspacePayload;
const evidence = {
  schema_version: "1.0.0", project_id: "project.example", revision: 4,
  evidence_id: "project.evidence.one", canonical_concept_id: "project.concept.one",
  primary_representation_id: "project.representation.a",
  primary_selection_reason: "Earliest exact source occurrence.",
  representations: [{ representation_id: "project.representation.b", exact_text: "Bayar lunas.",
    language: "id", document_id: "project.document.one", page: 3, section: "Payment",
    source_unit_id: "project.unit.two", span_start: 30, span_end: 41 },
  { representation_id: "project.representation.a", exact_text: "Payment must be complete.",
    language: "en", document_id: "project.document.one", page: 2, section: "Payment",
    source_unit_id: "project.unit.one", span_start: 5, span_end: 30,
    bounding_box: [1, 2, 3, 4] }],
  canonical_wording: "Payment is complete.", canonical_language: "en",
  access_event: { audit_event_id: "audit.source-access.one",
    accessed_at: "2026-08-02T12:00:00+07:00" },
  trace: { document_id: "project.document.one", source_unit_id: "project.unit.one",
    atomic_claim_id: "project.claim.one", canonical_record_id: "project.record.one",
    workflow_id: "project.workflow.one", operation_id: "project.operation.one" },
} satisfies SourceEvidenceProjection;

describe("ATLAS-UI-003 focused evidence workspace", () => {
  it("uses authenticated project-scoped revision-pinned evidence access", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(evidence), { status: 200 }));
    await expect(fetchSourceEvidence({ payload, evidenceId: "project.evidence.one", fetcher }))
      .resolves.toEqual(evidence);
    expect(fetcher).toHaveBeenCalledWith("/evidence/one", expect.objectContaining({
      credentials: "same-origin",
      headers: expect.objectContaining({ "If-Match": "4",
        "X-CES-Project-Id": "project.example" }),
    }));
  });

  it("shows every exact original separately from interpretation aids", () => {
    const html = renderSourceEvidence(evidence);
    expect(html).toContain("Payment must be complete.");
    expect(html).toContain("Bayar lunas.");
    expect(html).toContain("Interpretation aid — not original wording");
    expect(html).toContain("Bounding box: 1, 2, 3, 4");
    expect(html.indexOf("Payment must be complete.")).toBeLessThan(html.indexOf("Bayar lunas."));
    expect(renderSourceEvidence({ ...evidence,
      representations: [...evidence.representations].reverse() })).toBe(html);
  });

  it("rejects cross-project, stale, and mismatched evidence", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ...evidence, project_id: "project.other",
    }), { status: 200 }));
    await expect(fetchSourceEvidence({ payload, evidenceId: "project.evidence.one", fetcher }))
      .rejects.toThrow("scope or revision mismatch");
  });
});
