import { createHash } from "node:crypto";
import { z } from "zod";

export const POLICY_KNOWLEDGE_PROPOSAL_SCHEMA_VERSION = "1.0.0" as const;

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const NonEmpty = z.string().trim().min(1);
const Timestamp = z.iso.datetime({ offset: true });

export const KnowledgeLayerSchema = z.enum([
  "raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy",
]);
export const KnowledgeGapRouteSchema = z.enum([
  "EXTRACTION_GAP", "CANONICALIZATION_GAP", "POLICY_GAP",
]);

const GovernedContextSchema = z.object({
  gap_id: Id,
  gap_fingerprint: Hash,
  demand_fact_ids: z.array(Id).min(1),
  source_glossary_revision: Revision,
  raw_vocabulary_revision: Revision,
  canonical_vocabulary_revision: Revision,
  policy_taxonomy_revision: Revision,
  predecessor_artifact_id: Id,
  predecessor_artifact_hash: Hash,
}).strict().superRefine((value, context) => {
  if (new Set(value.demand_fact_ids).size !== value.demand_fact_ids.length) {
    context.addIssue({ code: "custom", message: "Demand fact IDs must be unique" });
  }
});

const SourceLineageSchema = z.object({
  source_release_id: Id,
  source_locator: NonEmpty,
  raw_concept_id: Id,
}).strict();

const RawRequestSchema = z.object({
  layer: z.literal("raw_source_vocabulary"),
  gap_route: z.literal("EXTRACTION_GAP"),
  bounded_task: NonEmpty,
  governed_source_release_ids: z.array(Id).min(1),
  source_locator_candidates: z.array(NonEmpty).min(1),
  existing_raw_concept_ids: z.array(Id),
}).strict();

const CanonicalRequestSchema = z.object({
  layer: z.literal("canonical_vocabulary"),
  gap_route: z.literal("CANONICALIZATION_GAP"),
  bounded_task: NonEmpty,
  accepted_raw_support: z.array(SourceLineageSchema).min(1),
  existing_canonical_concept_ids: z.array(Id),
}).strict();
export const CanonicalKnowledgeRequestSchema = CanonicalRequestSchema;

const PolicyRequestSchema = z.object({
  layer: z.literal("policy_taxonomy"),
  gap_route: z.literal("POLICY_GAP"),
  bounded_task: NonEmpty,
  approved_canonical_concept_ids: z.array(Id).min(1),
  predecessor_policy_ids: z.array(Id).min(1),
}).strict();

export const PolicyKnowledgeRequestBodySchema = z.discriminatedUnion("layer", [
  RawRequestSchema, CanonicalRequestSchema, PolicyRequestSchema,
]);

export const PolicyKnowledgeAgentRequestSchema = z.object({
  schema_version: z.literal(POLICY_KNOWLEDGE_PROPOSAL_SCHEMA_VERSION),
  request_id: Id,
  lifecycle: z.literal("proposed"),
  governed_context: GovernedContextSchema,
  request: PolicyKnowledgeRequestBodySchema,
  request_hash: Hash,
}).strict().superRefine((value, context) => {
  if (value.request.layer !== routeLayer(value.request.gap_route)) {
    context.addIssue({ code: "custom", message: "Gap route does not match request layer" });
  }
  const { request_hash: requestHash, ...withoutHash } = value;
  if (stableHash(withoutHash) !== requestHash) {
    context.addIssue({ code: "custom", message: "Request hash does not match request contents" });
  }
});

