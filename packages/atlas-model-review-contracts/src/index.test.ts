import { describe, expect, it } from "vitest";
import {
  classifyContractCompatibility,
  DecisionCommandSchema,
  DecisionReceiptSchema,
  OverviewSummarySchema,
  ProjectionNodeSchema,
  SourceEvidenceProjectionSchema,
  WorkspaceAuthoritySchema,
  ModelReviewDetailSchema,
  ModelReviewDetailIndexSchema,
} from "./index.js";

const id = (suffix: string) => `project.${suffix}`;
const hash = `sha256:${"a".repeat(64)}`;

describe("ATLAS-UI-000 shared model-review contracts", () => {
  it("separates canonical and projection-only identity", () => {
    expect(ProjectionNodeSchema.parse({
      projection_node_id: id("projection-node.payment"), projection_kind: id("projection.workflow"),
      node_kind: id("kind.operation"), label: "Payment", review_status: "pending",
      authoritative: false, identity_kind: "canonical_concept",
      canonical_concept_id: id("concept.payment"), evidence_ids: [id("evidence.payment")],
    }).identity_kind).toBe("canonical_concept");
    expect(() => ProjectionNodeSchema.parse({
      projection_node_id: id("projection-node.gateway"), projection_kind: id("projection.bpmn"),
      node_kind: id("kind.gateway"), label: "Gateway", review_status: "pending",
      authoritative: true, identity_kind: "projection_construct",
      projection_construct_id: id("construct.gateway"),
      projection_construct_kind: id("construct-kind.exclusive-gateway"),
      derived_from_relationship_ids: [id("relationship.ready")], evidence_ids: [],
    })).toThrow();
  });

  it("requires exactly one trace for every exact representation", () => {
    const evidence = { evidence_id: id("evidence.one"), canonical_concept_id: id("concept.one"),
      representations: [{ representation_id: id("representation.one"), exact_text: "Exact text.",
        language: "en", document_id: id("document.one"), source_unit_id: id("unit.one"),
        text_span: { start: 0, end: 11 } }], traces: [] };
    expect(() => SourceEvidenceProjectionSchema.parse(evidence)).toThrow("one trace");
    expect(SourceEvidenceProjectionSchema.parse({ ...evidence, traces: [{
      representation_id: id("representation.one"), document_id: id("document.one"),
      source_unit_id: id("unit.one"), atomic_claim_id: id("claim.one"),
      canonical_record_id: id("record.one"),
    }] }).traces).toHaveLength(1);
  });

  it("enforces bounded overview and explicit authority blockers", () => {
    expect(() => OverviewSummarySchema.parse({ node_count: 11, edge_count: 1,
      is_truncated: false, available_layer_ids: [], artifact_hashes: [hash],
      schema_versions: ["1.0.0"], revision: 1,
      budget: { max_initial_nodes: 10, max_initial_edges: 10,
        max_initial_payload_bytes: 1000, max_initial_layout_ms: 100 } })).toThrow("truncated");
    expect(() => WorkspaceAuthoritySchema.parse({ lifecycle: "approved",
      authority: "authoritative", downstream_execution: { status: "blocked", blockers: [] } }))
      .toThrow();
    expect(WorkspaceAuthoritySchema.parse({ lifecycle: "approved",
      authority: "authoritative", approval_decision_ids: [id("decision.release")],
      downstream_execution: { status: "blocked",
        blockers: [id("blocker.release-policy")] } }).lifecycle).toBe("approved");
  });

  it("fails closed on missing/new versions and recognizes explicit migrations", () => {
    expect(classifyContractCompatibility({})).toBe("unsupported");
    expect(classifyContractCompatibility({ contract_name: "atlas.model-review.workspace",
      contract_version: "2.0.0" })).toBe("unsupported");
    expect(classifyContractCompatibility({ contract_name: "atlas.model-review.workspace",
      contract_version: "0.9.0", migration_adapter_versions: ["0.9.0"] }))
      .toBe("migration_required");
    expect(classifyContractCompatibility({ contract_name: "atlas.model-review.workspace",
      contract_version: "1.0.0" })).toBe("current");
  });

  it("forbids reviewer injection and unsafe materialized URLs", () => {
    const command = { contract_name: "atlas.model-review.decision-command",
      contract_version: "1.0.0", project_id: id("example"), proposal_revision: 1,
      subject_ids: [id("record.one")], action: "approve", note: "Reviewed.",
      idempotency_key: "request-one", csrf_token: "csrf-one" };
    expect(DecisionCommandSchema.parse(command)).not.toHaveProperty("reviewer");
    expect(() => DecisionCommandSchema.parse({ ...command, reviewer: "forged" })).toThrow();
    const receipt = { contract_name: "atlas.model-review.decision-receipt",
      contract_version: "1.0.0", project_id: id("example"), proposal_revision: 1,
      decision_id: id("decision.one"), audit_event_id: id("audit.one"),
      reviewer: { kind: "human", display_name: "Reviewer" } };
    expect(() => DecisionReceiptSchema.parse({ ...receipt,
      materialized_workspace_path: "https://evil.example/workspace" })).toThrow();
    expect(DecisionReceiptSchema.parse({ ...receipt,
      materialized_workspace_path: "/projects/example/atlas" }).decision_id)
      .toBe(id("decision.one"));
  });

  it("validates indexed detail without inventing missing ordering", () => {
    const authority = { lifecycle: "review_in_progress" as const,
      authority: "non_authoritative" as const,
      downstream_execution: { status: "blocked" as const,
        blockers: [id("blocker.review")] } };
    expect(ModelReviewDetailIndexSchema.parse({
      contract_name: "atlas.model-review.detail-index", contract_version: "1.0.0",
      producer_version: "atlas-intent-graph@1.0.0", projection_schema_version: "1.0.0",
      project_id: id("example"), revision: 1, authority, entries: [{
        subject_id: id("workflow.package"), subject_role: "context_provider",
        label: "Package schedule", detail_path: "proposed-details/workflow.package.json",
        review_status: "pending",
      }],
    }).entries).toHaveLength(1);
    const operation = (suffix: string) => ({ projection_node_id: id(`operation.${suffix}.detail`),
      projection_kind: id("projection.workflow-detail"), node_kind: id("node.operation"),
      label: suffix, review_status: "pending" as const, authoritative: false,
      identity_kind: "canonical_concept" as const,
      canonical_concept_id: id(`operation.${suffix}`), evidence_ids: [id(`evidence.${suffix}`)] });
    const detail = { contract_name: "atlas.model-review.detail", contract_version: "1.0.0",
      producer_version: "atlas-intent-graph@1.0.0", projection_schema_version: "1.0.0",
      evidence_schema_version: "1.0.0", command_schema_version: "1.0.0",
      project_id: id("example"), revision: 1, authority, availability: "full",
      subject: { subject_id: id("workflow.package"), subject_role: "context_provider",
        canonical_concept_id: id("workflow.package"), node_kind: id("node.context-provider"),
        label: "Package schedule", review_status: "pending", authoritative: false,
        evidence_ids: [id("evidence.package")] },
      graph: { nodes: [operation("create"), operation("maintain")], edges: [],
        ordering_status: "not_established",
        ordering_explanation: "No governed internal ordering is established." },
      connected_project_relationships: [],
      tabs: [{ tab: "flow", availability: "available", item_count: 2,
        artifact_path: "proposed-workflows/workflow.package/flow.json" },
        { tab: "states", availability: "explicitly_empty", item_count: 0 }],
    } as const;
    expect(ModelReviewDetailSchema.parse(detail).graph.nodes).toHaveLength(2);
    expect(() => ModelReviewDetailSchema.parse({ ...detail, graph: { ...detail.graph,
      edges: [{ projection_edge_id: id("edge.fake.detail"),
        projection_kind: id("projection.workflow-detail"),
        from_projection_node_id: id("operation.create.detail"),
        to_projection_node_id: id("operation.maintain.detail"),
        relationship_kind: id("relationship.precedes"), relationship_status: "pending",
        authoritative: false, identity_kind: "projection_construct",
        projection_construct_id: id("construct.fake"),
        derived_from_relationship_ids: [id("relationship.missing")], evidence_ids: [] }] } }))
      .toThrow("Unestablished ordering");
  });
});
