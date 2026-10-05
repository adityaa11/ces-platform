import { z } from "zod";
import { slots } from "./fixture.mts";

export const transportQualificationSchema = z.object({
  status: z.literal("ANOMAN_OK").describe("Fixed qualification marker proving the requested schema was returned."),
  count: z.literal(1).describe("Fixed integer used only to verify typed structured output."),
}).strict();

const workflowStep = z.object({ kind: z.literal("workflow_step"), actor: z.string().nullable().describe("Actor explicitly performing the business action, or null."), action: z.string().describe("Business action explicitly stated by the source."), object: z.string().nullable().describe("Business object directly affected, or null."), target: z.string().nullable().describe("Explicit destination or recipient, or null."), temporalConstraint: z.string().nullable().describe("Explicit timing or ordering relationship, or null.") }).strict().describe("A concrete business-process action or event, not a heading, static limit, or unresolved possibility.");
const constraint = z.object({ kind: z.literal("constraint"), subject: z.string().describe("Actor, object, or behavior whose permitted behavior is bounded."), restriction: z.string().describe("Explicit boundary or limitation."), quantity: z.number().nullable().describe("Exact numeric boundary when stated, otherwise null."), unit: z.string().nullable().describe("Unit associated with the numeric boundary, otherwise null."), scope: z.string().nullable().describe("Scope of the limitation, for example per order, otherwise null.") }).strict().describe("An explicit maximum, minimum, threshold, quantity limit, deadline, or other definite restriction.");
const rule = z.object({ kind: z.literal("rule"), subject: z.string().nullable().describe("Actor, object, process, or requirement governed by the rule, or null."), modality: z.enum(["required", "prohibited", "permitted", "possible", "unspecified"]).describe("Strength of source assertion. Possible means the source does not establish definite applicability."), temporalConstraint: z.string().nullable().describe("Explicit timing or ordering; timing is not automatically applicability."), applicabilityCondition: z.string().nullable().describe("Explicit condition that determines applicability; null if not established."), missingInformation: z.array(z.string()).describe("Material information required to safely resolve the stated rule; empty only when sufficiently specified.") }).strict().describe("A governing business or behavioral rule. Preserve uncertainty and do not invent applicability conditions.");
const nonFact = z.object({ kind: z.literal("non_fact"), reason: z.string().describe("Why the source is document structure or context, not an asserted business meaning.") }).strict().describe("Headings, titles, numbering, labels, navigation, formatting, or other non-semantic document structure.");

export const sourceSemanticProposalSchema = z.discriminatedUnion("kind", [workflowStep, constraint, rule, nonFact]);
export const semanticQualificationSchema = z.object({ sourceResults: z.array(z.object({ sourceSlot: z.enum(slots), extraction: sourceSemanticProposalSchema }).strict()).length(4) }).strict();
export const transportProviderSchema = z.toJSONSchema(transportQualificationSchema);
export const providerSchema = z.toJSONSchema(semanticQualificationSchema);
export type SemanticQualificationProposal = z.infer<typeof semanticQualificationSchema>;

export function parseProposal(value: unknown): SemanticQualificationProposal {
  const proposal = semanticQualificationSchema.parse(value);
  const seen = new Set<string>();
  for (const entry of proposal.sourceResults) { if (seen.has(entry.sourceSlot)) throw new Error(`Invalid provider proposal: duplicate source slot ${entry.sourceSlot}.`); seen.add(entry.sourceSlot); }
  for (const slot of slots) if (!seen.has(slot)) throw new Error(`Invalid provider proposal: missing source slot ${slot}.`);
  return proposal;
}
