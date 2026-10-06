import { createHash } from "node:crypto";
import { atlasSemanticCandidateV1Schema, atlasSemanticQuestionV1Schema, atlasSourceClassificationV1Schema, toAtlasJsonSchema } from "@atlas/contracts";
import { z } from "zod";

export const semanticExtractionProfileId = "atlas.semantic.extract.prompt-003/v1" as const;
/** CK-approved BSS-V2-004-03-01 canonical Semantic V1 authority. */
export const canonicalSemanticV1AuthorityId = "472fd2ca2c002db2b47bdf16dc085a4f43629f20" as const;
export const semanticPromptCompilerId = "@atlas/skills/semantic-prompt/v1" as const;

const providerPayloadSchema = z.record(z.string().min(1).max(100), z.json()).superRefine((value, ctx) => {
  if (Object.keys(value).length > 100) ctx.addIssue({ code: "custom", message: "Provider semantic payload exceeds 100 properties." });
}).describe("Structured source-grounded semantic payload. Preserve useful supported facets using descriptive snake_case keys; do not invent missing facts.");
export const atlasProviderCandidateProposalV1Schema = atlasSemanticCandidateV1Schema.pick({ semantic_key: true, kind: true, normalized_meaning: true, needs_resolution: true }).extend({ payload: providerPayloadSchema }).describe("One provider-proposed semantic candidate. The provider never assigns Atlas IDs, evidence locators, source inventory identities, accepted truth, or canonical truth.");
export const atlasProviderQuestionProposalV1Schema = atlasSemanticQuestionV1Schema.pick({ question: true, reason: true }).describe("Provider-proposed clarification content. Atlas attaches trusted evidence and owns final question identity.");
export const atlasProviderSourceResultV1Schema = z.strictObject({
  slot: z.string().min(1).max(200).describe("The exact temporary source slot supplied by Atlas. Preserve it exactly; never create or rename slots."),
  classification: atlasSourceClassificationV1Schema,
  candidates: z.array(atlasProviderCandidateProposalV1Schema).max(64).describe("Semantic candidates grounded in this source slot. candidate requires one or more; non_fact requires none."),
  non_fact_reason: z.string().min(1).max(1000).nullable().describe("Bounded reason for non_fact classification. Must be null for candidate classification."),
  questions: z.array(atlasProviderQuestionProposalV1Schema).max(100).describe("Clarification questions caused by material ambiguity in this source slot."),
}).superRefine((value, ctx) => {
  if (value.classification === "candidate" && (value.candidates.length === 0 || value.non_fact_reason !== null)) ctx.addIssue({ code: "custom", message: "candidate classification requires candidates and null non_fact_reason." });
  if (value.classification === "non_fact" && (value.candidates.length !== 0 || value.non_fact_reason === null || value.questions.length !== 0)) ctx.addIssue({ code: "custom", message: "non_fact classification requires only a reason." });
}).describe("The provider semantic disposition for one Atlas-authorized source slot.");
export const atlasProviderExtractionProposalV1Schema = z.strictObject({ version: z.literal("v1").describe("The Atlas Semantic V1 profile version."), source_results: z.array(atlasProviderSourceResultV1Schema).max(100000).describe("Exactly one source result for every supplied source slot, with no missing, duplicate, or invented slots.") }).describe("Provider-facing Atlas Semantic V1 extraction proposal. It excludes Atlas-owned IDs, evidence, persistence, reconciliation, review, accepted truth, publication, and Master authority.");
export const atlasProviderExtractionProposalV1JsonSchema = toAtlasJsonSchema(atlasProviderExtractionProposalV1Schema);

