import {
  CandidateBusinessRuleSchema,
  CandidateRequirementSchema,
} from "@company/ces-greenfield-contracts";
import { z } from "zod";

const NonEmptyString = z.string().trim().min(1);
const TemporaryIdSchema = z.string().trim().regex(/^TMP-[A-Z]+-\d+$/u);

export const AtlasIntermediateSourceSchema = z.object({
  document_id: NonEmptyString,
  section: NonEmptyString.optional(),
  line_start: z.number().int().positive().optional(),
  line_end: z.number().int().positive().optional(),
}).strict().refine(
  ({ line_start, line_end }) =>
    line_start === undefined || line_end === undefined || line_end >= line_start,
  { message: "Source line_end must not precede line_start" },
);

const IntermediateInferenceSchema = z.object({
  origin: z.enum(["explicit", "inferred"]),
  confidence: z.number().min(0).max(1),
  review_status: z.enum(["candidate", "needs_confirmation"]),
}).strict();

export const AtlasIntermediateRequirementSchema = z.object({
  temporary_id: TemporaryIdSchema,
  proposed_logical_id: NonEmptyString,
  title: NonEmptyString,
  actor: CandidateRequirementSchema.shape.actor,
  operation: CandidateRequirementSchema.shape.operation,
  state_transition: CandidateRequirementSchema.shape.state_transition,
  source: AtlasIntermediateSourceSchema,
  inference: IntermediateInferenceSchema,
}).strict();

export const AtlasIntermediateBusinessRuleSchema = z.object({
  temporary_id: TemporaryIdSchema,
  proposed_logical_id: NonEmptyString,
  type: CandidateBusinessRuleSchema.shape.type,
  statement: NonEmptyString,
  source_requirement_ids: z.array(TemporaryIdSchema).min(1),
  source: AtlasIntermediateSourceSchema,
  inference: IntermediateInferenceSchema,
}).strict();

export const AtlasIntermediateUncertaintySchema = z.object({
  temporary_id: TemporaryIdSchema,
  severity: z.enum(["blocking", "high", "medium", "low"]),
  field: NonEmptyString,
  reason: NonEmptyString,
  affected_requirement_ids: z.array(TemporaryIdSchema).default([]),
}).strict();

export const AtlasIntermediateConflictSchema = z.object({
  temporary_id: TemporaryIdSchema,
  severity: z.enum(["blocking", "high", "medium", "low"]),
  statement: NonEmptyString,
  source_requirement_ids: z.array(TemporaryIdSchema).min(2),
}).strict();

export const AtlasIntermediateQuestionSchema = z.object({
  temporary_id: TemporaryIdSchema,
  question: NonEmptyString,
  affected_requirement_ids: z.array(TemporaryIdSchema).default([]),
  blocking: z.boolean(),
}).strict();

export const AtlasIntermediateExtractionSchema = z.object({
  candidate_requirements: z.array(AtlasIntermediateRequirementSchema).default([]),
  candidate_business_rules: z.array(AtlasIntermediateBusinessRuleSchema).default([]),
  uncertainties: z.array(AtlasIntermediateUncertaintySchema).default([]),
  conflicts: z.array(AtlasIntermediateConflictSchema).default([]),
  clarification_questions: z.array(AtlasIntermediateQuestionSchema).default([]),
}).strict();

export type AtlasIntermediateExtraction = z.infer<typeof AtlasIntermediateExtractionSchema>;
