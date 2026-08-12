import { PolicyKnowledgeAgentRequestSchema, PolicyKnowledgeProposalSchema,
  createPolicyKnowledgeProposal } from "@company/ces-policy-knowledge-proposals";
import { validatePolicyTaxonomyProposal } from "@company/ces-policy-knowledge-validation";
import { z } from "zod";
import type { StructuredGenerationPolicy, StructuredGenerationRequest } from "../../core/contracts.js";
import type { StructuredGenerationAgentDefinition } from "../../core/registry.js";

export const POLICY_TAXONOMY_AGENT_ID = "ces.policy-taxonomy-agent" as const;
export const POLICY_TAXONOMY_AGENT_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const NonEmpty = z.string().trim().min(1);
const Lineage = z.object({ canonical_concept_id: Id, raw_concept_id: Id,
  source_release_id: Id, source_locator: NonEmpty }).strict();

export const PolicyTaxonomyAgentInputSchema = z.object({
  request: PolicyKnowledgeAgentRequestSchema,
  approved_canonical_obligations: z.array(z.object({ concept_id: Id,
    preferred_term: NonEmpty, definition: NonEmpty,
    raw_lineage: z.array(Lineage).min(1) }).strict()).min(1),
  predecessor_policies: z.array(z.object({ policy_id: Id, title: NonEmpty,
    obligation: NonEmpty, canonical_support_ids: z.array(Id).min(1) }).strict()).min(1),
}).strict().superRefine((value, context) => {
  if (value.request.request.layer !== "policy_taxonomy") {
    context.addIssue({ code: "custom", message: "Policy Taxonomy Agent requires POLICY_GAP" });
    return;
  }
  const requestedConcepts = new Set(value.request.request.approved_canonical_concept_ids);
  if (requestedConcepts.size !== value.approved_canonical_obligations.length ||
      value.approved_canonical_obligations.some(({ concept_id }) => !requestedConcepts.has(concept_id))) {
    context.addIssue({ code: "custom", message: "Canonical payload must match requested concepts" });
  }
  const requestedPolicies = new Set(value.request.request.predecessor_policy_ids);
  if (requestedPolicies.size !== value.predecessor_policies.length ||
      value.predecessor_policies.some(({ policy_id }) => !requestedPolicies.has(policy_id))) {
    context.addIssue({ code: "custom", message: "Predecessor payload must match requested Policies" });
  }
});

const IntermediateSchema = z.object({
  decisions: z.array(z.object({ canonical_concept_id: Id,
    decision: z.enum(["ADD", "MERGE", "REJECT"]), target_policy_id: Id.nullable(),
    rationale: NonEmpty }).strict()).min(1),
  proposed_policy: z.object({ policy_id: Id, title: NonEmpty, obligation: NonEmpty,
    canonical_support_ids: z.array(Id).min(1), lifecycle: z.literal("candidate"),
    approval_status: z.literal("proposed") }).strict().nullable(),
  semantic_comparisons: z.array(z.object({ subject_canonical_concept_id: Id,
    comparison_target_id: Id,
    relationship: z.enum(["distinct", "overlaps", "subsumes", "equivalent", "unsupported"]),
    rationale: NonEmpty }).strict()).min(1),
}).strict();

type Input = z.infer<typeof PolicyTaxonomyAgentInputSchema>;
type Intermediate = z.infer<typeof IntermediateSchema>;
type Output = z.infer<typeof PolicyKnowledgeProposalSchema>;

export interface PolicyTaxonomyGovernedKnowledge {
  readonly validation_input: Parameters<typeof validatePolicyTaxonomyProposal>[1];
  readonly approved_canonical_obligations: Input["approved_canonical_obligations"];
  readonly predecessor_policies: Input["predecessor_policies"];
}

export type PolicyTaxonomyKnowledgeResolver =
  (request: Input["request"]) => PolicyTaxonomyGovernedKnowledge;

