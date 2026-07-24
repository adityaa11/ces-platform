import { BusinessRuleTypeSchema } from "@company/ces-business-rule-schema";
import {
  ActorTypeSchema,
  OperationActionSchema,
  RequirementStateTransitionSchema,
  ResourceTypeSchema,
  TargetScopeSchema,
} from "@company/ces-requirement-schema";
import { z } from "zod";

export const GREENFIELD_CONTRACT_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const SourceReferenceSchema = z
  .object({
    document_id: NonEmptyString,
    path: NonEmptyString,
    section: NonEmptyString.optional(),
    line_start: z.number().int().positive().optional(),
    line_end: z.number().int().positive().optional(),
    content_hash: Sha256Schema,
  })
  .strict()
  .refine(
    ({ line_start, line_end }) =>
      line_start === undefined || line_end === undefined || line_end >= line_start,
    { message: "Source reference line_end must not precede line_start" },
  );

export const ArtifactOriginSchema = z.enum([
  "explicit",
  "inferred",
  "confirmed",
  "derived",
  "observed",
]);

export const ReviewStatusSchema = z.enum([
  "candidate",
  "needs_confirmation",
  "approved",
  "superseded",
  "rejected",
]);

export const InferenceMetadataSchema = z
  .object({
    origin: ArtifactOriginSchema,
    confidence: z.number().min(0).max(1),
    agent: z
      .object({
        provider: NonEmptyString,
        model: NonEmptyString,
        prompt_contract_version: NonEmptyString,
      })
      .strict(),
    review: z
      .object({
        status: ReviewStatusSchema,
      })
      .strict(),
  })
  .strict();

export const CandidateRequirementSchema = z
  .object({
    schema_version: z.literal(GREENFIELD_CONTRACT_VERSION),
    candidate_id: NonEmptyString,
    proposed_logical_id: NonEmptyString,
    title: NonEmptyString,
    actor: z.object({ type: ActorTypeSchema }).strict(),
    operation: z
      .object({
        action: OperationActionSchema,
        resource: ResourceTypeSchema,
        target_scope: TargetScopeSchema.optional(),
      })
      .strict(),
    state_transition: RequirementStateTransitionSchema.optional(),
    source: SourceReferenceSchema,
    inference: InferenceMetadataSchema,
  })
  .strict();

export const CandidateBusinessRuleSchema = z
  .object({
    schema_version: z.literal(GREENFIELD_CONTRACT_VERSION),
    candidate_id: NonEmptyString,
    proposed_logical_id: NonEmptyString,
    type: BusinessRuleTypeSchema,
    statement: NonEmptyString,
    source_requirement_ids: z.array(NonEmptyString).min(1),
    source: SourceReferenceSchema,
    inference: InferenceMetadataSchema,
  })
  .strict();

export const ReviewDecisionSchema = z
  .object({
    schema_version: z.literal(GREENFIELD_CONTRACT_VERSION),
    candidate_id: NonEmptyString,
    candidate_revision_hash: Sha256Schema,
    source_revision_hash: Sha256Schema,
    decision: z.enum(["approved", "rejected", "corrected", "superseded", "deferred"]),
    decided_by: NonEmptyString,
    correction: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    ({ decision, correction }) =>
      decision === "corrected" ? correction !== undefined : correction === undefined,
    { message: "Only corrected decisions may contain correction fields" },
  );

export const RequirementRelationshipSchema = z.enum([
  "affects",
  "conflicts_with",
  "constrains",
  "depends_on",
  "duplicates",
  "implements",
  "refines",
  "supersedes",
  "verified_by",
]);

export const RequirementLinkSchema = z
  .object({
    source_id: NonEmptyString,
    target_id: NonEmptyString,
    relationship: RequirementRelationshipSchema,
    reason: NonEmptyString,
  })
  .strict()
  .refine(({ source_id, target_id }) => source_id !== target_id, {
    message: "A Requirement Link cannot target itself",
  });

export const ProjectIntentSchema = z
  .object({
    schema_version: z.literal(GREENFIELD_CONTRACT_VERSION),
    project: z
      .object({
        id: NonEmptyString,
        lifecycle: z.literal("greenfield"),
        application_type: z.enum([
          "transactional_web_application",
          "api_service",
          "background_processing_application",
        ]),
        business_domain: NonEmptyString,
      })
      .strict(),
    delivery: z
      .object({
        team_size: z.number().int().positive(),
        expected_delivery_months: z.number().int().positive(),
        deployment_preference: z.enum([
          "managed_cloud",
          "self_hosted",
          "undecided",
        ]),
      })
      .strict(),
    constraints: z
      .object({
        expected_users: z.number().int().positive(),
        data_sensitivity: z.enum(["public", "internal", "personal", "sensitive"]),
        multi_tenant: z.boolean(),
      })
      .strict(),
    skills: z
      .object({
        preferred_languages: z.array(NonEmptyString).default([]),
        preferred_databases: z.array(NonEmptyString).default([]),
      })
      .strict(),
  })
  .strict();

export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export type InferenceMetadata = z.infer<typeof InferenceMetadataSchema>;
export type CandidateRequirement = z.infer<typeof CandidateRequirementSchema>;
export type CandidateBusinessRule = z.infer<typeof CandidateBusinessRuleSchema>;
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
export type RequirementLink = z.infer<typeof RequirementLinkSchema>;
export type ProjectIntent = z.infer<typeof ProjectIntentSchema>;
