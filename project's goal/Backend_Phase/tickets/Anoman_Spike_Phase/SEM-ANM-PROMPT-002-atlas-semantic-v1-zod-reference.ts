import { z } from "zod";

/**
 * SEM-ANM-PROMPT-002
 * Atlas Semantic V1 -> Zod semantic reference
 *
 * Authority inspected:
 *   repo: adityaa11/ces-platform
 *   branch: codex/new-atlas-backend
 *   file: packages/atlas-contracts/src/semantic.ts
 *   Git blob SHA: a80c72922f25aac83bf2a6c4714865b7c247c9f6
 *
 * The enum values, result shapes and bounds are derived from the current V1
 * contract. The .describe(...) text is the human-authored model-facing
 * interpretation frozen by SEM-ANM-PROMPT-002. It does not create Semantic V2.
 */

export const atlasSemanticContractVersionV1 = "v1" as const;
export const atlasSemanticLimitsV1 = {
  jobBytes: 16 * 1024,
  contextBytes: 1024 * 1024,
  resultEnvelopeBytes: 2 * 1024 * 1024,
  currentCandidates: 500,
  priorCandidates: 500,
  totalCandidates: 1000,
  retrievalPage: 100,
} as const;

export type AtlasSemanticJsonValue =
  | null
  | boolean
  | number
  | string
  | AtlasSemanticJsonValue[]
  | { [key: string]: AtlasSemanticJsonValue };

const atlasIdV1Schema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/)
  .describe(
    "A bounded Atlas identifier. Provider-facing extraction must not invent canonical Atlas IDs; deterministic Atlas code owns final identity."
  );

const atlasTextV1 = (maxLength: number, description: string) =>
  z.string().min(1).max(maxLength).describe(description);

function validateAtlasJsonPayload(
  value: AtlasSemanticJsonValue,
  ctx: z.RefinementCtx,
  depth = 0,
): void {
  if (depth > 8) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Atlas semantic payload exceeds nesting depth 8." });
    return;
  }
  if (typeof value === "string" && value.length > 16384) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Atlas semantic payload string exceeds 16384 characters." });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Atlas semantic payload array exceeds 100 items." });
      return;
    }
    for (const item of value) validateAtlasJsonPayload(item, ctx, depth + 1);
    return;
  }
  if (value !== null && typeof value === "object") {
    const values = Object.values(value);
    if (values.length > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Atlas semantic payload object exceeds 100 properties." });
      return;
    }
    for (const item of values) validateAtlasJsonPayload(item, ctx, depth + 1);
  }
}

const atlasJsonValueBaseV1Schema: z.ZodType<AtlasSemanticJsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string().max(16384),
    z.array(atlasJsonValueBaseV1Schema).max(100),
    z.record(z.string(), atlasJsonValueBaseV1Schema),
  ]),
);

export const atlasSemanticPayloadV1Schema = atlasJsonValueBaseV1Schema
  .superRefine((value, ctx) => validateAtlasJsonPayload(value, ctx))
  .describe(
    [
      "The structured JSON payload carried by one Atlas semantic-v1 candidate.",
      "It is intentionally extensible because Atlas V1 stores semantic payload as JSON/JSONB rather than a fixed business-domain table.",
      "Preserve only source-grounded semantic details that help downstream reasoning.",
      "Useful dimensions can include actor, subject, action, object, target, modality, conditions, timing, quantities and units, scope, state/value information, transitions, relationships/cardinality, formulas or derivations, inputs, outputs, acceptance details, and exception details.",
      "A semantic kind is the candidate's primary semantic role; payload may preserve additional orthogonal facets.",
      "For example, a candidate whose primary kind is rule may also carry a quantitative restriction and scope without losing its rule meaning.",
      "Do not invent missing business facts merely to make the payload look complete.",
    ].join(" ")
  );

