import { describe, expect, it } from "vitest";
import {
  createAtlasCandidateInventory,
  inspectLegacyCandidateMigration,
  mergeAtlasRoleOutputs,
  partitionSourceUnits,
  type AtlasRoleOutput,
} from "./index.js";

const revisions = {
  source_revision_id: "safara.rev.0123456789ab",
  source_content_hash: `sha256:${"1".repeat(64)}`,
  lexicon_revision_id: "safara.lexicon.0123456789ab",
  lexicon_content_hash: `sha256:${"2".repeat(64)}`,
  lexicon_state: "candidate_pinned" as const,
  semantic_schema_version: "1.0.0",
  prompt_contract_version: "1.0.0",
};
const units = [1, 2, 3].map((order) => ({
  id: `safara.unit.0000${order}.01234567`,
  order,
  section_path: ["Kebutuhan"],
  kind: "paragraph",
  text: `Unit ${order}`,
  content_hash: `sha256:${String(order).repeat(64)}`,
}));
const output = (partition: string, candidate: string): AtlasRoleOutput => ({
  contract_version: "1.0.0",
  role_id: "atlas.section-extractor",
  partition_id: partition,
  revisions,
  classifications: [],
  concept_proposals: [],
  semantic_candidates: [{
    candidate_id: candidate,
    source_unit_ids: [units[0]!.id],
    semantic_kind: "business_rule",
    payload_hash: `sha256:${"a".repeat(64)}`,
  }],
  uncertainties: [],
  conflicts: [],
});

describe("DAPE-004 bounded Atlas roles", () => {
  it("builds a generic source-grounded candidate inventory", () => {
    const candidate = {
      contract_version: "1.0.0" as const,
      candidate_id: "cold-chain.candidate.temperature-release",
      statement: "Release requires an in-range temperature history.",
      provisional_kind: "cold-chain.kind.temperature-release",
      source_unit_ids: [units[0]!.id],
      confidence: 0.84,
      extraction_role: "atlas.domain-discovery",
      classification_status: "classification_required" as const,
      evidence_status: "support_review_required" as const,
      payload_hash: `sha256:${"3".repeat(64)}`,
      provider_metadata: {
        provider_id: "fixture",
        model_id: "domain-neutral-v1",
        contract_version: "1.0.0",
      },
    };
    const input = {
      source_revision_id: revisions.source_revision_id,
      lexicon_revision_id: revisions.lexicon_revision_id,
      semantic_schema_version: revisions.semantic_schema_version,
      semantic_kind_registry_id: "ces.semantic-kinds.0123456789ab",
      semantic_kind_registry_hash: `sha256:${"4".repeat(64)}`,
      prompt_contract_version: revisions.prompt_contract_version,
      allowed_source_unit_ids: units.map(({ id }) => id),
      candidates: [
        { ...candidate, candidate_id: "cold-chain.candidate.z-secondary" },
        candidate,
      ],
    };
    expect(createAtlasCandidateInventory(input).candidates[0]).toMatchObject({
      candidate_id: "cold-chain.candidate.temperature-release",
      provisional_kind: "cold-chain.kind.temperature-release",
      classification_status: "classification_required",
      evidence_status: "support_review_required",
    });
    expect(createAtlasCandidateInventory(input)).toEqual(createAtlasCandidateInventory({
      ...input, candidates: [...input.candidates].reverse(),
    }));
    expect(() => createAtlasCandidateInventory({
      ...input,
      candidates: [{ ...candidate, source_unit_ids: ["invented.unit"] }],
    })).toThrow("unknown source unit");
  });

  it("rejects lossy migration from the narrow legacy envelope", () => {
    const migration = inspectLegacyCandidateMigration(
      output("atlas.partition.00001", "safara.candidate.a").semantic_candidates![0]!,
    );
    expect(migration).toEqual({
      candidate_id: "safara.candidate.a",
      status: "rejected_lossy",
      losses: ["statement", "confidence", "provider_metadata"],
    });
  });

  it("partitions deterministically within configured budgets", () => {
    const partitions = partitionSourceUnits({
      role_id: "atlas.section-extractor", revisions,
      budget: { maximum_source_units: 2, maximum_input_characters: 20,
        maximum_output_candidates: 10, maximum_output_tokens: 1000 },
      source_units: [...units].reverse(),
    });
    expect(partitions.map(({ source_units }) => source_units.length)).toEqual([2, 1]);
    expect(partitions[0]?.source_units.map(({ order }) => order)).toEqual([1, 2]);
  });

  it("merges identically regardless of completion order and flags duplicates", () => {
    const a = output("atlas.partition.00001", "safara.candidate.a");
    const b = output("atlas.partition.00002", "safara.candidate.b");
    const first = mergeAtlasRoleOutputs({
      expected_revisions: revisions,
      allowed_source_unit_ids: units.map(({ id }) => id), outputs: [a, b],
    });
    const second = mergeAtlasRoleOutputs({
      expected_revisions: revisions,
      allowed_source_unit_ids: units.map(({ id }) => id), outputs: [b, a],
    });
    expect(first).toEqual(second);
    expect(first.duplicate_candidate_groups).toEqual([
      ["safara.candidate.a", "safara.candidate.b"],
    ]);
  });

  it("rejects mixed revisions, invented source IDs, and mutable L1 use", () => {
    expect(() => mergeAtlasRoleOutputs({
      expected_revisions: revisions, allowed_source_unit_ids: units.map(({ id }) => id),
      outputs: [{ ...output("atlas.partition.00001", "safara.candidate.a"),
        revisions: { ...revisions, prompt_contract_version: "2.0.0" } }],
    })).toThrow("Revision tuple mismatch");
    expect(() => mergeAtlasRoleOutputs({
      expected_revisions: revisions, allowed_source_unit_ids: units.map(({ id }) => id),
      outputs: [{ ...output("atlas.partition.00001", "safara.candidate.a"),
        semantic_candidates: [{ ...output("x", "safara.candidate.a").semantic_candidates![0]!,
          source_unit_ids: ["agent.invented.unit"] }] }],
    })).toThrow("unknown source unit");
    expect(() => partitionSourceUnits({
      role_id: "atlas.section-extractor",
      revisions: { ...revisions, lexicon_state: "seed" },
      budget: { maximum_source_units: 2, maximum_input_characters: 20,
        maximum_output_candidates: 10, maximum_output_tokens: 1000 },
      source_units: units,
    })).toThrow("pinned");
  });
});
