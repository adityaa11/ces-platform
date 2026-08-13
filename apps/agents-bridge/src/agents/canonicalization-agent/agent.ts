import { CanonicalKnowledgeProposalSchema, PolicyKnowledgeAgentRequestSchema, PolicyKnowledgeProposalSchema,
  createPolicyKnowledgeProposal } from "@company/ces-policy-knowledge-proposals";
import { z } from "zod";
import type { StructuredGenerationPolicy, StructuredGenerationRequest } from "../../core/contracts.js";
import type { StructuredGenerationAgentDefinition } from "../../core/registry.js";
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Text = z.string().trim().min(1);
const Lineage = z.object({ source_release_id: Id, source_locator: Text, raw_concept_id: Id }).strict();
const Comparison = z.object({ target_canonical_concept_id: Id,
  relationship: z.enum(["distinct", "overlaps", "subsumes", "equivalent", "unsupported"]),
  rationale: Text }).strict();
const Intermediate = z.object({ decision: z.enum(["ADD", "MERGE", "ALIAS", "REJECT"]),
  target_canonical_concept_id: Id.nullable(),
  proposed_canonical_concept_id: Id, preferred_term: Text, definition: Text,
  raw_support: z.array(Lineage).min(1), semantic_rationale: Text,
  predecessor_comparisons: z.array(Comparison),
  raw_distinction_justifications: z.array(z.object({ first_raw_concept_id: Id,
    second_raw_concept_id: Id, relationship: z.enum(["distinct", "compatible_combination"]),
    rationale: Text }).strict()),
  proposed_raw_mappings: z.array(z.object({ raw_concept_id: Id,
    relationship: z.enum(["supports", "related", "alias"]), rationale: Text }).strict()) }).strict();
export const CANONICALIZATION_AGENT_ID = "ces.canonicalization-agent";
export const CanonicalizationAgentInputSchema = z.object({ request: PolicyKnowledgeAgentRequestSchema }).strict()
  .superRefine((value, context) => { if (value.request.request.layer !== "canonical_vocabulary")
    context.addIssue({ code: "custom", message: "Canonicalization Agent requires CANONICALIZATION_GAP" }); });
type Input = z.infer<typeof CanonicalizationAgentInputSchema>;
export interface CanonicalizationKnowledge { raw_support: z.infer<typeof Lineage>[];
  raw_semantic_evidence: { raw_concept_id: string; source_release_id: string; source_locator: string;
    source_term: string; semantic_role: "objective" | "control" | "requirement" | "risk_concern" |
    "verification_context" | "evidence_expectation"; scope_disposition: "software_relevant" |
    "out_of_scope_organizational" | "review_required"; bounded_meaning: string;
    extraction_method: "manual" | "structured_source" | "agent_assisted"; extracted_at: string;
    extractor_id: string; extraction_input_hash: string; extraction_input_hash_scope: string }[];
  predecessor_concepts: { concept_id: string; preferred_term: string; definition: string }[] }
