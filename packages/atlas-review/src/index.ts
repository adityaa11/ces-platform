import { createHash } from "node:crypto";
import {
  AtlasProviderResultSchema,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
import { CoverageReportSchema } from "@company/ces-atlas-coverage";
import {
  CandidateBusinessRuleSchema,
  CandidateRequirementSchema,
  ReviewDecisionSchema,
  type CandidateBusinessRule,
  type CandidateRequirement,
  type ReviewDecision,
} from "@company/ces-greenfield-contracts";
import {
  canonicalJson,
  createRequirementCollection,
  requirementRevisionHash,
  type RequirementCollection,
} from "@company/ces-requirement-collection-schema";
import {
  assertBulkApprovalSelection,
  BulkApprovalEligibilitySchema,
} from "@company/ces-proposed-project-model";
import {
  RequirementPackageSchema,
  type RequirementPackage,
} from "@company/ces-requirement-schema";
import { z } from "zod";

export const ATLAS_REVIEW_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const ClarificationAnswerSchema = z.object({
  question_id: NonEmptyString,
  answer: NonEmptyString,
  answered_by: NonEmptyString,
  source_revision_hash: Sha256Schema,
}).strict();

export const AtlasReviewInputSchema = z.object({
  collection_id: NonEmptyString,
  analysis: AtlasProviderResultSchema,
  decisions: z.array(ReviewDecisionSchema),
  clarification_answers: z.array(ClarificationAnswerSchema).default([]),
}).strict();

export type ClarificationAnswer = z.infer<typeof ClarificationAnswerSchema>;

export interface AtlasReviewReport {
  readonly schema_version: typeof ATLAS_REVIEW_VERSION;
  readonly status: "approved";
  readonly decision_hash: string;
  readonly approved_candidate_ids: readonly string[];
  readonly rejected_candidate_ids: readonly string[];
  readonly deferred_candidate_ids: readonly string[];
  readonly clarification_answer_ids: readonly string[];
}

export interface AtlasReviewOutput {
  readonly schema_version: typeof ATLAS_REVIEW_VERSION;
  readonly collection: RequirementCollection;
  readonly packages: Readonly<Record<string, RequirementPackage>>;
  readonly review_report: AtlasReviewReport;
}

export interface TargetedClarificationQuestion {
  readonly id: string;
  readonly question: string;
  readonly affected_requirement_ids: readonly string[];
  readonly blocking: boolean;
}

export function candidateRevisionHash(
  candidate: CandidateRequirement | CandidateBusinessRule,
): string {
  return sha256(candidate);
}

export function targetedClarificationQuestions(
  analysisValue: unknown,
): TargetedClarificationQuestion[] {
  const analysis = AtlasProviderResultSchema.parse(analysisValue);
  const questions = new Map(
    analysis.clarification_questions.map((question) => [question.id, question]),
  );
  const covered = new Set(
    analysis.clarification_questions.flatMap(
      ({ affected_requirement_ids }) => affected_requirement_ids,
    ),
  );
  for (const uncertainty of analysis.uncertainties) {
    if (
      ["blocking", "high"].includes(uncertainty.severity)
      && uncertainty.affected_requirement_ids.some((id) => !covered.has(id))
    ) {
      questions.set(`QUESTION-${uncertainty.id}`, {
        id: `QUESTION-${uncertainty.id}`,
        question: `Clarify ${uncertainty.field}: ${uncertainty.reason}`,
        affected_requirement_ids: uncertainty.affected_requirement_ids,
        blocking: uncertainty.severity === "blocking",
      });
    }
  }
  for (const conflict of analysis.conflicts) {
    if (
      ["blocking", "high"].includes(conflict.severity)
      && conflict.source_requirement_ids.some((id) => !covered.has(id))
    ) {
      questions.set(`QUESTION-${conflict.id}`, {
        id: `QUESTION-${conflict.id}`,
        question: `Resolve conflict: ${conflict.statement}`,
        affected_requirement_ids: conflict.source_requirement_ids,
        blocking: conflict.severity === "blocking",
      });
    }
  }
  return [...questions.values()].sort((left, right) => compareText(left.id, right.id));
}

export function compileAtlasReview(input: unknown): AtlasReviewOutput {
  const parsed = AtlasReviewInputSchema.parse(input);
  assertUnique(parsed.decisions.map(({ candidate_id }) => candidate_id), "review decision");
  assertUnique(parsed.clarification_answers.map(({ question_id }) => question_id), "clarification answer");

  const candidates = new Map<string, CandidateRequirement | CandidateBusinessRule>([
    ...parsed.analysis.candidate_requirements.map((candidate) => [candidate.candidate_id, candidate] as const),
    ...parsed.analysis.candidate_business_rules.map((candidate) => [candidate.candidate_id, candidate] as const),
  ]);
  assertCandidatesRemainUnapproved(candidates);
  const decisions = normalizeDecisions(parsed.decisions);
  for (const decision of decisions) validateDecision(decision, candidates);
  assertEveryCandidateReviewed(candidates, decisions);
  assertBlockingIssuesResolved(parsed.analysis, parsed.clarification_answers);

  const approvedRequirements = new Map<string, CandidateRequirement>();
  const approvedRequirementReferences = new Map<string, string>();
  const approvedRules: CandidateBusinessRule[] = [];
  for (const decision of decisions) {
    if (!["approved", "corrected"].includes(decision.decision)) continue;
    const candidate = candidates.get(decision.candidate_id)!;
    const reviewed = applyCorrection(candidate, decision);
    if ("title" in reviewed) {
      if (approvedRequirements.has(reviewed.proposed_logical_id)) {
        throw new Error(
          `Duplicate Atlas approved requirement logical ID: ${reviewed.proposed_logical_id}`,
        );
      }
      approvedRequirements.set(reviewed.proposed_logical_id, reviewed);
      approvedRequirementReferences.set(reviewed.candidate_id, reviewed.proposed_logical_id);
    } else approvedRules.push(reviewed);
  }
  const resolvedApprovedRules = approvedRules.map((rule) => ({
    ...rule,
    source_requirement_ids: rule.source_requirement_ids.map(
      (id) => approvedRequirementReferences.get(id) ?? id,
    ),
  }));
  assertUnique(
    resolvedApprovedRules.map(({ proposed_logical_id }) => proposed_logical_id),
    "approved Business Rule logical ID",
  );

  if (approvedRequirements.size === 0) {
    throw new Error("Atlas review cannot approve an empty Requirement Collection");
  }

  const packages = Object.fromEntries(
    [...approvedRequirements.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([logicalId, candidate]) => {
        const businessRules = resolvedApprovedRules
          .filter(({ source_requirement_ids }) => source_requirement_ids.includes(logicalId))
          .sort((left, right) => compareText(left.proposed_logical_id, right.proposed_logical_id))
          .map((rule) => ({
            id: rule.proposed_logical_id,
            type: rule.type,
            statement: rule.statement,
          }));
        return [logicalId, RequirementPackageSchema.parse({
          schema_version: "1.0.0",
          requirement: { id: logicalId, title: candidate.title },
          source: {
            document_id: candidate.source.document_id,
            document_version: candidate.source.content_hash,
            path: candidate.source.path,
            section: candidate.source.section,
            page_start: candidate.source.page_start,
            page_end: candidate.source.page_end,
            page_revision_hashes: candidate.source.page_revision_hashes,
            extraction: candidate.source.extraction,
            parent_requirement_ids: [],
          },
          actor: candidate.actor,
          operation: candidate.operation,
          state_transition: candidate.state_transition,
          business_rules: businessRules,
          inputs: [],
          outputs: [],
          effects: [],
          uncertainties: [],
          asserted_capabilities: [],
        })] as const;
      }),
  );

  for (const rule of resolvedApprovedRules) {
    for (const requirementId of rule.source_requirement_ids) {
      if (!packages[requirementId]) {
        throw new Error(`Approved Business Rule ${rule.candidate_id} references unapproved requirement ${requirementId}`);
      }
    }
  }

  const decisionHash = sha256({
    decisions,
    clarification_answers: normalizeAnswers(parsed.clarification_answers),
  });
  const approvedBy = [...new Set(
    decisions
      .filter(({ decision }) => ["approved", "corrected"].includes(decision))
      .map(({ decided_by }) => decided_by),
  )].sort().join(", ");
  const collection = createRequirementCollection({
    schema_version: "1.0.0",
    collection: { id: parsed.collection_id },
    approval: {
      status: "approved",
      approved_by: approvedBy,
      review_decision_hash: decisionHash,
    },
    requirements: Object.entries(packages).map(([logicalId, requirement]) => ({
      logical_id: logicalId,
      revision_hash: requirementRevisionHash(requirement),
      path: `requirement-packages/${logicalId}.json`,
    })),
  });

  return {
    schema_version: ATLAS_REVIEW_VERSION,
    collection,
    packages,
    review_report: {
      schema_version: ATLAS_REVIEW_VERSION,
      status: "approved",
      decision_hash: decisionHash,
      approved_candidate_ids: idsFor(decisions, ["approved", "corrected"]),
      rejected_candidate_ids: idsFor(decisions, ["rejected", "superseded"]),
      deferred_candidate_ids: idsFor(decisions, ["deferred"]),
      clarification_answer_ids: normalizeAnswers(parsed.clarification_answers).map(({ question_id }) => question_id),
    },
  };
}

function validateDecision(
  decision: ReviewDecision,
  candidates: ReadonlyMap<string, CandidateRequirement | CandidateBusinessRule>,
): void {
  const candidate = candidates.get(decision.candidate_id);
  if (!candidate) throw new Error(`Review decision references unknown candidate ${decision.candidate_id}`);
  const revision = candidateRevisionHash(candidate);
  if (decision.candidate_revision_hash !== revision) {
    throw new Error(`Stale review decision for ${decision.candidate_id}: candidate revision changed`);
  }
  if (decision.source_revision_hash !== candidate.source.content_hash) {
    throw new Error(`Stale review decision for ${decision.candidate_id}: source revision changed`);
  }
}

function applyCorrection(
  candidate: CandidateRequirement | CandidateBusinessRule,
  decision: ReviewDecision,
): CandidateRequirement | CandidateBusinessRule {
  if (decision.decision !== "corrected") return candidate;
  const immutableFields = ["schema_version", "candidate_id", "source", "inference"];
  const changedImmutable = Object.keys(decision.correction ?? {})
    .filter((field) => immutableFields.includes(field));
  if (changedImmutable.length > 0) {
    throw new Error(
      `Correction cannot change immutable candidate provenance: ${changedImmutable.sort().join(", ")}`,
    );
  }
  const corrected = { ...candidate, ...decision.correction };
  return "title" in candidate
    ? CandidateRequirementSchema.parse(corrected)
    : CandidateBusinessRuleSchema.parse(corrected);
}

function assertEveryCandidateReviewed(
  candidates: ReadonlyMap<string, CandidateRequirement | CandidateBusinessRule>,
  decisions: readonly ReviewDecision[],
): void {
  const reviewed = new Set(decisions.map(({ candidate_id }) => candidate_id));
  const missing = [...candidates.keys()].filter((id) => !reviewed.has(id)).sort();
  if (missing.length > 0) throw new Error(`Candidates require human review: ${missing.join(", ")}`);
}

function assertCandidatesRemainUnapproved(
  candidates: ReadonlyMap<string, CandidateRequirement | CandidateBusinessRule>,
): void {
  for (const candidate of candidates.values()) {
    if (!["candidate", "needs_confirmation"].includes(candidate.inference.review.status)) {
      throw new Error(
        `Candidate ${candidate.candidate_id} contains non-human approved review state`,
      );
    }
  }
}

function assertBlockingIssuesResolved(
  analysis: AtlasProviderResult,
  answers: readonly ClarificationAnswer[],
): void {
  const answerByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  const questions = targetedClarificationQuestions(analysis);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const requirementSourceHashes = new Map(
    analysis.candidate_requirements.map(({ proposed_logical_id, source }) =>
      [proposed_logical_id, source.content_hash]),
  );
  const allSourceHashes = new Set(requirementSourceHashes.values());
  for (const answer of answers) {
    const question = questionById.get(answer.question_id);
    if (!question) throw new Error(`Clarification answer references unknown question ${answer.question_id}`);
    const applicableHashes = question.affected_requirement_ids.length === 0
      ? allSourceHashes
      : new Set(question.affected_requirement_ids
        .map((id) => requirementSourceHashes.get(id))
        .filter((hash): hash is string => hash !== undefined));
    if (!applicableHashes.has(answer.source_revision_hash)) {
      throw new Error(`Stale clarification answer for ${answer.question_id}: source revision changed`);
    }
  }
  const blockingQuestions = questions.filter(({ blocking }) => blocking);
  const unresolvedQuestions = blockingQuestions.filter(({ id }) => !answerByQuestion.has(id));
  if (unresolvedQuestions.length > 0) {
    throw new Error(`Unresolved blocking clarification: ${unresolvedQuestions.map(({ id }) => id).sort().join(", ")}`);
  }
}

function normalizeDecisions(decisions: readonly ReviewDecision[]): ReviewDecision[] {
  return [...decisions]
    .map((decision) => ReviewDecisionSchema.parse(decision))
    .sort((left, right) => compareText(left.candidate_id, right.candidate_id));
}

function normalizeAnswers(answers: readonly ClarificationAnswer[]): ClarificationAnswer[] {
  return [...answers]
    .map((answer) => ClarificationAnswerSchema.parse(answer))
    .sort((left, right) => compareText(left.question_id, right.question_id));
}

function idsFor(decisions: readonly ReviewDecision[], states: readonly ReviewDecision["decision"][]): string[] {
  return decisions.filter(({ decision }) => states.includes(decision)).map(({ candidate_id }) => candidate_id);
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`Duplicate Atlas ${label}: ${duplicate}`);
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

const ReviewIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);

