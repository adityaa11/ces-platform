import { describe, expect, it } from "vitest";
import {
  createSectionPurposeRegistry,
  finalizeCanonicalCandidateExtraction,
} from "@company/ces-atlas-role-contracts";
import {
  buildCandidateExtractionRequest,
  createAtlasCandidateExtractor,
} from "./agent.js";

const unit = {
  id: "sample.unit.1",
  order: 1,
  section_path: ["Policies"],
  kind: "paragraph",
  text: "Only reviewers may release an accepted order.",
  content_hash: `sha256:${"3".repeat(64)}`,
};
const input = {
  contract_version: "1.0.0" as const,
  revisions: {
    source_revision_id: "sample.rev.1",
    source_content_hash: `sha256:${"1".repeat(64)}`,
    lexicon_revision_id: "sample.lexicon.1",
    lexicon_content_hash: `sha256:${"2".repeat(64)}`,
    lexicon_state: "candidate_pinned" as const,
    semantic_schema_version: "1.0.0",
    prompt_contract_version: "1.0.0",
  },
  extractor_id: "atlas.extractor.role-permission",
  semantic_kind_registry_id: "ces.semantic-kinds.test",
  semantic_kind_registry_hash: `sha256:${"4".repeat(64)}`,
  allowed_semantic_kind_ids: ["ces.kind.role-permission"],
  source_units: [unit],
  section_classifications: [{
    source_unit_id: unit.id,
    purpose_ids: ["ces.section.roles-permissions"],
    disposition: "normative" as const,
    confidence: 0.9,
    status: "classified" as const,
    rationale: "Permission language.",
  }],
};

describe("Atlas canonical candidate extractor", () => {
  it("emits generic candidates with canonical source-unit evidence", () => {
    const output = finalizeCanonicalCandidateExtraction(input, {
      candidates: [{
        temporary_id: "TMP-CANDIDATE-1",
        statement: unit.text,
        provisional_kind: "ces.kind.role-permission",
        source_unit_ids: [unit.id],
        confidence: 0.95,
        classification_status: "classified",
        evidence_status: "source_anchored",
      }],
      uncertainties: [],
      conflicts: [],
    }, { provider_id: "gemini", model_id: "gemini-test" });
    expect(output.inventory.candidates[0]).toMatchObject({
      statement: unit.text,
      provisional_kind: "ces.kind.role-permission",
      source_unit_ids: [unit.id],
      extraction_role: "atlas.extractor.role-permission",
    });
  });

  it("rejects invented evidence and kinds outside extractor scope", () => {
    expect(() => finalizeCanonicalCandidateExtraction(input, {
      candidates: [{
        temporary_id: "TMP-CANDIDATE-1",
        statement: unit.text,
        provisional_kind: "ces.kind.calculation",
        source_unit_ids: ["sample.unit.invented"],
        confidence: 0.5,
        classification_status: "classified",
        evidence_status: "source_anchored",
      }],
    }, { provider_id: "gemini", model_id: "gemini-test" }))
      .toThrow("outside extractor scope");
  });

  it("uses the generic contract rather than the legacy arrays", () => {
    const agent = createAtlasCandidateExtractor({
      model_alias: "atlas-default", provider_id: "gemini", policy: {},
    });
    const request = buildCandidateExtractionRequest(
      input, "atlas-default", agent.execution_policy,
    );
    expect(request.system_instructions).toContain("generic candidates");
    expect(request.system_instructions).toContain("exact original document wording");
    expect(request.system_instructions).toContain("never translate");
    expect(request.system_instructions).not.toContain("candidate_requirements");
    expect(request.messages[0]!.content).toContain(createSectionPurposeRegistry()
      .purposes.find(({ purpose_id }) => purpose_id === "ces.section.roles-permissions")!
      .purpose_id);
  });
});