export const atlasSemanticKindV1Schema = z
  .union([
    z.literal("actor").describe(
      "ACTOR: An independently meaningful business agent, role, organization, system, component, or other entity that performs actions or owns responsibilities. Use this when identifying the actor itself is the primary project meaning; do not emit a separate actor candidate merely because an actor appears inside an otherwise self-contained workflow step unless the actor identity or role is independently meaningful."
    ),
    z.literal("business_object").describe(
      "BUSINESS_OBJECT: A domain entity, record, document, concept, or managed thing that the system or business reasons about, creates, changes, stores, relates, or acts upon. Use this when the existence, identity, structure, or domain meaning of the object itself is the primary project meaning."
    ),
    z.literal("business_property").describe(
      "BUSINESS_PROPERTY: A property, attribute, status, value, derived value, formula, or observable characteristic of a business object or business concept. Use it when the primary meaning defines or derives a property or value; if the primary meaning is a change from one state to another, prefer state_transition."
    ),
    z.literal("responsibility").describe(
      "RESPONSIBILITY: A stable responsibility, authority, duty, capability, or area of ownership assigned to an actor or role. Use this for statements about which role may manage, review, approve, inspect, maintain, or operate a class of business information or process; do not use it for one concrete occurrence when workflow_step is primary."
    ),
    z.literal("rule").describe(
      "RULE: A governing business proposition describing required, permitted, prohibited, or otherwise normative behavior or policy. Rules may contain conditions, timing, scope, quantities, limits, or other restrictions. Rule and constraint are not conceptually disjoint: a rule can carry constraints. Use rule when governing behavior or policy is primary; preserve embedded limits and conditions in payload."
    ),
    z.literal("constraint").describe(
      "CONSTRAINT: An explicit boundary, invariant, restriction, uniqueness requirement, cardinality, threshold, range, format limit, capacity limit, or other limitation on valid values, states, relationships, or behavior. A constraint often exists inside a broader rule. Use constraint when the boundary or invariant itself is the primary informational contribution, while preserving related modality, scope, quantity, and conditions in payload."
    ),
    z.literal("condition").describe(
      "CONDITION: A predicate, prerequisite, eligibility criterion, trigger, guard, or circumstance that determines whether another rule, action, transition, result, or requirement applies. Preserve AND, OR, ONLY IF, UNLESS, and nested logic when materially stated. Mere temporal ordering such as 'before processing' is not automatically an applicability condition."
    ),
    z.literal("decision").describe(
      "DECISION: A business determination, choice, approval/rejection decision point, or branching judgment whose outcome selects among materially different business outcomes. Use it when the decision itself is project meaning, not merely because a statement contains a condition or status."
    ),
    z.literal("workflow_step").describe(
      "WORKFLOW_STEP: A concrete action or event that occurs as part of a business process or operational sequence. Preserve explicit actor, action, object, target, conditions, and timing. Use it when the concrete process action or event is primary."
    ),
    z.literal("state_transition").describe(
      "STATE_TRANSITION: A change of a business object, process, or concept from one state, status, or value to another. Preserve from-state, to-state, trigger, actor, conditions, and effects when stated. Use this when the state change is primary even if it is also a workflow event."
    ),
    z.literal("relationship").describe(
      "RELATIONSHIP: A domain association, dependency, ownership, containment, linkage, or cardinality between business entities or concepts. This is extraction-time business meaning and is NOT the same as Atlas reconciliation relationship types such as supports, contradicts, or supersedes."
    ),
    z.literal("input").describe(
      "INPUT: Information, data, document, value, artifact, evidence, selection, or other material explicitly required or supplied to a business process, action, decision, calculation, or system behavior. Use it when the incoming material itself is the primary requirement or semantic fact."
    ),
    z.literal("output").describe(
      "OUTPUT: Information, document, report, artifact, message, export, calculation result, display, or other material explicitly produced, returned, shown, generated, or made available. Use it when the produced result itself is the primary requirement or semantic fact."
    ),
    z.literal("acceptance_expectation").describe(
      "ACCEPTANCE_EXPECTATION: A requirement about how completion, correctness, delivery, or expected behavior will be checked or accepted, including acceptance criteria, verification scenarios, testable completion outcomes, or delivery evidence. Do not confuse an ordinary runtime business rule with an acceptance expectation merely because both use words such as must or should."
    ),
    z.literal("exception").describe(
      "EXCEPTION: An exceptional, alternate, failure, rejection, override, fallback, or deviation path relative to a normal rule or workflow. Preserve the triggering circumstance and the exceptional behavior or outcome. Use it when the exceptional path is independently meaningful rather than merely a negated ordinary rule."
    ),
    z.literal("unresolved").describe(
      "UNRESOLVED: Meaningful source content for which material ambiguity or missing information prevents a safe, faithful semantic representation under a more specific kind. Use this when materially different interpretations remain possible or missing information changes the meaning itself. Do not use unresolved for incidental implementation details. If a specific semantic kind is still clear but one material detail needs clarification, that specific kind may remain primary while needs_resolution is true."
    ),
  ])
  .describe(
    "The exact Atlas semantic-v1 candidate kind vocabulary. Kind expresses the candidate's PRIMARY semantic role, not every semantic facet present in the source. Kinds can overlap conceptually; payload preserves orthogonal facets. Do not force a false either/or when a proposition is, for example, a rule carrying a quantitative constraint."
  );

