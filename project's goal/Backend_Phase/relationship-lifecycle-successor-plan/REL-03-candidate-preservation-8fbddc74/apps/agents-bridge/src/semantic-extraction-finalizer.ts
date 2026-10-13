import { parseSemanticExtractionResult, type SemanticExtractionResult } from "@atlas/contracts";
import { atlasProviderExtractionProposalV1Schema, type SourceLocatorType } from "@atlas/skills";

/**
 * The provider may propose meaning, but it never gets to name Atlas output
 * identities or evidence.  This module is intentionally pure so its trust
 * transition can be qualified independently of the worker/replay lifecycle.
 */
export type TrustedFinalizationSlot = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  /** Required for owned text/table/labelled-visual sources, not image-only context. */
  readonly content?: string;
  readonly role?: "owned_source" | "reference_context" | "pending_authorized_media";
};

export type AcceptedContextEvidence = {
  readonly ownedSourceSlot: string;
  readonly contextSourceSlot: string;
};

export type ExtractionFinalizationInput = {
  readonly proposal: unknown;
  readonly sourceSlots: readonly TrustedFinalizationSlot[];
  /** Already accepted Atlas context only; this function cannot attest one. */
  readonly acceptedContextEvidence?: readonly AcceptedContextEvidence[];
};

/** REL-03 uses this pure variant after its sidecar composition has identified
 * precisely which provider tuples depend on an essential provisional relation. */
export type DeferredCandidateTuple = { readonly sourceSlot: string; readonly candidateIndex: number };

const sourceUnitId = (slot: string) => `source-unit-${slot}`;
const candidateId = (slot: string, index: number) => `candidate-${slot}-${String(index + 1).padStart(3, "0")}`;

function fail(message: string): never {
  throw new Error(`Semantic extraction finalization failed: ${message}`);
}

function evidenceFor(slot: TrustedFinalizationSlot) {
  if (slot.locatorType === "visual_region") {
    return { page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId } as const;
  }
  // Canonical evidence has no truncation field.  An oversized trusted source
  // is therefore unrepresentable, rather than being silently shortened.
  const content = sourceContent(slot);
  if (content.length > 4_000) fail(`SCHEMA_FIT_BLOCKED: source slot ${slot.slot} exceeds the canonical evidence excerpt bound.`);
  return { page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId, excerpt: content } as const;
}

function sourceContent(slot: TrustedFinalizationSlot): string {
  if (!slot.content) fail(`owned source slot ${slot.slot} has no trusted source wording.`);
  return slot.content;
}

function validateTrustedSlots(sourceSlots: readonly TrustedFinalizationSlot[]) {
  const bySlot = new Map<string, TrustedFinalizationSlot>();
  for (const slot of sourceSlots) {
    if (!slot.slot) fail("a trusted finalization slot is empty.");
    if (bySlot.has(slot.slot)) fail(`duplicate trusted source slot ${slot.slot}.`);
    bySlot.set(slot.slot, slot);
  }
  return bySlot;
}

/**
 * Converts a strict, JSON-decoded provider proposal into canonical Semantic
 * V1.  It preserves provider meaning verbatim while deriving every Atlas-owned
 * identifier, source wording, evidence reference, and inventory entry locally.
 */
export function finalizeExtractionProposal(input: ExtractionFinalizationInput): SemanticExtractionResult {
  return finalizeExtractionProposalWithDeferredTuples(input, []);
}

