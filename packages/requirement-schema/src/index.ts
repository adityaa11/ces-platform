import { BusinessRuleSchema } from "@company/ces-business-rule-schema";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const REQUIREMENT_SCHEMA_VERSION = "1.0.0" as const;
export const REQUIREMENT_VOCABULARY_VERSION = "1.0.0" as const;

export const ActorTypeSchema = z.enum(["authenticated_user"]);
export const OperationActionSchema = z.enum(["replace"]);
export const ResourceTypeSchema = z.enum(["profile_picture"]);
export const TargetScopeSchema = z.enum(["own_resource"]);
export const InputTypeSchema = z.enum(["binary_file"]);
export const InputTrustBoundarySchema = z.enum(["external", "internal"]);
export const MediaCategorySchema = z.enum(["image"]);
export const MediaTypeSchema = z.enum(["image/jpeg", "image/png"]);
export const EffectSchema = z.enum(["persistent_write", "replaces_existing_resource"]);

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
    allowed_media_types: z.array(MediaTypeSchema).default([]),
    maximum_size_bytes: z.number().int().positive().optional(),
  })
  .strict();

export const RequirementInputSchema = z
  .object({
    name: z.string().trim().min(1),
    type: InputTypeSchema,
    trust_boundary: InputTrustBoundarySchema,
    media_category: MediaCategorySchema.optional(),
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
        type: ActorTypeSchema,
      })
      .strict(),
    operation: z
      .object({
        action: OperationActionSchema,
        resource: ResourceTypeSchema,
        target_scope: TargetScopeSchema.optional(),
      })
      .strict(),
    inputs: z.array(RequirementInputSchema).default([]),
    outputs: z.array(z.string().trim().min(1)).default([]),
    effects: z.array(EffectSchema).default([]),
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