export const CoverageReviewCandidateSchema = z.object({
  id: ReviewIdSchema,
  source_revision_id: ReviewIdSchema,
  lexicon_revision_id: ReviewIdSchema,
  semantic_revision_id: ReviewIdSchema,
  source_unit_ids: z.array(ReviewIdSchema).min(1),
  payload: z.record(z.string(), z.unknown()),
  candidate_hash: Sha256Schema,
}).strict();

export const CoverageReviewDecisionSchema = z.object({
  id: ReviewIdSchema,
  action: z.enum([
    "approve", "reject", "correct", "merge", "split", "defer",
    "create_from_source", "exclude_with_reason",
  ]),
  candidate_ids: z.array(ReviewIdSchema),
  source_unit_ids: z.array(ReviewIdSchema).min(1),
  expected_candidate_hashes: z.record(ReviewIdSchema, Sha256Schema),
  replacement_payloads: z.array(z.record(z.string(), z.unknown())).default([]),
  reason: NonEmptyString.optional(),
  reviewer: z.object({
    kind: z.literal("human"),
    identity: NonEmptyString,
  }).strict(),
}).strict().superRefine((value, context) => {
  const expectedCandidates = ["approve", "reject", "correct", "merge", "split", "defer"]
    .includes(value.action);
  if (expectedCandidates && value.candidate_ids.length === 0) {
    context.addIssue({ code: "custom", message: `${value.action} requires candidate_ids` });
  }
  if (value.action === "create_from_source" && value.candidate_ids.length > 0) {
    context.addIssue({ code: "custom", message: "create_from_source cannot reference candidates" });
  }
  if (["correct", "merge", "split", "create_from_source"].includes(value.action)
    && value.replacement_payloads.length === 0) {
    context.addIssue({ code: "custom", message: `${value.action} requires replacement payloads` });
  }
  if (["reject", "defer", "exclude_with_reason"].includes(value.action) && !value.reason) {
    context.addIssue({ code: "custom", message: `${value.action} requires a reason` });
  }
});

