import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readEvidence } from "./evidence";

const hash = `sha256:${"a".repeat(64)}`;

describe("Atlas evidence route adapter", () => {
  it("keeps exact original representations and one trace per representation", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-evidence-"));
    const directory = join(root, "project.example");
    await mkdir(directory);
    const unit = { id: "project.unit.one", exact_text: "Teks asli.",
      document_revision_id: "project.document.rev.one",
      language_detection: { detected_language: "id" } };
    const workspace = { contract_name: "atlas.model-review.workspace", contract_version: "1.0.0",
      producer_version: "atlas-intent-graph@1.0.0", projection_schema_version: "1.0.0",
      evidence_schema_version: "1.0.0", command_schema_version: "1.0.0",
      project_id: "project.example", revision: 1,
      authority: { lifecycle: "review_in_progress", authority: "non_authoritative",
        downstream_execution: { status: "blocked", blockers: ["atlas.blocker.review"] } },
      overview: { nodes: [{ node: { projection_node_id: "project.concept.one.projection.overview",
        projection_kind: "atlas.projection.integrated", node_kind: "atlas.node.operation",
        label: "Concept", review_status: "pending", authoritative: false,
        identity_kind: "canonical_concept", canonical_concept_id: "project.concept.one",
        evidence_ids: [unit.id] }, overview_eligible: true, overview_priority: 80,
        overview_role: "major_business_area", overview_inclusion_reason: "Backend selected",
        default_visible: true }], edges: [], summary: { node_count: 1, edge_count: 0,
        is_truncated: false, available_layer_ids: [], artifact_hashes: [hash],
        schema_versions: ["1.0.0"], revision: 1, budget: { max_initial_nodes: 10,
          max_initial_edges: 10, max_initial_payload_bytes: 2048, max_initial_layout_ms: 100 } },
        layout: { layout_engine: "elkjs", layout_engine_version: "0.11.0",
          layout_profile: "atlas.layout.overview", layout_algorithm: "atlas.layout.layered",
          direction: "RIGHT", node_order: ["project.concept.one.projection.overview"],
          edge_order: [], layout_input_hash: hash, layout_options_hash: hash } } };
    await Promise.all([
      writeFile(join(directory, "proposed-model-review-workspace.json"), JSON.stringify(workspace)),
      writeFile(join(directory, "source-units.json"), JSON.stringify([unit])),
      writeFile(join(directory, "atomic-claims.json"), JSON.stringify({ claims: [{
        claim_id: "project.claim.one", source_unit_id: unit.id }] })),
      writeFile(join(directory, "proposed-project-model.json"), JSON.stringify({
        records: [{ id: "project.record.one", source_unit_ids: [unit.id] }],
        operations: [{ operation_id: "project.operation.one", workflow_id: "project.workflow.one",
          semantic_record_ids: ["project.record.one"] }] })),
    ]);
    const evidence = await readEvidence({ root, projectId: "project.example",
      canonicalConceptId: "project.concept.one", revision: 1 });
    expect(evidence.representations).toMatchObject([{ exact_text: "Teks asli.", language: "id" }]);
    expect(evidence.traces).toHaveLength(evidence.representations.length);
  });
});
