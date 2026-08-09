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
    transformResult: async (result, input) => finalizeSemanticFacts(input,
      input.extraction_focus !== "all" ? { ...result,
        facts: result.facts.filter(({ kind }) => kind === "dependency" || kind === "activity_order") }
        : result),
  };
}

export function buildSemanticFactRequest(input: Input, modelAlias: string,
  policy: StructuredGenerationPolicy): StructuredGenerationRequest {
  const focus = input.extraction_focus !== "all"
    ? `Extract only project-level relationships between the supplied section headings. Every returned fact.kind MUST be exactly "dependency" or "activity_order"; return an empty facts array rather than any other kind. Use dependency for information, contribution, prerequisite, reporting, or recording links and activity_order only for evidenced sequence. Each source and target term MUST be copied exactly from the text field of a heading source unit, using role_id "source" and "target". Cite both endpoint heading units and one source unit containing the relationship evidence. exact_statement MUST be a verbatim contiguous quote copied from that cited source unit; never compose a new sentence, arrow expression, summary, or translation. Never use an activity phrase, actor, state, rule, or outcome as an endpoint. Do not return modules, actors, activities, entities, states, rules, validations, permissions, audit actions, or requirements.${input.extraction_focus === "relationships_retry" ? ` A previous response was rejected for non-exact wording. Recheck every character of exact_statement and both heading terms before returning.` : ""}`
    : `Find modules, actors, activities and order, decisions, conditions and outcomes, rules, states and transitions, entities and relationships, dependencies, events, permissions, validations, audit actions, and nonfunctional requirements.`;
  return {
    system_instructions: `Extract atomic semantic facts from this bounded source scope. Inspect every source unit in the request; an empty facts array is valid only when none contains a supported semantic fact. Return the top-level schema_version exactly as "2.0.0". ${focus} Never assume the document supports a workflow. Preserve exact_statement and every term exactly as written in a cited source unit; never translate or paraphrase. Proposed multilingual equivalence remains pending human review. Do not choose graph types or create graph topology. Return JSON only.`,
    messages: [{ role: "user", content: JSON.stringify({ project_id: input.project_id,
      documents: input.documents, source_units: input.source_units,
      extraction_focus: input.extraction_focus }) }],
    response_json_schema: z.toJSONSchema(SemanticFactIntermediateSchema),
    model_alias: modelAlias, max_output_tokens: policy.max_output_tokens,
  };
}
