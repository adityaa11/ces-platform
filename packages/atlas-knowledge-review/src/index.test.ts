import { describe, expect, it } from "vitest";
import { approveAtlasKnowledge, atlasProposalHash, atlasReviewSubjects } from "./index.js";

const evidence = { evidence_id: "sample.evidence.one", exact_text: "Orders", language: "en",
  location: { document_id: "sample.document", document_revision: 1,
    source_unit_id: "sample.source.one", page_number: 1, page_number_base: 1,
    text_span: { start: 0, end: 6 }, coordinates: { coordinate_status: "unavailable",
      bounding_boxes: [], reason: "source_has_no_coordinates" } },
  extraction_method: "text_layer", extraction_confidence: 1, review_status: "unreviewed" };
const moduleNode = { knowledge_id: "sample.knowledge.module.orders",
  parent_id: "sample.knowledge.main-workflow", child_ids: [],
  canonical_concept_id: "sample.concept.orders", kind: "module", display_name: "Orders",
  source_label: "Orders", evidence_ids: [evidence.evidence_id], support_status: "supported" };
const proposal = { schema_version: "2.0.0", project_id: "sample", revision: 1,
  authority: { lifecycle: "proposed", authority: "non_authoritative" },
  root_knowledge_id: "sample.knowledge.main-workflow",
  documents: [{ document_id: "sample.document", revision: 1,
    content_hash: `sha256:${"a".repeat(64)}`, media_type: "application/pdf",
    original_name: "sample.pdf" }], evidence: [evidence], knowledge_nodes: [{
      knowledge_id: "sample.knowledge.main-workflow", parent_id: null,
      child_ids: [moduleNode.knowledge_id], kind: "visualization", display_name: "Main Workflow",
      evidence_ids: [evidence.evidence_id], support_status: "supported", permanently_visible: true,
      visualization: { graph_type_id: "atlas.graph.business-workflow", edges: [],
        ordering_status: "not_applicable", renderer_capabilities: { interactive_required: true,
          capabilities: ["pan", "zoom", "select", "focus_relationships", "accessible_summary"] },
        nodes: [{ graph_node_id: "sample.graph-node.orders",
          canonical_concept_id: "sample.concept.orders", knowledge_id: moduleNode.knowledge_id,
          semantic_kind_id: "module", label: "Orders", label_origin: "original_document",
          evidence_ids: [evidence.evidence_id] }] } }, moduleNode] };
function decisions(hash = atlasProposalHash(proposal)) {
  return atlasReviewSubjects(proposal).map((subject, index) => ({
    decision_id: `sample.decision.${index + 1}`, proposal_hash: hash, proposal_revision: 1,
    subject_id: subject, decision: "accepted", reviewer_id: "reviewer.one",
    decided_at: "2026-08-07T00:00:00.000Z" }));
}
describe("Atlas V2 review governance", () => {
  it("approves without changing proposal knowledge", () => {
    const result = approveAtlasKnowledge({ proposal, decisions: decisions() });
    expect(result.approved_bundle.authority.lifecycle).toBe("approved");
    expect(result.approved_bundle.knowledge_nodes).toEqual(proposal.knowledge_nodes);
    expect(proposal.authority.lifecycle).toBe("proposed");
  });
  it("fails closed for stale and partial decisions", () => {
    expect(() => approveAtlasKnowledge({ proposal, decisions: decisions(`sha256:${"b".repeat(64)}`) }))
      .toThrow(/Stale/u);
    expect(() => approveAtlasKnowledge({ proposal, decisions: decisions().slice(0, 1) }))
      .toThrow(/Missing/u);
  });
});
