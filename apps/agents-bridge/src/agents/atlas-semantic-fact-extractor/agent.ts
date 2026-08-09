import {
  SemanticFactExtractionInputSchema,
  SemanticFactExtractionOutputSchema,
  SemanticFactIntermediateSchema,
  finalizeSemanticFacts,
} from "@company/ces-atlas-semantic-facts";
import { z } from "zod";
import type { StructuredGenerationPolicy, StructuredGenerationRequest } from "../../core/contracts.js";
import type { StructuredGenerationAgentDefinition } from "../../core/registry.js";

export const ATLAS_SEMANTIC_FACT_EXTRACTOR_ID = "atlas.semantic-fact-extractor" as const;
export const ATLAS_SEMANTIC_FACT_EXTRACTOR_VERSION = "2.0.0" as const;
type Input = z.infer<typeof SemanticFactExtractionInputSchema>;
type Intermediate = z.infer<typeof SemanticFactIntermediateSchema>;
type Output = z.infer<typeof SemanticFactExtractionOutputSchema>;

export function createAtlasSemanticFactExtractor(options: {
  model_alias: string; provider_id: string;
  policy: Partial<Pick<StructuredGenerationPolicy, "timeout_ms" | "max_attempts"
    | "max_input_bytes" | "max_output_bytes" | "max_output_tokens">>;
}): StructuredGenerationAgentDefinition<Input, Intermediate, Output> {
  const policy: StructuredGenerationPolicy = {
    allowed_providers: [options.provider_id], allowed_model_aliases: [options.model_alias],
    allowed_tools: [], timeout_ms: options.policy.timeout_ms ?? 90_000,
    max_attempts: options.policy.max_attempts ?? 3,
    max_input_bytes: options.policy.max_input_bytes ?? 10_485_760,
    max_output_bytes: options.policy.max_output_bytes ?? 4_194_304,
    max_output_tokens: options.policy.max_output_tokens ?? 32_768,
    requires_structured_output: true, requires_human_review: true,
  };
  return {
    id: ATLAS_SEMANTIC_FACT_EXTRACTOR_ID,
    version: ATLAS_SEMANTIC_FACT_EXTRACTOR_VERSION,
    description: "Extract evidence-grounded semantic facts for Atlas V2 graph selection.",
    mode: "structured-generation", input_schema: SemanticFactExtractionInputSchema,
    intermediate_schema: SemanticFactIntermediateSchema,
    output_schema: SemanticFactExtractionOutputSchema, execution_policy: policy,
    buildExecutionRequest: (input) => buildSemanticFactRequest(input, options.model_alias, policy),
    transformResult: async (result, input) => finalizeSemanticFacts(input, result),
  };
}

export function buildSemanticFactRequest(input: Input, modelAlias: string,
  policy: StructuredGenerationPolicy): StructuredGenerationRequest {
  return {
    system_instructions: `Extract atomic semantic facts from this bounded source scope. Inspect every source unit in the request; an empty facts array is valid only when none contains a supported semantic fact. Return the top-level schema_version exactly as "2.0.0". Find modules, actors, activities and order, decisions, conditions and outcomes, rules, states and transitions, entities and relationships, dependencies, events, permissions, validations, audit actions, and nonfunctional requirements. Never assume the document supports a workflow. Preserve exact_statement and every term exactly as written in a cited source unit; never translate or paraphrase. Proposed multilingual equivalence remains pending human review. Do not choose graph types or create graph topology. Return JSON only.`,
    messages: [{ role: "user", content: JSON.stringify({ project_id: input.project_id,
      documents: input.documents, source_units: input.source_units }) }],
    response_json_schema: z.toJSONSchema(SemanticFactIntermediateSchema),
    model_alias: modelAlias, max_output_tokens: policy.max_output_tokens,
  };
}
