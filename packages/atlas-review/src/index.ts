import { createHash } from "node:crypto";
import {
  AtlasProviderResultSchema,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
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
    } else approvedRules.push(reviewed);
  }
  assertUnique(
    approvedRules.map(({ proposed_logical_id }) => proposed_logical_id),
    "approved Business Rule logical ID",
  );

  if (approvedRequirements.size === 0) {
    throw new Error("Atlas review cannot approve an empty Requirement Collection");
  }

  const packages = Object.fromEntries(
    [...approvedRequirements.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([logicalId, candidate]) => {
        const businessRules = approvedRules
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
            section: candidate.source.section,
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

  for (const rule of approvedRules) {
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
