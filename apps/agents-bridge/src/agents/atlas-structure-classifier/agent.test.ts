import { describe, expect, it } from "vitest";
import {
  createSectionPurposeRegistry,
  type SectionClassifierInputSchema,
} from "@company/ces-atlas-role-contracts";
import type { z } from "zod";
import {
  buildSectionClassifierRequest,
  createAtlasStructureClassifier,
} from "./agent.js";

const input: z.infer<typeof SectionClassifierInputSchema> = {
  contract_version: "1.0.0",
  revisions: {
    source_revision_id: "sample.rev.1",
    source_content_hash: `sha256:${"1".repeat(64)}`,
    lexicon_revision_id: "sample.lexicon.1",
    lexicon_content_hash: `sha256:${"2".repeat(64)}`,
    lexicon_state: "candidate_pinned",
    semantic_schema_version: "1.0.0",
    prompt_contract_version: "1.0.0",
  },
  purpose_registry: createSectionPurposeRegistry(),
  source_units: [{
    id: "sample.unit.1",
    order: 1,
    section_path: ["Arbitrary title"],
    kind: "paragraph",
    text: "A reviewer must approve a release before delivery.",
    content_hash: `sha256:${"3".repeat(64)}`,
  }],
};

describe("Atlas live structure classifier", () => {
  it("builds a content-driven request without fixed document headings", () => {
    const agent = createAtlasStructureClassifier({
      model_alias: "atlas-default",
      provider_id: "gemini",
      policy: {},
    });
    const request = buildSectionClassifierRequest(
      input, "atlas-default", agent.execution_policy,
    );
    expect(request.system_instructions).toContain("not from exact heading names");
    expect(request.messages[0]!.content).toContain("ces.section.roles-permissions");
    expect(request.messages[0]!.content).not.toContain("Safara");
  });

  it("finalizes provider classifications with pinned revisions", async () => {
    const agent = createAtlasStructureClassifier({
      model_alias: "atlas-default",
      provider_id: "gemini",
      policy: {},
    });
    const output = await agent.transformResult({
      classifications: [{
        source_unit_id: "sample.unit.1",
        purpose_ids: ["ces.section.roles-permissions", "ces.section.workflows"],
        disposition: "normative",
        confidence: 0.9,
        status: "ambiguous",
        rationale: "Approval and delivery workflow.",
      }],
    }, input, {
      request_id: "request-1",
      client_id: "atlas-cli",
      agent_id: agent.id,
      agent_version: agent.version,
      model_alias: "atlas-default",
      provider_id: "gemini",
      resolved_model: "gemini-test",
    });
    expect(output.revisions).toEqual(input.revisions);
    expect(output.classifications[0]!.source_unit_id).toBe("sample.unit.1");
  });
});