export const atlasEvidenceRefV1Schema = z
  .strictObject({
    page_number: z.number().int().min(1).describe("The 1-based page number of trusted NormalizedDocument evidence."),
    locator_type: z.enum(["text_block", "table", "visual_region"]).describe("The exact Atlas NormalizedDocument locator type grounding the semantic candidate."),
    locator_id: atlasIdV1Schema.describe("The exact Atlas-owned locator identifier from the authorized NormalizedDocument."),
    excerpt: z.string().min(1).max(4000).optional().describe("Trusted source excerpt. Atlas V1 requires it for text_block and table evidence. It must come from authorized source content, not provider paraphrase."),
  })
  .superRefine((value, ctx) => {
    if ((value.locator_type === "text_block" || value.locator_type === "table") && !value.excerpt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "text_block and table evidence require excerpt.", path: ["excerpt"] });
    }
  })
  .describe("One evidence reference grounding a semantic candidate or clarification question in the authorized NormalizedDocument.");

export const atlasSemanticCandidateV1Schema = z
  .strictObject({
    local_candidate_id: atlasIdV1Schema.describe("Result-local candidate identifier. It is not the canonical Atlas semantic ID; Atlas owns final identity."),
    semantic_key: atlasTextV1(300, "A concise normalized semantic key describing what this candidate is about. It is useful for deterministic indexing/retrieval but is not accepted-truth identity. Do not encode random IDs, source slots, provider IDs, or review decisions."),
    kind: atlasSemanticKindV1Schema,
    payload: atlasSemanticPayloadV1Schema,
    normalized_meaning: atlasTextV1(8000, "A source-faithful normalized statement of the candidate's complete business meaning. Preserve material actors, objects, modality, negation, quantities, units, scope, conditions, timing, states, relationships, and uncertainty. Wording may normalize; meaning must not be broadened, narrowed, repaired, or invented."),
    source_wording: z.string().min(1).max(12000).optional().describe("Exact authorized source wording when textual wording exists. Atlas should copy this from trusted NormalizedDocument source rather than asking the provider to recreate it."),
    needs_resolution: z.boolean().describe("True only when material ambiguity or missing information prevents safe use without clarification. This is orthogonal to kind. False when the source is semantically usable and merely omits incidental implementation details."),
    evidence_refs: z.array(atlasEvidenceRefV1Schema).min(1).max(32).describe("One or more Atlas-owned evidence references proving where this candidate came from."),
  })
  .describe("One independently meaningful Atlas semantic-v1 candidate assertion. Kind is the primary semantic classification; payload may retain additional semantic facets. A candidate is proposed/reviewable project meaning, not automatically accepted truth.");

