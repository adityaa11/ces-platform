import { z } from "zod";

const semanticKindDescription = `workflow_step
  A concrete action or event performed by an actor, system, user,
  component, or process.

rule
  Governing business or behavioral logic describing what is required,
  permitted, prohibited, eligible, or applicable.

  A rule is primarily about governing behavior, not about expressing
  a measurable boundary.

constraint
  A restriction, bound, invariant, quantity limit, deadline, duration,
  range, scope boundary, or other definite limitation.

  A statement does not become a constraint merely because it contains
  temporal information. Classify according to its primary semantic role.`;

export const semanticUnitSchema = z.object({
  semantic_kind: z.enum(["workflow_step", "rule", "constraint"]).describe(semanticKindDescription),
  subject: z.string().nullable().describe("The entity, concept, requirement, or behavior the semantic unit is\nprimarily about.\n\nUse null when there is no useful explicit subject."),
  actor: z.string().nullable().describe("The entity explicitly performing the action.\n\nUse null when the source does not establish the actor.\n\nDo not infer an actor merely because one would normally exist."),
  action: z.string().nullable().describe("The explicitly stated business action, normalized to a concise verb\nor verb phrase.\n\nUse null when the unit is not primarily an action."),
  object: z.string().nullable().describe("The business object directly acted upon or produced by the action.\n\nUse null when none is explicitly established."),
  target: z.string().nullable().describe("The recipient or destination of the action.\n\nUse null when none is explicitly established."),
  modality: z.enum(["required", "prohibited", "permitted", "possible", "unspecified"]).describe(`required
  The source definitely requires something.

prohibited
  The source definitely forbids something.

permitted
  The source explicitly allows something.

possible
  Something may or might apply, happen, or be necessary, but the source
  does not establish that it definitely applies.

  Possibility is uncertainty, not permission.

unspecified
  The source does not establish one of the modalities above.`),
  applicability_conditions: z.array(z.string()).describe("Conditions determining WHETHER or UNDER WHAT CIRCUMSTANCES the\nsemantic unit applies.\n\nPreserve logical relationships such as AND, OR, ONLY IF, or nested\nconditions when they materially affect meaning.\n\nDo not invent missing applicability conditions."),
  temporal_constraints: z.array(z.string()).describe("Explicit timing or ordering relationships such as:\nafter another event;\nbefore another event;\nwithin a duration;\nwhile a state holds.\n\nTiming/order is not automatically an applicability condition."),
  quantitative_constraints: z.array(z.string()).describe("Explicit numeric limits, minimums, maximums, ranges, counts,\npercentages, amounts, or other quantitative boundaries.\n\nPreserve exact values and units."),
  scope_constraints: z.array(z.string()).describe("Explicit scope boundaries such as:\nper order;\nper customer;\nfor verified accounts;\nwithin a particular object or context.\n\nPreserve the stated scope rather than broadening it."),
  resolution_status: z.enum(["resolved", "needs_resolution"]).describe(`resolved
  The source contains enough information to faithfully represent the
  requirement that it actually states.

  A source does NOT need resolution merely because it omits incidental
  implementation details.

  Missing information such as method, storage location, implementation
  mechanism, exact timing, downstream behavior, or an unstated actor is
  not automatically a reason for clarification.

needs_resolution
  Material ambiguity or missing information prevents safe representation
  of the stated requirement.

  Use this when, for example:
  - multiple plausible referents materially change who or what the
    requirement concerns;
  - the source states that something may apply but omits what determines
    whether it applies;
  - materially different interpretations remain possible.

  Do not guess merely to avoid needs_resolution.`),
  clarification_question: z.string().nullable().describe("When resolution_status is \"needs_resolution\", ask exactly one concise\nquestion requesting only the missing material information.\n\nDo not assume the answer.\n\nWhen resolution_status is \"resolved\", use null."),
}).describe(`If material ambiguity or missing information prevents safe
representation, use resolution_status = "needs_resolution".

When resolution_status = "needs_resolution",
clarification_question must contain exactly one concise question asking
only for the missing material information.

When resolution_status = "resolved",
clarification_question must be null.

Do not create clarification questions for merely incidental omissions.`);

export const SemanticPromptSchema = z.object({
  source_results: z.array(z.object({
    slot: z.string(),
    semantic_units: z.array(semanticUnitSchema),
  })),
});

export const REQUIRED_SEMANTIC_FIELDS = ["semantic_kind", "subject", "actor", "action", "object", "target", "modality", "applicability_conditions", "temporal_constraints", "quantitative_constraints", "scope_constraints", "resolution_status", "clarification_question"] as const;
