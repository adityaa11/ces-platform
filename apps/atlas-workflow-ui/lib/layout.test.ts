import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ModelReviewWorkspace } from "@company/ces-atlas-model-review-contracts";
import { describe, expect, it } from "vitest";
import { layoutOverview } from "./layout";

const node = (id: string, label: string, kind = "atlas.node.operation") => ({ node: {
  projection_node_id: id, projection_kind: "atlas.projection.integrated", node_kind: kind,
  label, review_status: "pending", authoritative: false, identity_kind: "canonical_concept",
  canonical_concept_id: id.replace(".projection", ".concept"), evidence_ids: [`${id}.evidence`],
}, overview_eligible: true, overview_priority: 80, overview_role: "major_business_area",
overview_inclusion_reason: "Backend selected", default_visible: true });

const workspace = { overview: { nodes: [node("project.one.projection", "First"),
  node("project.two.projection", "Second")], edges: [{ projection_edge_id: "project.edge.projection",
  projection_kind: "atlas.projection.integrated", from_projection_node_id: "project.one.projection",
  to_projection_node_id: "project.two.projection", relationship_kind: "atlas.relationship.enables",
  relationship_status: "pending", authoritative: false, identity_kind: "governed_relationship",
  governed_relationship_id: "project.edge.one", origin: "explicit", evidence_ids: ["project.evidence.one"],
  rationale: "Source-defined." }], layout: { direction: "RIGHT",
  node_order: ["project.one.projection", "project.two.projection"],
  edge_order: ["project.edge.projection"] } } } as unknown as ModelReviewWorkspace;

describe("ATLAS-UI-005 production renderer qualification", () => {
  it("lays out identical backend topology deterministically and ignores label keywords", async () => {
    const first = await layoutOverview(workspace);
    expect(await layoutOverview(workspace)).toEqual(first);
    const mutated = structuredClone(workspace);
    (mutated.overview.nodes[0]!.node as { label: string; node_kind: string }).label = "Ready Decision Actor";
    expect(await layoutOverview(mutated)).toEqual(first);
  });

  it("contains no Safara fixture semantics in production UI sources", async () => {
    const files = [...await sourceFiles(join("apps", "atlas-workflow-ui", "app")),
      ...await sourceFiles(join("apps", "atlas-workflow-ui", "lib"))]
      .filter((path) => !path.endsWith(".test.ts"));
    const source = (await Promise.all(files.map((path) => readFile(path, "utf8")))).join("\n");
    for (const forbidden of ["Pendaftaran Jemaah", "Kesiapan Keberangkatan", "Finalisasi Manifest",
      "Data Jemaah", "Safara_Buyer", "pilgrim_registration"]) expect(source).not.toContain(forbidden);
  });
});

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? sourceFiles(join(directory, entry.name))
    : entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")
      ? [join(directory, entry.name)] : []))).flat();
}
