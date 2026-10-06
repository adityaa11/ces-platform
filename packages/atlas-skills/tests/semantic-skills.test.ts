import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { atlasProviderExtractionProposalV1JsonSchema, atlasProviderExtractionProposalV1Schema, buildSemanticSourcePacket, canonicalSemanticV1AuthorityId, compileExtractionPrompt, crossFieldSemanticCompositionPolicy, semanticExtractionProfileId, semanticExtractionSkill, semanticReconciliationSkill, getProductionSemanticSkill, semanticSourcePacketLimits } from "../src/index.ts";
import { validateJsonSchema } from "@atlas/contracts";

test("only the two bounded model-neutral semantic skills are exported", () => { assert.equal(getProductionSemanticSkill("atlas.semantic.extract", "v1"), semanticExtractionSkill); assert.equal(getProductionSemanticSkill("atlas.semantic.reconcile", "v1"), semanticReconciliationSkill); assert.throws(() => getProductionSemanticSkill("atlas.semantic.extract", "v2")); assert.doesNotThrow(() => validateJsonSchema(semanticExtractionSkill.outputSchema, { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] })); });

const qualifiedSectionOrder = ["PROVIDER PROPOSAL", "SYSTEM ROLE", "TASK INSTRUCTION", "OUTPUT SHAPE", "SOURCE RESULT AND ACCOUNTING FIELDS", "CANDIDATE FIELDS", "CANDIDATE KIND MEANINGS", "CLARIFICATION QUESTIONS", "CROSS-FIELD SEMANTIC COMPOSITION", "SOURCE CLASSIFICATION", "REFERENCE HANDLING", "MULTIPLE-CANDIDATE HANDLING", "CONFLICT HANDLING", "GENERAL RULES", "SOURCE ACCOUNTING", "OUTPUT RULES"];
const zodSectionTitles = ["PROVIDER PROPOSAL", "OUTPUT SHAPE", "SOURCE RESULT AND ACCOUNTING FIELDS", "CANDIDATE FIELDS", "CANDIDATE KIND MEANINGS", "CLARIFICATION QUESTIONS", "SOURCE CLASSIFICATION"];
const candidateProposal = { semantic_key: "quota", kind: "rule", payload: { value: 40 }, normalized_meaning: "quota is 40", needs_resolution: false };
const validProposal = { version: "v1", source_results: [{ slot: "s1", classification: "candidate", candidates: [candidateProposal], non_fact_reason: null, questions: [] }] };

