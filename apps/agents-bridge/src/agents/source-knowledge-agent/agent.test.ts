import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPolicyKnowledgeAgentRequest } from "@company/ces-policy-knowledge-proposals";
import { createSourceKnowledgeAgent } from "./agent.js";
import { resolveAcceptedGovernedSource } from "./governed-source.js";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function request(locator: string, existing: string[] = []) { return createPolicyKnowledgeAgentRequest({
  schema_version: "1.0.0", request_id: `request.extract.${locator.endsWith("1.1") ? "classification" : "disclosure"}`,
  lifecycle: "proposed", governed_context: { gap_id: "gap.extraction", gap_fingerprint: "a".repeat(64),
    demand_fact_ids: ["safara.manual.fact.0027"], source_glossary_revision: "1.1.0",
    raw_vocabulary_revision: "1.2.0", canonical_vocabulary_revision: "1.5.0",
    policy_taxonomy_revision: "1.1.0", predecessor_artifact_id: "raw.corpus.predecessor",
    predecessor_artifact_hash: hash({ revision: "1.1.0" }) }, request: {
    layer: "raw_source_vocabulary", gap_route: "EXTRACTION_GAP",
    bounded_task: "Extract the exact governed ASVS requirement.",
    governed_source_release_ids: ["owasp.asvs.5-0-0"], source_locator_candidates: [locator],
    existing_raw_concept_ids: existing } }); }
describe("AGB-012 source knowledge agent", () => {
  it.each(["v5.0.0-V14.1.1", "v5.0.0-V14.2.6"])("replays governed %s extraction", async (locator) => {
    const envelope = request(locator); const governed = resolveAcceptedGovernedSource(envelope);
    const agent = createSourceKnowledgeAgent({ model_alias: "policy-default", provider_id: "fixture",
      resolve_governed_source: resolveAcceptedGovernedSource, policy: {} });
    const output = await agent.transformResult({ decision: "ADD",
      proposed_raw_concept_id: governed.raw_concept_id, bounded_meaning: governed.exact_meaning,
      source_release_id: governed.source_release_id, source_locator: governed.source_locator,
      semantic_rationale: "Exact governed requirement is not present in the predecessor raw vocabulary." },
    { request: envelope }, {} as never);
    expect(output).toMatchObject({ lifecycle: "proposed", proposal: { decision: "ADD",
      source_locator: locator, bounded_meaning: governed.exact_meaning } });
    expect(agent.execution_policy).toMatchObject({ allowed_tools: [], requires_human_review: true });
  });
  it("rejects duplicates, fabricated meaning, missing material, and unauthorized releases", async () => {
    const envelope = request("v5.0.0-V14.1.1", ["raw.asvs.v14-1-1"]);
    const governed = resolveAcceptedGovernedSource(envelope);
    const agent = createSourceKnowledgeAgent({ model_alias: "policy-default", provider_id: "fixture",
      resolve_governed_source: resolveAcceptedGovernedSource, policy: {} });
    await expect(agent.transformResult({ decision: "ADD", proposed_raw_concept_id: governed.raw_concept_id,
      bounded_meaning: governed.exact_meaning, source_release_id: governed.source_release_id,
      source_locator: governed.source_locator, semantic_rationale: "duplicate" }, { request: envelope },
    {} as never)).rejects.toThrow(/exactly governed/u);
    expect(() => resolveAcceptedGovernedSource(request("v5.0.0-V99.9.9"))).toThrow(/unavailable/u);
    const blocked = structuredClone(request("v5.0.0-V14.1.1"));
    if (blocked.request.layer !== "raw_source_vocabulary") throw new Error("fixture layer");
    blocked.request.governed_source_release_ids = ["iso.iec-27001.2022-amd1-2024"];
    expect(() => resolveAcceptedGovernedSource(blocked)).toThrow(/not authorized/u);
  });
});
