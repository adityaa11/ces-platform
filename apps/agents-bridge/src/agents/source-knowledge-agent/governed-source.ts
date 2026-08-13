import { createHash } from "node:crypto";
import { CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1, sourceGovernanceDecisionEvidenceId,
  sourceGovernanceRightsEvidenceId } from "@company/ces-policy-source-glossary/core-sources";
import { CES_POLICY_ASVS_GOVERNED_SOURCE_ROWS_V1, GovernedSourceRowArtifactSchema,
  type GovernedSourceRowArtifact } from "@company/ces-policy-source-vocabulary/governed-source-rows";
import { CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import type { GovernedSourceResolver } from "./agent.js";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const RAW_V1_1_ARTIFACT_ID = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.corpus_id;
export const RAW_V1_1_ARTIFACT_HASH = hash(CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1);
type Predecessor = typeof CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1;
export function resolveGovernedSource(envelope: Parameters<GovernedSourceResolver>[0],
  rowInput: GovernedSourceRowArtifact = CES_POLICY_ASVS_GOVERNED_SOURCE_ROWS_V1,
  predecessor: Predecessor = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1) {
  const rowArtifact = GovernedSourceRowArtifactSchema.parse(rowInput);
  if (envelope.request.layer !== "raw_source_vocabulary" || envelope.governed_context.source_glossary_revision !== "1.1.0" ||
      envelope.governed_context.predecessor_artifact_id !== RAW_V1_1_ARTIFACT_ID ||
      envelope.governed_context.predecessor_artifact_hash !== RAW_V1_1_ARTIFACT_HASH)
    throw new Error("Request does not pin the governed raw v1.1 predecessor");
  if (envelope.request.governed_source_release_ids.length !== 1 || envelope.request.source_locator_candidates.length !== 1)
    throw new Error("Source extraction must be bounded to one locator");
  const releaseId = envelope.request.governed_source_release_ids[0]!;
  const locator = envelope.request.source_locator_candidates[0]!;
  const governance = CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1.governance.find(({ release_id }) => release_id === releaseId);
  if (!governance || governance.corpus_activation !== "ACTIVE" || governance.processing.structured_extraction !== "AUTHORIZED" ||
      governance.processing.ai_assisted_analysis !== "AUTHORIZED") throw new Error("Source release is not authorized for agent-assisted extraction");
  const artifact = predecessor.artifacts.find(({ release_id }) => release_id === releaseId);
  const row = rowArtifact.release_id === releaseId ? rowArtifact.rows.find((item) => item.locator === locator) : undefined;
  if (!artifact || !row || artifact.sha256 !== rowArtifact.upstream_artifact_hash)
    throw new Error("Exact governed source material is unavailable or unbound");
  const predecessors = predecessor.vocabularies.flatMap(({ concepts }) => concepts);
  const signature = JSON.stringify(row.semantic_atoms);
  const governedEquivalent = rowArtifact.predecessor_meanings.find(({ semantic_atoms }) =>
    JSON.stringify(semantic_atoms) === signature);
  const equivalent = governedEquivalent && predecessors.find(({ concept_id }) =>
    concept_id === governedEquivalent.concept_id);
  return { source_release_id: releaseId, source_locator: locator, source_term: row.source_term,
    exact_source_excerpt: row.exact_excerpt, semantic_role: row.semantic_role,
    scope_disposition: row.scope_disposition, governed_source_artifact_id: rowArtifact.artifact_id,
    governed_source_content_hash: rowArtifact.content_hash, predecessor_artifact_id: RAW_V1_1_ARTIFACT_ID,
    predecessor_artifact_hash: RAW_V1_1_ARTIFACT_HASH,
    rights_evidence_id: sourceGovernanceRightsEvidenceId(releaseId),
    authorization_evidence_id: sourceGovernanceDecisionEvidenceId(releaseId, governance.decision.revision_id),
    equivalent_predecessor_concept_id: equivalent?.concept_id ?? null };
}
export const resolveAcceptedGovernedSource: GovernedSourceResolver = (envelope) => resolveGovernedSource(envelope);