export function createPolicyTaxonomyAgent(options: {
  model_alias: string; provider_id: string;
  resolve_governed_knowledge: PolicyTaxonomyKnowledgeResolver;
  policy: Partial<Pick<StructuredGenerationPolicy, "timeout_ms" | "max_attempts" |
    "max_input_bytes" | "max_output_bytes" | "max_output_tokens">>;
}): StructuredGenerationAgentDefinition<Input, Intermediate, Output> {
  const policy: StructuredGenerationPolicy = {
    allowed_providers: [options.provider_id], allowed_model_aliases: [options.model_alias],
    allowed_tools: [], timeout_ms: options.policy.timeout_ms ?? 90_000,
    max_attempts: options.policy.max_attempts ?? 3,
    max_input_bytes: options.policy.max_input_bytes ?? 1_048_576,
    max_output_bytes: options.policy.max_output_bytes ?? 1_048_576,
    max_output_tokens: options.policy.max_output_tokens ?? 16_384,
    requires_structured_output: true, requires_human_review: true,
  };
  return { id: POLICY_TAXONOMY_AGENT_ID, version: POLICY_TAXONOMY_AGENT_VERSION,
    description: "Propose reusable Policy taxonomy changes for a bounded governed POLICY_GAP.",
    mode: "structured-generation", input_schema: PolicyTaxonomyAgentInputSchema,
    intermediate_schema: IntermediateSchema, output_schema: PolicyKnowledgeProposalSchema,
    execution_policy: policy,
    buildExecutionRequest: (input) => buildRequest(input, options.model_alias, policy,
      resolveAndVerify(input, options.resolve_governed_knowledge)),
    transformResult: async (result, input) => {
      const governed = resolveAndVerify(input, options.resolve_governed_knowledge);
      const proposal = createPolicyKnowledgeProposal({ schema_version: "1.0.0",
        proposal_id: `proposal.${input.request.request_id}`, lifecycle: "proposed",
        governed_context: input.request.governed_context,
        proposal: { layer: "policy_taxonomy", gap_route: "POLICY_GAP", ...result } });
      const validation = validatePolicyTaxonomyProposal(proposal, governed.validation_input);
      if (validation.status !== "valid" ||
          validation.review_eligibility !== "reviewable_proposal") {
        throw new Error(`AGB-008 rejected Policy proposal: ${validation.issue_codes.join(",")}`);
      }
      return proposal;
    } };
}

function buildRequest(input: Input, modelAlias: string,
  policy: StructuredGenerationPolicy,
  governed?: PolicyTaxonomyGovernedKnowledge): StructuredGenerationRequest {
  const knowledge = governed ?? { approved_canonical_obligations: input.approved_canonical_obligations,
    predecessor_policies: input.predecessor_policies };
  return { system_instructions: `Propose only a bounded reusable CES Policy taxonomy decision. Compare every approved canonical obligation against every predecessor Policy and against every other proposed obligation. Preserve distinct canonical meanings and raw lineage. Use ADD, MERGE, or REJECT. Policy wording must state WHAT is required, never implementation HOW, and must be technology- and project-independent. Lifecycle must remain candidate and approval_status proposed. Do not claim acceptance, publication, or authority. Return JSON only.`,
    messages: [{ role: "user", content: JSON.stringify({
      bounded_task: input.request.request.layer === "policy_taxonomy"
        ? input.request.request.bounded_task : "",
      governed_context: input.request.governed_context,
      approved_canonical_obligations: knowledge.approved_canonical_obligations,
      predecessor_policies: knowledge.predecessor_policies,
    }) }], response_json_schema: z.toJSONSchema(IntermediateSchema),
    model_alias: modelAlias, max_output_tokens: policy.max_output_tokens };
}

function resolveAndVerify(input: Input, resolver: PolicyTaxonomyKnowledgeResolver) {
  const governed = resolver(input.request);
  if (JSON.stringify(input.approved_canonical_obligations) !==
      JSON.stringify(governed.approved_canonical_obligations) ||
      JSON.stringify(input.predecessor_policies) !== JSON.stringify(governed.predecessor_policies)) {
    throw new Error("Caller Policy knowledge does not match the governed revision registry");
  }
  return governed;
}
