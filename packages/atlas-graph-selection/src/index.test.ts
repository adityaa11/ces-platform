import { describe, expect, it } from "vitest";
import { selectAtlasGraphTypes } from "./index.js";

const fact = (id: string, kind: string, statement: string, context = "Order Fulfillment") => ({
  fact_id: `shop.fact.${id}`, kind, exact_statement: statement,
  source_unit_ids: [`shop.source.${id}`], terms: [], confidence: 1,
  evidence_ids: [`shop.evidence.${id}`], context_paths: [context],
  equivalence_status: "not_proposed",
});
const extraction = (facts: unknown[]) => ({ schema_version: "2.0.0", project_id: "shop",
  facts, evidence: [] });

describe("Atlas graph selection heuristics", () => {
  it("selects several evidence-supported graphs for one module", () => {
    const output = selectAtlasGraphTypes(extraction([
      fact("module", "module", "Order Fulfillment"),
      fact("order", "activity_order", "Payment occurs after checkout."),
      fact("transition", "state_transition", "Paid orders become Fulfilled."),
      fact("decision", "decision", "If payment succeeds, the order is accepted"),
      fact("condition", "condition", "If payment succeeds"),
      fact("outcome", "outcome", "the order is accepted"),
    ]));
    const kinds = output.assessments.map(({ graph_type_id }) => graph_type_id);
    expect(kinds).toContain("atlas.graph.business-workflow");
    expect(kinds).toContain("atlas.graph.workflow");
    expect(kinds).toContain("atlas.graph.state-machine");
    expect(kinds).toContain("atlas.graph.decision-tree");
    expect(JSON.stringify(output)).not.toMatch(/mermaid|react.?flow|elk/iu);
  });

  it("does not force a workflow when an ER model is the only supported graph", () => {
    const output = selectAtlasGraphTypes(extraction([
      fact("module", "module", "Catalog"),
      fact("relation", "entity_relationship", "A product belongs to a category.", "Catalog"),
    ]));
    expect(output.assessments.map(({ graph_type_id }) => graph_type_id))
      .toEqual(["atlas.graph.entity-relationship"]);
  });

  it("marks incomplete multi-prerequisite graphs for review", () => {
    const output = selectAtlasGraphTypes(extraction([
      fact("module", "module", "Catalog"), fact("entity", "entity", "Product", "Catalog"),
    ]));
    expect(output.assessments).toEqual([expect.objectContaining({
      graph_type_id: "atlas.graph.entity-lifecycle", support_status: "review_required",
      missing_prerequisites: ["a lifecycle event or transition"],
    })]);
  });

  it("owns supporting facts through canonical section and term references", () => {
    const output = selectAtlasGraphTypes(extraction([
      fact("module", "module", "1. Registration", "Registration"),
      { ...fact("order", "activity_order", "Registration enables Payment", "Registration"),
        terms: [{ role_id: "source", exact_text: "Registration" },
          { role_id: "target", exact_text: "Payment" }] },
    ]));
    expect(output.assessments).toContainEqual(expect.objectContaining({
      scope_kind: "module", graph_type_id: "atlas.graph.workflow",
      support_status: "supported",
    }));
  });
});
