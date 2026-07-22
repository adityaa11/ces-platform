import { BusinessRuleSchema } from "@company/ces-business-rule-schema";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const REQUIREMENT_SCHEMA_VERSION = "1.0.0" as const;

export const RequirementSourceSchema = z
  .object({
    document_id: z.string().trim().min(1).optional(),
    document_version: z.string().trim().min(1).optional(),
    section: z.string().trim().min(1).optional(),
    change_request_id: z.string().trim().min(1).optional(),
    parent_requirement_ids: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const RequirementConstraintSchema = z
  .object({
    allowed_media_types: z.array(z.string().trim().min(1)).default([]),
    maximum_size_bytes: z.number().int().positive().optional(),
  })
  .strict();

export const RequirementInputSchema = z
  .object({
    name: z.string().trim().min(1),
    type: z.string().trim().min(1),
    media_category: z.string().trim().min(1).optional(),
    constraints: RequirementConstraintSchema.optional(),
  })
  .strict();

export const RequirementUncertaintySchema = z
  .object({
    field: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

export const RequirementPackageSchema = z
  .object({
    schema_version: z.literal(REQUIREMENT_SCHEMA_VERSION),
    requirement: z
      .object({
        id: z.string().trim().min(1),
        title: z.string().trim().min(1),
      })
      .strict(),
    source: RequirementSourceSchema.optional(),
    actor: z
      .object({
        type: z.string().trim().min(1),
      })
      .strict(),
    operation: z
      .object({
        action: z.string().trim().min(1),
        resource: z.string().trim().min(1),
        target_scope: z.string().trim().min(1).optional(),
      })
      .strict(),
    inputs: z.array(RequirementInputSchema).default([]),
    outputs: z.array(z.string().trim().min(1)).default([]),
    effects: z.array(z.string().trim().min(1)).default([]),
    business_rules: z.array(BusinessRuleSchema).default([]),
    uncertainties: z.array(RequirementUncertaintySchema).default([]),
    asserted_capabilities: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export type RequirementPackage = z.infer<typeof RequirementPackageSchema>;
export type RequirementSource = z.infer<typeof RequirementSourceSchema>;
export type PolicyRelevantRequirement = Omit<RequirementPackage, "source">;

export function parseRequirementPackage(value: unknown): RequirementPackage {
  return RequirementPackageSchema.parse(value);
}

export function getPolicyRelevantRequirement(
  requirement: RequirementPackage,
): PolicyRelevantRequirement {
  const { source, ...policyRelevant } = requirement;
  void source;
  return policyRelevant;
}

export function parseRequirementText(
  text: string,
  format: "json" | "yaml",
): RequirementPackage {
  const parsed: unknown = format === "json" ? JSON.parse(text) : parseYaml(text);
  return parseRequirementPackage(parsed);
}
