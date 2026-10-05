import { z } from "zod";
import { FIXED_SECTIONS } from "./prompt-fixed-sections.mts";
import { REQUIRED_SEMANTIC_FIELDS, SemanticPromptSchema } from "./semantic-schema.mts";
import { resolveLocalRef, schemaType, type JsonSchema } from "./json-schema.mts";

function asObject(value: unknown, message: string): JsonSchema {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as JsonSchema;
}

function objectProperties(schema: JsonSchema, root: JsonSchema): Record<string, JsonSchema> {
  const resolved = resolveLocalRef(schema, root);
  return asObject(resolved.properties, "Expected JSON Schema object properties") as Record<string, JsonSchema>;
}

function exampleFor(schema: JsonSchema, root: JsonSchema): unknown {
  const resolved = resolveLocalRef(schema, root);
  if (resolved.type === "object") return Object.fromEntries(Object.entries(objectProperties(resolved, root)).map(([key, property]) => [key, exampleFor(property, root)]));
  if (resolved.type === "array") return [exampleFor(asObject(resolved.items, "Array schema has no items"), root)];
  return schemaType(resolved, root);
}

export function assertDescriptionCompleteness(jsonSchema: JsonSchema): void {
  const rootProperties = objectProperties(jsonSchema, jsonSchema);
  const sourceResult = resolveLocalRef(asObject(rootProperties.source_results, "Missing source_results schema").items, jsonSchema);
  const unit = resolveLocalRef(asObject(objectProperties(sourceResult, jsonSchema).semantic_units, "Missing semantic_units schema").items, jsonSchema);
  if (typeof unit.description !== "string" || !unit.description.trim()) throw new Error("Missing required SemanticUnit object-level description");
  const properties = objectProperties(unit, jsonSchema);
  for (const field of REQUIRED_SEMANTIC_FIELDS) {
    if (typeof properties[field]?.description !== "string" || !String(properties[field].description).trim()) throw new Error(`Missing required semantic description: ${field}`);
  }
}

export function buildSemanticSystemPrompt(jsonSchema: JsonSchema): string {
  assertDescriptionCompleteness(jsonSchema);
  const rootProperties = objectProperties(jsonSchema, jsonSchema);
  const sourceResult = resolveLocalRef(asObject(rootProperties.source_results, "Missing source_results schema").items, jsonSchema);
  const unit = resolveLocalRef(asObject(objectProperties(sourceResult, jsonSchema).semantic_units, "Missing semantic_units schema").items, jsonSchema);
  const definitions = Object.entries(objectProperties(unit, jsonSchema)).map(([field, property]) => `${field}\n\n${resolveLocalRef(property, jsonSchema).description}`).join("\n\n");
  const sections = [
    ["SYSTEM ROLE", FIXED_SECTIONS["SYSTEM ROLE"]],
    ["TASK INSTRUCTION", FIXED_SECTIONS["TASK INSTRUCTION"]],
    ["OUTPUT SHAPE", `Return exactly one JSON object:\n\n${JSON.stringify(exampleFor(jsonSchema, jsonSchema), null, 2)}`],
    ["FIELD DEFINITIONS", definitions],
    ["SEMANTIC UNIT RULES", unit.description as string],
    ["REFERENCE HANDLING", FIXED_SECTIONS["REFERENCE HANDLING"]],
    ["MULTIPLE-UNIT HANDLING", FIXED_SECTIONS["MULTIPLE-UNIT HANDLING"]],
    ["CONFLICT HANDLING", FIXED_SECTIONS["CONFLICT HANDLING"]],
    ["GENERAL RULES", FIXED_SECTIONS["GENERAL RULES"]],
    ["SOURCE ACCOUNTING", FIXED_SECTIONS["SOURCE ACCOUNTING"]],
    ["OUTPUT RULES", FIXED_SECTIONS["OUTPUT RULES"]],
  ] as const;
  return sections.map(([heading, content]) => `${heading}\n\n${content}`).join("\n\n");
}

export function buildPromptFromZod(schema = SemanticPromptSchema): { jsonSchema: JsonSchema; prompt: string } {
  const jsonSchema = z.toJSONSchema(schema) as JsonSchema;
  return { jsonSchema, prompt: buildSemanticSystemPrompt(jsonSchema) };
}
