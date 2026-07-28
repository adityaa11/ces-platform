import {
  calculatePipelineCoverage,
  createCompletenessCriticReport,
} from "@company/ces-atlas-coverage";
import { createAtlasCandidateInventory } from "@company/ces-atlas-role-contracts";
import { createSemanticKindRegistry } from "@company/ces-semantic-record-schema";
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProposedProjectModel, publishProposedProjectModel } from "./index.js";

const hash = (value: string) => `sha256:${value.repeat(64)}`;
const source = "project.unit.00001.aaaaaaaa";
const candidate = (id: string, kind: string) => ({
  contract_version: "1.0.0" as const,
  candidate_id: id,
  statement: `Statement ${id}`,
  provisional_kind: kind,
  source_unit_ids: [source],
  confidence: 0.8,
  extraction_role: "atlas.domain-discovery",
  classification_status: "classified" as const,
  evidence_status: "source_anchored" as const,
  payload_hash: hash(id.endsWith("unknown") ? "1" : "2"),
  provider_metadata: {
    provider_id: "fixture", model_id: "neutral-v1", contract_version: "1.0.0",
  },
});

function fixture() {
  const registry = createSemanticKindRegistry({
    organization_id: "example-org",
    organization_definitions: [{
      id: "example.kind.temperature-release", schema_version: "1.0.0",
      registered_by: "organization", description: "Temperature release.",
      representation_kind: "extensible_record", representation_status: "structured_extension",
    }],
  });
  const inventory = createAtlasCandidateInventory({
    source_revision_id: "project.rev.0123456789ab",
    lexicon_revision_id: "project.lexicon.0123456789ab",
    semantic_schema_version: "1.0.0",
    semantic_kind_registry_id: registry.id,
    semantic_kind_registry_hash: registry.content_hash,
    prompt_contract_version: "1.0.0",
    allowed_source_unit_ids: [source],
    candidates: [
      candidate("project.candidate.unknown", "ces.kind.unknown"),
      candidate("project.candidate.temperature", "example.kind.temperature-release"),
    ],
  });
  const coverage = calculatePipelineCoverage({
    source_revision_id: inventory.source_revision_id,
    semantic_kind_registry_id: registry.id,
    source_unit_ids: [source],
    candidate_sources: Object.fromEntries(inventory.candidates.map((item) =>
      [item.candidate_id, item.source_unit_ids])),
    normalized_record_ids: ["project.record.unknown", "project.record.temperature"],
    workflow_node_ids: ["project.workflow.release"],
    graph_node_ids: [],
    source_coverage: [{
      source_unit_id: source, normative: true, current_stage: "assigned",
      candidate_ids: inventory.candidates.map(({ candidate_id }) => candidate_id),
      normalized_record_ids: ["project.record.unknown", "project.record.temperature"],
      workflow_node_ids: ["project.workflow.release"], graph_node_ids: [],
      stage_history: [{ stage: "assigned", status: "included" }],
    }],
    record_coverage: [
      { record_id: "project.record.unknown", semantic_kind_id: "ces.kind.unknown",
        candidate_ids: ["project.candidate.unknown"], source_unit_ids: [source] },
      { record_id: "project.record.temperature",
        semantic_kind_id: "example.kind.temperature-release",
        candidate_ids: ["project.candidate.temperature"], source_unit_ids: [source] },
    ],
  });
  const findings = createCompletenessCriticReport({ coverage, findings: [] });
  const records = [
    { id: "project.record.unknown", candidate_ids: ["project.candidate.unknown"],
      semantic_kind_id: "ces.kind.unknown", statement: "Unknown normative meaning.",
      source_unit_ids: [source], classification_status: "classification_required" as const,
      origin: "explicit" as const, review_status: "pending" as const, details: [],
      issues: [{ code: "classification-required", severity: "review_required" as const }] },
    { id: "project.record.temperature", candidate_ids: ["project.candidate.temperature"],
      semantic_kind_id: "example.kind.temperature-release", statement: "Temperature release.",
      source_unit_ids: [source], classification_status: "classified" as const,
      origin: "derived" as const, review_status: "pending" as const, details: [],
      issues: [{ code: "derived-interpretation-requires-review",
        severity: "review_required" as const }] },
  ];
  return { registry, inventory, coverage, findings, records };
}

describe("ATLAS-HARD-009 ProposedProjectModel", () => {
  it("materializes an immutable non-authoritative extensible proposal", async () => {
    const data = fixture();
    const model = createProposedProjectModel({
      project_id: "project", proposal_revision: 1,
      source_revision_id: data.inventory.source_revision_id,
      kind_registry: data.registry, candidate_inventory: data.inventory,
      records: data.records,
      workflow_nodes: [{ id: "project.workflow.release", label: "Release",
        semantic_record_ids: data.records.map(({ id }) => id), source_unit_ids: [source] }],
      source_documents: [{ document_id: "project-prd", document_version: "1.0",
        content_hash: hash("3") }],
      source_coverage: data.coverage, extraction_findings: data.findings,
      compatibility_projections: data.records.map(({ id }) => ({
        record_id: id, classification: "projection_gap" as const, reason: "Extensible record",
      })),
      approval_blockers: ["classification-required"],
    });
    expect(model).toMatchObject({
      authoritative: false, approval_required: true, downstream_execution_allowed: false,
      summary: { requirements: 2, unknown_items: 1, derived_items: 1 },
    });
    expect(Object.isFrozen(model.records[0])).toBe(true);
    const directory = await mkdtemp(join(tmpdir(), "atlas-proposal-"));
    const path = join(directory, "proposed-project-model.json");
    await publishProposedProjectModel(path, model);
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(model);
    await expect(publishProposedProjectModel(path, model)).rejects.toThrow();
  });

  it("rejects missing projections and invalid derived records", () => {
    const data = fixture();
    const common = {
      project_id: "project", proposal_revision: 1,
      source_revision_id: data.inventory.source_revision_id,
      kind_registry: data.registry, candidate_inventory: data.inventory,
      workflow_nodes: [], source_documents: [{ document_id: "project-prd",
        document_version: "1.0", content_hash: hash("3") }],
      source_coverage: data.coverage, extraction_findings: data.findings,
    };
    expect(() => createProposedProjectModel({
      ...common, records: data.records, compatibility_projections: [],
    })).toThrow("disposition every record");
    expect(() => createProposedProjectModel({
      ...common,
      records: [{ ...data.records[1]!, issues: [] }],
      compatibility_projections: [{ record_id: data.records[1]!.id,
        classification: "projection_gap", reason: "No legacy representation" }],
    })).toThrow("Derived record");
  });
});
