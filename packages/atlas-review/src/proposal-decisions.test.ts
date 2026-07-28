import { describe, expect, it } from "vitest";
import { createProposalApprovalLedger } from "./index.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
const proposalHash = hash("a");
const eligibility = {
  proposal_hash: proposalHash,
  policy_version: "1.0.0",
  policy_hash: hash("b"),
  items: [
    { record_id: "project.record.one", eligible: true, blockers: [] },
    { record_id: "project.record.two", eligible: false, blockers: ["classification-required"] },
  ],
  workflows: [],
  summary: { total_items: 2, eligible_items: 1, blocked_items: 1 },
  content_hash: hash("c"),
};
const human = { kind: "human" as const, identity: "reviewer-1" };

describe("ATLAS-HARD-012 immutable proposal decisions", () => {
  it("records replayable human decisions, corrections, splits, and merges", () => {
    const ledger = createProposalApprovalLedger({
      proposal_hash: proposalHash, proposal_revision: 1,
      proposal_record_ids: ["project.record.one", "project.record.two"],
      eligibility,
      decisions: [
        { sequence: 1, action: "approve", target_record_ids: ["project.record.one"],
          bulk: true, reviewer: human, decided_at: "2026-07-28T19:00:00+07:00",
          note: "Source-grounded and eligible." },
        { sequence: 2, action: "correction_requested", target_record_ids: ["project.record.two"],
          reviewer: human, decided_at: "2026-07-28T19:01:00+07:00",
          note: "Clarify the classification." },
        { sequence: 3, action: "corrected_approve", target_record_ids: ["project.record.two"],
          reviewer: human, decided_at: "2026-07-28T19:02:00+07:00",
          note: "Classification corrected.", approved_semantic_kind_id: "ces.kind.business-rule",
          approved_statement: "Corrected statement." },
      ],
    });
    expect(ledger.decisions).toHaveLength(3);
    expect(Object.isFrozen(ledger.decisions[0])).toBe(true);
    expect(ledger.decisions.map(({ sequence }) => sequence)).toEqual([1, 2, 3]);
  });

  it("rejects agent review, stale eligibility, and forced bulk approval", () => {
    const base = {
      proposal_hash: proposalHash, proposal_revision: 1,
      proposal_record_ids: ["project.record.one", "project.record.two"],
      eligibility,
    };
    expect(() => createProposalApprovalLedger({
      ...base,
      decisions: [{ sequence: 1, action: "approve" as const,
        target_record_ids: ["project.record.two"], bulk: true, reviewer: human,
        decided_at: "2026-07-28T19:00:00+07:00", note: "Force approval." }],
    })).toThrow("Bulk approval blocked");
    expect(() => createProposalApprovalLedger({
      ...base,
      eligibility: { ...eligibility, proposal_hash: hash("d") },
      decisions: [],
    })).toThrow("stale");
    expect(() => createProposalApprovalLedger({
      ...base,
      decisions: [{ sequence: 1, action: "approve" as const,
        target_record_ids: ["project.record.one"], reviewer: {
          kind: "agent", identity: "atlas",
        } as never, decided_at: "2026-07-28T19:00:00+07:00", note: "Self approve." }],
    })).toThrow();
    expect(() => createProposalApprovalLedger({
      ...base,
      decisions: [
        { sequence: 1, action: "approve" as const,
          target_record_ids: ["project.record.one"], reviewer: human,
          decided_at: "2026-07-28T19:00:00+07:00", note: "Approve." },
        { sequence: 2, action: "reject" as const,
          target_record_ids: ["project.record.one"], reviewer: human,
          decided_at: "2026-07-28T19:01:00+07:00", note: "Conflicting reject." },
      ],
    })).toThrow("Conflicting");
  });
});