export const CoverageAwareReviewInputSchema = z.object({
  source_revision_id: ReviewIdSchema,
  lexicon_revision_id: ReviewIdSchema,
  semantic_revision_id: ReviewIdSchema,
  source_unit_ids: z.array(ReviewIdSchema).min(1),
  candidates: z.array(CoverageReviewCandidateSchema),
  coverage_report: CoverageReportSchema,
  decisions: z.array(CoverageReviewDecisionSchema),
}).strict();

export const CoverageAwareReviewOutputSchema = z.object({
  schema_version: z.literal(ATLAS_REVIEW_VERSION),
  source_revision_id: ReviewIdSchema,
  lexicon_revision_id: ReviewIdSchema,
  semantic_revision_id: ReviewIdSchema,
  status: z.enum(["reviewed", "review_required", "clarification_required"]),
  records: z.array(z.object({
    id: ReviewIdSchema,
    source_unit_ids: z.array(ReviewIdSchema).min(1),
    payload: z.record(z.string(), z.unknown()),
    review_action: z.enum(["approved", "corrected", "merged", "split", "created"]),
  }).strict()),
  rejected_candidate_ids: z.array(ReviewIdSchema),
  deferred_candidate_ids: z.array(ReviewIdSchema),
  remapping: z.record(ReviewIdSchema, z.array(ReviewIdSchema)),
  source_dispositions: z.record(ReviewIdSchema,
    z.enum(["represented", "excluded_with_reason", "review_required"])),
  decision_hash: Sha256Schema,
}).strict();

