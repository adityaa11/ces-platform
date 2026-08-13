import { createHash } from "node:crypto";
import { CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1 } from "@company/ces-policy-source-glossary/core-sources";
import { CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import type { GovernedSourceResolver } from "./agent.js";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const surface = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
// Committed bounded rows from the authorized pinned ASVS CSV artifact. This is source input,
// independent from the accepted v1.2 extraction successor used only by golden tests.
const SOURCE_ROWS = [{ locator: "v5.0.0-V14.1.1", source_term: "Data Protection Documentation",
  excerpt: "Verify that all sensitive data created and processed by the application is identified and classified into protection levels that account for applicable data-protection and privacy requirements, including easily decoded data.",
  semantic_role: "requirement" as const, scope_disposition: "software_relevant" as const },
{ locator: "v5.0.0-V14.2.6", source_term: "General Data Protection",
  excerpt: "Verify that the application returns only the minimum sensitive data required for its functionality and, when complete data is required, masks it in the user interface unless the user specifically views it.",
  semantic_role: "requirement" as const, scope_disposition: "software_relevant" as const },
{ locator: "v5.0.0-V14.2.1", source_term: "General Data Protection",
  excerpt: "Verify that sensitive data is not placed in URLs or query strings and is sent only in appropriate HTTP message locations.",
  semantic_role: "requirement" as const, scope_disposition: "software_relevant" as const }];
export const RAW_V1_1_ARTIFACT_ID = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.corpus_id;
export const RAW_V1_1_ARTIFACT_HASH = hash(CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1);
export const resolveAcceptedGovernedSource: GovernedSourceResolver = (envelope) => {
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
  const artifact = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.artifacts.find(({ release_id }) => release_id === releaseId);
  const row = SOURCE_ROWS.find((item) => item.locator === locator);
  if (!artifact || !row) throw new Error("Exact governed source material is unavailable");
  const predecessors = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies.flatMap(({ concepts }) => concepts);
  const equivalent = predecessors.find((concept) => surface(concept.bounded_description) === surface(row.excerpt));
  return { source_release_id: releaseId, source_locator: locator, source_term: row.source_term,
    exact_source_excerpt: row.excerpt, semantic_role: row.semantic_role,
    scope_disposition: row.scope_disposition, governed_source_artifact_id: `artifact.${releaseId}.csv`,
    governed_source_content_hash: artifact.sha256, predecessor_artifact_id: RAW_V1_1_ARTIFACT_ID,
    predecessor_artifact_hash: RAW_V1_1_ARTIFACT_HASH, rights_evidence_id: `rights.${releaseId}.cc-by-sa-4-0`,
    authorization_evidence_id: `authorization.${releaseId}.pol-000-r01`,
    equivalent_predecessor_concept_id: equivalent?.concept_id ?? null };
};
