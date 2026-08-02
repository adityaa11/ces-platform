import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readWorkspace } from "./workspace";

const hash = `sha256:${"a".repeat(64)}`;
const workspace = {
  contract_name: "atlas.model-review.workspace",
  contract_version: "1.0.0",
  producer_version: "atlas-intent-graph@1.0.0",
  projection_schema_version: "1.0.0",
  evidence_schema_version: "1.0.0",
  command_schema_version: "1.0.0",
  project_id: "project.example",
  revision: 1,
  authority: { lifecycle: "review_in_progress", authority: "non_authoritative",
    downstream_execution: { status: "blocked", blockers: ["atlas.blocker.review"] } },
  overview: { nodes: [], edges: [], summary: { node_count: 0, edge_count: 0,
    is_truncated: false, available_layer_ids: [], artifact_hashes: [hash],
    schema_versions: ["1.0.0"], revision: 1,
    budget: { max_initial_nodes: 10, max_initial_edges: 10,
      max_initial_payload_bytes: 1024, max_initial_layout_ms: 100 } },
  layout: { layout_engine: "elkjs", layout_engine_version: "0.11.0",
    layout_profile: "atlas.layout.overview", layout_algorithm: "atlas.layout.layered",
    direction: "RIGHT", node_order: [], edge_order: [], layout_input_hash: hash,
    layout_options_hash: hash } },
} as const;

describe("Atlas workspace server boundary", () => {
  it("loads only a schema-valid revision from a scoped project directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-ui-"));
    const directory = join(root, "project.example");
    await mkdir(directory);
    await writeFile(join(directory, "proposed-model-review-workspace.json"),
      JSON.stringify(workspace), "utf8");
    expect((await readWorkspace({ root, projectId: "project.example" })).revision).toBe(1);
    await expect(readWorkspace({ root, projectId: "../outside" }))
      .rejects.toThrow("Invalid Atlas project identifier");
  });
});
