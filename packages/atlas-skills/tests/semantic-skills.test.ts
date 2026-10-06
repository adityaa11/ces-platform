import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { atlasProviderExtractionProposalV1JsonSchema, atlasProviderExtractionProposalV1Schema, canonicalSemanticV1AuthorityId, compileExtractionPrompt, crossFieldSemanticCompositionPolicy, semanticExtractionProfileId, semanticExtractionSkill, semanticReconciliationSkill, getProductionSemanticSkill } from "../src/index.ts";
import { validateJsonSchema } from "@atlas/contracts";

test("only the two bounded model-neutral semantic skills are exported", () => { assert.equal(getProductionSemanticSkill("atlas.semantic.extract", "v1"), semanticExtractionSkill); assert.equal(getProductionSemanticSkill("atlas.semantic.reconcile", "v1"), semanticReconciliationSkill); assert.throws(() => getProductionSemanticSkill("atlas.semantic.extract", "v2")); assert.doesNotThrow(() => validateJsonSchema(semanticExtractionSkill.outputSchema, { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] })); });

const sectionTitles = ["PROVIDER PROPOSAL", "SYSTEM ROLE", "TASK INSTRUCTION", "OUTPUT SHAPE", "SOURCE RESULT AND ACCOUNTING FIELDS", "CANDIDATE FIELDS", "CANDIDATE KIND MEANINGS", "CLARIFICATION QUESTIONS", "CROSS-FIELD SEMANTIC COMPOSITION", "SOURCE CLASSIFICATION", "REFERENCE HANDLING", "MULTIPLE-CANDIDATE HANDLING", "CONFLICT HANDLING", "SOURCE ACCOUNTING", "OUTPUT RULES"];
const candidateProposal = { semantic_key: "quota", kind: "rule", payload: { value: 40 }, normalized_meaning: "quota is 40", needs_resolution: false };
const validProposal = { version: "v1", source_results: [{ slot: "s1", classification: "candidate", candidates: [candidateProposal], non_fact_reason: null, questions: [] }] };

test("production prompt has the frozen PROMPT-003 structure and static policy", async () => {
  const first = compileExtractionPrompt(); const second = compileExtractionPrompt();
  assert.equal(first.profile, semanticExtractionProfileId); assert.equal(first.prompt, second.prompt); assert.deepEqual(first.providerSchema, second.providerSchema); assert.deepEqual(first.provenance, second.provenance);
  assert.deepEqual(first.provenance.sections.map((section) => section.title), sectionTitles);
  assert.equal(crossFieldSemanticCompositionPolicy, first.prompt.match(/CROSS-FIELD SEMANTIC COMPOSITION\n\n([\s\S]*?)\n\nSOURCE CLASSIFICATION/)?.[1]);
  assert.equal(createHash("sha256").update(crossFieldSemanticCompositionPolicy).digest("hex"), "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10");
  const qualifiedPrompt = await readFile(resolve(import.meta.dirname, "../../../scripts/sem-anm-prompt003/generated/system-prompt.txt"), "utf8");
  for (const section of ["PROVIDER PROPOSAL", "SYSTEM ROLE", "TASK INSTRUCTION", "OUTPUT SHAPE", "SOURCE RESULT AND ACCOUNTING FIELDS", "CANDIDATE FIELDS", "CANDIDATE KIND MEANINGS", "CLARIFICATION QUESTIONS", "CROSS-FIELD SEMANTIC COMPOSITION", "SOURCE CLASSIFICATION", "REFERENCE HANDLING", "CONFLICT HANDLING", "SOURCE ACCOUNTING", "OUTPUT RULES"]) assert.ok(qualifiedPrompt.includes(section));
  assert.ok(qualifiedPrompt.includes("GENERAL RULES")); assert.ok(first.prompt.includes("MULTIPLE-CANDIDATE HANDLING")); assert.ok(!first.prompt.includes("GENERAL RULES"));
  const source = await readFile(resolve(import.meta.dirname, "../src/semantic-prompt.ts"), "utf8"); assert.ok(!source.includes("scripts/sem-anm-")); assert.ok(!source.includes("DocumentStore")); assert.ok(!/compileAnoman|compileGemini|providerId/.test(source));
});

test("ZOD-owned sections retain source-bound canonical provenance", () => {
  const output = compileExtractionPrompt(); const zodSections = output.provenance.sections.filter((section) => section.ownership === "ZOD");
  assert.deepEqual(zodSections.map((section) => section.title), ["PROVIDER PROPOSAL", "OUTPUT SHAPE", "SOURCE RESULT AND ACCOUNTING FIELDS", "CANDIDATE FIELDS", "CANDIDATE KIND MEANINGS", "CLARIFICATION QUESTIONS", "SOURCE CLASSIFICATION"]);
  for (const section of zodSections) { assert.match(section.source ?? "", /^proposalSchema:\$/); assert.match(section.renderedSha256, /^[a-f0-9]{64}$/); }
  assert.equal(output.provenance.canonicalAuthority.id, canonicalSemanticV1AuthorityId);
});

test("compiler keeps prompt and portable schema coherent for the supplied schema", () => {
  const injected = structuredClone(atlasProviderExtractionProposalV1JsonSchema) as { description: string; properties: { source_results: { description: string } } };
  injected.description = "DISTINGUISHABLE PROPOSAL ROOT"; injected.properties.source_results.description = "DISTINGUISHABLE SOURCE RESULTS";
  const output = compileExtractionPrompt(semanticExtractionProfileId, injected); assert.equal(output.providerSchema, injected); assert.ok(output.prompt.includes("DISTINGUISHABLE PROPOSAL ROOT")); assert.ok(output.prompt.includes("DISTINGUISHABLE SOURCE RESULTS"));
});

test("artifact identity binds authority, compiler, frozen policy, schema, and prompt", () => {
  const output = compileExtractionPrompt(); const { canonicalAuthority, compiler, crossFieldPolicySha256, providerSchemaSha256, promptSha256, artifactSha256 } = output.provenance;
  assert.equal(artifactSha256, createHash("sha256").update([canonicalAuthority.sha256, compiler.sha256, crossFieldPolicySha256, providerSchemaSha256, promptSha256].join("\n")).digest("hex"));
});

test("portable provider schema is weaker than canonical local Zod for cross-field rules", () => {
  const candidateWithoutCandidate = { version: "v1", source_results: [{ slot: "s1", classification: "candidate", candidates: [], non_fact_reason: null, questions: [] }] };
  const nonFactWithCandidate = { version: "v1", source_results: [{ slot: "s1", classification: "non_fact", candidates: [candidateProposal], non_fact_reason: null, questions: [{ question: "why?", reason: "test" }] }] };
  for (const invalid of [candidateWithoutCandidate, nonFactWithCandidate]) { assert.doesNotThrow(() => validateJsonSchema(atlasProviderExtractionProposalV1JsonSchema, invalid)); assert.throws(() => atlasProviderExtractionProposalV1Schema.parse(invalid)); }
  assert.doesNotThrow(() => atlasProviderExtractionProposalV1Schema.parse(validProposal)); assert.doesNotThrow(() => validateJsonSchema(atlasProviderExtractionProposalV1JsonSchema, validProposal)); assert.throws(() => atlasProviderExtractionProposalV1Schema.parse({ ...validProposal, local_candidate_id: "forbidden" }));
});
