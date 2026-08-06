import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { qualifyHard027 } from "./qualification/atlas-hard027.mjs";

describe("ATLAS-HARD-027 production-output qualification", () => {
  it("fails with attributed gaps and passes only the complete frozen oracle", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hard027-"));
    const oraclePath = join("tests", "fixtures", "safara", "golden-main-workflow.json");
    const oracle = JSON.parse(await import("node:fs/promises").then(({ readFile }) =>
      readFile(oraclePath, "utf8"))) as {
      main_workflow: { nodes: { concept: string; accepted_source_labels: string[] }[];
        relationships: { from: string; to: string; kind: string }[] };
      knowledge_nodes: unknown[];
    };
    const incomplete = join(directory, "incomplete.json");
    await writeFile(incomplete, JSON.stringify({ nodes: [], edges: [] }));
    expect((await qualifyHard027({ oraclePath, outputPath: incomplete })).passed).toBe(false);
    const ids = new Map(oracle.main_workflow.nodes.map((node) => [node.concept, `fixture.${node.concept}`]));
    const complete = join(directory, "complete.json");
    await writeFile(complete, JSON.stringify({ nodes: oracle.main_workflow.nodes.map((node) => ({
      node_id: ids.get(node.concept), label: node.accepted_source_labels[0],
      evidence_ids: [`fixture.evidence.${node.concept}`],
    })), edges: oracle.main_workflow.relationships.map((edge, index) => ({ edge_id: `fixture.edge.${index}`,
      from_node_id: ids.get(edge.from), to_node_id: ids.get(edge.to),
      relationship_kind: edge.kind })), knowledge_nodes: oracle.knowledge_nodes }));
    expect((await qualifyHard027({ oraclePath, outputPath: complete })).passed).toBe(true);
  });
});
