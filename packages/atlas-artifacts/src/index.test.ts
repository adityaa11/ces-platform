import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasArtifactBundle, publishAtlasArtifactBundle } from "./index.js";

const hash = (character: string) => `sha256:${character.repeat(64)}`;
const manifest = {
  schema_version: "1.0.0" as const, atlas_version: "1.0.0",
  contract_version: "1.0.0", provider_id: "fixture", model_id: "neutral-v1",
  input_document_hashes: [hash("b"), hash("a")], configuration_hash: hash("c"),
  proposal_revision: 1, run_started_at: "2026-07-28T19:00:00+07:00",
};

describe("ATLAS-HARD-014 deterministic artifacts", () => {
  it("canonicalizes semantic artifacts independently from run metadata", async () => {
    const first = createAtlasArtifactBundle({
      project_id: "project", model_hash: hash("d"),
      semantic_artifacts: {
        "source-coverage.json": { z: 2, a: 1 },
        "proposed-project-model.json": { lifecycle: "review_in_progress", records: [] },
      },
      run_manifest: manifest,
    });
    const second = createAtlasArtifactBundle({
      project_id: "project", model_hash: hash("d"),
      semantic_artifacts: {
        "proposed-project-model.json": { records: [], lifecycle: "review_in_progress" },
        "source-coverage.json": { a: 1, z: 2 },
      },
      run_manifest: { ...manifest, run_started_at: "2026-07-28T20:00:00+07:00" },
    });
    expect(first.semantic_bundle_hash).toBe(second.semantic_bundle_hash);
    expect(first.semantic_artifacts).toEqual(second.semantic_artifacts);
    const output = await mkdtemp(join(tmpdir(), "atlas-artifacts-"));
    const published = await publishAtlasArtifactBundle(output, first);
    expect(await readFile(join(published, "proposed-project-model.json"), "utf8"))
      .toBe(first.semantic_artifacts[0]?.canonical_json);
    await expect(publishAtlasArtifactBundle(output, first)).rejects.toThrow();
  });

  it("rejects timestamps inside semantic artifacts", () => {
    expect(() => createAtlasArtifactBundle({
      project_id: "project", model_hash: hash("d"),
      semantic_artifacts: {
        "proposed-project-model.json": { generated_at: "now" },
      },
      run_manifest: manifest,
    })).toThrow("Run metadata");
  });
});