export function coverageReviewCandidateHash(value: {
  readonly source_revision_id: string;
  readonly lexicon_revision_id: string;
  readonly semantic_revision_id: string;
  readonly source_unit_ids: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
}): string {
  return sha256({
    source_revision_id: value.source_revision_id,
    lexicon_revision_id: value.lexicon_revision_id,
    semantic_revision_id: value.semantic_revision_id,
    source_unit_ids: value.source_unit_ids,
    payload: value.payload,
  });
}

export function compileCoverageAwareReview(
  inputValue: z.input<typeof CoverageAwareReviewInputSchema>,
): z.infer<typeof CoverageAwareReviewOutputSchema> {
  const input = CoverageAwareReviewInputSchema.parse(inputValue);
  if (input.coverage_report.source_revision_id !== input.source_revision_id
    || input.coverage_report.semantic_collection_id !== input.semantic_revision_id) {
    throw new Error("Coverage report revision mismatch");
  }
  const sourceIds = new Set(input.source_unit_ids);
  const candidates = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  assertUnique([...candidates.keys()], "coverage-review candidate");
  for (const candidate of candidates.values()) {
    if (candidate.source_revision_id !== input.source_revision_id
      || candidate.lexicon_revision_id !== input.lexicon_revision_id
      || candidate.semantic_revision_id !== input.semantic_revision_id) {
      throw new Error(`Candidate revision mismatch: ${candidate.id}`);
    }
    assertReviewSources(candidate.source_unit_ids, sourceIds);
    const expected = coverageReviewCandidateHash(candidate);
    if (candidate.candidate_hash !== expected) throw new Error(`Stale candidate hash: ${candidate.id}`);
  }
  const decisions = [...input.decisions].sort((a, b) => compareText(a.id, b.id));
  assertUnique(decisions.map(({ id }) => id), "coverage-review decision");
  const handled = new Set<string>();
  const records: z.infer<typeof CoverageAwareReviewOutputSchema>["records"] = [];
  const rejected: string[] = [];
  const deferred: string[] = [];
  const remapping: Record<string, string[]> = {};
  const dispositions: Record<string, "represented" | "excluded_with_reason" | "review_required">
    = Object.fromEntries(input.source_unit_ids.map((id) => [id, "review_required"]));

  for (const decision of decisions) {
    assertReviewSources(decision.source_unit_ids, sourceIds);
    const selected = decision.candidate_ids.map((id) => {
      const candidate = candidates.get(id);
      if (!candidate) throw new Error(`Unknown review candidate: ${id}`);
      if (handled.has(id)) throw new Error(`Candidate reviewed more than once: ${id}`);
      if (decision.expected_candidate_hashes[id] !== candidate.candidate_hash) {
        throw new Error(`Stale review decision for ${id}`);
      }
      handled.add(id);
      return candidate;
    });
    if (decision.action === "reject") rejected.push(...decision.candidate_ids);
    else if (decision.action === "defer") deferred.push(...decision.candidate_ids);
    else if (decision.action === "exclude_with_reason") {
      for (const id of decision.source_unit_ids) dispositions[id] = "excluded_with_reason";
    } else {
      const payloads = decision.action === "approve"
        ? selected.map(({ payload }) => payload)
        : decision.replacement_payloads;
      payloads.forEach((payload, index) => {
        const recordId = `atlas.reviewed.${digestForReview({
          decision: decision.id, index, payload,
        }).slice(0, 16)}`;
        const reviewAction = decision.action === "approve" ? "approved"
          : decision.action === "correct" ? "corrected"
          : decision.action === "merge" ? "merged"
          : decision.action === "split" ? "split" : "created";
        records.push({
          id: recordId,
          source_unit_ids: [...decision.source_unit_ids].sort(compareText),
          payload,
          review_action: reviewAction,
        });
        for (const candidate of selected) (remapping[candidate.id] ??= []).push(recordId);
      });
      for (const id of decision.source_unit_ids) dispositions[id] = "represented";
    }
  }
  const missingCandidates = [...candidates.keys()].filter((id) => !handled.has(id));
  if (missingCandidates.length > 0) {
    throw new Error(`Candidates require coverage-aware review: ${missingCandidates.sort().join(", ")}`);
  }
  const blockingUnits = input.coverage_report.entries.filter(({ normative, disposition }) =>
    normative && !["covered", "duplicate", "excluded_with_reason"].includes(disposition))
    .map(({ source_unit_id }) => source_unit_id);
  const unresolved = blockingUnits.filter((id) => dispositions[id] === "review_required");
  const status = unresolved.length > 0 || deferred.length > 0 ? "review_required" : "reviewed";
  const normalizedRecords = records.sort((a, b) => compareText(a.id, b.id));
  return deepFreezeReview(CoverageAwareReviewOutputSchema.parse({
    schema_version: ATLAS_REVIEW_VERSION,
    source_revision_id: input.source_revision_id,
    lexicon_revision_id: input.lexicon_revision_id,
    semantic_revision_id: input.semantic_revision_id,
    status,
    records: normalizedRecords,
    rejected_candidate_ids: rejected.sort(compareText),
    deferred_candidate_ids: deferred.sort(compareText),
    remapping,
    source_dispositions: dispositions,
    decision_hash: sha256(decisions),
  }));
}

