import {
  SemanticFactExtractionInputSchema,
  SemanticFactExtractionOutputSchema,
  finalizeSemanticFacts,
} from "@company/ces-atlas-semantic-facts";
import { z } from "zod";
import type { StructuredGenerationPolicy, StructuredGenerationRequest } from "../../core/contracts.js";
import type { StructuredGenerationAgentDefinition } from "../../core/registry.js";

export const ATLAS_PROJECT_RELATIONSHIP_EXTRACTOR_ID =
  "atlas.project-relationship-extractor" as const;
export const ATLAS_PROJECT_RELATIONSHIP_EXTRACTOR_VERSION = "2.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const IntermediateSchema = z.object({ schema_version: z.literal("2.0.0"),
  relations: z.array(z.object({ candidate_id: Id,
    kind: z.enum(["dependency", "activity_order"]),
    source_heading_unit_id: Id, target_heading_unit_id: Id,
    evidence_source_unit_id: Id, relation_kind: Id.optional(),
    confidence: z.number().min(0).max(1) }).strict()) }).strict();
type Input = z.infer<typeof SemanticFactExtractionInputSchema>;
type Intermediate = z.infer<typeof IntermediateSchema>;
type Output = z.infer<typeof SemanticFactExtractionOutputSchema>;

export function createAtlasProjectRelationshipExtractor(options: {
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
  return { id: ATLAS_PROJECT_RELATIONSHIP_EXTRACTOR_ID,
    version: ATLAS_PROJECT_RELATIONSHIP_EXTRACTOR_VERSION,
    description: "Map evidenced project relationships between exact section heading units.",
    mode: "structured-generation", input_schema: SemanticFactExtractionInputSchema,
    intermediate_schema: IntermediateSchema, output_schema: SemanticFactExtractionOutputSchema,
    execution_policy: policy,
    buildExecutionRequest: (input) => buildRequest(input, options.model_alias, policy),
    transformResult: async (result, input) => transform(result, input) };
}

function buildRequest(input: Input, modelAlias: string,
  policy: StructuredGenerationPolicy): StructuredGenerationRequest {
  return { system_instructions: `Identify only project-level relationships between source units whose kind is "heading". Return heading source-unit IDs, never generated endpoint labels. Use activity_order only when the evidence explicitly establishes sequence; otherwise use dependency for contribution, prerequisite, reporting, recording, or information flow. evidence_source_unit_id must identify one supplied non-heading unit that directly supports the relation. Do not return relations based only on heading proximity. Return JSON only.`,
    messages: [{ role: "user", content: JSON.stringify({ project_id: input.project_id,
      source_units: input.source_units }) }],
    response_json_schema: z.toJSONSchema(IntermediateSchema), model_alias: modelAlias,
    max_output_tokens: policy.max_output_tokens };
}

function transform(result: Intermediate, input: Input): Output {
  const units = new Map(input.source_units.map((unit) => [unit.id, unit]));
  const facts = result.relations.flatMap((relation) => {
    const source = units.get(relation.source_heading_unit_id);
    const target = units.get(relation.target_heading_unit_id);
    const evidence = units.get(relation.evidence_source_unit_id);
    if (!source || source.kind !== "heading" || !target || target.kind !== "heading"
      || source.id === target.id || !evidence || evidence.kind === "heading"
      || evidence.kind === "caption") return [];
    return [{ candidate_id: relation.candidate_id, kind: relation.kind,
      exact_statement: evidence.exact_text,
      source_unit_ids: [source.id, target.id, evidence.id],
      terms: [{ role_id: "source", exact_text: source.text },
        { role_id: "target", exact_text: target.text }],
      ...(relation.relation_kind ? { relation_kind: relation.relation_kind } : {}),
      confidence: relation.confidence }];
  });
  return finalizeSemanticFacts(input, { schema_version: "2.0.0", facts });
}
