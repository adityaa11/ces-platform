import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createExpandedApprovalLedger,
  createProposalApprovalLedger,
} from "@company/ces-atlas-review";
import { createFocusedAtlasProjections } from "@company/ces-atlas-intent-graph";
import { calculateExpandedApprovalEligibility } from "@company/ces-proposed-project-model";
import { describe, expect, it } from "vitest";
import {
  materializeHardenedApprovedProjectModel,
  materializeExpandedApprovedProjectModel,
  publishExpandedApproval,
  publishHardenedApproval,
} from "./index.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
const source = "project.unit.00001.aaaaaaaa";
const proposal = {
  schema_version: "1.5.0" as const,
  project_id: "project", proposal_revision: 1,
  lifecycle: "review_in_progress" as const, authoritative: false as const,
  approval_required: true as const, downstream_execution_allowed: false as const,
  source_revision_id: "project.rev.0123456789ab",
  semantic_kind_registry_id: "example.semantic-kinds.0123456789ab",
  candidate_inventory_hash: hash("a"),
  records: [{
    id: "project.record.temperature",
    identity: {
      schema_version: "1.0.0" as const,
      record_id: "project.record.temperature",
      project_id: "project",
      proposal_revision: 1,
      semantic_kind_id: "example.kind.temperature-release",
      semantic_fingerprint: hash("2"),
      source_lineage_hash: hash("3"),
      predecessor_record_ids: [],
      identity_status: "proposed" as const,
    },
    candidate_ids: ["project.candidate.temperature"],
    semantic_kind_id: "example.kind.temperature-release", statement: "Original statement.",
    multilingual: {
      original_statement: "Original statement.",
      original_language: {
        detected_language: "en",
        language_detection_method: "deterministic" as const,
        language_confidence: 0.8,
      },
      canonical_statement: "Original statement.",
      canonical_language: "en",
      display_language: "en",
      translation_status: "original" as const,
      translation_source_unit_ids: [],
    },
    source_unit_ids: [source], classification_status: "classified" as const,
    origin: "explicit" as const, review_status: "pending" as const,
    details: [], issues: [],
  }],
  workflows: [{
    workflow_id: "project.workflow.release",
    label: "Release",
    summary: "Release workflow.",
    operation_ids: ["project.operation.release"],
    source_unit_ids: [source],
    governance: {
      id: "project.governance.workflow-release",
      origin: "explicit" as const,
      evidence_source_unit_ids: [source],
      rationale: "Source-defined workflow.",
      confidence: 1,
      review_status: "pending" as const,
      bulk_approval_eligible: true,
      blockers: [],
      proposal_revision: 1,
    },
  }],
  operations: [{
    operation_id: "project.operation.release",
    workflow_id: "project.workflow.release",
    label: "Release",
    operation_kind: "action" as const,
    semantic_record_ids: ["project.record.temperature"],
    source_unit_ids: [source],
    governance: {
      id: "project.governance.operation-release",
      origin: "explicit" as const,
      evidence_source_unit_ids: [source],
      rationale: "Source-defined operation.",
      confidence: 1,
      review_status: "pending" as const,
      bulk_approval_eligible: true,
      blockers: [],
      proposal_revision: 1,
    },
  }],
  workflow_edges: [{
    edge_id: "project.workflow-edge.release",
    workflow_id: "project.workflow.release",
    from_operation_id: "project.operation.release",
    to_operation_id: "project.operation.release",
    edge_kind: "loop" as const,
    governance: {
      id: "project.governance.workflow-edge-release",
      origin: "derived" as const,
      evidence_source_unit_ids: [source],
      rationale: "Proposed retry loop.",
      confidence: 0.6,
      review_status: "pending" as const,
      bulk_approval_eligible: false,
      blockers: ["derived-topology-requires-review"],
      proposal_revision: 1,
    },
  }],
  workflow_assignments: [{
    assignment_id: "project.assignment.temperature-release",
    record_id: "project.record.temperature",
    workflow_id: "project.workflow.release",
    operation_id: "project.operation.release",
    applicability: "primary" as const,
    governance: {
      id: "project.governance.assignment-temperature-release",
      origin: "explicit" as const,
      evidence_source_unit_ids: [source],
      rationale: "Source-defined workflow membership.",
      confidence: 1,
      review_status: "pending" as const,
      bulk_approval_eligible: true,
      blockers: [],
      proposal_revision: 1,
    },
  }],
  cross_cutting_assignments: [],
  relationship_hints: [],
  relationship_candidates: [],
  workflow_nodes: [{
    id: "project.workflow.release", label: "Release",
    semantic_record_ids: ["project.record.temperature"], source_unit_ids: [source],
  }],
  relationships: [],
  source_documents: [{ document_id: "project-prd", document_version: "1.0",
    content_hash: hash("b") }],
  source_coverage: {
    schema_version: "1.0.0" as const, source_revision_id: "project.rev.0123456789ab",
    semantic_kind_registry_id: "example.semantic-kinds.0123456789ab",
    source_coverage: [{ source_unit_id: source, normative: true, current_stage: "projected" as const,
      candidate_ids: ["project.candidate.temperature"],
      normalized_record_ids: ["project.record.temperature"],
      workflow_node_ids: ["project.workflow.release"], graph_node_ids: ["project.workflow.release"],
      stage_history: [{ stage: "projected" as const, status: "included" as const }] }],
    record_coverage: [{ record_id: "project.record.temperature",
      semantic_kind_id: "example.kind.temperature-release",
      candidate_ids: ["project.candidate.temperature"], source_unit_ids: [source] }],
    counts: { source_units: 1, normative: 1, unmapped_normative: 0,
      unknown_records: 0, organization_records: 1 },
    loss_by_stage: Object.fromEntries([
      "evaluated", "non_normative", "candidate", "classified", "normalized",
      "deduplicated", "assigned", "projected", "unmapped", "ambiguous",
      "conflicting", "excluded",
    ].map((stage) => [stage, 0])) as never,
    content_hash: hash("c"),
  },
  extraction_findings: {
    schema_version: "1.0.0" as const, source_revision_id: "project.rev.0123456789ab",
    pipeline_coverage_hash: hash("c"), findings: [],
    counts: { total: 0, open: 0, blocking_open: 0 }, content_hash: hash("d"),
  },
  compatibility_projections: [{
    record_id: "project.record.temperature", classification: "projection_gap" as const,
    reason: "Organization-specific kind.",
  }],
  approval_blockers: [],
  summary: { workflow_steps: 1, requirements: 1, unknown_items: 0,
    derived_items: 0, open_findings: 0, publish_blockers: 0 },
  content_hash: hash("e"),
};
const eligibility = {
  proposal_hash: proposal.content_hash, policy_version: "1.0.0", policy_hash: hash("f"),
  items: [{ record_id: "project.record.temperature", eligible: true, blockers: [] }],
  workflows: [{ workflow_id: "project.workflow.release", eligible: true,
    eligible_record_ids: ["project.record.temperature"], blocked_record_ids: [] }],
  summary: { total_items: 1, eligible_items: 1, blocked_items: 0 }, content_hash: hash("1"),
};

