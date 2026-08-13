import { CanonicalKnowledgeRequestSchema, createPolicyKnowledgeAgentRequest } from
  "@company/ces-policy-knowledge-proposals";
import { CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1,
  CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3 } from
  "@company/ces-policy-canonical-vocabulary/representative-catalog";
import { CES_POLICY_REPRESENTATIVE_TAXONOMY_V1,
  CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1 } from
  "@company/ces-policy-taxonomy/representative-taxonomy";
import { RAW_V1_1_ARTIFACT_HASH, RAW_V1_1_ARTIFACT_ID } from "./source-knowledge-agent/governed-source.js";
import { canonicalPredecessorHash } from
  "./canonicalization-agent/governed-knowledge.js";
import { resolveAcceptedPolicyTaxonomyKnowledge } from "./policy-taxonomy-agent/governed-knowledge.js";
import type { z } from "zod";
import { KnowledgeGapRouteSchema } from "@company/ces-policy-knowledge-orchestration";
type Route = z.infer<typeof KnowledgeGapRouteSchema>;
export function acceptedSafaraAgentValue(route: Route) {
  const support: any = route.support_branch.support[0]!.evidence;
  const base = { schema_version: "1.0.0" as const, lifecycle: "proposed" as const,
    request_id: `request.replay.${route.fact_id.replaceAll(".", "-")}.${route.earliest_incomplete_layer}` };
  if (route.earliest_incomplete_layer === "raw_source_vocabulary") return { request:
    createPolicyKnowledgeAgentRequest({ ...base, governed_context: context(route, "1.1.0", "1.5.0", "1.1.0",
      RAW_V1_1_ARTIFACT_ID, RAW_V1_1_ARTIFACT_HASH), request: { layer: "raw_source_vocabulary",
      gap_route: "EXTRACTION_GAP", bounded_task: "Extract the exact fact-local authorized source row.",
      governed_source_release_ids: [support.source_release_id], source_locator_candidates: [support.source_locator],
      existing_raw_concept_ids: [] } }) };
  if (route.earliest_incomplete_layer === "canonical_vocabulary") {
    const raw = support; const sequential = raw.concept_id === "raw.asvs.v2-3-1";
    const predecessor = sequential ? CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 :
      CES_POLICY_APPROVED_SEQUENTIAL_FLOW_CANONICAL_VOCABULARY_V1_3;
    return { request: createPolicyKnowledgeAgentRequest({ ...base,
      governed_context: context(route, "1.2.0", predecessor.vocabulary_revision, "1.1.0",
        predecessor.vocabulary_id, canonicalPredecessorHash(predecessor)), request: CanonicalKnowledgeRequestSchema.parse({ layer: "canonical_vocabulary",
        gap_route: "CANONICALIZATION_GAP", bounded_task: "Canonicalize the exact accepted fact-local raw support.",
        accepted_raw_support: [{ source_release_id: raw.source_release_id,
          source_locator: raw.source_locator.locator, raw_concept_id: raw.concept_id }],
        existing_canonical_concept_ids: predecessor.concepts.map(({ concept_id }) => concept_id) }) }) };
  }
  const canonicalId = support.concept.concept_id; const sequential = canonicalId === "ces.sequential-business-flow";
  const predecessor = sequential ? CES_POLICY_REPRESENTATIVE_TAXONOMY_V1 :
    CES_POLICY_ACCEPTED_SEQUENTIAL_FLOW_DECISION_V1.artifact.taxonomy;
  const canonicalRevision = sequential ? "1.3.0" : "1.5.0";
  const request = createPolicyKnowledgeAgentRequest({ ...base, governed_context: context(route, "1.2.0",
    canonicalRevision, predecessor.taxonomy_revision, predecessor.taxonomy_id, canonicalPredecessorHash(predecessor)),
  request: { layer: "policy_taxonomy", gap_route: "POLICY_GAP",
    bounded_task: "Evaluate the exact approved fact-local canonical obligation.",
    approved_canonical_concept_ids: [canonicalId], predecessor_policy_ids: predecessor.policies.map(({ policy_id }) => policy_id) } });
  const governed = resolveAcceptedPolicyTaxonomyKnowledge(request);
  return { request, approved_canonical_obligations: governed.approved_canonical_obligations,
    predecessor_policies: governed.predecessor_policies };
}
function context(route: Route, raw: string, canonical: string, taxonomy: string,
  predecessor_artifact_id: string, predecessor_artifact_hash: string) { return {
  gap_id: route.gap_id, gap_fingerprint: "a".repeat(64), demand_fact_ids: [route.fact_id],
  source_glossary_revision: "1.1.0", raw_vocabulary_revision: raw,
  canonical_vocabulary_revision: canonical, policy_taxonomy_revision: taxonomy,
  predecessor_artifact_id, predecessor_artifact_hash }; }
