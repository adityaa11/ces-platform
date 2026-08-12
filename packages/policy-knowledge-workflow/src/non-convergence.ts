import { createHash } from "node:crypto";
import { z } from "zod";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const Suspension = z.enum(["DUPLICATE_PROPOSAL", "NO_PROGRESS", "ATTEMPT_EXHAUSTED",
  "AUTHORITY_UNAVAILABLE", "GOVERNED_SOURCE_UNAVAILABLE"]);

export const KnowledgeAttemptPolicySchema = z.object({ policy_id: Id, policy_version: Revision,
  max_attempts: z.number().int().positive(), reviewer_evidence_id: Id }).strict();
export const NormalizedProposalSemanticsSchema = z.object({ layer: z.enum([
  "raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  decisions: z.array(z.object({ subject_id: Id, decision: z.enum(["ADD", "MERGE", "REJECT"]),
    target_id: Id.nullable() }).strict()).min(1), resulting_concept_or_policy: z.object({ id: Id,
    obligation_or_definition: z.string().trim().min(1), semantic_atom_ids: z.array(Id).min(1),
    support_ids: z.array(Id) }).strict().nullable(),
  lineage: z.array(z.object({ subject_id: Id, source_release_id: Id,
    raw_concept_id: Id }).strict()), comparisons: z.array(z.object({ subject_id: Id,
    target_id: Id, relationship: z.enum(["distinct", "overlaps", "subsumes", "equivalent",
      "unsupported"]) }).strict()) }).strict();
const Attempt = z.object({ attempt_id: Id, proposal_fingerprint: Hash }).strict();
export const NonConvergenceLedgerSchema = z.object({ schema_version: z.literal("1.0.0"),
  ledger_id: Id, gap_fingerprint: Hash, fact_id: Id,
  earliest_incomplete_layer: z.enum(["raw_source_vocabulary", "canonical_vocabulary",
    "policy_taxonomy"]), attempt_policy: KnowledgeAttemptPolicySchema,
  attempt_policy_hash: Hash, attempts: z.array(Attempt), suspension_reason: Suspension.nullable(),
  supersedes_ledger_id: Id.nullable(), ledger_hash: Hash }).strict().superRefine((value, context) => {
  const { ledger_hash, ...body } = value;
  if (hash(body) !== ledger_hash || hash(value.attempt_policy) !== value.attempt_policy_hash)
    context.addIssue({ code: "custom", message: "Non-convergence ledger hash mismatch" });
  const attempts = value.attempts.map(({ attempt_id }) => attempt_id);
  if (new Set(attempts).size !== attempts.length)
    context.addIssue({ code: "custom", message: "Duplicate attempt identity" });
});
export type NonConvergenceLedger = z.infer<typeof NonConvergenceLedgerSchema>;

export function proposalSemanticFingerprint(value: unknown) {
  const parsed = NormalizedProposalSemanticsSchema.parse(value);
  return hash({ ...parsed,
    decisions: sorted(parsed.decisions, (item) => `${item.subject_id}:${item.decision}:${item.target_id}`),
    resulting_concept_or_policy: parsed.resulting_concept_or_policy && {
      ...parsed.resulting_concept_or_policy,
      obligation_or_definition: undefined,
      semantic_atom_ids: [...parsed.resulting_concept_or_policy.semantic_atom_ids].sort(),
      support_ids: [...parsed.resulting_concept_or_policy.support_ids].sort() },
    lineage: sorted(parsed.lineage, (item) =>
      `${item.subject_id}:${item.source_release_id}:${item.raw_concept_id}`),
    comparisons: sorted(parsed.comparisons, (item) =>
      `${item.subject_id}:${item.target_id}:${item.relationship}`) });
}