export const atlasSourceClassificationV1Schema = z
  .union([
    z.literal("candidate").describe("The source unit establishes project meaning and must point to one or more semantic candidates."),
    z.literal("non_fact").describe("The source unit is structural, decorative, or otherwise does not itself establish project meaning. A bounded non-fact reason is required."),
  ])
  .describe("The exact Atlas semantic-v1 source-accounting classification vocabulary.");

export const atlasSourceStatementInventoryItemV1Schema = z
  .strictObject({
    source_unit_id: atlasIdV1Schema,
    page_number: z.number().int().min(1),
    locator_type: z.enum(["text_block", "table", "visual_region"]),
    locator_id: atlasIdV1Schema,
    classification: atlasSourceClassificationV1Schema,
    destination_local_candidate_ids: z.array(atlasIdV1Schema).max(64).describe("Result-local candidate IDs produced from this source. Candidate-classified sources require at least one; non_fact requires none."),
    non_fact_reason: z.string().min(1).max(1000).optional().describe("Bounded reason why this source unit establishes no project fact. Required only for non_fact."),
  })
  .superRefine((value, ctx) => {
    if (value.classification === "candidate" && value.destination_local_candidate_ids.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "candidate inventory requires at least one destination candidate.", path: ["destination_local_candidate_ids"] });
    }
    if (value.classification === "non_fact" && (!value.non_fact_reason || value.destination_local_candidate_ids.length !== 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "non_fact inventory requires only a reason and no candidate destinations." });
    }
  })
  .describe("Atlas semantic-v1 source accounting item. Every supplied meaningful source unit must be accounted for so extraction cannot silently omit source material.");

export const atlasSemanticQuestionV1Schema = z
  .strictObject({
    question: atlasTextV1(2000, "A concise clarification question requesting only the material information needed to resolve semantic ambiguity."),
    reason: atlasTextV1(2000, "A bounded explanation of why the missing or ambiguous information materially affects semantic interpretation."),
    evidence_refs: z.array(atlasEvidenceRefV1Schema).max(16).optional().describe("Optional Atlas-owned evidence references grounding the clarification question."),
  })
  .describe("A semantic clarification question. Questions preserve uncertainty rather than allowing the provider to guess missing project meaning.");

export const atlasSemanticExtractionResultV1Schema = z
  .strictObject({
    version: z.literal("v1"),
    candidate_assertions: z.array(atlasSemanticCandidateV1Schema).max(atlasSemanticLimitsV1.currentCandidates),
    source_statement_inventory: z.array(atlasSourceStatementInventoryItemV1Schema).max(100000),
    questions: z.array(atlasSemanticQuestionV1Schema).max(100),
  })
  .superRefine((value, ctx) => {
    const localIds = new Set<string>();
    for (const candidate of value.candidate_assertions) {
      if (localIds.has(candidate.local_candidate_id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate local candidate ID.", path: ["candidate_assertions"] });
      }
      localIds.add(candidate.local_candidate_id);
    }
    const sourceIdentities = new Set<string>();
    const accountedCandidates = new Set<string>();
    for (const item of value.source_statement_inventory) {
      const sourceIdentity = `${item.page_number}:${item.locator_type}:${item.locator_id}`;
      if (sourceIdentities.has(sourceIdentity)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate source inventory identity.", path: ["source_statement_inventory"] });
      }
      sourceIdentities.add(sourceIdentity);
      for (const destination of item.destination_local_candidate_ids) {
        if (!localIds.has(destination)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Dangling local candidate ID: ${destination}`, path: ["source_statement_inventory"] });
        }
        accountedCandidates.add(destination);
      }
    }
    for (const localId of localIds) {
      if (!accountedCandidates.has(localId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Candidate is missing source accounting: ${localId}`, path: ["source_statement_inventory"] });
      }
    }
  })
  .describe("The current Atlas semantic extraction result contract v1: evidence-grounded candidate assertions, complete source accounting, and unresolved clarification questions.");