export type CanonicalizationResolver = (request: Input["request"]) => CanonicalizationKnowledge;
export function createCanonicalizationAgent(options: { model_alias: string; provider_id: string;
  resolve_knowledge: CanonicalizationResolver; policy: Partial<StructuredGenerationPolicy> }):
  StructuredGenerationAgentDefinition<Input, z.infer<typeof Intermediate>,
  z.infer<typeof PolicyKnowledgeProposalSchema>> {
  const policy: StructuredGenerationPolicy = { allowed_providers: [options.provider_id],
    allowed_model_aliases: [options.model_alias], allowed_tools: [], timeout_ms: options.policy.timeout_ms ?? 90_000,
    max_attempts: options.policy.max_attempts ?? 3, max_input_bytes: options.policy.max_input_bytes ?? 1_048_576,
    max_output_bytes: options.policy.max_output_bytes ?? 1_048_576,
    max_output_tokens: options.policy.max_output_tokens ?? 12_000, requires_structured_output: true,
    requires_human_review: true };
  return { id: CANONICALIZATION_AGENT_ID, version: "1.0.0",
    description: "Propose bounded canonical concepts from accepted raw knowledge.", mode: "structured-generation",
    input_schema: CanonicalizationAgentInputSchema, intermediate_schema: Intermediate,
    output_schema: PolicyKnowledgeProposalSchema, execution_policy: policy,
    buildExecutionRequest: (input) => request(input, options.resolve_knowledge(input.request), options.model_alias, policy),
    transformResult: async (result, input) => {
      const governed = options.resolve_knowledge(input.request);
      if (JSON.stringify(result.raw_support) !== JSON.stringify(governed.raw_support))
        throw new Error("Canonical proposal loses or invents raw lineage");
      const expected = new Set(governed.predecessor_concepts.map(({ concept_id }) => concept_id));
      const compared = result.predecessor_comparisons.map(({ target_canonical_concept_id }) => target_canonical_concept_id);
      if (compared.length !== expected.size || new Set(compared).size !== compared.length ||
          compared.some((id) => !expected.has(id))) throw new Error("Canonical predecessor comparison is incomplete");
      validateDecision(result, expected);
      validateRawDistinctions(result, governed);
      const mapped = result.proposed_raw_mappings.map(({ raw_concept_id }) => raw_concept_id);
      const supported = governed.raw_support.map(({ raw_concept_id }) => raw_concept_id);
      if (mapped.length !== supported.length || new Set(mapped).size !== mapped.length ||
          mapped.some((id) => !supported.includes(id))) throw new Error("Proposed raw mappings lose or invent support");
      const shared = JSON.stringify(result).toLowerCase();
      if (["safara", "pilgrim", "passport", "package", "payment", "framework", "database"]
        .some((term) => shared.includes(term))) throw new Error("Canonical proposal contains project or implementation wording");
      const proposal = CanonicalKnowledgeProposalSchema.parse({ layer: "canonical_vocabulary",
        gap_route: "CANONICALIZATION_GAP", ...result,
        raw_semantic_evidence: governed.raw_semantic_evidence });
      return createPolicyKnowledgeProposal({ schema_version: "1.0.0",
        proposal_id: `proposal.${input.request.request_id}`, lifecycle: "proposed",
        governed_context: input.request.governed_context,
        proposal });
    } };
}
function request(input: Input, knowledge: CanonicalizationKnowledge, alias: string,
  policy: StructuredGenerationPolicy): StructuredGenerationRequest { return {
  system_instructions: "Propose one reusable canonical meaning from accepted raw support. Compare it with every predecessor concept. Preserve every raw distinction and exact lineage; explicitly justify each differently-role raw pair. Use ADD, MERGE, ALIAS, or REJECT with an explicit target when required. Exclude project wording and implementation mechanisms. Never approve or publish. Return JSON only.",
  messages: [{ role: "user", content: JSON.stringify({ bounded_task: input.request.request.layer ===
    "canonical_vocabulary" ? input.request.request.bounded_task : "", ...knowledge }) }],
  response_json_schema: z.toJSONSchema(Intermediate), model_alias: alias,
  max_output_tokens: policy.max_output_tokens }; }
function validateDecision(result: z.infer<typeof Intermediate>, predecessorIds: Set<string>) {
  const target = result.target_canonical_concept_id;
  const targetComparison = target ? result.predecessor_comparisons.find(({ target_canonical_concept_id }) =>
    target_canonical_concept_id === target) : undefined;
  if (target && !predecessorIds.has(target)) throw new Error("Canonical decision target is outside predecessor");
  if (result.decision === "ADD") {
    if (target || result.predecessor_comparisons.some(({ relationship }) =>
      !["distinct", "unsupported"].includes(relationship))) throw new Error("ADD contradicts predecessor comparisons");
  } else if (result.decision === "MERGE") {
    if (!targetComparison || !["overlaps", "subsumes"].includes(targetComparison.relationship) ||
        result.predecessor_comparisons.some(({ relationship, target_canonical_concept_id }) =>
          relationship === "equivalent" || (["overlaps", "subsumes"].includes(relationship) &&
          target_canonical_concept_id !== target))) throw new Error("MERGE requires one related target");
  } else if (result.decision === "ALIAS") {
    if (!targetComparison || targetComparison.relationship !== "equivalent" ||
        result.predecessor_comparisons.filter(({ relationship }) => relationship === "equivalent").length !== 1)
      throw new Error("ALIAS requires one equivalent target");
  } else if (!targetComparison || targetComparison.relationship !== "equivalent") {
    throw new Error("REJECT requires an equivalent predecessor target");
  }
}
function validateRawDistinctions(result: z.infer<typeof Intermediate>, governed: CanonicalizationKnowledge) {
  const required = new Set<string>();
  for (let first = 0; first < governed.raw_semantic_evidence.length; first++)
    for (let second = first + 1; second < governed.raw_semantic_evidence.length; second++) {
      const a = governed.raw_semantic_evidence[first]!; const b = governed.raw_semantic_evidence[second]!;
      if (a.semantic_role !== b.semantic_role) required.add([a.raw_concept_id, b.raw_concept_id].sort().join("|"));
    }
  const supplied = result.raw_distinction_justifications.map(({ first_raw_concept_id, second_raw_concept_id }) =>
    [first_raw_concept_id, second_raw_concept_id].sort().join("|"));
  if (supplied.length !== required.size || new Set(supplied).size !== supplied.length ||
      supplied.some((pair) => !required.has(pair))) throw new Error("Material raw-role distinctions are not justified");
}