type JsonObject = Record<string, unknown>;
type PromptSection = { title: string; text: string };
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const testStableJson = (value: unknown): string => Array.isArray(value) ? `[${value.map(testStableJson).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value as JsonObject).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${testStableJson(child)}`).join(",")}}` : JSON.stringify(value);
const extractSections = (prompt: string, knownTitles?: readonly string[]): PromptSection[] => {
  const headings = [...prompt.matchAll(/^([A-Z][A-Z -]+)\n\n/gm)].filter((match) => !knownTitles || knownTitles.includes(match[1]!));
  return headings.map((match, index) => ({ title: match[1]!, text: prompt.slice(match.index! + match[0].length, headings[index + 1]?.index ?? prompt.length).replace(/\n\n$/, "") }));
};
const sectionText = (prompt: string, title: string) => {
  const text = extractSections(prompt, qualifiedSectionOrder).find((section) => section.title === title)?.text;
  assert.ok(text !== undefined, `Missing rendered section ${title}.`);
  return text;
};
const resolveProvenancePath = (schema: unknown, source: string): unknown => {
  assert.ok(source.startsWith("proposalSchema:$"), `Unsupported provenance source ${source}.`);
  let value: unknown = schema;
  for (const segment of source.slice("proposalSchema:$".length).matchAll(/\.(properties)\.([a-z_]+)|(\.items)/g)) {
    if (segment[1] === "properties") {
      assert.ok(value && typeof value === "object", `Cannot resolve ${source}.`);
      value = (value as JsonObject).properties;
      assert.ok(value && typeof value === "object", `Cannot resolve ${source}.`);
      value = (value as JsonObject)[segment[2]!];
    } else {
      assert.ok(value && typeof value === "object", `Cannot resolve ${source}.`);
      value = (value as JsonObject).items;
    }
  }
  assert.ok(value && typeof value === "object", `Cannot resolve ${source}.`);
  return value;
};
const sourceDescription = (value: unknown): string => {
  const description = (value as JsonObject).description;
  assert.equal(typeof description, "string");
  return description;
};
const expectedZodText = (title: string, source: unknown): string => {
  if (title === "OUTPUT SHAPE") return testStableJson(source);
  if (title !== "CANDIDATE KIND MEANINGS") return sourceDescription(source);
  const kind = source as JsonObject;
  if (Array.isArray(kind.enum)) return `${sourceDescription(kind)}\n\n${kind.enum.join(" | ")}`;
  assert.ok(Array.isArray(kind.anyOf), "Kind must be represented by enum or anyOf literals.");
  return `${sourceDescription(kind)}\n\n${kind.anyOf.map((entry) => `${String((entry as JsonObject).const)}\n${sourceDescription(entry)}`).join("\n\n")}`;
};
const proveZodSourceRendering = (proposalSchema: JsonObject) => {
  const output = compileExtractionPrompt(semanticExtractionProfileId, proposalSchema);
  const zodSections = output.provenance.sections.filter((section) => section.ownership === "ZOD");
  assert.deepEqual(zodSections.map((section) => section.title), zodSectionTitles);
  for (const section of zodSections) {
    assert.ok(section.source, `${section.title} lacks source provenance.`);
    const expected = expectedZodText(section.title, resolveProvenancePath(proposalSchema, section.source));
    assert.equal(sectionText(output.prompt, section.title), expected, `${section.title} must render its resolved schema source.`);
    assert.equal(section.renderedSha256, sha256(expected), `${section.title} provenance hash must bind the resolved rendered source.`);
  }
  return output;
};
const providerPath = (schema: JsonObject, ...keys: string[]) => keys.reduce<unknown>((value, key) => (value as JsonObject)[key], schema);

test("production prompt has the frozen PROMPT-003 structure and static policy", async () => {
  const first = compileExtractionPrompt(); const second = compileExtractionPrompt();
  assert.equal(first.profile, semanticExtractionProfileId); assert.equal(first.prompt, second.prompt); assert.deepEqual(first.providerSchema, second.providerSchema); assert.deepEqual(first.provenance, second.provenance);
  const qualifiedPrompt = await readFile(resolve(import.meta.dirname, "../../../scripts/sem-anm-prompt003/generated/system-prompt.txt"), "utf8");
  const qualifiedSections = extractSections(qualifiedPrompt);
  const productionSections = first.provenance.sections.map((section) => section.title);
  assert.deepEqual(qualifiedSections.map((section) => section.title), qualifiedSectionOrder);
  assert.deepEqual(productionSections, qualifiedSections.map((section) => section.title).filter((title) => title !== "GENERAL RULES"));
  for (const order of [qualifiedSections.map((section) => section.title), productionSections]) {
    const clarification = order.indexOf("CLARIFICATION QUESTIONS");
    assert.deepEqual(order.slice(clarification, clarification + 3), ["CLARIFICATION QUESTIONS", "CROSS-FIELD SEMANTIC COMPOSITION", "SOURCE CLASSIFICATION"]);
  }
  assert.equal(crossFieldSemanticCompositionPolicy, sectionText(first.prompt, "CROSS-FIELD SEMANTIC COMPOSITION"));
  assert.equal(sha256(crossFieldSemanticCompositionPolicy), "2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10");
  assert.ok(sectionText(first.prompt, "TASK INSTRUCTION").includes("Use only meaning supported by the supplied authorized source material."));
  assert.ok(sectionText(first.prompt, "TASK INSTRUCTION").includes("Do not invent, repair, reconcile, or canonicalize missing or conflicting meaning."));
  assert.ok(sectionText(first.prompt, "TASK INSTRUCTION").includes("Preserve material uncertainty."));
  const proposal = first.providerSchema as JsonObject;
  const source = providerPath(proposal, "properties", "source_results", "items") as JsonObject;
  const candidate = providerPath(source, "properties", "candidates", "items") as JsonObject;
  const kind = providerPath(candidate, "properties", "kind");
  const normalizedMeaning = providerPath(candidate, "properties", "normalized_meaning");
  const needsResolution = providerPath(candidate, "properties", "needs_resolution");
  const questions = providerPath(source, "properties", "questions", "items", "properties", "question");
  assert.match(sourceDescription(normalizedMeaning), /modality, negation/); assert.match(sourceDescription(normalizedMeaning), /quantities, exact values and units/); assert.match(sourceDescription(normalizedMeaning), /scope/);
  assert.match(sourceDescription(kind), /PRIMARY semantic role/); assert.match(sourceDescription(kind), /orthogonal facets/);
  assert.match(sectionText(first.prompt, "CANDIDATE KIND MEANINGS"), /conditions/); assert.match(sectionText(first.prompt, "CANDIDATE KIND MEANINGS"), /temporal/);
  assert.match(sourceDescription(needsResolution), /incidental implementation details/); assert.match(sourceDescription(questions), /incidental implementation detail/);
  const crossField = sectionText(first.prompt, "CROSS-FIELD SEMANTIC COMPOSITION"); assert.match(crossField, /applicability conditions/); assert.match(crossField, /temporal relationships/);
  const compilerSource = await readFile(resolve(import.meta.dirname, "../src/semantic-prompt.ts"), "utf8"); assert.ok(!compilerSource.includes("scripts/sem-anm-")); assert.ok(!compilerSource.includes("DocumentStore")); assert.ok(!/compileAnoman|compileGemini|providerId/.test(compilerSource));
});

test("ZOD-owned sections resolve their provenance against default and injected schemas", () => {
  const defaultSchema = atlasProviderExtractionProposalV1JsonSchema as JsonObject;
  proveZodSourceRendering(defaultSchema);
  const injected = structuredClone(defaultSchema);
  const source = providerPath(injected, "properties", "source_results") as JsonObject;
  const candidate = providerPath(source, "items", "properties", "candidates", "items") as JsonObject;
  (injected as JsonObject).description = "DISTINGUISHABLE ROOT DESCRIPTION";
  source.description = "DISTINGUISHABLE SOURCE RESULTS DESCRIPTION";
  candidate.description = "DISTINGUISHABLE CANDIDATE DESCRIPTION";
  (providerPath(candidate, "properties", "kind") as JsonObject).description = "DISTINGUISHABLE KIND DESCRIPTION";
  (providerPath(source, "items", "properties", "questions") as JsonObject).description = "DISTINGUISHABLE QUESTIONS DESCRIPTION";
  (providerPath(source, "items", "properties", "classification") as JsonObject).description = "DISTINGUISHABLE CLASSIFICATION DESCRIPTION";
  const injectedOutput = proveZodSourceRendering(injected);
  for (const value of ["DISTINGUISHABLE ROOT DESCRIPTION", "DISTINGUISHABLE SOURCE RESULTS DESCRIPTION", "DISTINGUISHABLE CANDIDATE DESCRIPTION", "DISTINGUISHABLE KIND DESCRIPTION", "DISTINGUISHABLE QUESTIONS DESCRIPTION", "DISTINGUISHABLE CLASSIFICATION DESCRIPTION"]) assert.ok(injectedOutput.prompt.includes(value));
});

test("compiler keeps prompt and portable schema coherent for the supplied schema", () => {
  const injected = structuredClone(atlasProviderExtractionProposalV1JsonSchema) as { description: string; properties: { source_results: { description: string } } };
  injected.description = "DISTINGUISHABLE PROPOSAL ROOT"; injected.properties.source_results.description = "DISTINGUISHABLE SOURCE RESULTS";
  const output = compileExtractionPrompt(semanticExtractionProfileId, injected); assert.equal(output.providerSchema, injected); assert.ok(output.prompt.includes("DISTINGUISHABLE PROPOSAL ROOT")); assert.ok(output.prompt.includes("DISTINGUISHABLE SOURCE RESULTS"));
});

test("artifact identity binds authority, compiler, frozen policy, schema, and prompt", () => {
  const output = compileExtractionPrompt(); const { canonicalAuthority, compiler, crossFieldPolicySha256, providerSchemaSha256, promptSha256, artifactSha256 } = output.provenance;
  assert.equal(artifactSha256, sha256([canonicalAuthority.sha256, compiler.sha256, crossFieldPolicySha256, providerSchemaSha256, promptSha256].join("\n"))); assert.equal(output.provenance.canonicalAuthority.id, canonicalSemanticV1AuthorityId);
});

test("portable provider schema is weaker than canonical local Zod for cross-field rules", () => {
  const candidateWithoutCandidate = { version: "v1", source_results: [{ slot: "s1", classification: "candidate", candidates: [], non_fact_reason: null, questions: [] }] };
  const nonFactWithCandidate = { version: "v1", source_results: [{ slot: "s1", classification: "non_fact", candidates: [candidateProposal], non_fact_reason: null, questions: [{ question: "why?", reason: "test" }] }] };
  for (const invalid of [candidateWithoutCandidate, nonFactWithCandidate]) { assert.doesNotThrow(() => validateJsonSchema(atlasProviderExtractionProposalV1JsonSchema, invalid)); assert.throws(() => atlasProviderExtractionProposalV1Schema.parse(invalid)); }
  assert.doesNotThrow(() => atlasProviderExtractionProposalV1Schema.parse(validProposal)); assert.doesNotThrow(() => validateJsonSchema(atlasProviderExtractionProposalV1JsonSchema, validProposal)); assert.throws(() => atlasProviderExtractionProposalV1Schema.parse({ ...validProposal, local_candidate_id: "forbidden" }));
});

const normalizedSourceFixture = () => ({ version: "v1", executionId: "perception-1", artifactId: "document-1", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "perception-1", processedAt: "2026-10-06T00:00:00.000Z" }, pages: [
  { number: 2, textBlocks: [{ id: "text-b", text: "Second page text" }, { id: "empty", text: "" }], tables: [{ id: "table-b", content: "B|2" }], visualRegions: [{ id: "unlabeled" }, { id: "figure", label: "Payment flow" }] },
  { number: 1, textBlocks: [{ id: "text-a", text: "First page text" }], tables: [{ id: "table-a", content: "A|1" }], visualRegions: [{ id: "figure-a", label: "Account hierarchy" }] },
] }) as const;

test("normalized documents build deterministic complete provider-neutral source packets", () => {
  const first = buildSemanticSourcePacket(normalizedSourceFixture());
  const second = buildSemanticSourcePacket(normalizedSourceFixture());
  assert.deepEqual(first, second);
  assert.deepEqual(first.sourceSlotMap.map(({ slot, pageNumber, locatorType, locatorId }) => [slot, pageNumber, locatorType, locatorId]), [
    ["slot-000001", 1, "text_block", "text-a"], ["slot-000002", 1, "table", "table-a"], ["slot-000003", 1, "visual_region", "figure-a"], ["slot-000004", 2, "text_block", "text-b"], ["slot-000005", 2, "table", "table-b"], ["slot-000006", 2, "visual_region", "figure"],
  ]);
  assert.deepEqual(first.rejectedSourceUnits, [{ pageNumber: 2, locatorType: "text_block", locatorId: "empty", reason: "empty_content" }, { pageNumber: 2, locatorType: "visual_region", locatorId: "unlabeled", reason: "unlabeled_visual_region" }]);
  const payload = JSON.parse(first.userPrompt) as { source_slots: readonly { slot: string; content: string }[] };
  assert.deepEqual(payload.source_slots, first.sourceSlotMap.map(({ slot, content }) => ({ slot, content })));
  assert.equal(first.semanticProfile, semanticExtractionProfileId); assert.equal(first.providerProposalJsonSchema, atlasProviderExtractionProposalV1JsonSchema);
});

test("source packets fail closed for duplicate, overflow, and byte-overflow source material", () => {
  const duplicate = normalizedSourceFixture() as { pages: { textBlocks: { id: string; text: string }[]; tables: unknown[]; visualRegions: unknown[]; number: number }[] };
  duplicate.pages[0]!.textBlocks.push({ id: "text-b", text: "duplicate" });
  assert.throws(() => buildSemanticSourcePacket(duplicate), /Duplicate normalized source locator/);
  const overflow = normalizedSourceFixture() as { pages: { textBlocks: { id: string; text: string }[] }[] };
  overflow.pages[0]!.textBlocks = Array.from({ length: semanticSourcePacketLimits.maxSourceUnits + 1 }, (_, index) => ({ id: `source-${index}`, text: "x" }));
  assert.throws(() => buildSemanticSourcePacket(overflow), /exceeds 10000 source units/);
  const bytes = normalizedSourceFixture() as { pages: { textBlocks: { id: string; text: string }[] }[] };
  bytes.pages[0]!.textBlocks = [{ id: "large", text: "x".repeat(semanticSourcePacketLimits.maxUserPromptBytes) }];
  assert.throws(() => buildSemanticSourcePacket(bytes), /UTF-8 bytes/);
});

test("source packet builder has no provider, classification, finalization, or persistence seam", async () => {
  const source = await readFile(resolve(import.meta.dirname, "../src/semantic-source-packet.ts"), "utf8");
  assert.ok(!/Anoman|Gemini|Mistral|DocumentStore|candidate_id|finaliz|providerId|fetch\(/.test(source));
});