const RawProposalSchema = z.object({
  layer: z.literal("raw_source_vocabulary"),
  gap_route: z.literal("EXTRACTION_GAP"),
  decision: z.enum(["ADD", "REJECT"]),
  proposed_raw_concept_id: Id,
  bounded_meaning: NonEmpty,
  source_release_id: Id,
  source_locator: NonEmpty,
  semantic_rationale: NonEmpty,
  extraction_evidence: z.object({ schema_version: z.literal("1.1.0"),
    governed_source_artifact_id: Id, governed_source_content_hash: z.string()
      .regex(/^sha256:[0-9a-f]{64}$/u), exact_source_term: NonEmpty,
    exact_source_excerpt_hash: Hash, semantic_role: z.enum(["objective", "control", "requirement",
      "risk_concern", "verification_context", "evidence_expectation"]),
    scope_disposition: z.enum(["software_relevant", "out_of_scope_organizational", "review_required"]),
    extraction_method: z.literal("agent_assisted"), extractor_id: Id,
    extractor_version: Revision, extraction_input_hash: z.string().regex(/^sha256:[0-9a-f]{64}$/u),
    predecessor_artifact_id: Id,
    predecessor_artifact_hash: Hash, rights_evidence_id: Id,
    authorization_evidence_id: Id }).strict().optional(),
}).strict();

const CanonicalProposalSchema = z.object({
  layer: z.literal("canonical_vocabulary"),
  gap_route: z.literal("CANONICALIZATION_GAP"),
  decision: z.enum(["ADD", "MERGE", "ALIAS", "REJECT"]),
  target_canonical_concept_id: Id.nullable().optional(),
  proposed_canonical_concept_id: Id,
  preferred_term: NonEmpty,
  definition: NonEmpty,
  raw_support: z.array(SourceLineageSchema).min(1),
  semantic_rationale: NonEmpty,
  predecessor_comparisons: z.array(z.object({ target_canonical_concept_id: Id,
    relationship: z.enum(["distinct", "overlaps", "subsumes", "equivalent", "unsupported"]),
    rationale: NonEmpty }).strict()).optional(),
  raw_semantic_evidence: z.array(z.object({ raw_concept_id: Id, source_release_id: Id,
    source_locator: NonEmpty, source_term: NonEmpty,
    semantic_role: z.enum(["objective", "control", "requirement", "risk_concern",
      "verification_context", "evidence_expectation"]),
    scope_disposition: z.enum(["software_relevant", "out_of_scope_organizational", "review_required"]),
    bounded_meaning: NonEmpty, extraction_method: z.enum(["manual", "structured_source", "agent_assisted"]),
    extracted_at: Timestamp, extractor_id: Id, extraction_input_hash: z.string()
      .regex(/^sha256:[0-9a-f]{64}$/u), extraction_input_hash_scope: NonEmpty }).strict()).min(1).optional(),
  raw_distinction_justifications: z.array(z.object({ first_raw_concept_id: Id,
    second_raw_concept_id: Id, relationship: z.enum(["distinct", "compatible_combination"]),
    rationale: NonEmpty }).strict()).optional(),
  proposed_raw_mappings: z.array(z.object({ raw_concept_id: Id,
    relationship: z.enum(["supports", "related", "alias"]), rationale: NonEmpty }).strict()).optional(),
}).strict();
export const CanonicalKnowledgeProposalSchema = CanonicalProposalSchema;

const ComparisonSchema = z.object({
  subject_canonical_concept_id: Id,
  comparison_target_id: Id,
  relationship: z.enum(["distinct", "overlaps", "subsumes", "equivalent", "unsupported"]),
  rationale: NonEmpty,
}).strict();

const PolicyProposalSchema = z.object({
  layer: z.literal("policy_taxonomy"),
  gap_route: z.literal("POLICY_GAP"),
  decisions: z.array(z.object({
    canonical_concept_id: Id,
    decision: z.enum(["ADD", "MERGE", "REJECT"]),
    target_policy_id: Id.nullable(),
    rationale: NonEmpty,
  }).strict()).min(1),
  proposed_policy: z.object({
    policy_id: Id,
    title: NonEmpty,
    obligation: NonEmpty,
    canonical_support_ids: z.array(Id).min(1),
    lifecycle: z.literal("candidate"),
    approval_status: z.literal("proposed"),
  }).strict().nullable(),
  semantic_comparisons: z.array(ComparisonSchema).min(1),
}).strict();

