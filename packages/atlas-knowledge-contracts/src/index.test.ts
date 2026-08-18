import { describe, expect, it } from "vitest";
import { AtlasKnowledgeBundleSchema, AtlasProjectContextSchema, AtlasSemanticModelSchema,
  knowledgeBreadcrumb } from "./index.js";

const hash = `sha256:${"a".repeat(64)}`;
const evidence = {
  evidence_id: "project.evidence.fulfillment",
  exact_text: "Order Fulfillment",
  language: "en",
  location: {
    document_id: "project.document.prd", document_revision: 1,
    source_unit_id: "project.source.fulfillment", page_number: 3,
    page_number_base: 1 as const, text_span: { start: 10, end: 29 },
    coordinates: { coordinate_status: "available" as const,
      bounding_boxes: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.04,
        coordinate_space: "normalized_page" as const, origin: "top_left" as const }] },
  },
  extraction_method: "text_layer" as const, extraction_confidence: 1,
  review_status: "accepted" as const,
};
const module = {
  knowledge_id: "project.module.fulfillment", parent_id: "project.main",
  child_ids: ["project.module.fulfillment.rules"],
  canonical_concept_id: "project.concept.fulfillment", display_name: "Order Fulfillment",
  source_label: "Order Fulfillment", evidence_ids: [evidence.evidence_id],
  support_status: "supported" as const, kind: "module" as const,
};
const content = {
  knowledge_id: "project.module.fulfillment.rules", parent_id: module.knowledge_id,
  child_ids: [], display_name: "Business Rules", evidence_ids: [evidence.evidence_id],
  support_status: "supported" as const, kind: "content" as const,
  content_type_id: "atlas.content.business-rules", content: { rule_ids: ["rule.fulfillment"] },
};
const root = {
  knowledge_id: "project.main", parent_id: null, child_ids: [module.knowledge_id],
  display_name: "Main Workflow", evidence_ids: [evidence.evidence_id],
  support_status: "supported" as const, kind: "visualization" as const,
  permanently_visible: true,
  visualization: {
    graph_type_id: "atlas.graph.business-workflow", ordering_status: "established" as const,
    renderer_capabilities: { interactive_required: true,
      capabilities: ["pan", "zoom", "select", "accessible_summary"] as const },
    nodes: [{ graph_node_id: "project.graph.fulfillment",
      canonical_concept_id: module.canonical_concept_id, knowledge_id: module.knowledge_id,
      semantic_kind_id: "atlas.kind.module", label: module.source_label,
      label_origin: "original_document" as const, evidence_ids: [evidence.evidence_id] }],
    edges: [],
  },
};
const bundle = {
  schema_version: "2.0.0" as const, project_id: "project", revision: 1,
  authority: { lifecycle: "proposed" as const, authority: "non_authoritative" as const },
  root_knowledge_id: root.knowledge_id,
  documents: [{ document_id: "project.document.prd", revision: 1,
    content_hash: hash, media_type: "application/pdf", original_name: "PRD.pdf", page_count: 3 }],
  evidence: [evidence], knowledge_nodes: [root, module, content],
  semantic_model: { concepts: [{ concept_id: module.canonical_concept_id,
    parent_concept_id: null, child_concept_ids: [], semantic_kind: "module" as const,
    source_label: module.source_label, evidence_ids: [evidence.evidence_id], confidence: 1,
    review_status: "accepted" as const, decomposition_status: "atomic" as const }],
    relationships: [] },
};