export const crossFieldSemanticCompositionPolicy = `- Treat candidate kind, modality, applicability conditions, temporal relationships, payload facets, needs_resolution, and clarification questions as separate but related semantic dimensions.
- A possible or uncertain modality is NOT itself an applicability condition.
- Wording such as "may be required", "might be required", or "could be required" means the source establishes a possible requirement, not that the missing condition has been supplied.
- If the source clearly establishes a specific primary semantic kind but leaves materially unstated what determines whether that proposition applies:
  - keep the specific primary kind when it is otherwise clear;
  - preserve the possible or uncertain modality;
  - do not invent the missing applicability condition;
  - set needs_resolution = true;
  - emit one concise clarification question asking only for the missing material applicability condition.
- Temporal wording such as "before processing", "after approval", "within 30 days", or "while a state holds" describes timing/order. It does not by itself supply an applicability condition unless the source explicitly makes it a predicate or guard.
- Do not classify a proposition as kind = "condition" merely because it contains uncertain modality or temporal wording. Use kind = "condition" only when the source actually states a predicate, prerequisite, trigger, guard, eligibility criterion, or circumstance that determines whether another proposition applies.`;

type Schema = { description?: string; type?: string; const?: string; enum?: string[]; anyOf?: Schema[]; properties?: Record<string, Schema>; items?: Schema; [key: string]: unknown };
type Section = { readonly title: string; readonly text: string; readonly ownership: "ZOD" | "STATIC_POLICY"; readonly source?: string };
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const describe = (schema: Schema, path: string) => { if (!schema.description) throw new Error(`Canonical schema has no description at ${path}.`); return schema.description; };
const property = (schema: Schema, key: string) => { const value = schema.properties?.[key]; if (!value) throw new Error(`Provider proposal schema is missing ${key}.`); return value; };
const kindText = (schema: Schema) => schema.anyOf?.map((item) => `${item.const}\n${describe(item, "kind")}`).join("\n\n") ?? schema.enum?.join(" | ") ?? "";
const stableJson = (value: unknown): string => Array.isArray(value) ? `[${value.map(stableJson).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}` : JSON.stringify(value);
const taskInstruction = `Extract the project meaning of each supplied source slot into independently meaningful semantic candidates.

A supplied source slot may establish:
- no project meaning;
- exactly one independently meaningful semantic candidate; or
- multiple independently meaningful semantic candidates.

Use only meaning supported by the supplied authorized source material. Preserve material uncertainty. Do not invent, repair, reconcile, or canonicalize missing or conflicting meaning.`;
const referenceHandling = `- Resolve pronouns, aliases, and references only when the supplied authorized source establishes a clear referent.
- Preserve the resolved referent's materially relevant identity when needed for faithful semantic interpretation.
- If multiple plausible referents materially change the semantics, do not choose one arbitrarily.
- Preserve that ambiguity under the canonical Semantic V1 needs_resolution and clarification-question semantics.
- Do not use external knowledge to manufacture a referent that the authorized source does not establish.`;
const multipleCandidateHandling = `- One grammatical sentence may express multiple independently meaningful propositions.
- One paragraph may express multiple independently meaningful propositions.
- Split candidates only when the propositions are independently meaningful project statements.
- Do not split one proposition solely because it contains several semantic facets, qualifiers, or restrictions.
- Preserve shared conditions or timing on every candidate to which they apply.
- Do not collapse several independent propositions into one vague candidate.`;
const conflictHandling = `- Preserve every source proposition faithfully.
- Do not silently reconcile, weaken, merge, prioritize, supersede, or discard apparently conflicting propositions.
- Do not infer which conflicting proposition is accepted or canonical.
- Extraction is not reconciliation or conflict resolution.`;
const sourceAccounting = `- Return one source_result for every supplied source slot.
- Preserve each supplied slot exactly.
- Do not create source slots that were not supplied.
- Do not omit a supplied source slot.
- Do not use non_fact as a fallback for missing, failed, difficult, or ambiguous extraction when the source contains meaningful project information.`;
const outputRules = `- Return valid JSON only.
- Return exactly one top-level object conforming to the supplied provider proposal schema.
- Do not emit markdown, code fences, commentary, or fields outside the supplied schema.`;

