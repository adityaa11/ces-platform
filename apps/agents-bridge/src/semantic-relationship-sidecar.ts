import { relationshipContractVersion, relationshipSha256, type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity, type RelationshipSourceLocator, type TrustedFinalizationSlot } from "@atlas/skills";

type ParsedSemanticProposal = {
  readonly source_results: readonly { readonly slot: string; readonly candidates: readonly unknown[] }[];
};

export type RelationshipFinalizationSlot = TrustedFinalizationSlot & { readonly content?: string };
export type CandidateTuple = { readonly source_slot: string; readonly candidate_index: number };
export type DeferredDependentInterpretationV1 = {
  readonly deferred_interpretation_id: string;
  readonly relationship_revision_hash: string;
  readonly provider_candidate_tuple: CandidateTuple;
  readonly source: { readonly owned_source: RelationshipSourceLocator; readonly context_source: RelationshipSourceLocator };
  readonly uncertainty: ContextSourceRelationshipRevisionV1["uncertainty"];
  readonly proposed_candidate_meaning: unknown;
  readonly reason: "essential_provisional_relationship";
  readonly canonical_candidate_id: null;
};
export type PreparedDeferredDependentInterpretations = {
  readonly deferred_interpretations: readonly DeferredDependentInterpretationV1[];
  readonly independent_candidate_tuples: readonly CandidateTuple[];
  readonly optional_relationship_tuples: readonly CandidateTuple[];
};

