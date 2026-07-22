import { z } from "zod";

export const CAPABILITY_REGISTRY_VERSION = "0.1.0" as const;
export const TRAIT_REGISTRY_VERSION = "0.1.0" as const;

export const CapabilityIdSchema = z.enum([
  "PROFILE_MANAGEMENT",
  "FILE_UPLOAD",
  "IMAGE_PROCESSING",
]);

export const TraitIdSchema = z.enum([
  "AUTHENTICATED_ACTOR",
  "EXTERNAL_INPUT",
  "BINARY_DATA",
  "USER_OWNED_RESOURCE",
  "PERSISTENT_DATA",
  "REPLACEABLE_RESOURCE",
  "BROWSER_RENDERED_CONTENT",
]);

export const FactPredicateSchema = z
  .object({
    path: z.string().trim().min(1),
    operator: z.enum(["equals", "exists", "includes"]),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .strict();

export const ResolutionRuleSchema = z
  .object({
    id: z.string().trim().min(1),
    target_kind: z.enum(["capability", "trait"]),
    target_id: z.string().trim().min(1),
    all: z.array(FactPredicateSchema).min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

export type CapabilityId = z.infer<typeof CapabilityIdSchema>;
export type TraitId = z.infer<typeof TraitIdSchema>;
export type FactPredicate = z.infer<typeof FactPredicateSchema>;
export type ResolutionRule = z.infer<typeof ResolutionRuleSchema>;

export interface CapabilityTraitRegistry {
  readonly capability_registry_version: string;
  readonly trait_registry_version: string;
  readonly capabilities: readonly CapabilityId[];
  readonly traits: readonly TraitId[];
  readonly rules: readonly ResolutionRule[];
}

export const defaultCapabilityTraitRegistry: CapabilityTraitRegistry = {
  capability_registry_version: CAPABILITY_REGISTRY_VERSION,
  trait_registry_version: TRAIT_REGISTRY_VERSION,
  capabilities: [...CapabilityIdSchema.options],
  traits: [...TraitIdSchema.options],
  rules: [
    {
      id: "CAP-FILE-001",
      target_kind: "capability",
      target_id: "FILE_UPLOAD",
      all: [{ path: "inputs.*.type", operator: "equals", value: "binary_file" }],
      reason: "A binary file enters the system",
    },
    {
      id: "CAP-IMAGE-001",
      target_kind: "capability",
      target_id: "IMAGE_PROCESSING",
      all: [{ path: "inputs.*.media_category", operator: "equals", value: "image" }],
      reason: "An input is categorized as image media",
    },
    {
      id: "CAP-PROFILE-001",
      target_kind: "capability",
      target_id: "PROFILE_MANAGEMENT",
      all: [{ path: "operation.resource", operator: "equals", value: "profile_picture" }],
      reason: "The operation manages a profile resource",
    },
    {
      id: "TRAIT-AUTH-001",
      target_kind: "trait",
      target_id: "AUTHENTICATED_ACTOR",
      all: [{ path: "actor.type", operator: "equals", value: "authenticated_user" }],
      reason: "The actor is authenticated",
    },
    {
      id: "TRAIT-BINARY-001",
      target_kind: "trait",
      target_id: "BINARY_DATA",
      all: [{ path: "inputs.*.type", operator: "equals", value: "binary_file" }],
      reason: "The requirement accepts binary data",
    },
    {
      id: "TRAIT-BROWSER-001",
      target_kind: "trait",
      target_id: "BROWSER_RENDERED_CONTENT",
      all: [{ path: "inputs.*.media_category", operator: "equals", value: "image" }],
      reason: "The image resource can be rendered by a browser",
    },
    {
      id: "TRAIT-EXTERNAL-001",
      target_kind: "trait",
      target_id: "EXTERNAL_INPUT",
      all: [{ path: "inputs.*.type", operator: "exists" }],
      reason: "The operation accepts input from outside its trust boundary",
    },
    {
      id: "TRAIT-OWNED-001",
      target_kind: "trait",
      target_id: "USER_OWNED_RESOURCE",
      all: [{ path: "operation.target_scope", operator: "equals", value: "own_resource" }],
      reason: "The target scope is the actor's own resource",
    },
    {
      id: "TRAIT-PERSIST-001",
      target_kind: "trait",
      target_id: "PERSISTENT_DATA",
      all: [{ path: "effects", operator: "includes", value: "persistent_write" }],
      reason: "The operation performs a persistent write",
    },
    {
      id: "TRAIT-REPLACE-001",
      target_kind: "trait",
      target_id: "REPLACEABLE_RESOURCE",
      all: [{ path: "effects", operator: "includes", value: "replaces_existing_resource" }],
      reason: "The operation replaces an existing resource",
    },
  ].map((rule) => ResolutionRuleSchema.parse(rule)),
};