function assertReviewSources(values: readonly string[], allowed: ReadonlySet<string>): void {
  const unknown = values.find((id) => !allowed.has(id));
  if (unknown) throw new Error(`Review references unknown source unit: ${unknown}`);
}
function digestForReview(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
function deepFreezeReview<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreezeReview(child);
  }
  return value;
}

const DecisionRecordPayloadSchema = z.object({
  id: ReviewIdSchema,
  statement: NonEmptyString,
  semantic_kind_id: ReviewIdSchema,
  source_unit_ids: z.array(ReviewIdSchema).min(1),
  candidate_ids: z.array(ReviewIdSchema),
}).strict();

export const ProposalApprovalDecisionInputSchema = z.object({
  sequence: z.number().int().positive(),
  action: z.enum([
    "approve", "reject", "correction_requested", "corrected_approve",
    "mark_ambiguous", "correct_classification", "split", "merge",
    "add_record", "register_category",
  ]),
  target_record_ids: z.array(ReviewIdSchema),
  bulk: z.boolean().default(false),
  reviewer: z.object({
    kind: z.literal("human"),
    identity: NonEmptyString,
  }).strict(),
  decided_at: z.string().datetime({ offset: true }),
  note: NonEmptyString,
  approved_statement: NonEmptyString.optional(),
  approved_semantic_kind_id: ReviewIdSchema.optional(),
  replacement_records: z.array(DecisionRecordPayloadSchema).default([]),
  registered_kind_id: ReviewIdSchema.optional(),
}).strict().superRefine((value, context) => {
  if (["approve", "reject", "correction_requested", "corrected_approve",
    "mark_ambiguous", "correct_classification"].includes(value.action)
    && value.target_record_ids.length !== 1) {
    context.addIssue({ code: "custom", message: `${value.action} requires one target record` });
  }
  if (value.action === "split"
    && (value.target_record_ids.length !== 1 || value.replacement_records.length < 2)) {
    context.addIssue({ code: "custom", message: "Split requires one target and multiple replacements" });
  }
  if (value.action === "merge"
    && (value.target_record_ids.length < 2 || value.replacement_records.length !== 1)) {
    context.addIssue({ code: "custom", message: "Merge requires multiple targets and one replacement" });
  }
  if (value.action === "add_record"
    && (value.target_record_ids.length !== 0 || value.replacement_records.length !== 1)) {
    context.addIssue({ code: "custom", message: "Add record requires one replacement and no target" });
  }
  if ((value.action === "register_category") !== (value.registered_kind_id !== undefined)) {
    context.addIssue({ code: "custom", message: "Category registration requires registered_kind_id" });
  }
  if (value.bulk && value.action !== "approve") {
    context.addIssue({ code: "custom", message: "Only approve decisions may be bulk" });
  }
});

