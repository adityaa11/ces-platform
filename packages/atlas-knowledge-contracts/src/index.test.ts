import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AtlasKnowledgeBundleSchema, knowledgeBreadcrumb } from "./index.js";

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

  it("keeps the Safara golden renderer-neutral and recursively connected", async () => {
    const golden = JSON.parse(await readFile(resolve(import.meta.dirname,
      "../../../tests/fixtures/safara/golden-main-workflow.json"), "utf8")) as {
      renderer_policy: { locked_renderer: unknown; semantic_membership_owned_by_renderer: boolean };
      knowledge_nodes: Array<{ knowledge_id: string; parent_id: string | null; children: string[] }>;
    };
    expect(golden.renderer_policy).toEqual({ interactive_required: true,
      locked_renderer: null, semantic_membership_owned_by_renderer: false });
    const nodes = new Map(golden.knowledge_nodes.map((node) => [node.knowledge_id, node]));
    for (const node of golden.knowledge_nodes) {
      for (const child of node.children) expect(nodes.get(child)?.parent_id).toBe(node.knowledge_id);
    }
  });
});
