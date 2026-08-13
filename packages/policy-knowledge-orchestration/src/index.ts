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
import { CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1,
  CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
const LayerAgent = { raw_source_vocabulary: "ces.source-knowledge-agent",
  canonical_vocabulary: "ces.canonicalization-agent",
  policy_taxonomy: "ces.policy-taxonomy-agent" } as const;
const Support = z.object({ support_id: z.string().min(1), kind: z.enum(["source_candidate", "raw_concept",
  "canonical_concept", "policy"]), evidence_hash: z.string().regex(/^[0-9a-f]{64}$/u),
  evidence: z.unknown() }).strict().superRefine((value, context) => { if (hash(value.evidence) !== value.evidence_hash)
    context.addIssue({ code: "custom", message: "Support evidence hash mismatch" }); });
const FactBranch = z.object({ fact_id: z.string().min(1), support: z.array(Support).min(1) }).strict();
export const KnowledgeGapRouteSchema = z.object({ fact_id: z.string().min(1), gap_id: z.string().min(1),
  earliest_incomplete_layer: z.enum(["raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  agent_id: z.enum(["ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]),
  support_branch: FactBranch, support_evidence_hash: z.string().regex(/^[0-9a-f]{64}$/u),
  workflow: z.unknown() }).strict().superRefine((value, context) => {
  if (value.support_branch.fact_id !== value.fact_id || hash(value.support_branch) !== value.support_evidence_hash)
    context.addIssue({ code: "custom", message: "Route support evidence does not bind its fact" });
});
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
function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export function governedSafaraFactSupport(coverage: { entries: readonly any[] }) {
  const raw = CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies.flatMap(({ concepts }) => concepts);
  const canonical = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5;
  return coverage.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP").map((entry) => {
    let support: z.input<typeof Support>[];
    if (entry.gap_route === "EXTRACTION_GAP") support = entry.source_support_candidates.map((candidate: unknown) => ({
      support_id: `source-candidate.${hash(candidate)}`, kind: "source_candidate" as const,
      evidence_hash: hash(candidate), evidence: candidate }));
    else if (entry.gap_route === "CANONICALIZATION_GAP") support = entry.raw_support_ids.map((id: string) => {
      const concept = raw.find(({ concept_id }) => concept_id === id); if (!concept) throw new Error(`Unknown raw support ${id}`);
      return { support_id: id, kind: "raw_concept" as const, evidence_hash: hash(concept), evidence: concept }; });
    else support = entry.raw_support_ids.map((rawId: string) => { const mapping = canonical.mappings.find(({ raw_concept_id }) =>
      raw_concept_id === rawId); const concept = mapping && canonical.concepts.find(({ concept_id }) =>
      concept_id === mapping.canonical_concept_id); if (!mapping || !concept) throw new Error(`Unknown canonical support for ${rawId}`);
      return { support_id: concept.concept_id, kind: "canonical_concept" as const,
        evidence_hash: hash({ mapping, concept }), evidence: { mapping, concept } }; });
    return FactBranch.parse({ fact_id: entry.demand_fact_id, support });
  });
}
export function acceptedPolicySupport(canonicalConceptId: string) {
  const taxonomies = [CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy,
    CES_POLICY_ACCEPTED_DATA_PROTECTION_DECISION_V1.artifact.taxonomy];
  for (const taxonomy of taxonomies) for (const policy of taxonomy.policies) {
    const selected = policy.canonical_support.filter(({ canonical_concept_id }) =>
      canonical_concept_id === canonicalConceptId);
    if (selected.length) return { policy_id: policy.policy_id, policy_revision: policy.policy_version,
      support_status: "candidate_only", canonical_concept_ids: [canonicalConceptId],
      source_lineage: selected.flatMap(({ canonical_concept_id }) => {
        const mapping = CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.mappings.find((item) =>
          item.canonical_concept_id === canonical_concept_id)!;
        const raw = CES_POLICY_ACCEPTED_TARGETED_EXTRACTION_CORPUS_V1_2.corpus.vocabularies
          .flatMap(({ concepts }) => concepts).find(({ concept_id }) => concept_id === mapping.raw_concept_id)!;
        return [{ canonical_concept_id, raw_concept_id: mapping.raw_concept_id,
          source_release_id: mapping.raw_source_release_id, source_locator: raw.source_locator.locator }]; }) };
  }
  throw new Error(`No accepted Policy support for ${canonicalConceptId}`);
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
const AcceptedKnowledgePublicationSchema = z.object({ publication_id: z.string().min(1),
  authority_evidence_id: z.string().min(1), proposal_hash: z.string().regex(/^[0-9a-f]{64}$/u),
  agent_id: z.enum(["ces.source-knowledge-agent", "ces.canonicalization-agent", "ces.policy-taxonomy-agent"]),
  layer: z.enum(["raw_source_vocabulary", "canonical_vocabulary", "policy_taxonomy"]),
  source_locator: z.string().min(1).optional(), raw_concept_id: z.string().min(1).optional(),
  canonical_concept_id: z.string().min(1).optional(), policy_support: z.unknown().optional() }).strict();
export function applyAcceptedKnowledgePublication(coverageValue: any, publicationValue: unknown) {
  const publication = AcceptedKnowledgePublicationSchema.parse(publicationValue);
  const expectedAgent = LayerAgent[publication.layer];
  if (publication.agent_id !== expectedAgent) throw new Error("Publication agent does not own its knowledge layer");
  let changed = 0;
  const entries = coverageValue.entries.map((entry: any) => {
    if (publication.layer === "raw_source_vocabulary" && entry.gap_route === "EXTRACTION_GAP" &&
        entry.source_support_candidates.some(({ source_locator }: any) => source_locator === publication.source_locator)) {
      if (!publication.raw_concept_id) throw new Error("Raw publication lacks accepted raw identity"); changed++;
      return { ...entry, gap_route: "CANONICALIZATION_GAP", raw_support_ids: [publication.raw_concept_id] };
    }
    if (publication.layer === "canonical_vocabulary" && entry.gap_route === "CANONICALIZATION_GAP" &&
        entry.raw_support_ids.includes(publication.raw_concept_id)) {
      if (!publication.canonical_concept_id) throw new Error("Canonical publication lacks accepted identity"); changed++;
      return { ...entry, gap_route: "POLICY_GAP" };
    }
    if (publication.layer === "policy_taxonomy" && entry.gap_route === "POLICY_GAP") {
      const canonicalIds = (publication.policy_support as any)?.canonical_concept_ids ?? [];
      const mapped = entry.raw_support_ids.some((rawId: string) =>
        CES_POLICY_APPROVED_DATA_PROTECTION_CANONICAL_VOCABULARY_V1_5.mappings.some(({ raw_concept_id,
          canonical_concept_id }) => raw_concept_id === rawId && canonicalIds.includes(canonical_concept_id)));
      const sequential = entry.raw_support_ids.includes("raw.asvs.v2-3-1") &&
        canonicalIds.includes("ces.sequential-business-flow");
      if (mapped || sequential) { changed++; return { ...entry, disposition: "AWARENESS_EMITTED",
        gap_route: null, policy_support: [publication.policy_support], raw_support_ids: [],
        source_support_candidates: [] }; }
    }
    return entry;
  });
  if (changed === 0) throw new Error("Accepted publication makes no bounded coverage change");
  return { ...coverageValue, result_id: `${coverageValue.result_id}.${publication.publication_id}`, entries };
}
export async function runGovernedKnowledgeReplay(input: { initial_coverage: any;
  execute_registered_agent: (route: Route) => Promise<{ agent_id: Route["agent_id"];
    agent_version: string; support_evidence_hash: string; proposal_hash: string; proposal?: unknown }>;
  consume_external_publication: (route: Route, execution: { proposal_hash: string;
    proposal?: unknown }) => Promise<unknown>;
  max_cycles: number }) {
  let coverage = structuredClone(input.initial_coverage); const executions: { agent_id: string; fact_id: string }[] = [];
  for (let cycle = 0; cycle < input.max_cycles; cycle++) {
    const workflow = { coverage_result_id: coverage.result_id, status: "valid", completeness: "complete",
      revisions: { source_glossary_revision: "1.1.0", raw_vocabulary_revision: "1.2.0",
        canonical_vocabulary_revision: "1.5.0", policy_taxonomy_revision: "1.1.0" },
      entries: coverage.entries.map((entry: any) => ({ fact_id: entry.demand_fact_id,
        disposition: entry.disposition, earliest_incomplete_layer: entry.disposition !== "SOURCE_OR_POLICY_GAP" ? null :
          entry.gap_route === "EXTRACTION_GAP" ? "raw_source_vocabulary" : entry.gap_route === "CANONICALIZATION_GAP"
            ? "canonical_vocabulary" : "policy_taxonomy" })) };
    const routes = routeCompleteCoverage(workflow, { occurred_at: at, expected_fact_count: coverage.entries.length,
      fact_support: governedSafaraFactSupport(coverage) });
    if (routes.length === 0) return { coverage, executions };
    const route = routes[0]!; const result = await input.execute_registered_agent(route);
    if (result.agent_id !== route.agent_id || result.agent_version !== "1.0.0" ||
        result.support_evidence_hash !== route.support_evidence_hash)
      throw new Error("Registered execution evidence does not bind the routed agent and support");
    executions.push({ agent_id: route.agent_id, fact_id: route.fact_id });
    const publication = await input.consume_external_publication(route, result);
    coverage = applyAcceptedKnowledgePublication(coverage, publication);
  }
  throw new Error("Governed replay attempt budget exhausted");
}
