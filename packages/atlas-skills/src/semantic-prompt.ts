import { createHash } from "node:crypto";
import { atlasSemanticCandidateV1Schema, atlasSemanticQuestionV1Schema, atlasSourceClassificationV1Schema, toAtlasJsonSchema } from "@atlas/contracts";
import { z } from "zod";

/** The provider-neutral, Atlas-owned Semantic V1 extraction profile. */
export const semanticExtractionProfileId = "atlas.semantic.extract.prompt-003/v1" as const;

const providerPayloadSchema = z.record(z.string().min(1).max(100), z.json()).superRefine((value, ctx) => {
  if (Object.keys(value).length > 100) ctx.addIssue({ code: "custom", message: "Provider semantic payload exceeds 100 properties." });
}).describe("Structured source-grounded semantic payload. Preserve useful supported facets using descriptive snake_case keys; do not invent missing facts.");

/** Semantic fields are picked from canonical V1; all identity and evidence fields remain Atlas-owned. */
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
export const atlasProviderExtractionProposalV1Schema = z.strictObject({
  version: z.literal("v1").describe("The Atlas Semantic V1 profile version."),
  source_results: z.array(atlasProviderSourceResultV1Schema).max(100000).describe("Exactly one source result for every supplied source slot, with no missing, duplicate, or invented slots."),
}).describe("Provider-facing Atlas Semantic V1 extraction proposal. It excludes Atlas-owned IDs, evidence, persistence, reconciliation, review, accepted truth, publication, and Master authority.");
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

type Schema = { description?: string; type?: string; const?: string; enum?: string[]; anyOf?: Schema[]; properties?: Record<string, Schema>; items?: Schema };
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const describe = (schema: Schema, path: string) => { if (!schema.description) throw new Error(`Canonical schema has no description at ${path}.`); return schema.description; };
const property = (schema: Schema, key: string) => { const value = schema.properties?.[key]; if (!value) throw new Error(`Provider proposal schema is missing ${key}.`); return value; };
const kindText = (schema: Schema) => schema.anyOf?.map((item) => `${item.const}\n${describe(item, "kind")}`).join("\n\n") ?? schema.enum?.join(" | ") ?? "";

/** No provider choice is accepted: this compiles Atlas semantic instruction only. */
export function compileExtractionPrompt(profile = semanticExtractionProfileId, proposalSchema: Schema = atlasProviderExtractionProposalV1JsonSchema as Schema) {
  if (profile !== semanticExtractionProfileId) throw new Error("Unknown Atlas semantic extraction profile.");
  const sourceResults = property(proposalSchema, "source_results");
  const source = sourceResults.items!;
  const candidates = property(source, "candidates");
  const candidate = candidates.items!;
  const kind = property(candidate, "kind");
  const sections: readonly [string, string, "ZOD" | "STATIC_POLICY"][] = [
    ["PROVIDER PROPOSAL", describe(proposalSchema, "$"), "ZOD"],
    ["SYSTEM ROLE", "You are a semantic extraction component.", "STATIC_POLICY"],
    ["TASK INSTRUCTION", "Extract independently meaningful, source-grounded candidate meaning. Preserve uncertainty; do not invent meaning.", "STATIC_POLICY"],
    ["SOURCE RESULT AND ACCOUNTING FIELDS", describe(sourceResults, "source_results"), "ZOD"],
    ["CANDIDATE FIELDS", describe(candidate, "candidate"), "ZOD"],
    ["CANDIDATE KIND MEANINGS", `${describe(kind, "kind")}\n\n${kindText(kind)}`, "ZOD"],
    ["CLARIFICATION QUESTIONS", describe(property(source, "questions"), "questions"), "ZOD"],
    ["CROSS-FIELD SEMANTIC COMPOSITION", crossFieldSemanticCompositionPolicy, "STATIC_POLICY"],
    ["SOURCE CLASSIFICATION", describe(property(source, "classification"), "classification"), "ZOD"],
    ["REFERENCE HANDLING", "- Resolve clear references. Preserve material ambiguity rather than choosing arbitrarily.", "STATIC_POLICY"],
    ["CONFLICT HANDLING", "- Preserve source propositions. Extraction is not reconciliation or conflict resolution.", "STATIC_POLICY"],
    ["SOURCE ACCOUNTING", "- Return one source_result for every supplied slot. Do not omit, invent, or rename slots.", "STATIC_POLICY"],
    ["OUTPUT RULES", "- Return valid JSON only.", "STATIC_POLICY"],
  ];
  const prompt = sections.map(([title, text]) => `${title}\n\n${text}`).join("\n\n");
  const providerSchema = toAtlasJsonSchema(atlasProviderExtractionProposalV1Schema);
  return { profile, prompt, providerSchema, provenance: { profile, sections: sections.map(([title, text, ownership]) => ({ title, ownership, sha256: sha(text) })), canonicalSchemaSha256: sha(JSON.stringify(providerSchema)), crossFieldPolicySha256: sha(crossFieldSemanticCompositionPolicy) } };
}
