import { PolicyKnowledgeAgentRequestSchema, PolicyKnowledgeProposalSchema,
  createPolicyKnowledgeProposal } from "@company/ces-policy-knowledge-proposals";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { StructuredGenerationPolicy, StructuredGenerationRequest } from "../../core/contracts.js";
import type { StructuredGenerationAgentDefinition } from "../../core/registry.js";
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Text = z.string().trim().min(1);
export const SOURCE_KNOWLEDGE_AGENT_ID = "ces.source-knowledge-agent";
export const SourceKnowledgeAgentInputSchema = z.object({ request: PolicyKnowledgeAgentRequestSchema }).strict()
  .superRefine((value, context) => { if (value.request.request.layer !== "raw_source_vocabulary")
    context.addIssue({ code: "custom", message: "Source agent requires EXTRACTION_GAP" }); });
const Intermediate = z.object({ decision: z.enum(["ADD", "REJECT"]),
  proposed_raw_concept_id: Id, bounded_meaning: Text, source_release_id: Id,
  source_locator: Text, semantic_rationale: Text }).strict();
type Input = z.infer<typeof SourceKnowledgeAgentInputSchema>;
export interface GovernedSourceCandidate { source_release_id: string; source_locator: string;
  source_term: string; exact_source_excerpt: string; semantic_role: "objective" | "control" | "requirement" |
  "risk_concern" | "verification_context" | "evidence_expectation"; scope_disposition: "software_relevant" |
  "out_of_scope_organizational" | "review_required"; governed_source_artifact_id: string;
  governed_source_content_hash: string; predecessor_artifact_id: string; predecessor_artifact_hash: string;
  rights_evidence_id: string; authorization_evidence_id: string; equivalent_predecessor_concept_id: string | null }
export type GovernedSourceResolver = (request: Input["request"]) => GovernedSourceCandidate;
export function createSourceKnowledgeAgent(options: { model_alias: string; provider_id: string;
  resolve_governed_source: GovernedSourceResolver; policy: Partial<Pick<StructuredGenerationPolicy,
  "timeout_ms" | "max_attempts" | "max_input_bytes" | "max_output_bytes" | "max_output_tokens">> }):
  StructuredGenerationAgentDefinition<Input, z.infer<typeof Intermediate>,
  z.infer<typeof PolicyKnowledgeProposalSchema>> {
  const policy: StructuredGenerationPolicy = { allowed_providers: [options.provider_id],
    allowed_model_aliases: [options.model_alias], allowed_tools: [], timeout_ms: options.policy.timeout_ms ?? 90_000,
    max_attempts: options.policy.max_attempts ?? 3, max_input_bytes: options.policy.max_input_bytes ?? 1_048_576,
    max_output_bytes: options.policy.max_output_bytes ?? 1_048_576,
    max_output_tokens: options.policy.max_output_tokens ?? 8_192,
    requires_structured_output: true, requires_human_review: true };
  return { id: SOURCE_KNOWLEDGE_AGENT_ID, version: "1.0.0", description: "Propose one bounded raw CES source concept.",
    mode: "structured-generation", input_schema: SourceKnowledgeAgentInputSchema,
    intermediate_schema: Intermediate, output_schema: PolicyKnowledgeProposalSchema,
    execution_policy: policy, buildExecutionRequest: (input) => request(input,
      options.resolve_governed_source(input.request), options.model_alias, policy),
    transformResult: async (result, input) => {
      const source = options.resolve_governed_source(input.request);
      const expectedDecision = source.equivalent_predecessor_concept_id ? "REJECT" : "ADD";
      if (result.decision !== expectedDecision ||
          result.source_release_id !== source.source_release_id || result.source_locator !== source.source_locator ||
          normalize(result.bounded_meaning) !== normalize(source.exact_source_excerpt)) throw new Error("Source proposal is not governed-equivalent");
      return createPolicyKnowledgeProposal({ schema_version: "1.0.0",
        proposal_id: `proposal.${input.request.request_id}`, lifecycle: "proposed",
        governed_context: input.request.governed_context,
        proposal: { layer: "raw_source_vocabulary", gap_route: "EXTRACTION_GAP", ...result,
          extraction_evidence: { schema_version: "1.1.0",
            governed_source_artifact_id: source.governed_source_artifact_id,
            governed_source_content_hash: source.governed_source_content_hash,
            exact_source_term: source.source_term,
            exact_source_excerpt_hash: digest(source.exact_source_excerpt), semantic_role: source.semantic_role,
            scope_disposition: source.scope_disposition, extraction_method: "agent_assisted",
            extractor_id: SOURCE_KNOWLEDGE_AGENT_ID, extractor_version: "1.0.0",
            extraction_input_hash: source.governed_source_content_hash,
            predecessor_artifact_id: source.predecessor_artifact_id,
            predecessor_artifact_hash: source.predecessor_artifact_hash,
            rights_evidence_id: source.rights_evidence_id,
            authorization_evidence_id: source.authorization_evidence_id } } });
    } };
}
function request(input: Input, source: GovernedSourceCandidate, alias: string,
  policy: StructuredGenerationPolicy): StructuredGenerationRequest { return {
  system_instructions: "Extract only the supplied authorized governed source candidate. Preserve its exact release, locator, and bounded meaning. Use REJECT when equivalent raw knowledge exists. Do not generalize to a project, canonicalize, create Policy, claim acceptance, or use outside sources. Return JSON only.",
  messages: [{ role: "user", content: JSON.stringify({ bounded_task:
    input.request.request.layer === "raw_source_vocabulary" ? input.request.request.bounded_task : "",
    governed_source: source }) }], response_json_schema: z.toJSONSchema(Intermediate),
  model_alias: alias, max_output_tokens: policy.max_output_tokens }; }
function normalize(value: string) { return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim(); }
function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