export function createNonConvergenceLedger(input: { ledger_id: string; gap_fingerprint: string;
  fact_id: string; earliest_incomplete_layer: "raw_source_vocabulary" | "canonical_vocabulary" |
  "policy_taxonomy"; attempt_policy: unknown;
  supersedes_ledger_id?: string | null }) {
  Hash.parse(input.gap_fingerprint);
  const policy = KnowledgeAttemptPolicySchema.parse(input.attempt_policy);
  return make({ schema_version: "1.0.0", ledger_id: input.ledger_id,
    gap_fingerprint: input.gap_fingerprint, fact_id: input.fact_id,
    earliest_incomplete_layer: input.earliest_incomplete_layer, attempt_policy: policy,
    attempt_policy_hash: hash(policy), attempts: [], suspension_reason: null,
    supersedes_ledger_id: input.supersedes_ledger_id ?? null });
}
export function createSuccessorConvergenceLedger(previousValue: unknown, input: {
  ledger_id: string; gap_fingerprint: string; fact_id: string;
  earliest_incomplete_layer: "raw_source_vocabulary" | "canonical_vocabulary" | "policy_taxonomy";
  attempt_policy: unknown }) {
  const previous = NonConvergenceLedgerSchema.parse(previousValue);
  if (input.gap_fingerprint === previous.gap_fingerprint)
    throw new Error("Successor convergence history requires changed governed gap fingerprint");
  return createNonConvergenceLedger({ ...input, supersedes_ledger_id: previous.ledger_id });
}

export function recordBoundedAttempt(ledgerValue: unknown, input: { attempt_id: string;
  proposal_semantics: unknown; prior_review?: { outcome: "NOT ACCEPTED";
    required_finding_ids: string[] } }) {
  const ledger = NonConvergenceLedgerSchema.parse(ledgerValue);
  if (ledger.suspension_reason) throw new Error("Suspended convergence ledger cannot retry");
  if (input.prior_review && input.prior_review.required_finding_ids.length === 0)
    throw new Error("Retry after NOT ACCEPTED requires bounded REQUIRED findings");
  if (ledger.attempts.length >= ledger.attempt_policy.max_attempts)
    return suspend(ledger, "ATTEMPT_EXHAUSTED");
  const fingerprint = proposalSemanticFingerprint(input.proposal_semantics);
  if (ledger.attempts.some(({ proposal_fingerprint }) => proposal_fingerprint === fingerprint))
    return suspend(ledger, "DUPLICATE_PROPOSAL");
  return make({ ...withoutHash(ledger), attempts: [...ledger.attempts,
    { attempt_id: input.attempt_id, proposal_fingerprint: fingerprint }] });
}

export function evaluateCoverageProgress(ledgerValue: unknown, input: {
  source_or_policy_gap: null | { fact_id: string; earliest_incomplete_layer: string;
    gap_fingerprint: string } }) {
  const ledger = NonConvergenceLedgerSchema.parse(ledgerValue);
  if (input.source_or_policy_gap === null) return { outcome: "KNOWLEDGE_CONVERGED" as const,
    ledger };
  Hash.parse(input.source_or_policy_gap.gap_fingerprint);
  const sameSemanticGap = input.source_or_policy_gap.fact_id === ledger.fact_id &&
    input.source_or_policy_gap.earliest_incomplete_layer === ledger.earliest_incomplete_layer;
  if (sameSemanticGap) return { outcome: "GOVERNED_SUSPENSION" as const,
    ledger: suspend(ledger, "NO_PROGRESS") };
  return { outcome: "PROGRESS" as const, ledger,
    next_gap_fingerprint: input.source_or_policy_gap.gap_fingerprint };
}

export function suspendForExternalCondition(ledgerValue: unknown,
  reason: "AUTHORITY_UNAVAILABLE" | "GOVERNED_SOURCE_UNAVAILABLE") {
  return suspend(NonConvergenceLedgerSchema.parse(ledgerValue), reason);
}
function suspend(ledger: NonConvergenceLedger, reason: z.infer<typeof Suspension>) {
  return make({ ...withoutHash(ledger), suspension_reason: reason });
}
function make(value: Omit<z.input<typeof NonConvergenceLedgerSchema>, "ledger_hash">) {
  return NonConvergenceLedgerSchema.parse({ ...value, ledger_hash: hash(value) });
}
function withoutHash(ledger: NonConvergenceLedger) { const { ledger_hash: _, ...body } = ledger;
  return body; }
function sorted<T>(items: T[], key: (value: T) => string) { return [...items].sort((a, b) =>
  key(a).localeCompare(key(b))); }
function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
