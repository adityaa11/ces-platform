import { createHash } from "node:crypto";
import { z } from "zod";
import { PolicyKnowledgeWorkflowSchema } from "./index.js";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const Suspension = z.enum(["DUPLICATE_PROPOSAL", "NO_PROGRESS", "ATTEMPT_EXHAUSTED",
  "AUTHORITY_UNAVAILABLE", "GOVERNED_SOURCE_UNAVAILABLE"]);

export const KnowledgeAttemptPolicySchema = z.object({ policy_id: Id, policy_version: Revision,
  max_attempts: z.number().int().positive(), reviewer_evidence_id: Id }).strict();
const MeaningAtom = z.object({ atom_id: Id, modality: z.enum(["require", "prohibit", "permit"]),
  predicate: Id, object: Id, qualifier_ids: z.array(Id) }).strict();
export const GovernedNormalizedMeaningArtifactSchema = z.object({ artifact_id: Id,
  lifecycle: z.literal("accepted"), meaning_id: Id, semantic_atoms: z.array(MeaningAtom).min(1),
  evidence_surface_hashes: z.array(Hash).min(1), reviewer_evidence_id: Id,
  artifact_hash: Hash }).strict().superRefine((value, context) => {
  const { artifact_hash, ...body } = value;
  if (hash(body) !== artifact_hash) context.addIssue({ code: "custom",
    message: "Normalized meaning artifact hash mismatch" });
});
export type GovernedMeaningResolver = (artifactId: string) => unknown;
export const NormalizedProposalSemanticsSchema = z.object({ layer: z.enum([
  "raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  decisions: z.array(z.object({ subject_id: Id, decision: z.enum(["ADD", "MERGE", "REJECT"]),
    target_id: Id.nullable() }).strict()).min(1), resulting_concept_or_policy: z.object({ id: Id,
    obligation_or_definition: z.string().trim().min(1), normalized_meaning_artifact_id: Id,
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

export function createGovernedNormalizedMeaningArtifact(input: Omit<z.input<
  typeof GovernedNormalizedMeaningArtifactSchema>, "artifact_hash">) {
  return GovernedNormalizedMeaningArtifactSchema.parse({ ...input, artifact_hash: hash(input) });
}
export function governedSurfaceHash(value: string) { return hash(normalizeSurface(value)); }
export function proposalSemanticFingerprint(value: unknown, resolveMeaning: GovernedMeaningResolver) {
  const parsed = NormalizedProposalSemanticsSchema.parse(value);
  const result = parsed.resulting_concept_or_policy;
  const meaning = result ? GovernedNormalizedMeaningArtifactSchema.parse(
    resolveMeaning(result.normalized_meaning_artifact_id)) : null;
  if (result && (!meaning || meaning.artifact_id !== result.normalized_meaning_artifact_id ||
      !meaning.evidence_surface_hashes.includes(governedSurfaceHash(result.obligation_or_definition))))
    throw new Error("Proposal wording is not bound to the accepted normalized meaning artifact");
  return hash({ ...parsed,
    decisions: sorted(parsed.decisions, (item) => `${item.subject_id}:${item.decision}:${item.target_id}`),
    resulting_concept_or_policy: parsed.resulting_concept_or_policy && {
      id: parsed.resulting_concept_or_policy.id, meaning_id: meaning!.meaning_id,
      semantic_atoms: sorted(meaning!.semantic_atoms, (item) => item.atom_id).map((atom) =>
        ({ ...atom, qualifier_ids: [...atom.qualifier_ids].sort() })),
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
  proposal_semantics: unknown; resolve_meaning: GovernedMeaningResolver;
  authorization: { kind: "INITIAL" } | { kind: "NOT_ACCEPTED_REMEDIATION";
    workflow: unknown; review_id: string } }) {
  const ledger = NonConvergenceLedgerSchema.parse(ledgerValue);
  if (ledger.suspension_reason) throw new Error("Suspended convergence ledger cannot retry");
  assertAttemptAuthority(ledger, input.authorization);
  if (ledger.attempts.length >= ledger.attempt_policy.max_attempts)
    return suspend(ledger, "ATTEMPT_EXHAUSTED");
  const fingerprint = proposalSemanticFingerprint(input.proposal_semantics, input.resolve_meaning);
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
    input.source_or_policy_gap.earliest_incomplete_layer === ledger.earliest_incomplete_layer &&
    input.source_or_policy_gap.gap_fingerprint === ledger.gap_fingerprint;
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
function assertAttemptAuthority(ledger: NonConvergenceLedger,
  authorization: { kind: "INITIAL" } | { kind: "NOT_ACCEPTED_REMEDIATION";
    workflow: unknown; review_id: string }) {
  if (authorization.kind === "INITIAL") {
    if (ledger.attempts.length !== 0) throw new Error("Only the first attempt may use initial authority");
    return;
  }
  const workflow = PolicyKnowledgeWorkflowSchema.parse(authorization.workflow);
  if (ledger.attempts.length === 0 || workflow.state !== "GOVERNED_SUSPENSION" ||
      workflow.review_id !== authorization.review_id || workflow.review_outcome !== "NOT ACCEPTED" ||
      workflow.required_finding_ids.length === 0 || !workflow.gap ||
      workflow.gap.gap_fingerprint !== ledger.gap_fingerprint)
    throw new Error("Retry requires authoritative bounded NOT ACCEPTED review state");
}
function normalizeSurface(value: string) { return value.normalize("NFKC").toLowerCase()
  .replace(/[^a-z0-9]+/gu, " ").trim().replace(/\s+/gu, " "); }
function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
