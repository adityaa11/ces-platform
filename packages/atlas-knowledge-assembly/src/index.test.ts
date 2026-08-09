import { selectAtlasGraphTypes } from "@company/ces-atlas-graph-selection";
import { knowledgeBreadcrumb } from "@company/ces-atlas-knowledge-contracts";
import { describe, expect, it } from "vitest";
import { assembleAtlasKnowledge } from "./index.js";

const hash = `sha256:${"a".repeat(64)}`;
function evidence(id: string, text: string) {
  return { evidence_id: id, exact_text: text, language: "id",
    location: { document_id: "sample.document", document_revision: 1,
      source_unit_id: `sample.source.${id.split(".").at(-1)}`, page_number: 1,
      page_number_base: 1 as const, text_span: { start: 0, end: text.length },
      coordinates: { coordinate_status: "unavailable" as const, bounding_boxes: [] as [],
        reason: "source_has_no_coordinates" as const } },
    extraction_method: "text_layer" as const, extraction_confidence: 1,
    review_status: "unreviewed" as const };
}
function fact(id: string, kind: string, statement: string, context: string,
  terms: Array<{ role_id: string; exact_text: string }> = []) {
  return { fact_id: `sample.fact.${id}`, kind, exact_statement: statement,
    source_unit_ids: [`sample.source.${id}`], terms, confidence: 0.9,
    evidence_ids: [`sample.evidence.${id}`], context_paths: [context],
    equivalence_status: "not_proposed" };
}
function bundle(facts: ReturnType<typeof fact>[]) {
  const extraction = { schema_version: "2.0.0", project_id: "sample", facts,
    evidence: facts.map((item) => evidence(item.evidence_ids[0]!, item.exact_statement)) };
  return assembleAtlasKnowledge({ project_id: "sample", revision: 1,
    documents: [{ document_id: "sample.document", revision: 1, content_hash: hash,
      media_type: "application/pdf", original_name: "sample.pdf" }], extraction,
    selection: selectAtlasGraphTypes(extraction) });
}

describe("recursive Atlas knowledge assembly", () => {
  it("keeps decisions below their source module and exposes breadcrumbs", () => {
    const result = bundle([
      fact("booking", "module", "Pemesanan", "Pemesanan"),
      fact("pay", "module", "Pembayaran", "Pembayaran"),
      fact("order", "activity_order", "Pemesanan dilanjutkan ke Pembayaran", "Pemesanan",
        [{ role_id: "source", exact_text: "Pemesanan" },
          { role_id: "target", exact_text: "Pembayaran" }]),
      fact("condition", "condition", "Jika pembayaran berhasil", "Pemesanan > Keputusan",
        [{ role_id: "condition", exact_text: "pembayaran berhasil" }]),
      fact("outcome", "outcome", "Pesanan dikonfirmasi", "Pemesanan > Keputusan",
        [{ role_id: "outcome", exact_text: "Pesanan dikonfirmasi" }]),
    ]);
    const root = result.knowledge_nodes.find(({ knowledge_id }) =>
      knowledge_id === result.root_knowledge_id)!;
    expect(root.child_ids).toHaveLength(2);
    expect(root.kind).toBe("visualization");
    if (root.kind !== "visualization") throw new Error("expected visualization");
    expect(root.visualization.nodes.map(({ label }) => label)).toEqual(["Pemesanan", "Pembayaran"]);
    const decision = result.knowledge_nodes.find((node) => node.kind === "visualization" &&
      node.visualization.graph_type_id === "atlas.graph.decision-tree")!;
    expect(knowledgeBreadcrumb(result, decision.knowledge_id)).toEqual([
      result.root_knowledge_id, decision.parent_id, decision.knowledge_id]);
  });

  it("builds a different hierarchy for an entity-relationship document", () => {
    const result = bundle([
      fact("catalog", "module", "Catalog", "Catalog"),
      fact("relation", "entity_relationship", "Product belongs to Category", "Catalog",
        [{ role_id: "entity_source", exact_text: "Product" },
          { role_id: "entity_target", exact_text: "Category" }]),
    ]);
    const graphs = result.knowledge_nodes.filter((node) => node.kind === "visualization")
      .map((node) => node.visualization.graph_type_id);
    expect(graphs).toContain("atlas.graph.entity-relationship");
    expect(graphs).not.toContain("atlas.graph.workflow");
    const root = result.knowledge_nodes.find(({ knowledge_id }) =>
      knowledge_id === result.root_knowledge_id);
    expect(root?.kind === "visualization" && root.visualization.graph_type_id)
      .toBe("atlas.graph.project-map");
  });

  it("resolves numbered module labels through canonical endpoint identities", () => {
    const result = bundle([
      fact("registration", "module", "1. Registration", "Registration"),
      fact("payment", "module", "2. Payment", "Payment"),
      fact("link", "dependency", "Registration provides data to Payment", "Registration",
        [{ role_id: "source", exact_text: "Registration" },
          { role_id: "target", exact_text: "Payment" }]),
    ]);
    const root = result.knowledge_nodes.find(({ knowledge_id }) =>
      knowledge_id === result.root_knowledge_id);
    if (root?.kind !== "visualization") throw new Error("expected root visualization");
    expect(root.visualization.edges).toHaveLength(1);
    expect(root.visualization.nodes.map(({ label }) => label).sort())
      .toEqual(["1. Registration", "2. Payment"]);
  });
});