/** No provider choice is accepted: this compiles Atlas semantic instruction only. */
export function compileExtractionPrompt(profile = semanticExtractionProfileId, proposalSchema: Schema = atlasProviderExtractionProposalV1JsonSchema as Schema) {
  if (profile !== semanticExtractionProfileId) throw new Error("Unknown Atlas semantic extraction profile.");
  const sourceResults = property(proposalSchema, "source_results");
  const source = sourceResults.items!;
  const candidate = property(source, "candidates").items!;
  const kind = property(candidate, "kind");
  const sections: readonly Section[] = [
    { title: "PROVIDER PROPOSAL", text: describe(proposalSchema, "$"), ownership: "ZOD", source: "proposalSchema:$" },
    { title: "SYSTEM ROLE", text: "You are a semantic extraction component.", ownership: "STATIC_POLICY" },
    { title: "TASK INSTRUCTION", text: taskInstruction, ownership: "STATIC_POLICY" },
    { title: "OUTPUT SHAPE", text: stableJson(proposalSchema), ownership: "ZOD", source: "proposalSchema:$" },
    { title: "SOURCE RESULT AND ACCOUNTING FIELDS", text: describe(sourceResults, "source_results"), ownership: "ZOD", source: "proposalSchema:$.properties.source_results" },
    { title: "CANDIDATE FIELDS", text: describe(candidate, "candidate"), ownership: "ZOD", source: "proposalSchema:$.properties.source_results.items.properties.candidates.items" },
    { title: "CANDIDATE KIND MEANINGS", text: `${describe(kind, "kind")}\n\n${kindText(kind)}`, ownership: "ZOD", source: "proposalSchema:$.properties.source_results.items.properties.candidates.items.properties.kind" },
    { title: "CLARIFICATION QUESTIONS", text: describe(property(source, "questions"), "questions"), ownership: "ZOD", source: "proposalSchema:$.properties.source_results.items.properties.questions" },
    { title: "CROSS-FIELD SEMANTIC COMPOSITION", text: crossFieldSemanticCompositionPolicy, ownership: "STATIC_POLICY" },
    { title: "SOURCE CLASSIFICATION", text: describe(property(source, "classification"), "classification"), ownership: "ZOD", source: "proposalSchema:$.properties.source_results.items.properties.classification" },
    { title: "REFERENCE HANDLING", text: referenceHandling, ownership: "STATIC_POLICY" },
    { title: "MULTIPLE-CANDIDATE HANDLING", text: multipleCandidateHandling, ownership: "STATIC_POLICY" },
    { title: "CONFLICT HANDLING", text: conflictHandling, ownership: "STATIC_POLICY" },
    { title: "SOURCE ACCOUNTING", text: sourceAccounting, ownership: "STATIC_POLICY" },
    { title: "OUTPUT RULES", text: outputRules, ownership: "STATIC_POLICY" },
  ];
  const prompt = sections.map(({ title, text }) => `${title}\n\n${text}`).join("\n\n");
  const providerSchema = proposalSchema as Record<string, unknown>;
  const canonicalAuthoritySha256 = sha(canonicalSemanticV1AuthorityId);
  const compilerSha256 = sha(semanticPromptCompilerId);
  const crossFieldPolicySha256 = sha(crossFieldSemanticCompositionPolicy);
  const providerSchemaSha256 = sha(stableJson(providerSchema));
  const promptSha256 = sha(prompt);
  return { profile, prompt, providerSchema, provenance: { profile, canonicalAuthority: { id: canonicalSemanticV1AuthorityId, sha256: canonicalAuthoritySha256 }, compiler: { id: semanticPromptCompilerId, sha256: compilerSha256 }, sections: sections.map(({ title, text, ownership, source }) => ({ title, ownership, ...(source ? { source } : {}), renderedSha256: sha(text) })), providerSchemaSha256, promptSha256, crossFieldPolicySha256, artifactSha256: sha([canonicalAuthoritySha256, compilerSha256, crossFieldPolicySha256, providerSchemaSha256, promptSha256].join("\n")) } };
}
