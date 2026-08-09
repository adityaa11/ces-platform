import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { authorizeAtlasRequest, parseByteRange, readKnowledgeNode,
  resolveAtlasConfiguredPath, resolvePdfDocument } from "./knowledge-v2";

function fixture() {
  const evidence = { evidence_id: "sample.evidence.one", exact_text: "Orders", language: "en",
    location: { document_id: "sample.document", document_revision: 1,
      source_unit_id: "sample.source.one", page_number: 2, page_number_base: 1,
      text_span: { start: 0, end: 6 }, coordinates: { coordinate_status: "unavailable",
        bounding_boxes: [], reason: "source_has_no_coordinates" } }, extraction_method: "text_layer",
    extraction_confidence: 1, review_status: "unreviewed" };
  const concept = { knowledge_id: "sample.knowledge.concept.create", parent_id: "sample.knowledge.module.orders",
    child_ids: [], representation_ids: [], canonical_concept_id: "sample.concept.create",
    kind: "concept", display_name: "Create Order", source_label: "Create Order",
    semantic_kind: "action", evidence_ids: [evidence.evidence_id], confidence: 1,
    review_status: "unreviewed", decomposition_status: "atomic", support_status: "supported" };
  const representation = { knowledge_id: "sample.knowledge.module.orders.visualization.workflow",
    parent_id: "sample.knowledge.module.orders", child_ids: [], representation_ids: [],
    kind: "visualization", display_name: "Workflow", evidence_ids: [evidence.evidence_id],
    support_status: "supported", permanently_visible: false,
    visualization: { graph_type_id: "atlas.graph.workflow", edges: [],
      ordering_status: "not_applicable", renderer_capabilities: { interactive_required: true,
        capabilities: ["pan", "zoom", "select", "focus_relationships", "accessible_summary"] },
      nodes: [{ graph_node_id: "sample.graph-node.create", canonical_concept_id: "sample.concept.create",
        knowledge_id: concept.knowledge_id, semantic_kind_id: "atlas.semantic.action",
        label: "Create Order", label_origin: "original_document", evidence_ids: [evidence.evidence_id] }] } };
  const module = { knowledge_id: "sample.knowledge.module.orders",
    parent_id: "sample.knowledge.main-workflow", child_ids: [concept.knowledge_id],
    representation_ids: [representation.knowledge_id],
    canonical_concept_id: "sample.concept.orders", kind: "module", display_name: "Orders",
    source_label: "Orders", evidence_ids: [evidence.evidence_id], support_status: "supported" };
  return { schema_version: "2.0.0", project_id: "sample", revision: 1,
    authority: { lifecycle: "proposed", authority: "non_authoritative" },
    root_knowledge_id: "sample.knowledge.main-workflow",
    documents: [{ document_id: "sample.document", revision: 1,
      content_hash: `sha256:${"a".repeat(64)}`, media_type: "application/pdf", original_name: "sample.pdf" }],
    evidence: [evidence], semantic_model: { concepts: [{ concept_id: module.canonical_concept_id,
      parent_concept_id: null, child_concept_ids: [concept.canonical_concept_id], semantic_kind: "module",
      source_label: "Orders", evidence_ids: [evidence.evidence_id], confidence: 1,
      review_status: "unreviewed", decomposition_status: "decomposable" },
      { concept_id: concept.canonical_concept_id, parent_concept_id: module.canonical_concept_id,
        child_concept_ids: [], semantic_kind: "action", source_label: "Create Order",
        evidence_ids: [evidence.evidence_id], confidence: 1, review_status: "unreviewed",
        decomposition_status: "atomic" }], relationships: [] },
    knowledge_nodes: [{ knowledge_id: "sample.knowledge.main-workflow",
      parent_id: null, child_ids: [module.knowledge_id], kind: "visualization", display_name: "Main Workflow",
      representation_ids: [],
      evidence_ids: [evidence.evidence_id], support_status: "supported", permanently_visible: true,
      visualization: { graph_type_id: "atlas.graph.business-workflow", edges: [],
        ordering_status: "not_applicable", renderer_capabilities: { interactive_required: true,
          capabilities: ["pan", "zoom", "select", "focus_relationships", "accessible_summary"] },
        nodes: [{ graph_node_id: "sample.graph-node.orders", canonical_concept_id: "sample.concept.orders",
          knowledge_id: module.knowledge_id, semantic_kind_id: "module", label: "Orders",
          label_origin: "original_document", evidence_ids: [evidence.evidence_id] }] } },
      module, concept, representation] };
}
describe("Atlas V2 knowledge API backing", () => {
  it("resolves env-file paths from the pnpm invocation root", () => {
    expect(resolveAtlasConfiguredPath(".ces/generated", "C:/repo/apps/atlas-workflow-ui",
      "C:/repo").replaceAll("\\", "/")).toBe("C:/repo/.ces/generated");
    expect(resolveAtlasConfiguredPath("C:/atlas/generated", "C:/repo/apps", "C:/repo")
      .replaceAll("\\", "/")).toBe("C:/atlas/generated");
  });
  it("returns recursive context and rejects stale revisions", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-api-"));
    try { await mkdir(join(root, "sample"));
      await writeFile(join(root, "sample", "atlas-knowledge.json"), JSON.stringify(fixture()));
      const result = await readKnowledgeNode({ root, projectId: "sample", revision: 1,
        knowledgeId: "sample.knowledge.module.orders" });
      expect(result.breadcrumb.map(({ display_name }) => display_name)).toEqual(["Main Workflow", "Orders"]);
      expect(result.source_coverage).toEqual({ page_numbers: [2], source_unit_count: 1,
        evidence_count: 1, overview_text: ["Orders"] });
      expect(result.children).toEqual([expect.objectContaining({ display_name: "Create Order",
        semantic_kind: "action", depth: 1 })]);
      expect(result.representations).toEqual([expect.objectContaining({ display_name: "Workflow" })]);
      await expect(readKnowledgeNode({ root, projectId: "sample", revision: 2,
        knowledgeId: "sample.knowledge.module.orders" })).rejects.toThrow(/stale/u);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("isolates PDF storage and parses ranges", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-pdf-")); const pdfRoot = join(root, "pdf");
    try { await mkdir(join(root, "artifacts", "sample"), { recursive: true });
      await mkdir(join(pdfRoot, "sample"), { recursive: true });
      await writeFile(join(root, "artifacts", "sample", "atlas-knowledge.json"), JSON.stringify(fixture()));
      await writeFile(join(pdfRoot, "sample", "sample.pdf"), "%PDF-test");
      expect((await resolvePdfDocument({ artifactRoot: join(root, "artifacts"), pdfRoot,
        projectId: "sample", documentId: "sample.document", revision: 1 })).size).toBe(9);
      expect(parseByteRange("bytes=2-5", 9)).toEqual({ start: 2, end: 5 });
      expect(() => parseByteRange("bytes=20-30", 9)).toThrow(/Unsatisfiable/u);
      expect(() => authorizeAtlasRequest("Bearer wrong", "secret")).toThrow(/authorization/u);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