export const PolicyKnowledgeProposalBodySchema = z.discriminatedUnion("layer", [
  RawProposalSchema, CanonicalProposalSchema, PolicyProposalSchema,
]);

export const PolicyKnowledgeProposalSchema = z.object({
  schema_version: z.literal(POLICY_KNOWLEDGE_PROPOSAL_SCHEMA_VERSION),
  proposal_id: Id,
  lifecycle: z.literal("proposed"),
  governed_context: GovernedContextSchema,
  proposal: PolicyKnowledgeProposalBodySchema,
  proposal_hash: Hash,
}).strict().superRefine((value, context) => {
  const expectedLayer = routeLayer(value.proposal.gap_route);
  if (value.proposal.layer !== expectedLayer) {
    context.addIssue({ code: "custom", message: "Gap route does not match proposal layer" });
  }
  const { proposal_hash: proposalHash, ...withoutHash } = value;
  if (stableHash(withoutHash) !== proposalHash) {
    context.addIssue({ code: "custom", message: "Proposal hash does not match proposal contents" });
  }
});

export const PolicyKnowledgeExecutionEvidenceSchema = z.object({
  schema_version: z.literal(POLICY_KNOWLEDGE_PROPOSAL_SCHEMA_VERSION),
  evidence_id: Id,
  request_id: Id,
  attempt_id: Id,
  agent_id: Id,
  agent_version: Revision,
  provider_id: Id,
  model_alias: Id,
  resolved_model: NonEmpty,
  governed_context_hash: Hash,
  proposal_id: Id,
  proposal_hash: Hash,
  validation: z.object({
    status: z.enum(["valid", "invalid"]),
    validator_id: Id,
    validator_version: Revision,
    result_hash: Hash,
  }).strict(),
  executed_at: Timestamp,
  authority: z.object({
    proposal_lifecycle: z.literal("proposed"),
    review_status: z.literal("not_submitted"),
    publication_status: z.literal("not_published"),
    grants_policy_authority: z.literal(false),
  }).strict(),
  evidence_hash: Hash,
}).strict().superRefine((value, context) => {
  const { evidence_hash: evidenceHash, ...withoutHash } = value;
  if (stableHash(withoutHash) !== evidenceHash) {
    context.addIssue({ code: "custom", message: "Evidence hash does not match evidence contents" });
  }
});

export function createPolicyKnowledgeProposal(input: Omit<
  z.input<typeof PolicyKnowledgeProposalSchema>, "proposal_hash"
>) {
  const value = { ...input, proposal_hash: stableHash(input) };
  return PolicyKnowledgeProposalSchema.parse(value);
}

export function createPolicyKnowledgeAgentRequest(input: Omit<
  z.input<typeof PolicyKnowledgeAgentRequestSchema>, "request_hash"
>) {
  const value = { ...input, request_hash: stableHash(input) };
  return PolicyKnowledgeAgentRequestSchema.parse(value);
}

export function createPolicyKnowledgeExecutionEvidence(input: Omit<
  z.input<typeof PolicyKnowledgeExecutionEvidenceSchema>, "evidence_hash"
>) {
  const value = { ...input, evidence_hash: stableHash(input) };
  return PolicyKnowledgeExecutionEvidenceSchema.parse(value);
}

export function governedContextHash(
  value: z.input<typeof GovernedContextSchema>,
): string {
  return stableHash(GovernedContextSchema.parse(value));
}

function routeLayer(route: z.infer<typeof KnowledgeGapRouteSchema>) {
  if (route === "EXTRACTION_GAP") return "raw_source_vocabulary" as const;
  if (route === "CANONICALIZATION_GAP") return "canonical_vocabulary" as const;
  return "policy_taxonomy" as const;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export type PolicyKnowledgeProposal = z.infer<typeof PolicyKnowledgeProposalSchema>;
export type PolicyKnowledgeAgentRequest = z.infer<typeof PolicyKnowledgeAgentRequestSchema>;
export type PolicyKnowledgeExecutionEvidence =
  z.infer<typeof PolicyKnowledgeExecutionEvidenceSchema>;
