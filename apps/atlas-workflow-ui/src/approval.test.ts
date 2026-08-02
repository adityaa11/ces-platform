import { describe, expect, it, vi } from "vitest";
import type { AtlasWorkspacePayload, ReviewSubject } from "./contracts.js";
import { backendBulkEligibleSubjects, renderApprovalPanel, submitDecision } from "./approval.js";

const payload = { project: { id: "project.example" }, revision: 6 } as unknown as AtlasWorkspacePayload;
const subject = {
  subject_id: "project.relationship-target.one",
  entity_type: "relationship_target",
  label: "Payment enables readiness",
  eligible: true,
  bulk_approval_eligible: false,
  blockers: ["derived-topology-requires-review"],
  allowed_actions: ["approve", "reject", "remove_relationship"],
  requires_explicit_confirmation: true,
  command_href: "/review/relationship-target/one",
  relationship: { from_id: "project.workflow.payment", to_id: "project.workflow.readiness",
    relationship_kind: "enables", condition: "balance is zero", origin: "derived",
    confidence: 0.8, evidence_ids: ["project.evidence.one"],
    rationale: "Source-backed candidate.", status: "pending" },
} satisfies ReviewSubject;

describe("ATLAS-UI-004 governed approval client", () => {
  it("renders backend eligibility, blockers, and relationship review exactly", () => {
    const html = renderApprovalPanel([subject]);
    expect(html).toContain("Bulk blocked");
    expect(html).toContain("derived-topology-requires-review");
    expect(html).toContain("project.workflow.payment");
    expect(html).toContain("balance is zero");
    expect(html).toContain("pending");
  });

  it("submits scoped, revision-pinned, idempotent input without reviewer identity", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(String(init?.body)).not.toContain("reviewer");
      return new Response(JSON.stringify({ schema_version: "1.0.0",
        decision_id: "decision.one", audit_event_id: "audit.one",
        project_id: "project.example", proposal_revision: 6,
        reviewer: { kind: "human", display_name: "Authenticated reviewer" },
        materialized_workspace_href: "/approved/project.example" }), { status: 200 });
    });
    await expect(submitDecision({ payload, subject, action: "approve", note: "Reviewed.",
      confirmed: true, idempotencyKey: "request-123", fetcher })).resolves
      .toMatchObject({ decision_id: "decision.one" });
    expect(fetcher).toHaveBeenCalledWith(subject.command_href, expect.objectContaining({
      credentials: "same-origin", method: "POST",
      headers: expect.objectContaining({ "X-CES-Project-Id": "project.example",
        "If-Match": "6", "Idempotency-Key": "request-123" }),
    }));
  });

  it("fails closed for blocked approval, missing confirmation, and stale conflicts", async () => {
    await expect(submitDecision({ payload, subject: { ...subject, eligible: false },
      action: "approve", note: "No.", confirmed: true, idempotencyKey: "one" }))
      .rejects.toThrow("blocked");
    await expect(submitDecision({ payload, subject, action: "approve", note: "No.",
      idempotencyKey: "two" })).rejects.toThrow("confirmation");
    const fetcher = vi.fn(async () => new Response(null, { status: 409 }));
    await expect(submitDecision({ payload, subject, action: "approve", note: "Reviewed.",
      confirmed: true, idempotencyKey: "three", fetcher })).rejects.toThrow("conflict");
  });

  it("bulk-selects only subjects explicitly marked eligible by the backend", () => {
    expect(backendBulkEligibleSubjects([subject, { ...subject,
      subject_id: "project.record.two", bulk_approval_eligible: true }]))
      .toEqual(["project.record.two"]);
  });
});
