import { createHash } from "node:crypto";
import { z } from "zod";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
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
  "VALIDATION_PENDING", "GOVERNED_SUSPENSION", "KNOWLEDGE_CONVERGED", "FULLY_RESOLVED"]);
const EventKind = z.enum(["WORKFLOW_STARTED", "ATTEMPT_COMPLETED", "PROPOSAL_RECORDED",
  "VALIDATION_RECORDED"]);
const Event = z.object({ event_id: Id, workflow_id: Id, sequence: z.number().int().positive(),
  kind: EventKind, occurred_at: z.iso.datetime({ offset: true }), previous_event_hash: Hash.nullable(),
  evidence_id: Id, transition_payload_hash: Hash, event_hash: Hash }).strict();
export const PolicyKnowledgeWorkflowSchema = z.object({ schema_version: z.literal("1.0.0"),
  workflow_id: Id, state: StateName, coverage_result_id: Id, revisions: Revisions,
  gap: z.object({ gap_id: Id, fact_id: Id, earliest_incomplete_layer: Layer,
    gap_fingerprint: Hash }).strict().nullable(), attempt_id: Id.nullable(),
  proposal_id: Id.nullable(), proposal_hash: Hash.nullable(), validation_id: Id.nullable(),
  suspension_reason: z.enum(["REVIEW_REQUIRED", "VALIDATION_FAILED"]).nullable(),
  review_id: Id.nullable(), publication_id: Id.nullable(), resume_id: Id.nullable(),
  events: z.array(Event) }).strict().superRefine((value, context) => {
  let previous: string | null = null;
  value.events.forEach((event, index) => {
    const { event_hash, ...body } = event;
    if (event.workflow_id !== value.workflow_id || event.sequence !== index + 1 ||
        event.previous_event_hash !== previous || stableHash(body) !== event_hash)
      context.addIssue({ code: "custom", message: "Broken append-only workflow history" });
    previous = event_hash;
  });
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
    suspension_reason: null, review_id: null, publication_id: null, resume_id: null,
    events: [event(input, "WORKFLOW_STARTED", null, 1, { state, coverage_result_id:
      coverage.coverage_result_id, revisions: coverage.revisions, gap })] });
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
type Evidence = { event_id: string; evidence_id: string; occurred_at: string };
function update(workflow: PolicyKnowledgeWorkflow, input: Evidence, kind: z.infer<typeof EventKind>,
  changed: Record<string, unknown>) { const previous = workflow.events.at(-1)!.event_hash;
  return PolicyKnowledgeWorkflowSchema.parse({ ...workflow, ...changed,
    events: [...workflow.events, event({ ...input, workflow_id: workflow.workflow_id }, kind,
      previous, workflow.events.length + 1, changed)] }); }
function requireState(value: unknown, state: z.infer<typeof StateName>) { const workflow =
  PolicyKnowledgeWorkflowSchema.parse(value); if (workflow.state !== state)
  throw new Error(`Illegal workflow transition from ${workflow.state}`); return workflow; }
function event(input: { workflow_id: string; event_id: string; evidence_id: string; occurred_at: string },
  kind: z.infer<typeof EventKind>, previous: string | null, sequence: number,
  transitionPayload: unknown) { const body = {
  event_id: input.event_id, workflow_id: input.workflow_id, sequence, kind,
  occurred_at: input.occurred_at, previous_event_hash: previous, evidence_id: input.evidence_id,
  transition_payload_hash: stableHash(transitionPayload) };
  return { ...body, event_hash: stableHash(body) }; }
function stableHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
