import { z } from "zod";

export const POLICY_MANIFEST_SCHEMA_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);

export const ResolutionEvidenceSchema = z
  .object({
    path: NonEmptyString,
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  })
  .strict();

export const ResolvedVocabularyItemSchema = z
  .object({
    id: NonEmptyString,
    source: z.enum(["resolver_rule", "assertion"]),
    rule_id: NonEmptyString.optional(),
    evidence: z.array(ResolutionEvidenceSchema).default([]),
    reason: NonEmptyString,
    registry_version: NonEmptyString,
  })
  .strict();

export const PolicyRequirementLevelSchema = z.enum([
  "mandatory",
  "conditional",
  "prohibited",
]);

export const PolicyResolutionStateSchema = z.enum([
  "resolved",
  "blocked",
  "conflict",
]);

export const PolicyObligationSchema = z
  .object({
    policy_id: NonEmptyString,
    requirement_level: PolicyRequirementLevelSchema,
    resolution_state: PolicyResolutionStateSchema,
    parameters: z.record(z.string(), z.unknown()).default({}),
    reasons: z.array(NonEmptyString).min(1),
    evidence: z.array(ResolutionEvidenceSchema).default([]),
    source_rule_ids: z.array(NonEmptyString).default([]),
    business_rule_ids: z.array(NonEmptyString).default([]),
    missing_inputs: z.array(NonEmptyString).default([]),
  })
  .strict();

export const PolicyManifestSchema = z
  .object({
    schema_version: z.literal(POLICY_MANIFEST_SCHEMA_VERSION),
    compilation_id: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    input_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    requirement_id: NonEmptyString,
    ces_baseline_version: NonEmptyString,
    capability_registry_version: NonEmptyString,
    capability_registry_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    trait_registry_version: NonEmptyString,
    trait_registry_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    policy_registry_version: NonEmptyString,
    policy_registry_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    resolved_capabilities: z.array(ResolvedVocabularyItemSchema).default([]),
    resolved_traits: z.array(ResolvedVocabularyItemSchema).default([]),
    obligations: z.array(PolicyObligationSchema).default([]),
  })
  .strict();

export type PolicyManifest = z.infer<typeof PolicyManifestSchema>;
export type PolicyObligation = z.infer<typeof PolicyObligationSchema>;
export type ResolutionEvidence = z.infer<typeof ResolutionEvidenceSchema>;
export type ResolvedVocabularyItem = z.infer<
  typeof ResolvedVocabularyItemSchema
>;