describe("Atlas recursive knowledge contract", () => {
  it("validates renderer-neutral recursive knowledge and PDF evidence", () => {
    const parsed = AtlasKnowledgeBundleSchema.parse(bundle);
    expect(knowledgeBreadcrumb(parsed, content.knowledge_id))
      .toEqual([root.knowledge_id, module.knowledge_id, content.knowledge_id]);
    expect(JSON.stringify(parsed)).not.toContain("mermaid");
    expect(JSON.stringify(parsed)).not.toContain("react-flow");
  });

  it("rejects guessed PDF coordinates and hierarchy cycles", () => {
    expect(() => AtlasKnowledgeBundleSchema.parse({ ...bundle, evidence: [{ ...evidence,
      location: { ...evidence.location, coordinates: { coordinate_status: "unavailable",
        bounding_boxes: [evidence.location.coordinates.bounding_boxes[0]],
        reason: "ocr_coordinates_unreliable" } } }] })).toThrow();
    expect(() => AtlasKnowledgeBundleSchema.parse({ ...bundle,
      knowledge_nodes: [root, { ...module, child_ids: [root.knowledge_id] }, content] })).toThrow();
  });

  it("validates graph-neutral recursive semantic concepts and relationships", () => {
    const concepts = [{ concept_id: "project.concept.payment", parent_concept_id: null,
      child_concept_ids: ["project.concept.verification"], semantic_kind: "module",
      source_label: "Pembayaran", evidence_ids: [evidence.evidence_id], confidence: 1,
      review_status: "unreviewed", decomposition_status: "decomposable" },
    { concept_id: "project.concept.verification", parent_concept_id: "project.concept.payment",
      child_concept_ids: [], semantic_kind: "action", source_label: "Verifikasi Pembayaran",
      evidence_ids: [evidence.evidence_id], confidence: .95, review_status: "unreviewed",
      decomposition_status: "atomic" }];
    const parsed = AtlasSemanticModelSchema.parse({ concepts, relationships: [{
      relationship_id: "project.relationship.contains", from_concept_id: concepts[0]!.concept_id,
      to_concept_id: concepts[1]!.concept_id, relationship_kind: "contains",
      display_label: "contains", evidence_ids: [evidence.evidence_id], confidence: .95,
      review_status: "unreviewed" }] });
    expect(parsed.concepts[1]?.source_label).toBe("Verifikasi Pembayaran");
    expect(JSON.stringify(parsed)).not.toContain("graph_type");
    expect(() => AtlasSemanticModelSchema.parse({ concepts: [
      { ...concepts[0], parent_concept_id: concepts[1]!.concept_id },
      { ...concepts[1], child_concept_ids: [concepts[0]!.concept_id] }], relationships: [] }))
      .toThrow(/cycle/u);
  });

  it("validates accumulated revisions, PRD increments, and contributions", () => {
    const context = { schema_version: "1.0.0", project_id: "project", displayed_revision: 2,
      authority: { lifecycle: "proposed", authority: "non_authoritative" },
      revisions: [
        { revision: 1, predecessor_revision: null, lifecycle: "superseded",
          included_increment_ids: ["project.document.prd.increment.1"], knowledge_bundle_hash: hash },
        { revision: 2, predecessor_revision: 1, lifecycle: "proposed",
          included_increment_ids: ["project.document.prd.increment.1", "project.document.change.increment.1"],
          knowledge_bundle_hash: hash }],
      increments: [
        { increment_id: "project.document.prd.increment.1", sequence: 1,
          document_id: "project.document.prd", document_revision: 1, content_hash: hash, title: "PRD.pdf" },
        { increment_id: "project.document.change.increment.1", sequence: 2,
          document_id: "project.document.change", document_revision: 1, content_hash: hash, title: "Change.pdf" }],
      contributions: [{ contribution_id: "project.contribution.one",
        increment_id: "project.document.change.increment.1", destination_kind: "knowledge",
        destination_id: "project.module.fulfillment", role: "clarified",
        evidence_ids: [evidence.evidence_id] }] };
    expect(AtlasProjectContextSchema.parse(context).revisions).toHaveLength(2);
    expect(() => AtlasProjectContextSchema.parse({ ...context, revisions: [
      { ...context.revisions[1], predecessor_revision: 2 }] })).toThrow(/predecessor/u);
    expect(() => AtlasProjectContextSchema.parse({ ...context, contributions: [
      { ...context.contributions[0], increment_id: "project.increment.missing" }] }))
      .toThrow(/unknown increment/u);
  });
});