function reject(message: string): never { throw new Error(`REL-03 deferred interpretation preparation failed: ${message}`); }
const tupleKey = (slot: string, index: number) => `${slot}\u0000${index}`;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const relationshipRoles = new Set(["title", "legend", "scope", "interpretation"]);
const relationshipNecessities = new Set(["essential", "optional"]);
const uncertainties = new Set(["low", "medium", "high", "unknown"]);
const relationshipRelations = new Set(["refines", "challenges", "replaces"]);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const expected = new Set(keys);
  return Object.keys(value).length === expected.size && Object.keys(value).every((key) => expected.has(key));
};
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isSha256 = (value: unknown): value is string => typeof value === "string" && sha256Pattern.test(value);
const tupleFromKey = (key: string): CandidateTuple => {
  const [source_slot, rawIndex] = key.split("\u0000");
  return { source_slot: source_slot!, candidate_index: Number(rawIndex) };
};
function sameScope(left: RelationshipPacketIdentity, right: RelationshipPacketIdentity) {
  return left.projectId === right.projectId && left.workspaceId === right.workspaceId && left.bundleId === right.bundleId && left.documentId === right.documentId && left.executionId === right.executionId && left.artifactId === right.artifactId && left.sourceSha256 === right.sourceSha256;
}
function sameAsset(left: TrustedFinalizationSlot["assetIdentity"], right: RelationshipSourceLocator["assetIdentity"]) {
  if (left === undefined || right === undefined) return left === right;
  return left.assetRef === right.assetRef && left.sha256 === right.sha256 && left.sourceSha256 === right.sourceSha256;
}
function sameLocator(slot: TrustedFinalizationSlot, locator: RelationshipSourceLocator) {
  return slot.slot === locator.slot && slot.pageNumber === locator.pageNumber && slot.locatorType === locator.locatorType && slot.locatorId === locator.locatorId && slot.sourceSha256 === locator.sourceSha256 && sameAsset(slot.assetIdentity, locator.assetIdentity);
}
function validateScope(scope: RelationshipPacketIdentity) {
  if (!isRecord(scope) || !hasExactKeys(scope, ["projectId", "workspaceId", "bundleId", "documentId", "executionId", "artifactId", "sourceSha256"]) || !Object.values(scope).every(isNonEmptyString) || !isSha256(scope.sourceSha256)) reject("packet scope is malformed.");
}
function validateAssetIdentity(asset: TrustedFinalizationSlot["assetIdentity"], sourceSha256: string, required: boolean) {
  if (asset === undefined) {
    if (required) reject("visual source locator is missing its asset identity.");
    return;
  }
  if (!isRecord(asset) || !hasExactKeys(asset, ["assetRef", "sha256", "sourceSha256"]) || !isNonEmptyString(asset.assetRef) || !isSha256(asset.sha256) || asset.sourceSha256 !== sourceSha256) reject("source locator asset identity is malformed or foreign.");
}
function validateSlot(slot: TrustedFinalizationSlot, scope: RelationshipPacketIdentity) {
  if (!isRecord(slot) || !hasExactKeys(slot, ["slot", "pageNumber", "locatorType", "locatorId", "sourceSha256", ...(slot.role === undefined ? [] : ["role"]), ...(slot.assetIdentity === undefined ? [] : ["assetIdentity"])]) || !isNonEmptyString(slot.slot) || !Number.isSafeInteger(slot.pageNumber) || slot.pageNumber < 1 || !isNonEmptyString(slot.locatorId) || !isSha256(slot.sourceSha256) || slot.sourceSha256 !== scope.sourceSha256) reject("trusted source slots are malformed, duplicate, or outside the supplied scope.");
  if (!["text_block", "table", "visual_region"].includes(slot.locatorType)) reject("trusted source slot locator type is unsupported.");
  if (slot.role !== undefined && !["owned_source", "reference_context", "pending_authorized_media"].includes(slot.role)) reject("trusted source slot role is unsupported.");
  validateAssetIdentity(slot.assetIdentity, scope.sourceSha256, slot.locatorType === "visual_region");
  if (slot.locatorType !== "visual_region" && slot.assetIdentity !== undefined) reject("non-visual source slot carries an asset identity.");
}
function validateLocator(locator: RelationshipSourceLocator, scope: RelationshipPacketIdentity) {
  if (!isRecord(locator) || !hasExactKeys(locator, ["slot", "pageNumber", "locatorType", "locatorId", "sourceSha256", ...(locator.assetIdentity === undefined ? [] : ["assetIdentity"])]) || !isNonEmptyString(locator.slot) || !Number.isSafeInteger(locator.pageNumber) || locator.pageNumber < 1 || !isNonEmptyString(locator.locatorId) || !isSha256(locator.sourceSha256) || locator.sourceSha256 !== scope.sourceSha256) reject("relationship source locator is malformed or foreign.");
  if (!["text_block", "table", "visual_region"].includes(locator.locatorType)) reject("relationship source locator type is unsupported.");
  validateAssetIdentity(locator.assetIdentity, scope.sourceSha256, locator.locatorType === "visual_region");
  if (locator.locatorType !== "visual_region" && locator.assetIdentity !== undefined) reject("non-visual relationship locator carries an asset identity.");
}
function validateRevision(revision: ContextSourceRelationshipRevisionV1, scope: RelationshipPacketIdentity, slots: ReadonlyMap<string, TrustedFinalizationSlot>) {
  if (!isRecord(revision) || !hasExactKeys(revision, ["contractVersion", "relationshipLineageId", "revisionHash", "scope", "normalizedDocument", "ownedSource", "contextSource", "relationship", "disposition", "uncertainty", "proposedMeaning", "sourceLanguage", "candidateRefs", "proposalProvenance", "predecessor", "authorization"])) reject("relationship revision structure is malformed.");
  if (revision.contractVersion !== relationshipContractVersion || !isSha256(revision.relationshipLineageId) || !isSha256(revision.revisionHash)) reject("relationship revision identity is malformed.");
  if (!sameScope(revision.scope, scope)) reject("relationship revision scope is foreign.");
  if (!isRecord(revision.normalizedDocument) || !hasExactKeys(revision.normalizedDocument, ["executionId", "artifactId", "sourceSha256"]) || revision.normalizedDocument.executionId !== scope.executionId || revision.normalizedDocument.artifactId !== scope.artifactId || revision.normalizedDocument.sourceSha256 !== scope.sourceSha256) reject("relationship revision normalized-document identity does not match scope.");
  validateLocator(revision.ownedSource, scope); validateLocator(revision.contextSource, scope);
  if (revision.ownedSource.slot === revision.contextSource.slot) reject("relationship revision uses one source for both roles.");
  const owner = slots.get(revision.ownedSource.slot); const context = slots.get(revision.contextSource.slot);
  if (!owner || !context || (owner.role ?? "owned_source") !== "owned_source" || !sameLocator(owner, revision.ownedSource) || !sameLocator(context, revision.contextSource)) reject("relationship revision source references are foreign, mismatched, or unowned.");
  if (!isRecord(revision.relationship) || !hasExactKeys(revision.relationship, ["type", "direction", "contextualRole", "necessity"]) || revision.relationship.type !== "context_qualifies" || revision.relationship.direction !== "context_to_owned" || !relationshipRoles.has(revision.relationship.contextualRole) || !relationshipNecessities.has(revision.relationship.necessity)) reject("relationship revision vocabulary is malformed or unsupported.");
  if (revision.disposition !== "proposed" || !uncertainties.has(revision.uncertainty) || !isNonEmptyString(revision.proposedMeaning) || revision.proposedMeaning.length > 20_000 || (revision.sourceLanguage !== null && (!isNonEmptyString(revision.sourceLanguage) || revision.sourceLanguage.length > 64))) reject("relationship revision provisional fields are malformed.");
  if (!Array.isArray(revision.candidateRefs) || revision.candidateRefs.length > 10_000 || revision.candidateRefs.some((candidateRef) => {
    if (!isRecord(candidateRef) || !hasExactKeys(candidateRef, ["sourceSlot", "candidateIndex"])) return true;
    return !isNonEmptyString(candidateRef.sourceSlot) || candidateRef.sourceSlot.length > 200 || typeof candidateRef.candidateIndex !== "number" || !Number.isSafeInteger(candidateRef.candidateIndex) || candidateRef.candidateIndex < 0;
  })) reject("relationship revision candidate references are malformed.");
  if (!isRecord(revision.proposalProvenance) || !hasExactKeys(revision.proposalProvenance, ["providerIdentity", "providerRun", "providerRelationshipOrdinal", "confidence"]) || !isNonEmptyString(revision.proposalProvenance.providerIdentity) || !isNonEmptyString(revision.proposalProvenance.providerRun) || !Number.isSafeInteger(revision.proposalProvenance.providerRelationshipOrdinal) || revision.proposalProvenance.providerRelationshipOrdinal < 0 || revision.proposalProvenance.confidence !== null) reject("relationship revision provenance is malformed.");
  if (revision.predecessor !== null && (!isRecord(revision.predecessor) || !hasExactKeys(revision.predecessor, ["relationshipRevisionHash", "relation"]) || !isSha256(revision.predecessor.relationshipRevisionHash) || !relationshipRelations.has(revision.predecessor.relation))) reject("relationship revision predecessor is malformed.");
  if (revision.authorization !== null) reject("relationship revision carries authorization.");
  const { revisionHash: _revisionHash, ...immutable } = revision;
  try {
    if (relationshipSha256({ scope: revision.scope, ownedSource: revision.ownedSource, contextSource: revision.contextSource, relationship: revision.relationship }) !== revision.relationshipLineageId || relationshipSha256(immutable) !== revision.revisionHash) reject("relationship revision hash does not match immutable content.");
  } catch { reject("relationship revision cannot be canonically hashed."); }
}