describe("ATLAS-HARD-013 approved model materialization", () => {
  it("materializes expanded human decisions and approved focused projections", async () => {
    const expandedEligibility = calculateExpandedApprovalEligibility({ model: proposal });
    const ledger = createExpandedApprovalLedger({
      eligibility: expandedEligibility,
      decisions: [{
        sequence: 1,
        action: "approve",
        entity_type: "record",
        entity_ids: ["project.record.temperature"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-29T10:00:00+07:00",
        note: "Approved record.",
      }, {
        sequence: 2,
        action: "approve",
        entity_type: "workflow_assignment",
        entity_ids: ["project.assignment.temperature-release"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-29T10:01:00+07:00",
        note: "Approved workflow membership.",
      }, {
        sequence: 3,
        action: "approve",
        entity_type: "workflow_edge",
        entity_ids: ["project.workflow-edge.release"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-29T10:02:00+07:00",
        note: "Approved reviewed retry loop.",
      }],
    });
    const publication = materializeExpandedApprovedProjectModel({
      proposal,
      eligibility: expandedEligibility,
      ledger,
      focused_projections: createFocusedAtlasProjections({ model: proposal }),
    });
    expect(materializeExpandedApprovedProjectModel({
      proposal,
      eligibility: expandedEligibility,
      ledger,
      focused_projections: createFocusedAtlasProjections({ model: proposal }),
    })).toEqual(publication);
    expect(publication.model).toMatchObject({
      authoritative: true,
      downstream_execution_allowed: true,
      records: [{ id: "project.record.temperature" }],
    });
    expect(publication.focused_projections).toMatchObject({
      model_lifecycle: "approved",
      authoritative: true,
      downstream_execution_allowed: true,
    });
    expect(publication.model.workflow_edges).toHaveLength(1);
    expect(publication.model.workflow_assignments).toHaveLength(1);
    expect(publication.focused_projections.workflow_details[0]?.edges).toHaveLength(1);
    const directory = await mkdtemp(join(tmpdir(), "atlas-expanded-approved-"));
    const published = await publishExpandedApproval(directory, publication);
    expect(await readFile(join(published, "approval-report.md"), "utf8"))
      .toContain("Approved records: 1");
    expect(JSON.parse(await readFile(
      join(published, "approved-workflow-edges.json"), "utf8",
    ))).toHaveLength(1);
    expect(await readFile(join(
      published, "approved-workflows", "project.workflow.release", "flow.mmd",
    ), "utf8")).toContain("flowchart TD");
  });

  it("publishes only approved records with authority and graph parity", async () => {
    const ledger = createProposalApprovalLedger({
      proposal_hash: proposal.content_hash, proposal_revision: 1,
      proposal_record_ids: ["project.record.temperature"], eligibility,
      decisions: [{ sequence: 1, action: "approve", target_record_ids: ["project.record.temperature"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-28T19:00:00+07:00", note: "Approved." }],
    });
    const publication = materializeHardenedApprovedProjectModel({ proposal, ledger });
    expect(publication.model).toMatchObject({
      authoritative: true, downstream_execution_allowed: true,
      proposal_hash: proposal.content_hash,
    });
    expect(publication.graph).toMatchObject({
      authoritative: true, graph_purpose: "approved_baseline",
    });
    const directory = await mkdtemp(join(tmpdir(), "atlas-approved-"));
    const published = await publishHardenedApproval(directory, publication);
    expect(JSON.parse(await readFile(join(published, "approved-project-model.json"), "utf8")))
      .toEqual(publication.model);
    await expect(publishHardenedApproval(directory, publication)).rejects.toThrow();
  });

  it("preserves IDs across correction and rejects stale ledgers", () => {
    const ledger = createProposalApprovalLedger({
      proposal_hash: proposal.content_hash, proposal_revision: 1,
      proposal_record_ids: ["project.record.temperature"], eligibility,
      decisions: [
        { sequence: 1, action: "correction_requested",
          target_record_ids: ["project.record.temperature"],
          reviewer: { kind: "human", identity: "reviewer-1" },
          decided_at: "2026-07-28T19:00:00+07:00", note: "Correct wording." },
        { sequence: 2, action: "corrected_approve",
          target_record_ids: ["project.record.temperature"],
          reviewer: { kind: "human", identity: "reviewer-1" },
          decided_at: "2026-07-28T19:01:00+07:00", note: "Corrected.",
          approved_statement: "Corrected statement." },
      ],
    });
    const model = materializeHardenedApprovedProjectModel({ proposal, ledger }).model;
    expect(model.records[0]).toMatchObject({
      id: "project.record.temperature", revision: 2,
      proposal_statement: "Original statement.", statement: "Corrected statement.",
    });
    expect(() => materializeHardenedApprovedProjectModel({
      proposal, ledger: { ...ledger, proposal_hash: hash("9") },
    })).toThrow("stale");
  });

  it("applies deterministic split and merge identity rules", () => {
    const splitLedger = createProposalApprovalLedger({
      proposal_hash: proposal.content_hash, proposal_revision: 1,
      proposal_record_ids: ["project.record.temperature"], eligibility,
      decisions: [{ sequence: 1, action: "split",
        target_record_ids: ["project.record.temperature"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-28T19:00:00+07:00", note: "Split meanings.",
        replacement_records: [
          { id: "project.record.temperature", statement: "First meaning.",
            semantic_kind_id: "example.kind.temperature-release",
            source_unit_ids: [source], candidate_ids: ["project.candidate.temperature"] },
          { id: "project.record.temperature-audit", statement: "Second meaning.",
            semantic_kind_id: "ces.kind.business-rule",
            source_unit_ids: [source], candidate_ids: ["project.candidate.temperature"] },
        ] }],
    });
    const split = materializeHardenedApprovedProjectModel({
      proposal, ledger: splitLedger,
    }).model.records;
    expect(split.map(({ id }) => id)).toEqual([
      "project.record.temperature", "project.record.temperature-audit",
    ]);
    expect(split[0]?.revision).toBe(2);

    const secondRecord = { ...proposal.records[0]!, id: "project.record.audit" };
    const mergedProposal = {
      ...proposal, content_hash: hash("8"),
      records: [...proposal.records, secondRecord],
      workflow_nodes: [{ ...proposal.workflow_nodes[0]!,
        semantic_record_ids: ["project.record.temperature", "project.record.audit"] }],
      compatibility_projections: [...proposal.compatibility_projections, {
        record_id: "project.record.audit", classification: "projection_gap" as const,
        reason: "Organization-specific kind.",
      }],
      summary: { ...proposal.summary, requirements: 2 },
    };
    const mergedEligibility = {
      ...eligibility, proposal_hash: mergedProposal.content_hash,
      items: [...eligibility.items,
        { record_id: "project.record.audit", eligible: true, blockers: [] }],
      summary: { total_items: 2, eligible_items: 2, blocked_items: 0 },
    };
    const mergeLedger = createProposalApprovalLedger({
      proposal_hash: mergedProposal.content_hash, proposal_revision: 1,
      proposal_record_ids: ["project.record.temperature", "project.record.audit"],
      eligibility: mergedEligibility,
      decisions: [{ sequence: 1, action: "merge",
        target_record_ids: ["project.record.temperature", "project.record.audit"],
        reviewer: { kind: "human", identity: "reviewer-1" },
        decided_at: "2026-07-28T19:00:00+07:00", note: "Merge meanings.",
        replacement_records: [{ id: "project.record.ignored", statement: "Merged meaning.",
          semantic_kind_id: "example.kind.temperature-release",
          source_unit_ids: [source], candidate_ids: ["project.candidate.temperature"] }] }],
    });
    const merged = materializeHardenedApprovedProjectModel({
      proposal: mergedProposal, ledger: mergeLedger,
    }).model.records;
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toMatch(/^project\.record\.merge\./u);
    expect(merged[0]?.parent_record_ids).toHaveLength(2);
  });
});
