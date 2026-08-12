import { createHash } from "node:crypto";
import { z } from "zod";
export * from "./non-convergence.js";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const GitCommitSha = z.string().regex(/^[0-9a-f]{40}$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const Disposition = z.enum(["AWARENESS_EMITTED", "NO_SECURITY_AWARENESS_REQUIRED",
  "OUTSIDE_SOFTWARE_SCOPE", "DECISION_REQUIRED", "SOURCE_OR_POLICY_GAP"]);
const Layer = z.enum(["raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]);
const Revisions = z.object({ source_glossary_revision: Revision,
  raw_vocabulary_revision: Revision, canonical_vocabulary_revision: Revision,
  policy_taxonomy_revision: Revision }).strict();
export const CoverageResultSchema = z.object({ coverage_result_id: Id,
  status: z.literal("valid"), completeness: z.literal("complete"),
  entries: z.array(z.object({ fact_id: Id, disposition: Disposition,
    earliest_incomplete_layer: Layer.nullable() }).strict()).min(1),
  revisions: Revisions }).strict().superRefine((value, context) => {
  const ids = value.entries.map(({ fact_id }) => fact_id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Duplicate fact" });
  for (const entry of value.entries) {
    if ((entry.disposition === "SOURCE_OR_POLICY_GAP") !==
        (entry.earliest_incomplete_layer !== null)) context.addIssue({ code: "custom",
      message: "Only SOURCE_OR_POLICY_GAP requires an incomplete layer" });
  }
});
const StateName = z.enum(["AGENT_EXECUTION_PENDING", "AGENT_EXECUTION_COMPLETE",
  "VALIDATION_PENDING", "GOVERNED_SUSPENSION", "COVERAGE_RERUN_PENDING",
  "KNOWLEDGE_CONVERGED", "FULLY_RESOLVED"]);
const EventKind = z.enum(["WORKFLOW_STARTED", "ATTEMPT_COMPLETED", "PROPOSAL_RECORDED",
  "VALIDATION_RECORDED", "REVIEW_RECORDED", "PUBLICATION_RECORDED", "WORKFLOW_RESUMED"]);
const Gap = z.object({ gap_id: Id, fact_id: Id, earliest_incomplete_layer: Layer,
  gap_fingerprint: Hash }).strict();
const Snapshot = z.object({ state: StateName, coverage_result_id: Id, revisions: Revisions,
  gap: Gap.nullable(), attempt_id: Id.nullable(), proposal_id: Id.nullable(),
  proposal_hash: Hash.nullable(), validation_id: Id.nullable(),
  suspension_reason: z.enum(["REVIEW_REQUIRED", "VALIDATION_FAILED"]).nullable(),
  review_id: Id.nullable(), review_outcome: z.enum(["ACCEPTED", "NOT ACCEPTED",
    "ACCEPTED WITH DEFERRED ITEMS"]).nullable(), review_round: z.number().int().positive().nullable(),
  predecessor_review_id: Id.nullable(), reviewed_commit: GitCommitSha.nullable(),
  reviewed_artifact_hash: Hash.nullable(), required_finding_ids: z.array(Id),
  reviewed_finding_ids: z.array(Id), qualifying_regression: z.boolean(),
  publication_id: Id.nullable(), publication_artifact_hash: Hash.nullable(),
  publication_authority_evidence_id: Id.nullable(), resume_id: Id.nullable() }).strict();
const Event = z.object({ event_id: Id, workflow_id: Id, sequence: z.number().int().positive(),
  kind: EventKind, occurred_at: z.iso.datetime({ offset: true }), previous_event_hash: Hash.nullable(),
  evidence_id: Id, snapshot: Snapshot, transition_payload_hash: Hash, event_hash: Hash }).strict();
export const PolicyKnowledgeWorkflowSchema = z.object({ schema_version: z.literal("1.0.0"),
  workflow_id: Id, ...Snapshot.shape,
  events: z.array(Event) }).strict().superRefine((value, context) => {
  let previous: string | null = null;
  value.events.forEach((event, index) => {
    const { event_hash, ...body } = event;
    if (event.workflow_id !== value.workflow_id || event.sequence !== index + 1 ||
        event.previous_event_hash !== previous || stableHash(body) !== event_hash ||
        event.transition_payload_hash !== stableHash(event.snapshot) ||
        !validTransition(value.events[index - 1]?.snapshot, event.kind, event.snapshot))
      context.addIssue({ code: "custom", message: "Broken append-only workflow history" });
    previous = event_hash;
  });
  const finalSnapshot = value.events.at(-1)?.snapshot;
  if (!finalSnapshot || JSON.stringify(snapshotOf(value)) !== JSON.stringify(finalSnapshot))
    context.addIssue({ code: "custom", message: "Workflow snapshot does not match event history" });
});
export type PolicyKnowledgeWorkflow = z.infer<typeof PolicyKnowledgeWorkflowSchema>;

export function gapFingerprint(input: { fact_id: string; earliest_incomplete_layer: string;
  revisions: z.infer<typeof Revisions> }) { return stableHash(input); }

export function startPolicyKnowledgeWorkflow(input: { workflow_id: string; gap_id?: string;
  coverage_result: unknown; event_id: string; evidence_id: string; occurred_at: string }) {
  const coverage = CoverageResultSchema.parse(input.coverage_result);
  const gaps = coverage.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP")
    .sort((a, b) => a.fact_id.localeCompare(b.fact_id));
  if (gaps.length > 1) throw new Error("A workflow must bind exactly one bounded knowledge gap");
  const decisions = coverage.entries.filter(({ disposition }) => disposition === "DECISION_REQUIRED");
  const gapEntry = gaps[0];
  const gap = gapEntry ? { gap_id: input.gap_id ?? `gap.${gapEntry.fact_id}`,
    fact_id: gapEntry.fact_id, earliest_incomplete_layer: gapEntry.earliest_incomplete_layer!,
    gap_fingerprint: gapFingerprint({ fact_id: gapEntry.fact_id,
      earliest_incomplete_layer: gapEntry.earliest_incomplete_layer!, revisions: coverage.revisions }) } : null;
  const state = gap ? "AGENT_EXECUTION_PENDING" as const : decisions.length > 0
    ? "KNOWLEDGE_CONVERGED" as const : "FULLY_RESOLVED" as const;
  return PolicyKnowledgeWorkflowSchema.parse({ schema_version: "1.0.0", workflow_id: input.workflow_id,
    state, coverage_result_id: coverage.coverage_result_id, revisions: coverage.revisions, gap,
    attempt_id: null, proposal_id: null, proposal_hash: null, validation_id: null,
    suspension_reason: null, review_id: null, review_outcome: null, review_round: null,
    predecessor_review_id: null, reviewed_commit: null, reviewed_artifact_hash: null,
    required_finding_ids: [], reviewed_finding_ids: [], qualifying_regression: false, publication_id: null,
    publication_artifact_hash: null, publication_authority_evidence_id: null, resume_id: null,
    events: [event(input, "WORKFLOW_STARTED", null, 1, { state, coverage_result_id:
      coverage.coverage_result_id, revisions: coverage.revisions, gap, attempt_id: null,
      proposal_id: null, proposal_hash: null, validation_id: null, suspension_reason: null,
      review_id: null, review_outcome: null, review_round: null, predecessor_review_id: null,
      reviewed_commit: null, reviewed_artifact_hash: null, required_finding_ids: [],
      reviewed_finding_ids: [], qualifying_regression: false, publication_id: null, publication_artifact_hash: null,
      publication_authority_evidence_id: null, resume_id: null })] });
}

export function recordKnowledgeAttempt(workflowValue: unknown, input: Evidence & { attempt_id: string }) {
  const workflow = requireState(workflowValue, "AGENT_EXECUTION_PENDING");
  if (!workflow.gap) throw new Error("Knowledge attempts require SOURCE_OR_POLICY_GAP");
  return update(workflow, input, "ATTEMPT_COMPLETED", { state: "AGENT_EXECUTION_COMPLETE",
    attempt_id: input.attempt_id });
}
export function recordKnowledgeProposal(workflowValue: unknown, input: Evidence & {
  attempt_id: string; proposal_id: string; proposal_hash: string }) {
  const workflow = requireState(workflowValue, "AGENT_EXECUTION_COMPLETE");
  if (workflow.attempt_id !== input.attempt_id) throw new Error("Proposal attempt mismatch");
  Hash.parse(input.proposal_hash);
  return update(workflow, input, "PROPOSAL_RECORDED", { state: "VALIDATION_PENDING",
    proposal_id: input.proposal_id, proposal_hash: input.proposal_hash });
}
export function recordKnowledgeValidation(workflowValue: unknown, input: Evidence & {
  proposal_id: string; proposal_hash: string; validation_id: string; status: "valid" | "invalid" }) {
  const workflow = requireState(workflowValue, "VALIDATION_PENDING");
  if (workflow.proposal_id !== input.proposal_id || workflow.proposal_hash !== input.proposal_hash)
    throw new Error("Validation proposal mismatch");
  return update(workflow, input, "VALIDATION_RECORDED", { state: "GOVERNED_SUSPENSION",
    validation_id: input.validation_id,
    suspension_reason: input.status === "valid" ? "REVIEW_REQUIRED" : "VALIDATION_FAILED" });
}
export function recordKnowledgeReview(workflowValue: unknown, input: Evidence & {
  review_id: string; outcome: "ACCEPTED" | "NOT ACCEPTED" | "ACCEPTED WITH DEFERRED ITEMS";
  review_round: number; predecessor_review_id: string | null; reviewed_commit: string;
  reviewed_artifact_hash: string; required_finding_ids: string[]; reviewed_finding_ids: string[];
  qualifying_regression: boolean }) {
  const workflow = requireState(workflowValue, "GOVERNED_SUSPENSION");
  if (workflow.suspension_reason !== "REVIEW_REQUIRED" ||
      workflow.proposal_hash !== input.reviewed_artifact_hash) throw new Error("Review artifact mismatch");
  GitCommitSha.parse(input.reviewed_commit); Hash.parse(input.reviewed_artifact_hash);
  if (new Set(input.required_finding_ids).size !== input.required_finding_ids.length)
    throw new Error("Duplicate REQUIRED finding identity");
  if (new Set(input.reviewed_finding_ids).size !== input.reviewed_finding_ids.length)
    throw new Error("Duplicate reviewed finding identity");
  const expectedRound = (workflow.review_round ?? 0) + 1;
  if (input.review_round !== expectedRound || input.predecessor_review_id !== workflow.review_id)
    throw new Error("Review round does not continue the exact predecessor review");
  if (workflow.review_id && !input.qualifying_regression &&
      input.reviewed_finding_ids.some((id) => !workflow.required_finding_ids.includes(id)))
    throw new Error("Closure review exceeds bounded REQUIRED findings");
  if (!validReviewSemantics(workflow, { ...workflow, review_id: input.review_id,
    review_outcome: input.outcome, review_round: input.review_round,
    predecessor_review_id: input.predecessor_review_id, reviewed_commit: input.reviewed_commit,
    reviewed_artifact_hash: input.reviewed_artifact_hash,
    required_finding_ids: [...input.required_finding_ids].sort(),
    reviewed_finding_ids: [...input.reviewed_finding_ids].sort(),
    qualifying_regression: input.qualifying_regression }))
    throw new Error("Review does not satisfy bounded terminal outcome semantics");
  return update(workflow, input, "REVIEW_RECORDED", { review_id: input.review_id,
    review_outcome: input.outcome, review_round: input.review_round,
    predecessor_review_id: input.predecessor_review_id, reviewed_commit: input.reviewed_commit,
    reviewed_artifact_hash: input.reviewed_artifact_hash,
    required_finding_ids: [...input.required_finding_ids].sort(),
    reviewed_finding_ids: [...input.reviewed_finding_ids].sort(),
    qualifying_regression: input.qualifying_regression });
}
export function recordAcceptedPublication(workflowValue: unknown, input: Evidence & {
  publication_id: string; review_id: string; reviewed_commit: string;
  artifact_hash: string; authority_evidence_id: string }) {
  const workflow = requireState(workflowValue, "GOVERNED_SUSPENSION");
  if (!workflow.review_id || workflow.review_id !== input.review_id ||
      !["ACCEPTED", "ACCEPTED WITH DEFERRED ITEMS"].includes(workflow.review_outcome ?? "") ||
      workflow.reviewed_commit !== input.reviewed_commit ||
      workflow.reviewed_artifact_hash !== input.artifact_hash)
    throw new Error("Publication does not match the accepted reviewed artifact");
  GitCommitSha.parse(input.reviewed_commit); Hash.parse(input.artifact_hash);
  return update(workflow, input, "PUBLICATION_RECORDED", {
    publication_id: input.publication_id, publication_artifact_hash: input.artifact_hash,
    publication_authority_evidence_id: input.authority_evidence_id });
}
export function resumeKnowledgeWorkflow(workflowValue: unknown, input: Evidence & {
  resume_id: string; publication_id: string; artifact_hash: string }) {
  const workflow = requireState(workflowValue, "GOVERNED_SUSPENSION");
  if (!workflow.publication_id || workflow.publication_id !== input.publication_id ||
      workflow.publication_artifact_hash !== input.artifact_hash || workflow.resume_id !== null)
    throw new Error("Resume does not match an unconsumed accepted publication");
  return update(workflow, input, "WORKFLOW_RESUMED", { state: "COVERAGE_RERUN_PENDING",
    suspension_reason: null, resume_id: input.resume_id });
}
type Evidence = { event_id: string; evidence_id: string; occurred_at: string };
function update(workflow: PolicyKnowledgeWorkflow, input: Evidence, kind: z.infer<typeof EventKind>,
  changed: Record<string, unknown>) { const previous = workflow.events.at(-1)!.event_hash;
  const next = { ...workflow, ...changed };
  return PolicyKnowledgeWorkflowSchema.parse({ ...next,
    events: [...workflow.events, event({ ...input, workflow_id: workflow.workflow_id }, kind,
      previous, workflow.events.length + 1, snapshotOf(next))] }); }
function requireState(value: unknown, state: z.infer<typeof StateName>) { const workflow =
  PolicyKnowledgeWorkflowSchema.parse(value); if (workflow.state !== state)
  throw new Error(`Illegal workflow transition from ${workflow.state}`); return workflow; }
function event(input: { workflow_id: string; event_id: string; evidence_id: string; occurred_at: string },
  kind: z.infer<typeof EventKind>, previous: string | null, sequence: number,
  snapshot: z.infer<typeof Snapshot>) { const body = {
  event_id: input.event_id, workflow_id: input.workflow_id, sequence, kind,
  occurred_at: input.occurred_at, previous_event_hash: previous, evidence_id: input.evidence_id,
  snapshot, transition_payload_hash: stableHash(snapshot) };
  return { ...body, event_hash: stableHash(body) }; }
function snapshotOf(value: Record<string, unknown>) { return Snapshot.parse({ state: value.state,
  coverage_result_id: value.coverage_result_id, revisions: value.revisions, gap: value.gap,
  attempt_id: value.attempt_id, proposal_id: value.proposal_id, proposal_hash: value.proposal_hash,
  validation_id: value.validation_id, suspension_reason: value.suspension_reason,
  review_id: value.review_id, review_outcome: value.review_outcome, review_round: value.review_round,
  predecessor_review_id: value.predecessor_review_id,
  reviewed_commit: value.reviewed_commit, reviewed_artifact_hash: value.reviewed_artifact_hash,
  required_finding_ids: value.required_finding_ids, reviewed_finding_ids: value.reviewed_finding_ids,
  qualifying_regression: value.qualifying_regression, publication_id: value.publication_id,
  publication_artifact_hash: value.publication_artifact_hash,
  publication_authority_evidence_id: value.publication_authority_evidence_id,
  resume_id: value.resume_id }); }
function validTransition(previous: z.infer<typeof Snapshot> | undefined,
  kind: z.infer<typeof EventKind>, next: z.infer<typeof Snapshot>) {
  if (!previous) return kind === "WORKFLOW_STARTED" && ["AGENT_EXECUTION_PENDING",
    "KNOWLEDGE_CONVERGED", "FULLY_RESOLVED"].includes(next.state) && next.attempt_id === null &&
    next.proposal_id === null && next.validation_id === null && next.suspension_reason === null &&
    next.review_id === null && next.publication_id === null && next.resume_id === null;
  const governedStable = previous.coverage_result_id === next.coverage_result_id &&
    JSON.stringify(previous.revisions) === JSON.stringify(next.revisions) &&
    JSON.stringify(previous.gap) === JSON.stringify(next.gap) &&
    previous.attempt_id === next.attempt_id && previous.proposal_id === next.proposal_id &&
    previous.proposal_hash === next.proposal_hash && previous.validation_id === next.validation_id;
  const authorityStable = previous.review_id === next.review_id &&
    previous.review_outcome === next.review_outcome && previous.review_round === next.review_round &&
    previous.predecessor_review_id === next.predecessor_review_id &&
    previous.reviewed_commit === next.reviewed_commit &&
    previous.reviewed_artifact_hash === next.reviewed_artifact_hash &&
    JSON.stringify(previous.required_finding_ids) === JSON.stringify(next.required_finding_ids) &&
    JSON.stringify(previous.reviewed_finding_ids) === JSON.stringify(next.reviewed_finding_ids) &&
    previous.qualifying_regression === next.qualifying_regression &&
    previous.publication_id === next.publication_id &&
    previous.publication_artifact_hash === next.publication_artifact_hash &&
    previous.publication_authority_evidence_id === next.publication_authority_evidence_id &&
    previous.resume_id === next.resume_id;
  if (!governedStable && !["ATTEMPT_COMPLETED", "PROPOSAL_RECORDED", "VALIDATION_RECORDED"]
    .includes(kind)) return false;
  if (kind === "ATTEMPT_COMPLETED") return previous.state === "AGENT_EXECUTION_PENDING" &&
    authorityStable &&
    next.state === "AGENT_EXECUTION_COMPLETE" && previous.attempt_id === null && next.attempt_id !== null &&
    next.proposal_id === null && next.validation_id === null;
  if (kind === "PROPOSAL_RECORDED") return previous.state === "AGENT_EXECUTION_COMPLETE" &&
    authorityStable &&
    next.state === "VALIDATION_PENDING" && next.attempt_id === previous.attempt_id &&
    next.proposal_id !== null && next.proposal_hash !== null && next.validation_id === null;
  if (kind === "VALIDATION_RECORDED") return previous.state === "VALIDATION_PENDING" &&
    authorityStable &&
    next.state === "GOVERNED_SUSPENSION" && next.attempt_id === previous.attempt_id &&
    next.proposal_id === previous.proposal_id && next.proposal_hash === previous.proposal_hash &&
    next.validation_id !== null && next.suspension_reason !== null;
  if (kind === "REVIEW_RECORDED") return governedStable &&
    previous.state === "GOVERNED_SUSPENSION" && next.state === previous.state &&
    next.review_id !== null && next.review_outcome !== null && next.review_round !== null &&
    next.reviewed_commit !== null && next.reviewed_artifact_hash === next.proposal_hash &&
    previous.publication_id === next.publication_id && previous.resume_id === next.resume_id &&
    validReviewSemantics(previous, next);
  if (kind === "PUBLICATION_RECORDED") return governedStable &&
    previous.state === "GOVERNED_SUSPENSION" && next.state === previous.state &&
    previous.review_id === next.review_id && previous.review_outcome === next.review_outcome &&
    previous.publication_id === null && next.publication_id !== null &&
    isAccepting(previous.review_outcome) && previous.required_finding_ids.length === 0 &&
    next.publication_artifact_hash === next.reviewed_artifact_hash &&
    next.publication_authority_evidence_id !== null && next.resume_id === null;
  if (kind === "WORKFLOW_RESUMED") return governedStable &&
    previous.state === "GOVERNED_SUSPENSION" && next.state === "COVERAGE_RERUN_PENDING" &&
    previous.review_id === next.review_id && previous.publication_id === next.publication_id &&
    isAccepting(previous.review_outcome) && previous.required_finding_ids.length === 0 &&
    previous.publication_id !== null && previous.publication_artifact_hash === previous.reviewed_artifact_hash &&
    previous.publication_authority_evidence_id !== null && previous.resume_id === null &&
    next.resume_id !== null && next.suspension_reason === null;
  return false;
}
function isAccepting(value: string | null) {
  return value === "ACCEPTED" || value === "ACCEPTED WITH DEFERRED ITEMS";
}
function validReviewSemantics(previous: z.infer<typeof Snapshot>, next: z.infer<typeof Snapshot>) {
  if (previous.state !== "GOVERNED_SUSPENSION" ||
      previous.suspension_reason !== "REVIEW_REQUIRED" || next.review_round !==
      (previous.review_round ?? 0) + 1 || next.predecessor_review_id !== previous.review_id ||
      next.reviewed_artifact_hash !== previous.proposal_hash || !next.reviewed_commit) return false;
  if (next.review_outcome === "NOT ACCEPTED") return next.required_finding_ids.length > 0;
  if (!isAccepting(next.review_outcome) || next.required_finding_ids.length > 0) return false;
  if (!previous.review_id) return true;
  const reviewed = new Set(next.reviewed_finding_ids);
  if (previous.required_finding_ids.some((id) => !reviewed.has(id))) return false;
  return next.qualifying_regression || next.reviewed_finding_ids.every((id) =>
    previous.required_finding_ids.includes(id));
}
function stableHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
