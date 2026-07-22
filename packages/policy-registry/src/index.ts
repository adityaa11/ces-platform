import {
  CapabilityIdSchema,
  TraitIdSchema,
} from "@company/ces-capability-registry";
import { z } from "zod";

export const POLICY_REGISTRY_VERSION = "0.1.0" as const;

export const PolicyIdSchema = z.enum([
  "INPUT_VALIDATION",
  "RESOURCE_LEVEL_AUTHORIZATION",
  "FILE_SIZE_LIMIT",
  "FILE_CONTENT_VERIFICATION",
  "SERVER_GENERATED_STORAGE_KEY",
  "SAFE_IMAGE_DELIVERY",
  "ATOMIC_RESOURCE_REPLACEMENT",
  "REPLACED_RESOURCE_LIFECYCLE",
  "SAFE_LOGGING",
]);

export const PolicyDefinitionSchema = z
  .object({
    id: PolicyIdSchema,
    category: z.enum(["security", "consistency", "lifecycle"]),
    requires: z.array(PolicyIdSchema).default([]),
  })
  .strict();

export const PolicyParameterBindingSchema = z
  .object({
    name: z.string().trim().min(1),
    fact_path: z.string().trim().min(1),
    required: z.boolean().default(false),
  })
  .strict();

export const PolicyRuleSchema = z
  .object({
    id: z.string().trim().min(1),
    when: z
      .object({
        capability: CapabilityIdSchema.optional(),
        trait: TraitIdSchema.optional(),
        assurance_path: z.string().trim().min(1).optional(),
        assurance_equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
      })
      .strict(),
    policy_id: PolicyIdSchema,
    requirement_level: z.enum(["mandatory", "conditional", "prohibited"]),
    reason: z.string().trim().min(1),
    parameters: z.array(PolicyParameterBindingSchema).default([]),
    required_business_rule_type: z.string().trim().min(1).optional(),
  })
  .strict();

export type PolicyId = z.infer<typeof PolicyIdSchema>;
export type PolicyDefinition = z.infer<typeof PolicyDefinitionSchema>;
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export interface PolicyRegistry {
  readonly version: string;
  readonly definitions: readonly PolicyDefinition[];
  readonly rules: readonly PolicyRule[];
}

export const defaultPolicyRegistry: PolicyRegistry = {
  version: POLICY_REGISTRY_VERSION,
  definitions: [
    { id: "INPUT_VALIDATION", category: "security", requires: [] },
    { id: "RESOURCE_LEVEL_AUTHORIZATION", category: "security", requires: [] },
    { id: "FILE_SIZE_LIMIT", category: "security", requires: ["INPUT_VALIDATION"] },
    { id: "FILE_CONTENT_VERIFICATION", category: "security", requires: ["INPUT_VALIDATION"] },
    { id: "SERVER_GENERATED_STORAGE_KEY", category: "security", requires: [] },
    { id: "SAFE_IMAGE_DELIVERY", category: "security", requires: [] },
    { id: "ATOMIC_RESOURCE_REPLACEMENT", category: "consistency", requires: [] },
    { id: "REPLACED_RESOURCE_LIFECYCLE", category: "lifecycle", requires: [] },
    { id: "SAFE_LOGGING", category: "security", requires: [] },
  ].map((definition) => PolicyDefinitionSchema.parse(definition)),
  rules: [
    {
      id: "POL-AUTH-001",
      when: { trait: "USER_OWNED_RESOURCE" },
      policy_id: "RESOURCE_LEVEL_AUTHORIZATION",
      requirement_level: "mandatory",
      reason: "Trait USER_OWNED_RESOURCE requires authorization against the target resource",
    },
    {
      id: "POL-CONSISTENCY-001",
      when: { trait: "REPLACEABLE_RESOURCE" },
      policy_id: "ATOMIC_RESOURCE_REPLACEMENT",
      requirement_level: "mandatory",
      reason: "Trait REPLACEABLE_RESOURCE requires atomic replacement",
    },
    {
      id: "POL-FILE-001",
      when: { capability: "FILE_UPLOAD" },
      policy_id: "FILE_SIZE_LIMIT",
      requirement_level: "mandatory",
      reason: "Capability FILE_UPLOAD requires an explicit size limit",
      parameters: [
        {
          name: "maximum_bytes",
          fact_path: "inputs.*.constraints.maximum_size_bytes",
          required: true,
        },
      ],
    },
    {
      id: "POL-FILE-002",
      when: { capability: "FILE_UPLOAD" },
      policy_id: "FILE_CONTENT_VERIFICATION",
      requirement_level: "mandatory",
      reason: "Capability FILE_UPLOAD requires verification of actual file content",
    },
    {
      id: "POL-FILE-003",
      when: { capability: "FILE_UPLOAD" },
      policy_id: "SERVER_GENERATED_STORAGE_KEY",
      requirement_level: "mandatory",
      reason: "Capability FILE_UPLOAD requires a trusted storage key",
    },
    {
      id: "POL-IMAGE-001",
      when: { capability: "IMAGE_PROCESSING" },
      policy_id: "SAFE_IMAGE_DELIVERY",
      requirement_level: "conditional",
      reason: "Capability IMAGE_PROCESSING may produce browser-delivered content",
    },
    {
      id: "POL-IMAGE-PUBLIC-001",
      when: {
        capability: "IMAGE_PROCESSING",
        assurance_path: "exposure",
        assurance_equals: "public_internet",
      },
      policy_id: "SAFE_IMAGE_DELIVERY",
      requirement_level: "mandatory",
      reason: "Public internet exposure requires safe image delivery",
    },
    {
      id: "POL-INPUT-001",
      when: { trait: "EXTERNAL_INPUT" },
      policy_id: "INPUT_VALIDATION",
      requirement_level: "mandatory",
      reason: "Trait EXTERNAL_INPUT requires input validation",
    },
    {
      id: "POL-LIFECYCLE-001",
      when: { trait: "REPLACEABLE_RESOURCE" },
      policy_id: "REPLACED_RESOURCE_LIFECYCLE",
      requirement_level: "mandatory",
      reason: "Trait REPLACEABLE_RESOURCE requires an explicit lifecycle rule",
      required_business_rule_type: "lifecycle",
    },
    {
      id: "POL-LOG-001",
      when: { trait: "EXTERNAL_INPUT" },
      policy_id: "SAFE_LOGGING",
      requirement_level: "mandatory",
      reason: "Trait EXTERNAL_INPUT requires safe logging",
    },
  ].map((rule) => PolicyRuleSchema.parse(rule)),
};
