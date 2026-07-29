import { describe, expect, it } from "vitest";
import {
  createExpandedApprovalLedger,
  createProposalApprovalLedger,
  replayExpandedApprovalLedger,
} from "./index.js";

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
  it("records multi-entity decisions and marks stale replay deterministically", () => {
    const expandedEligibility = {
      proposal_hash: proposalHash,
      proposal_revision: 1,
      entities: [
        { entity_type: "record" as const,
          entity_id: "project.record.one", eligible: true,
          bulk_approval_eligible: true, blockers: [] },
        { entity_type: "workflow_assignment" as const,
          entity_id: "project.assignment.one", eligible: true,
          bulk_approval_eligible: true, blockers: [] },
        { entity_type: "relationship_target" as const,
          entity_id: "project.target.one", eligible: true,
          bulk_approval_eligible: false, blockers: [] },
      ],
      content_hash: hash("9"),
    };
    const ledger = createExpandedApprovalLedger({
      eligibility: expandedEligibility,
      decisions: [
        { sequence: 1, action: "approve", entity_type: "workflow_assignment",
          entity_ids: ["project.assignment.one"], bulk: true, reviewer: human,
          decided_at: "2026-07-29T10:00:00+07:00", note: "Assignment approved." },
        { sequence: 2, action: "approve", entity_type: "relationship_target",
          entity_ids: ["project.target.one"], reviewer: human,
          decided_at: "2026-07-29T10:01:00+07:00", note: "Target approved." },
      ],
    });
    expect(ledger.decisions).toHaveLength(2);
    expect(replayExpandedApprovalLedger({
      ledger,
      current_proposal_hash: proposalHash,
      current_entity_ids: ["project.assignment.one", "project.target.one"],
    }).reusable_decision_ids).toHaveLength(2);
    const replay = replayExpandedApprovalLedger({
      ledger,
      current_proposal_hash: hash("8"),
      current_entity_ids: ["project.assignment.one", "project.target.one"],
      meaning_changed_entity_ids: ["project.target.one"],
    });
    expect(replay.reusable_decision_ids).toHaveLength(1);
    expect(replay.stale_decision_ids).toHaveLength(1);
    expect(() => createExpandedApprovalLedger({
      eligibility: expandedEligibility,
      decisions: [{ sequence: 1, action: "approve", entity_type: "relationship_target",
        entity_ids: ["project.target.one"], bulk: true, reviewer: human,
        decided_at: "2026-07-29T10:00:00+07:00", note: "Invalid bulk." }],
    })).toThrow("Bulk approval blocked");
    const successor = (id: string, statement: string) => ({
      id,
      identity: {
        schema_version: "1.0.0" as const,
        record_id: id,
        project_id: "project",
        proposal_revision: 2,
        semantic_kind_id: "ces.kind.business-rule",
        semantic_fingerprint: hash(id.endsWith("a") ? "4" : "5"),
        source_lineage_hash: hash("6"),
        predecessor_record_ids: ["project.record.one"],
        identity_status: "proposed" as const,
      },
      candidate_ids: ["project.candidate.one"],
      semantic_kind_id: "ces.kind.business-rule",
      statement,
      multilingual: {
        original_statement: statement,
        original_language: {
          detected_language: "en",
          language_detection_method: "human" as const,
          language_confidence: 1,
        },
        canonical_statement: statement,
        canonical_language: "en",
        display_language: "en",
        translation_status: "original" as const,
        translation_source_unit_ids: [],
      },
      source_unit_ids: ["project.unit.one"],
      classification_status: "classified" as const,
      origin: "human_added" as const,
      review_status: "pending" as const,
      details: [],
      issues: [],
    });
    const splitLedger = createExpandedApprovalLedger({
      eligibility: expandedEligibility,
      decisions: [{
        sequence: 1,
        action: "split",
        entity_type: "record",
        entity_ids: ["project.record.one"],
        reviewer: human,
        decided_at: "2026-07-29T10:02:00+07:00",
        note: "Split compound meaning into complete successor records.",
        successor_proposal_revision: 2,
        successor_proposal_hash: hash("7"),
        successor_records: [
          successor("project.record.r2.a", "First successor."),
          successor("project.record.r2.b", "Second successor."),
        ],
      }],
    });
    expect(splitLedger.decisions[0]?.successor_records).toHaveLength(2);
  });

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
