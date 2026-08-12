import { CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 } from
  "@company/ces-policy-source-vocabulary/representative-corpus";
import { CanonicalVocabularySchema,
  rawConceptIdentityKey, validateCanonicalVocabularyAgainstRawConcepts,
  validateCanonicalVocabularySuccessor } from "./index.js";

const PROPOSED_AT = "2026-08-12T01:00:00+00:00" as const;
const APPROVED_AT = "2026-08-12T04:00:00+00:00" as const;
const APPROVAL_EVIDENCE_ID = "CES-GF-POL-007-H01" as const;

const concepts = [
  { concept_id: "ces.access-authorization", meaning_version: "1.0.0",
    preferred_term: "Access authorization", semantic_kind: "obligation",
    lifecycle: "candidate", aliases: ["access enforcement"],
    definition: "Access to software resources is governed and enforced according to approved authorizations." },
  { concept_id: "ces.security-event-logging", meaning_version: "1.0.0",
    preferred_term: "Security event logging", semantic_kind: "obligation",
    lifecycle: "candidate", aliases: ["event logging"],
    definition: "Security-relevant events are recorded to support monitoring and investigation." },
  { concept_id: "ces.recoverable-known-state", meaning_version: "1.0.0",
    preferred_term: "Recovery to a known state", semantic_kind: "obligation",
    lifecycle: "candidate", aliases: ["system recovery and reconstitution"],
    definition: "Software and its restoration assets support verified recovery to a known trustworthy state." },
  { concept_id: "ces.transaction-integrity", meaning_version: "1.0.0",
    preferred_term: "Transaction integrity", semantic_kind: "obligation",
    lifecycle: "candidate", aliases: ["atomic business operation"],
    definition: "A security-relevant business operation completes consistently or returns to its prior correct state." },
  { concept_id: "ces.object-authorization-bypass", meaning_version: "1.0.0",
    preferred_term: "Object authorization bypass", semantic_kind: "concern",
    lifecycle: "candidate", aliases: ["insecure direct object reference"],
    definition: "A subject may access a resource when object-level authorization is not enforced." },
  { concept_id: "ces.object-authorization-testing", meaning_version: "1.0.0",
    preferred_term: "Object authorization testing", semantic_kind: "verification_context",
    lifecycle: "candidate", aliases: [],
    definition: "Verification identifies object references and tests whether access controls enforce subject authorization." },
  { concept_id: "ces.session-expiration-testing", meaning_version: "1.0.0",
    preferred_term: "Session expiration testing", semantic_kind: "verification_context",
    lifecycle: "candidate", aliases: ["session timeout testing"],
    definition: "Verification tests hard session expiry and rejection of destroyed session identifiers." },
] as const;

const mappings = [
  ["ces.access-authorization", "raw.nist-csf.pr-aa-05", "nist.csf.2-0", "supports",
    "The CSF outcome defines management and enforcement of approved access permissions."],
  ["ces.access-authorization", "raw.nist-sp800-53.ac-3", "nist.sp-800-53.r5-2-0", "supports",
    "AC-3 expresses enforcement of approved logical-access authorizations."],
  ["ces.security-event-logging", "raw.nist-sp800-53.au-2", "nist.sp-800-53.r5-2-0", "supports",
    "AU-2 supplies the event-selection and investigation meaning without importing its source schema."],
  ["ces.security-event-logging", "raw.nist-csf.de-cm-01", "nist.csf.2-0", "partial_support",
    "Network monitoring reinforces detection awareness but does not by itself define event logging."],
  ["ces.recoverable-known-state", "raw.nist-sp800-53.cp-10", "nist.sp-800-53.r5-2-0", "supports",
    "CP-10 directly supports recovery and reconstitution to a known state."],
  ["ces.recoverable-known-state", "raw.nist-csf.rc-rp-03", "nist.csf.2-0", "partial_support",
    "Restoration-asset integrity supports trustworthy recovery while remaining a distinct source outcome."],
  ["ces.transaction-integrity", "raw.asvs.v2-3-3", "owasp.asvs.5-0-0", "supports",
    "The ASVS requirement directly expresses complete-or-rollback transaction behavior."],
  ["ces.object-authorization-bypass", "raw.wstg.athz-04.concern", "owasp.wstg.4-2", "expresses_concern",
    "The raw WSTG concern describes unauthorized resource exposure through object references."],
  ["ces.object-authorization-testing", "raw.wstg.athz-04.context", "owasp.wstg.4-2", "verifies",
    "The raw test context supplies verification perspective and is not merged with the concern."],
  ["ces.session-expiration-testing", "raw.wstg.sess-07", "owasp.wstg.4-2", "verifies",
    "The WSTG scenario supplies the session-expiration verification context."],
].map(([canonical_concept_id, raw_concept_id, raw_source_release_id, relationship, rationale]) =>
  ({ canonical_concept_id, raw_concept_id, raw_source_release_id, relationship, rationale }));