export const ProposalApprovalDecisionSchema = ProposalApprovalDecisionInputSchema.extend({
  id: ReviewIdSchema,
  proposal_hash: Sha256Schema,
  proposal_revision: z.number().int().positive(),
}).strict();

export const ProposalApprovalLedgerSchema = z.object({
  schema_version: z.literal(ATLAS_REVIEW_VERSION),
  proposal_hash: Sha256Schema,
  proposal_revision: z.number().int().positive(),
  decisions: z.array(ProposalApprovalDecisionSchema),
  content_hash: Sha256Schema,
}).strict();

export function createProposalApprovalLedger(input: {
  readonly proposal_hash: string;
  readonly proposal_revision: number;
  readonly proposal_record_ids: readonly string[];
  readonly eligibility: z.input<typeof BulkApprovalEligibilitySchema>;
  readonly decisions: readonly z.input<typeof ProposalApprovalDecisionInputSchema>[];
}): z.infer<typeof ProposalApprovalLedgerSchema> {
  const proposalHash = Sha256Schema.parse(input.proposal_hash);
  const proposalRevision = z.number().int().positive().parse(input.proposal_revision);
  const recordIds = new Set(input.proposal_record_ids.map((id) => ReviewIdSchema.parse(id)));
  const eligibility = BulkApprovalEligibilitySchema.parse(input.eligibility);
  if (eligibility.proposal_hash !== proposalHash) throw new Error("Approval eligibility is stale");
  const parsed = input.decisions.map((decision) =>
    ProposalApprovalDecisionInputSchema.parse(decision))
    .sort((a, b) => a.sequence - b.sequence);
  const states = new Map<string, "pending" | "correction_requested" | "terminal">(
    [...recordIds].map((id) => [id, "pending"]),
  );
  parsed.forEach((decision, index) => {
    if (decision.sequence !== index + 1) throw new Error("Approval decision sequence must be contiguous");
    for (const id of decision.target_record_ids) {
      if (!recordIds.has(id)) throw new Error(`Approval references unknown record: ${id}`);
      const state = states.get(id);
      if (state === "terminal") throw new Error(`Conflicting terminal decision for ${id}`);
      if (decision.action === "corrected_approve" && state !== "correction_requested") {
        throw new Error(`Corrected approval requires correction request for ${id}`);
      }
    }
    if (decision.bulk) assertBulkApprovalSelection(eligibility, decision.target_record_ids);
    for (const id of decision.target_record_ids) {
      states.set(id, decision.action === "correction_requested"
        ? "correction_requested" : "terminal");
    }
  });
  const decisions = parsed.map((decision) => {
    const core = { proposal_hash: proposalHash, proposal_revision: proposalRevision, ...decision };
    return ProposalApprovalDecisionSchema.parse({
      ...core,
      id: `atlas.decision.${String(decision.sequence).padStart(5, "0")}.${digestForReview(core).slice(0, 12)}`,
    });
  });
  const core = {
    schema_version: ATLAS_REVIEW_VERSION,
    proposal_hash: proposalHash,
    proposal_revision: proposalRevision,
    decisions,
  };
  return deepFreezeReview(ProposalApprovalLedgerSchema.parse({
    ...core, content_hash: sha256(core),
  }));
}