/** Produces draft-only descriptors from strictly parsed meaning and immutable REL-02 revisions. */
export function prepareDeferredDependentInterpretations(input: {
  readonly semanticProposal: ParsedSemanticProposal;
  readonly sourceSlots: readonly TrustedFinalizationSlot[];
  readonly scope: RelationshipPacketIdentity;
  readonly provisionalRelationshipRevisions: readonly ContextSourceRelationshipRevisionV1[];
}): PreparedDeferredDependentInterpretations {
  validateScope(input.scope);
  if (!Array.isArray(input.sourceSlots) || !Array.isArray(input.semanticProposal?.source_results) || !Array.isArray(input.provisionalRelationshipRevisions)) reject("pure REL-03 inputs are malformed.");
  const slots = new Map<string, TrustedFinalizationSlot>();
  for (const slot of input.sourceSlots) {
    validateSlot(slot, input.scope);
    if (slots.has(slot.slot)) reject("trusted source slots are malformed, duplicate, or outside the supplied scope.");
    slots.set(slot.slot, slot);
  }
  const results = new Map<string, (typeof input.semanticProposal.source_results)[number]>();
  for (const result of input.semanticProposal.source_results) {
    const slot = slots.get(result.slot);
    if (!slot || slot.role === "reference_context" || slot.role === "pending_authorized_media" || results.has(result.slot)) reject("semantic proposal has a foreign, unowned, or duplicate source result.");
    results.set(result.slot, result);
  }
  for (const slot of slots.values()) if ((slot.role ?? "owned_source") === "owned_source" && !results.has(slot.slot)) reject("semantic proposal omitted an owned source result.");

  const allCandidateTuples = new Set<string>();
  for (const result of results.values()) for (const [candidateIndex] of result.candidates.entries()) allCandidateTuples.add(tupleKey(result.slot, candidateIndex));
  const revisions = new Set<string>();
  const classifiedTuples = new Map<string, { readonly revision: ContextSourceRelationshipRevisionV1; readonly necessity: "essential" | "optional" }>();
  for (const revision of input.provisionalRelationshipRevisions) {
    validateRevision(revision, input.scope, slots);
    if (revisions.has(revision.revisionHash)) reject("relationship revisions are duplicate or missing an immutable revision hash.");
    revisions.add(revision.revisionHash);
    for (const candidateRef of revision.candidateRefs) {
      const key = tupleKey(candidateRef.sourceSlot, candidateRef.candidateIndex);
      if (!Number.isSafeInteger(candidateRef.candidateIndex) || candidateRef.candidateIndex < 0 || !allCandidateTuples.has(key) || candidateRef.sourceSlot !== revision.ownedSource.slot) reject("relationship revision has an out-of-range, mismatched, or foreign candidate tuple.");
      if (classifiedTuples.has(key)) reject("relationship revisions have duplicate or conflicting candidate tuple dependencies.");
      classifiedTuples.set(key, { revision, necessity: revision.relationship.necessity });
    }
  }

  const deferred_interpretations: DeferredDependentInterpretationV1[] = [];
  const optional_relationship_tuples: CandidateTuple[] = [];
  for (const [key, dependency] of [...classifiedTuples.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (dependency.necessity === "optional") { optional_relationship_tuples.push(tupleFromKey(key)); continue; }
    const tuple = tupleFromKey(key); const candidate = results.get(tuple.source_slot)?.candidates[tuple.candidate_index];
    if (candidate === undefined) reject("essential relationship candidate tuple is not locally resolvable.");
    deferred_interpretations.push({
      deferred_interpretation_id: relationshipSha256({ scope: input.scope, sourceSlot: tuple.source_slot, candidateIndex: tuple.candidate_index, relationshipRevisionHash: dependency.revision.revisionHash }),
      relationship_revision_hash: dependency.revision.revisionHash, provider_candidate_tuple: tuple,
      source: { owned_source: dependency.revision.ownedSource, context_source: dependency.revision.contextSource }, uncertainty: dependency.revision.uncertainty,
      proposed_candidate_meaning: candidate, reason: "essential_provisional_relationship", canonical_candidate_id: null,
    });
  }
  const independent_candidate_tuples = [...allCandidateTuples].filter((key) => !classifiedTuples.has(key)).sort().map(tupleFromKey);
  return { deferred_interpretations, independent_candidate_tuples, optional_relationship_tuples };
}

/**
 * Compatibility guard for the pre-existing worker candidate.  The integrated
 * composition is outside this GO authorization and must fail closed until its
 * separately owned durable/worker path is qualified.
 */
export async function finalizeRelationshipExtractionEnvelope(_input: unknown): Promise<{ readonly canonicalResult: never }> {
  reject("integrated finalization is not authorized by the REL-03 pure-interface prerequisite.");
}
