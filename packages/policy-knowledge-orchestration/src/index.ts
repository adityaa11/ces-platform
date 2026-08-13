import { createHash } from "node:crypto";
import { CoverageResultSchema, startPolicyKnowledgeWorkflow } from
  "@company/ces-policy-knowledge-workflow";
import { recordKnowledgeAttempt, recordKnowledgeProposal, recordKnowledgeValidation,
  recordKnowledgeReview, recordAcceptedPublication, resumeKnowledgeWorkflow } from
  "@company/ces-policy-knowledge-workflow";
import { z } from "zod";
const LayerAgent = { raw_source_vocabulary: "ces.source-knowledge-agent",
  canonical_vocabulary: "ces.canonicalization-agent",
  policy_taxonomy: "ces.policy-taxonomy-agent" } as const;
export const KnowledgeGapRouteSchema = z.object({ fact_id: z.string().min(1), gap_id: z.string().min(1),
  earliest_incomplete_layer: z.enum(["raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  agent_id: z.enum(["ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]),
  workflow: z.unknown() }).strict();
export function routeCompleteCoverage(value: unknown, evidence: { occurred_at: string;
  expected_fact_count: number }) {
  const coverage = CoverageResultSchema.parse(value);
  if (coverage.entries.length !== evidence.expected_fact_count)
    throw new Error("Coverage accounting does not match the governed fact inventory");
  return coverage.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP")
    .sort((a, b) => a.fact_id.localeCompare(b.fact_id)).map((entry, index) => {
      const layer = entry.earliest_incomplete_layer!; const gap_id = `gap.${entry.fact_id}`;
      const boundedCoverage = { ...coverage, coverage_result_id: `${coverage.coverage_result_id}.route.${index + 1}`,
        entries: coverage.entries.map((candidate) => candidate.fact_id === entry.fact_id ? candidate :
          { ...candidate, disposition: candidate.disposition === "SOURCE_OR_POLICY_GAP"
            ? "DECISION_REQUIRED" as const : candidate.disposition, earliest_incomplete_layer: null }) };
      return KnowledgeGapRouteSchema.parse({ fact_id: entry.fact_id, gap_id,
        earliest_incomplete_layer: layer, agent_id: LayerAgent[layer], workflow:
        startPolicyKnowledgeWorkflow({ workflow_id: `workflow.${entry.fact_id}`, gap_id,
          coverage_result: boundedCoverage, event_id: `event.${entry.fact_id}.start`,
          evidence_id: `evidence.${entry.fact_id}.coverage`, occurred_at: evidence.occurred_at }) });
    });
}
export function retainMaterialFactSupport<T extends { fact_id: string }>(factId: string,
  support: readonly T[]) { const selected = support.filter(({ fact_id }) => fact_id === factId);
  if (selected.length === 0) throw new Error(`No material support for ${factId}`); return selected; }
export function semanticCoverageFingerprint(value: unknown) {
  const coverage = CoverageResultSchema.parse(value); return createHash("sha256").update(JSON.stringify({
    entries: coverage.entries, revisions: coverage.revisions })).digest("hex"); }
type Route = z.infer<typeof KnowledgeGapRouteSchema>;
const at = "2026-08-13T00:00:00+00:00";
export async function executeGapToReviewSuspension(routeValue: unknown,
  executeAgent: (agentId: Route["agent_id"], factId: string) => Promise<{
    attempt_id: string; proposal_id: string; proposal_hash: string; validation_id: string;
    validation_status: "valid" | "invalid" }>) {
  const route = KnowledgeGapRouteSchema.parse(routeValue); const result = await executeAgent(route.agent_id, route.fact_id);
  let workflow = recordKnowledgeAttempt(route.workflow, { attempt_id: result.attempt_id,
    event_id: `event.${route.fact_id}.attempt`, evidence_id: `evidence.${route.fact_id}.attempt`, occurred_at: at });
  workflow = recordKnowledgeProposal(workflow, { attempt_id: result.attempt_id, proposal_id: result.proposal_id,
    proposal_hash: result.proposal_hash, event_id: `event.${route.fact_id}.proposal`,
    evidence_id: `evidence.${route.fact_id}.proposal`, occurred_at: at });
  return recordKnowledgeValidation(workflow, { proposal_id: result.proposal_id, proposal_hash: result.proposal_hash,
    validation_id: result.validation_id, status: result.validation_status,
    event_id: `event.${route.fact_id}.validation`, evidence_id: `evidence.${route.fact_id}.validation`, occurred_at: at });
}
export function consumeAcceptedAuthority(workflow: unknown, input: { review_id: string; reviewed_commit: string;
  artifact_hash: string; publication_id: string; authority_evidence_id: string; resume_id: string }) {
  let next = recordKnowledgeReview(workflow, { review_id: input.review_id, outcome: "ACCEPTED", review_round: 1,
    predecessor_review_id: null, reviewed_commit: input.reviewed_commit, reviewed_artifact_hash: input.artifact_hash,
    required_finding_ids: [], reviewed_finding_ids: [], qualifying_regression: false,
    event_id: `event.${input.review_id}`, evidence_id: input.review_id, occurred_at: at });
  next = recordAcceptedPublication(next, { publication_id: input.publication_id, review_id: input.review_id,
    reviewed_commit: input.reviewed_commit, artifact_hash: input.artifact_hash,
    authority_evidence_id: input.authority_evidence_id, event_id: `event.${input.publication_id}`,
    evidence_id: input.authority_evidence_id, occurred_at: at });
  return resumeKnowledgeWorkflow(next, { resume_id: input.resume_id, publication_id: input.publication_id,
    artifact_hash: input.artifact_hash, event_id: `event.${input.resume_id}`, evidence_id: input.resume_id, occurred_at: at });
}