const decisions = [
  { decision_id: "decision.pol-007.merge.access-authorization", decision_kind: "merge",
    status: "proposed",
    affected_canonical_concept_ids: ["ces.access-authorization"],
    affected_raw_concept_ids: ["raw.nist-csf.pr-aa-05", "raw.nist-sp800-53.ac-3"],
    rationale: "The source concepts share stable authorization-enforcement meaning; source-specific details remain in mappings.",
    proposed_at: PROPOSED_AT, reviewed_at: null, reviewer_evidence_id: null },
  { decision_id: "decision.pol-007.split.object-authorization", decision_kind: "split",
    status: "proposed",
    affected_canonical_concept_ids: ["ces.object-authorization-bypass", "ces.object-authorization-testing"],
    affected_raw_concept_ids: ["raw.wstg.athz-04.concern", "raw.wstg.athz-04.context"],
    rationale: "A risk concern and a verification context are semantically distinct even when they share a WSTG scenario.",
    proposed_at: PROPOSED_AT, reviewed_at: null, reviewer_evidence_id: null },
  { decision_id: "decision.pol-007.alias.idor", decision_kind: "alias",
    status: "proposed",
    affected_canonical_concept_ids: ["ces.object-authorization-bypass"],
    affected_raw_concept_ids: ["raw.wstg.athz-04.concern"],
    rationale: "The source term remains a searchable alias without becoming a second canonical concept.",
    proposed_at: PROPOSED_AT, reviewed_at: null, reviewer_evidence_id: null },
] as const;

const catalogValue = {
  schema_version: "1.0.0", vocabulary_id: "ces-policy-canonical-vocabulary",
  vocabulary_revision: "1.0.0", predecessor_revision: null, vocabulary_status: "candidate",
  concepts, mappings, decisions,
};

export function buildRepresentativeCanonicalVocabulary() {
  const rawConcepts = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
    .flatMap(({ concepts: values }) => values);
  return validateCanonicalVocabularyAgainstRawConcepts(catalogValue, rawConcepts);
}

export function replaceRawMappingForSourceRenumbering(
  vocabularyValue: unknown,
  previous: { raw_concept_id: string; raw_source_release_id: string },
  replacement: { raw_concept_id: string; raw_source_release_id: string },
  nextRevision: string,
) {
  const vocabulary = CanonicalVocabularySchema.parse(vocabularyValue);
  let replacementCount = 0;
  const previousKey = rawConceptIdentityKey(previous);
  const mappings = vocabulary.mappings.map((mapping) => {
    if (rawConceptIdentityKey(mapping) !== previousKey) return mapping;
    replacementCount += 1;
    return { ...mapping, ...replacement,
      rationale: `${mapping.rationale} Mapping locator updated for source renumbering.` };
  });
  if (replacementCount === 0) {
    throw new Error(`Raw mapping ${previous.raw_source_release_id}/${previous.raw_concept_id} was not found`);
  }
  const successor = CanonicalVocabularySchema.parse({ ...vocabulary,
    vocabulary_revision: nextRevision, predecessor_revision: vocabulary.vocabulary_revision,
    mappings });
  return validateCanonicalVocabularySuccessor(vocabulary, successor).successor;
}

export function changeCanonicalConceptLifecycle(
  vocabularyValue: unknown,
  conceptId: string,
  lifecycle: "candidate" | "approved" | "retired",
  nextRevision: string,
) {
  const vocabulary = CanonicalVocabularySchema.parse(vocabularyValue);
  let replacementCount = 0;
  const concepts = vocabulary.concepts.map((concept) => {
    if (concept.concept_id !== conceptId) return concept;
    replacementCount += 1;
    return { ...concept, lifecycle };
  });
  if (replacementCount === 0) throw new Error(`Canonical concept ${conceptId} was not found`);
  const successor = CanonicalVocabularySchema.parse({ ...vocabulary,
    vocabulary_revision: nextRevision, predecessor_revision: vocabulary.vocabulary_revision,
    concepts });
  return validateCanonicalVocabularySuccessor(vocabulary, successor).successor;
}

export const CES_POLICY_CANONICAL_VOCABULARY_V1 = buildRepresentativeCanonicalVocabulary();

export function approveRepresentativeCanonicalVocabulary() {
  const candidate = CES_POLICY_CANONICAL_VOCABULARY_V1;
  const successor = CanonicalVocabularySchema.parse({
    ...candidate,
    vocabulary_revision: "1.1.0",
    predecessor_revision: candidate.vocabulary_revision,
    vocabulary_status: "approved",
    concepts: candidate.concepts.map((concept) => ({ ...concept, lifecycle: "approved" })),
    decisions: candidate.decisions.map((decision) => ({ ...decision, status: "approved",
      reviewed_at: APPROVED_AT, reviewer_evidence_id: APPROVAL_EVIDENCE_ID })),
  });
  const transition = validateCanonicalVocabularySuccessor(candidate, successor);
  if (!transition.lifecycle_changed || transition.mapping_changed) {
    throw new Error("POL-007 approval must change lifecycle without changing source mappings");
  }
  const rawConcepts = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
    .flatMap(({ concepts: values }) => values);
  return validateCanonicalVocabularyAgainstRawConcepts(successor, rawConcepts);
}

export const CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1 =
  approveRepresentativeCanonicalVocabulary();

export function resolveCanonicalSourceLineage(canonicalConceptId: string) {
  const vocabulary = CES_POLICY_APPROVED_CANONICAL_VOCABULARY_V1_1;
  const rawConcepts = CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1.vocabularies
    .flatMap(({ concepts: values }) => values);
  return vocabulary.mappings
    .filter(({ canonical_concept_id }) => canonical_concept_id === canonicalConceptId)
    .map((mapping) => {
      const raw = rawConcepts.find(({ concept_id, source_release_id }) =>
        concept_id === mapping.raw_concept_id &&
        source_release_id === mapping.raw_source_release_id);
      if (!raw) throw new Error(`Missing raw lineage for ${mapping.raw_concept_id}`);
      return { mapping, raw_concept: raw };
    });
}