export const atlasReconciliationRelationshipTypeV1Schema = z
  .union([
    z.literal("new").describe("NEW: The source candidate introduces materially new meaning relative to the supplied reconciliation neighborhood and therefore has no target candidate."),
    z.literal("supports").describe("SUPPORTS: The source candidate is materially consistent with and corroborates a target candidate without merely duplicating it."),
    z.literal("duplicates").describe("DUPLICATES: The source and target express materially the same project meaning with no substantive semantic addition."),
    z.literal("refines").describe("REFINES: The source makes the target meaning more precise, specific, constrained, or detailed without contradicting it."),
    z.literal("extends").describe("EXTENDS: The source adds compatible meaning beyond the target rather than merely restating or narrowing it."),
    z.literal("contradicts").describe("CONTRADICTS: The source and target cannot both be true under the same relevant scope/context as currently stated."),
    z.literal("supersedes").describe("SUPERSEDES: Evidence establishes that the source replaces the target's meaning in the relevant scope. Later processing order alone never proves supersession."),
    z.literal("partially_supersedes").describe("PARTIALLY_SUPERSEDES: Evidence establishes that the source replaces only part of the target's scope or meaning while the remainder can stay valid."),
    z.literal("ambiguous").describe("AMBIGUOUS: The relationship between source and target cannot be safely classified from available evidence because materially different interpretations remain possible."),
    z.literal("requires_resolution").describe("REQUIRES_RESOLUTION: A material relationship or conflict exists but human clarification/review is required before Atlas can safely determine the intended canonical relationship."),
  ])
  .describe("The exact Atlas semantic-reconciliation v1 relationship vocabulary. These values belong to reconciliation, not extraction-time business relationship candidates.");

export const atlasReconciliationRelationshipV1Schema = z
  .strictObject({
    source_candidate_id: atlasIdV1Schema,
    target_candidate_id: atlasIdV1Schema.optional(),
    relationship_type: atlasReconciliationRelationshipTypeV1Schema,
    payload: atlasSemanticPayloadV1Schema.describe("Structured evidence-grounded detail explaining the reconciliation relationship without inventing precedence or accepted truth."),
    requires_resolution: z.boolean().describe("True when the relationship cannot be safely applied without clarification or human review."),
    evidence_refs: z.array(atlasEvidenceRefV1Schema).max(32),
  })
  .superRefine((value, ctx) => {
    const shouldHaveTarget = value.relationship_type !== "new";
    if (shouldHaveTarget && value.target_candidate_id === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "All non-new reconciliation relationships require target_candidate_id.", path: ["target_candidate_id"] });
    }
    if (!shouldHaveTarget && value.target_candidate_id !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "new reconciliation relationships must not have target_candidate_id.", path: ["target_candidate_id"] });
    }
  })
  .describe("One Atlas semantic-reconciliation v1 relationship proposal.");

export const atlasSemanticReconciliationResultV1Schema = z
  .strictObject({
    version: z.literal("v1"),
    relationships: z.array(atlasReconciliationRelationshipV1Schema).max(atlasSemanticLimitsV1.totalCandidates * 10),
    questions: z.array(atlasSemanticQuestionV1Schema).max(100),
  })
  .describe("The current Atlas semantic reconciliation result contract v1. Reconciliation remains a separate capability from extraction.");

/**
 * Provider-facing extraction profile for SEM-ANM-PROMPT-002.
 * It exposes only semantic judgments the model is allowed to make.
 */
const providerPayloadObjectV1Schema = z
  .record(z.string().min(1).max(100), atlasSemanticPayloadV1Schema)
  .superRefine((value, ctx) => {
    if (Object.keys(value).length > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provider semantic payload exceeds 100 properties." });
    }
  })
  .describe(
    "Structured source-grounded semantic payload stored inside Atlas semantic-v1 payload. Use clear descriptive snake_case keys. Preserve relevant dimensions such as actor, subject, action, object, target, modality, conditions, timing, quantities/units, scope, state/value, transitions, relationships/cardinality, derivations/formulas, inputs, outputs, acceptance details, and exceptions when supported. Include only materially useful dimensions and do not invent absent values merely to fill a template."
  );

