import { z } from "zod";
import { slots } from "./fixture.mts";

const workflowStep = z.object({ kind: z.literal("workflow_step"), actor: z.string().nullable().describe("The actor explicitly performing the business action, or null when the source does not identify one."), action: z.string().describe("The business action explicitly stated by the source."), object: z.string().nullable().describe("The business object directly affected by the action, or null when none is explicitly stated."), condition: z.string().nullable().describe("An explicitly stated condition controlling when the action occurs, otherwise null.") }).describe("A workflow step represents something that happens as part of a business process. Do not use it for static rules, limits, headings, or unresolved possibilities.");
const constraint = z.object({ kind: z.literal("constraint"), subject: z.string().describe("The actor, object, or behavior whose permitted behavior is explicitly limited."), restriction: z.string().describe("The explicit boundary or limitation stated by the source."), quantity: z.number().nullable().describe("The exact numeric boundary when explicitly stated, otherwise null."), unit: z.string().nullable().describe("The unit associated with the quantity when explicitly stated, otherwise null."), scope: z.string().nullable().describe("The scope in which the limitation applies, for example per order, otherwise null.") }).describe("A constraint expresses an explicit maximum, minimum, threshold, quantity limit, prohibition, or bounded range. Prefer constraint over generic rule when the source states such a boundary.");
const rule = z.object({ kind: z.literal("rule"), subject: z.string().nullable().describe("The actor, object, or process governed by the rule when explicitly stated."), rule: z.string().describe("The normative business behavior explicitly required, allowed, or prohibited by the source.") }).describe("A rule is a normative business statement. Do not use generic rule when a more precise semantic kind such as constraint is explicitly supported.");
const condition = z.object({ kind: z.literal("condition"), condition: z.string().describe("The explicitly stated circumstance under which another business statement applies.") }).describe("Use only when the source explicitly states the relevant condition. Do not invent a missing condition and do not use condition for unresolved uncertainty.");
const unresolved = z.object({ kind: z.literal("unresolved"), knownMeaning: z.string().describe("The business meaning that the source explicitly establishes."), missingInformation: z.string().describe("The essential semantic information that the source does not establish."), clarificationQuestion: z.string().describe("A clarification question asking only for the missing information.") }).describe("Use when the source establishes business-relevant meaning but leaves an essential condition, trigger, actor, threshold, decision, or outcome undetermined. Never invent the missing information or convert possibility into a resolved rule.");
const nonFact = z.object({ kind: z.literal("non_fact"), reason: z.string().describe("Why this source unit is document structure or non-semantic context rather than an asserted business meaning.") }).describe("Use for headings, titles, numbering, labels, navigation, formatting, or other document structure that does not itself assert business meaning.");

export const sourceSemanticProposalSchema = z.discriminatedUnion("kind", [workflowStep, constraint, rule, condition, unresolved, nonFact]);
export const atlasSemanticSpikeSchema = z.object({ sourceResults: z.array(z.object({ sourceSlot: z.enum(slots), extraction: sourceSemanticProposalSchema })).length(4) }).describe("Schema-driven semantic extraction results for exactly the four authorized Atlas source slots.");
export type AtlasSemanticSpikeProposal = z.infer<typeof atlasSemanticSpikeSchema>;
export const providerSchema = z.toJSONSchema(atlasSemanticSpikeSchema);

export function parseProposal(value: unknown): AtlasSemanticSpikeProposal {
  const proposal = atlasSemanticSpikeSchema.parse(value);
  const seen = new Set<string>();
  for (const result of proposal.sourceResults) {
    if (seen.has(result.sourceSlot)) throw new Error(`Invalid provider proposal: duplicate source slot ${result.sourceSlot}.`);
    seen.add(result.sourceSlot);
  }
  for (const slot of slots) if (!seen.has(slot)) throw new Error(`Invalid provider proposal: missing source slot ${slot}.`);
  return proposal;
}
