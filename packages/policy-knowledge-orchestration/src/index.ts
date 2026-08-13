import { createHash } from "node:crypto";
import { CoverageResultSchema, PolicyKnowledgeWorkflowSchema, startPolicyKnowledgeWorkflow } from
  "@company/ces-policy-knowledge-workflow";
import { recordKnowledgeAttempt, recordKnowledgeProposal, recordKnowledgeValidation,
  resumeKnowledgeWorkflow } from
  "@company/ces-policy-knowledge-workflow";
import { evaluateCoverageProgress, recordBoundedAttempt } from "@company/ces-policy-knowledge-workflow";
export { createGovernedNormalizedMeaningArtifact, createNonConvergenceLedger,
  governedSurfaceHash } from "@company/ces-policy-knowledge-workflow";
import { z } from "zod";
const LayerAgent = { raw_source_vocabulary: "ces.source-knowledge-agent",
  canonical_vocabulary: "ces.canonicalization-agent",
  policy_taxonomy: "ces.policy-taxonomy-agent" } as const;
const Support = z.object({ support_id: z.string().min(1), kind: z.enum(["source_candidate", "raw_concept",
  "canonical_concept", "policy"]), evidence_hash: z.string().regex(/^[0-9a-f]{64}$/u) }).strict();
const FactBranch = z.object({ fact_id: z.string().min(1), support: z.array(Support).min(1) }).strict();
export const KnowledgeGapRouteSchema = z.object({ fact_id: z.string().min(1), gap_id: z.string().min(1),
  earliest_incomplete_layer: z.enum(["raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  agent_id: z.enum(["ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]),
  support_branch: FactBranch, support_evidence_hash: z.string().regex(/^[0-9a-f]{64}$/u),
  workflow: z.unknown() }).strict();
export function routeCompleteCoverage(value: unknown, evidence: { occurred_at: string;
  expected_fact_count: number; fact_support: unknown[] }) {
  const coverage = CoverageResultSchema.parse(value);
  if (coverage.entries.length !== evidence.expected_fact_count)
    throw new Error("Coverage accounting does not match the governed fact inventory");
  return coverage.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP")
    .sort((a, b) => a.fact_id.localeCompare(b.fact_id)).map((entry, index) => {
      const layer = entry.earliest_incomplete_layer!; const gap_id = `gap.${entry.fact_id}`;
      const branches = evidence.fact_support.map((value) => FactBranch.parse(value));
      const support_branch = branches.find(({ fact_id }) => fact_id === entry.fact_id);
      if (!support_branch || branches.filter(({ fact_id }) => fact_id === entry.fact_id).length !== 1 ||
          new Set(support_branch.support.map(({ support_id }) => support_id)).size !== support_branch.support.length)
        throw new Error("Gap support is missing, duplicated, or belongs to another fact");
      const permitted = layer === "raw_source_vocabulary" ? ["source_candidate"] :
        layer === "canonical_vocabulary" ? ["raw_concept"] : ["canonical_concept"];
      if (support_branch.support.some(({ kind }) => !permitted.includes(kind)))
        throw new Error("Gap support does not match earliest incomplete layer");
      const boundedCoverage = { ...coverage, coverage_result_id: `${coverage.coverage_result_id}.route.${index + 1}`,
        entries: coverage.entries.map((candidate) => candidate.fact_id === entry.fact_id ? candidate :
          { ...candidate, disposition: candidate.disposition === "SOURCE_OR_POLICY_GAP"
            ? "DECISION_REQUIRED" as const : candidate.disposition, earliest_incomplete_layer: null }) };
      return KnowledgeGapRouteSchema.parse({ fact_id: entry.fact_id, gap_id, support_branch,
        support_evidence_hash: createHash("sha256").update(JSON.stringify(support_branch)).digest("hex"),
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
export function safaraSemanticProjection(value: { entries: readonly any[] }) { return value.entries
  .map((entry) => ({ fact_id: entry.demand_fact_id, disposition: entry.disposition,
    gap_route: entry.gap_route, policy_support: entry.policy_support,
    raw_support_ids: entry.raw_support_ids, source_support_candidates: entry.source_support_candidates }))
  .sort((a, b) => a.fact_id.localeCompare(b.fact_id)); }
export function safaraSemanticFingerprint(value: { entries: readonly any[] }) { return createHash("sha256")
  .update(JSON.stringify(safaraSemanticProjection(value))).digest("hex"); }
type Route = z.infer<typeof KnowledgeGapRouteSchema>;
const at = "2026-08-13T00:00:00+00:00";
export async function executeGapToReviewSuspension(routeValue: unknown,
  executeAgent: (agentId: Route["agent_id"], factId: string,
    supportBranch: z.infer<typeof FactBranch>) => Promise<{
    attempt_id: string; proposal_id: string; proposal_hash: string; validation_id: string;
    validation_status: "valid" | "invalid" }>) {
  const route = KnowledgeGapRouteSchema.parse(routeValue); const result = await executeAgent(
    route.agent_id, route.fact_id, route.support_branch);
  let workflow = recordKnowledgeAttempt(route.workflow, { attempt_id: result.attempt_id,
    event_id: `event.${route.fact_id}.attempt`, evidence_id: `evidence.${route.fact_id}.attempt`, occurred_at: at });
  workflow = recordKnowledgeProposal(workflow, { attempt_id: result.attempt_id, proposal_id: result.proposal_id,
    proposal_hash: result.proposal_hash, event_id: `event.${route.fact_id}.proposal`,
    evidence_id: `evidence.${route.fact_id}.proposal`, occurred_at: at });
  return recordKnowledgeValidation(workflow, { proposal_id: result.proposal_id, proposal_hash: result.proposal_hash,
    validation_id: result.validation_id, status: result.validation_status,
    event_id: `event.${route.fact_id}.validation`, evidence_id: `evidence.${route.fact_id}.validation`, occurred_at: at });
}
export function consumeAcceptedAuthority(workflow: unknown, externalAuthorityWorkflow: unknown,
  input: { resume_id: string }) {
  const suspended = PolicyKnowledgeWorkflowSchema.parse(workflow);
  const authority = PolicyKnowledgeWorkflowSchema.parse(externalAuthorityWorkflow);
  if (authority.workflow_id !== suspended.workflow_id || authority.proposal_id !== suspended.proposal_id ||
      authority.proposal_hash !== suspended.proposal_hash || !authority.publication_id ||
      !authority.publication_artifact_hash || !authority.publication_authority_evidence_id ||
      !["ACCEPTED", "ACCEPTED WITH DEFERRED ITEMS"].includes(authority.review_outcome ?? "") ||
      authority.events.length <= suspended.events.length ||
      JSON.stringify(authority.events.slice(0, suspended.events.length)) !== JSON.stringify(suspended.events))
    throw new Error("External authority does not extend the exact suspended workflow");
  return resumeKnowledgeWorkflow(authority, { resume_id: input.resume_id,
    publication_id: authority.publication_id, artifact_hash: authority.publication_artifact_hash,
    event_id: `event.${input.resume_id}`, evidence_id: input.resume_id, occurred_at: at });
}
export function evaluatePostPublicationRerun(ledger: unknown, source_or_policy_gap: Parameters<
  typeof evaluateCoverageProgress>[1]["source_or_policy_gap"]) { const result = evaluateCoverageProgress(ledger,
  { source_or_policy_gap }); return { ...result, should_execute_agent: result.outcome === "PROGRESS" }; }
export const recordReplayAttempt = recordBoundedAttempt;