export const atlasProviderCandidateProposalV1Schema = z
  .strictObject({
    semantic_key: atlasTextV1(300, "A concise normalized semantic key for this candidate's main concept. Use source-supported project/domain language. Do not include slot IDs, random IDs, provider metadata, or review decisions."),
    kind: atlasSemanticKindV1Schema,
    payload: providerPayloadObjectV1Schema,
    normalized_meaning: atlasTextV1(8000, "A concise but complete normalized statement of the candidate's source-supported business meaning. Preserve modality, negation, actor/object identity, conditions, temporal ordering, quantities, exact units/values, scope, states, relationships, and uncertainty. Harmless grammatical normalization is acceptable; semantic broadening, narrowing, repair, or invention is not."),
    needs_resolution: z.boolean().describe("True when material ambiguity or missing information prevents safe use without clarification. This is independent of primary kind. Do not set true merely because incidental implementation details are absent."),
  })
  .describe("One provider-proposed semantic candidate aligned to the current Atlas semantic-v1 vocabulary. Kind is the PRIMARY role; payload preserves orthogonal facets. The provider does not assign Atlas IDs, evidence locators, source inventory identities, accepted truth, or canonical truth.");

export const atlasProviderQuestionProposalV1Schema = z
  .strictObject({
    question: atlasTextV1(2000, "One concise clarification question asking only for material missing information."),
    reason: atlasTextV1(2000, "Why the missing or ambiguous information materially affects semantic interpretation."),
  })
  .describe("Provider-proposed clarification content. Atlas attaches trusted evidence and owns final question identity.");

export const atlasProviderSourceResultV1Schema = z
  .strictObject({
    slot: z.string().min(1).max(200).describe("The exact temporary source slot supplied by Atlas. Preserve it exactly; never create or rename slots."),
    classification: atlasSourceClassificationV1Schema,
    candidates: z.array(atlasProviderCandidateProposalV1Schema).max(64).describe("Semantic candidates grounded in this source slot. candidate requires one or more; non_fact requires none."),
    non_fact_reason: z.string().min(1).max(1000).nullable().describe("Bounded reason for non_fact classification. Must be null for candidate classification."),
    questions: z.array(atlasProviderQuestionProposalV1Schema).max(100).describe("Clarification questions caused by material ambiguity in this source slot. Do not ask about incidental implementation details."),
  })
  .superRefine((value, ctx) => {
    if (value.classification === "candidate") {
      if (value.candidates.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "candidate classification requires at least one candidate.", path: ["candidates"] });
      if (value.non_fact_reason !== null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "candidate classification requires non_fact_reason = null.", path: ["non_fact_reason"] });
    }
    if (value.classification === "non_fact") {
      if (value.candidates.length !== 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "non_fact classification requires zero candidates.", path: ["candidates"] });
      if (value.non_fact_reason === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "non_fact classification requires a reason.", path: ["non_fact_reason"] });
      if (value.questions.length !== 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "non_fact classification cannot emit semantic clarification questions.", path: ["questions"] });
    }
  })
  .describe("The provider semantic disposition for exactly one Atlas-authorized source slot. It mirrors Atlas V1 candidate/non_fact accounting while leaving final source identity and candidate IDs to Atlas.");

export const atlasProviderExtractionProposalV1Schema = z
  .strictObject({
    version: z.literal("v1").describe("The semantic vocabulary/profile version aligned to the existing Atlas semantic contract version v1."),
    source_results: z.array(atlasProviderSourceResultV1Schema).max(100000).describe("Exactly one source result for every supplied source slot, with no missing, duplicate, or invented slots."),
  })
  .describe("SEM-ANM-PROMPT-002 provider-facing semantic extraction proposal aligned to Atlas semantic-v1. It excludes Atlas-owned IDs, evidence locators, source inventory identities, persistence state, reconciliation, review, accepted truth, publication, and Master authority. Deterministic Atlas finalization must convert it into unchanged atlas.semantic.extract/v1 without inventing missing semantic judgments.");