export function finalizeExtractionProposalWithDeferredTuples(input: ExtractionFinalizationInput, deferredTuples: readonly DeferredCandidateTuple[]): SemanticExtractionResult {
  const proposal = atlasProviderExtractionProposalV1Schema.parse(input.proposal);
  const slotsById = validateTrustedSlots(input.sourceSlots);
  const ownedSlots = input.sourceSlots.filter((slot) => (slot.role ?? "owned_source") === "owned_source");
  const ownedById = new Map(ownedSlots.map((slot) => [slot.slot, slot]));

  const resultBySlot = new Map<string, (typeof proposal.source_results)[number]>();
  for (const sourceResult of proposal.source_results) {
    if (!ownedById.has(sourceResult.slot)) fail(`proposal supplied a non-owned, foreign, or dangling slot ${sourceResult.slot}.`);
    if (resultBySlot.has(sourceResult.slot)) fail(`proposal supplied duplicate source result ${sourceResult.slot}.`);
    resultBySlot.set(sourceResult.slot, sourceResult);
  }
  for (const slot of ownedSlots) if (!resultBySlot.has(slot.slot)) fail(`proposal omitted owned source slot ${slot.slot}.`);

  const deferred = new Set<string>();
  for (const tuple of deferredTuples) {
    const result = resultBySlot.get(tuple.sourceSlot);
    if (!result || !Number.isSafeInteger(tuple.candidateIndex) || tuple.candidateIndex < 0 || tuple.candidateIndex >= result.candidates.length) fail("SOURCE_RELATIONSHIP_BLOCKED: deferred tuple is not an exact parsed proposal candidate.");
    const key = `${tuple.sourceSlot}\u0000${tuple.candidateIndex}`;
    if (deferred.has(key)) fail("SOURCE_RELATIONSHIP_BLOCKED: duplicate deferred candidate tuple.");
    deferred.add(key);
  }

  const contextualEvidence = new Map<string, TrustedFinalizationSlot[]>();
  for (const relationship of input.acceptedContextEvidence ?? []) {
    const owner = ownedById.get(relationship.ownedSourceSlot);
    const context = slotsById.get(relationship.contextSourceSlot);
    if (!owner || !context || (context.role ?? "owned_source") !== "reference_context") fail("SOURCE_RELATIONSHIP_BLOCKED: contextual evidence is not an accepted owned-to-reference binding.");
    const existing = contextualEvidence.get(owner.slot) ?? [];
    if (existing.some((item) => item.slot === context.slot)) fail("SOURCE_RELATIONSHIP_BLOCKED: duplicate contextual evidence binding.");
    existing.push(context);
    contextualEvidence.set(owner.slot, existing);
  }

  const candidate_assertions: SemanticExtractionResult["candidate_assertions"] = [];
  const source_statement_inventory: SemanticExtractionResult["source_statement_inventory"] = [];
  const questions: SemanticExtractionResult["questions"] = [];

  for (const source of ownedSlots) {
    const proposalResult = resultBySlot.get(source.slot)!;
    const wording = sourceContent(source);
    const sourceEvidence = evidenceFor(source);
    const candidateIds: string[] = [];
    for (const [index, proposed] of proposalResult.candidates.entries()) {
      if (wording.length > 12_000) fail(`SCHEMA_FIT_BLOCKED: source slot ${source.slot} exceeds the canonical source wording bound.`);
      const local_candidate_id = candidateId(source.slot, index);
      if (deferred.has(`${source.slot}\u0000${index}`)) continue;
      candidateIds.push(local_candidate_id);
      const contextEvidence = (contextualEvidence.get(source.slot) ?? []).map(evidenceFor);
      candidate_assertions.push({
        local_candidate_id,
        semantic_key: proposed.semantic_key,
        kind: proposed.kind,
        payload: proposed.payload,
        normalized_meaning: proposed.normalized_meaning,
        source_wording: wording,
        needs_resolution: proposed.needs_resolution,
        evidence_refs: [sourceEvidence, ...contextEvidence],
      });
    }
    source_statement_inventory.push({
      source_unit_id: sourceUnitId(source.slot),
      page_number: source.pageNumber,
      locator_type: source.locatorType,
      locator_id: source.locatorId,
      classification: proposalResult.classification,
      destination_local_candidate_ids: candidateIds,
      ...(proposalResult.classification === "non_fact" ? { non_fact_reason: proposalResult.non_fact_reason! } : {}),
    });
    for (const question of proposalResult.questions) questions.push({ question: question.question, reason: question.reason, evidence_refs: [sourceEvidence] });
  }

  return parseSemanticExtractionResult({ version: "v1", candidate_assertions, source_statement_inventory, questions });
}
