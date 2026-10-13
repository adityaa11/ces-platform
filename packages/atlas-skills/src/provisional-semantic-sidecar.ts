import { parseSemanticExtractionResult, type SemanticExtractionResult } from "@atlas/contracts";
import { createHash } from "node:crypto";
import { type StepwiseRelationshipEnvelopeRequest } from "./stepwise-extraction-request.js";

/** Offline-only companion record. It is deliberately not a Semantic V1 field. */
export const provisionalSemanticSidecarVersion = "atlas.semantic.provisional-sidecar/v1" as const;

export type ProvisionalSemanticScope = {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
  readonly documentId: string;
  readonly executionId: string;
  readonly sourceSha256: string;
};

export type ProvisionalRelationshipRevisionReference = {
  readonly revisionHash: string;
  readonly sourceSnapshot: { readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string };
};

export type ProvisionalSemanticSidecar = {
  readonly version: typeof provisionalSemanticSidecarVersion;
  readonly scope: ProvisionalSemanticScope;
  readonly semanticProfile: string;
  readonly requestSha256: string;
  readonly canonicalResultSha256: string;
  readonly sourceAccounting: readonly {
    readonly slot: string;
    readonly pageNumber: number;
    readonly locatorType: string;
    readonly locatorId: string;
    readonly disposition: "finalized_in_semantic_v1" | "pending_unexamined_visual" | "conditional_context";
  }[];
  readonly relationshipDependencies: readonly { readonly revisionHash: string; readonly disposition: "proposed" | "unresolved" }[];
  readonly unresolvedRelationshipRequirements: readonly { readonly ownedSourceSlot: string; readonly contextSourceSlot: string; readonly necessity: "essential" | "optional" }[];
  readonly authority: { readonly acceptedRelationshipAuthority: null; readonly masterMutation: false; readonly publishing: false; readonly reconciliationTruth: false };
  readonly sidecarHash: string;
};

type Lease = { readonly key: string; readonly generation: number };

const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  throw new Error("SCHEMA_FIT_BLOCKED: provisional sidecar must be JSON-serializable.");
};
const sha256 = (value: unknown) => createHash("sha256").update(stableJson(value)).digest("hex");
const reject = (message: string): never => { throw new Error(`PROVISIONAL_SIDECAR_REJECTED: ${message}`); };
const isHash = (value: string) => /^[a-f0-9]{64}$/.test(value);
const scopeKey = (scope: ProvisionalSemanticScope, idempotencyKey: string) => `${stableJson(scope)}\u0000${idempotencyKey}`;

function assertScope(scope: ProvisionalSemanticScope, request: StepwiseRelationshipEnvelopeRequest) {
  for (const [key, value] of Object.entries(scope)) if (!value) reject(`scope ${key} is missing.`);
  if (!isHash(scope.sourceSha256) || scope.sourceSha256 !== request.sourceSnapshot.sourceSha256) reject("scope source SHA does not match the request snapshot.");
  if (scope.documentId !== request.sourceSnapshot.artifactId) reject("scope document does not match the request artifact.");
}

/**
 * Prepares complete, attributable accounting without staging a durable result.
 * Canonical V1 carries only finalized owned sources; pending visuals and
 * provisional context are retained here rather than misclassified as non_fact.
 */
export function prepareProvisionalSemanticSidecar(input: {
  readonly scope: ProvisionalSemanticScope;
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly canonicalResult: unknown;
  readonly relationshipRevisions: readonly ProvisionalRelationshipRevisionReference[];
}): ProvisionalSemanticSidecar {
  assertScope(input.scope, input.request);
  const canonicalResult = parseSemanticExtractionResult(input.canonicalResult);
  const slots = new Map(input.request.sourceSlots.map((slot) => [slot.slot, slot]));
  if (slots.size !== input.request.sourceSlots.length) reject("request has duplicate source slots.");
  const inventory = new Map(canonicalResult.source_statement_inventory.map((item) => [`${item.page_number}\u0000${item.locator_type}\u0000${item.locator_id}`, item]));
  const eligible = input.request.sourceSlots.filter((slot) => slot.role === "owned_source" && slot.status === "ready");
  if (inventory.size !== canonicalResult.source_statement_inventory.length) reject("canonical result repeats a source inventory locator.");
  if (inventory.size !== eligible.length) reject("canonical result does not account for the exact finalized owned-source set.");
  for (const slot of eligible) if (!inventory.has(`${slot.pageNumber}\u0000${slot.locatorType}\u0000${slot.locatorId}`)) reject(`canonical result omits owned source slot ${slot.slot}.`);
  for (const slot of input.request.sourceSlots.filter((slot) => slot.role !== "owned_source" || slot.status !== "ready")) if (inventory.has(`${slot.pageNumber}\u0000${slot.locatorType}\u0000${slot.locatorId}`)) reject(`canonical result improperly accounts a pending or contextual slot ${slot.slot}.`);

  const extension = input.request.provisionalRelationships.relationships;
  const revisionByHash = new Map(input.relationshipRevisions.map((revision) => [revision.revisionHash, revision]));
  if (revisionByHash.size !== input.relationshipRevisions.length) reject("relationship revision references are duplicated.");
  for (const relationship of extension) {
    const revision = revisionByHash.get(relationship.revision_hash);
    if (!revision || !isHash(revision.revisionHash)) reject("relationship dependency is foreign or missing.");
    if (stableJson(revision!.sourceSnapshot) !== stableJson(input.request.sourceSnapshot)) reject("relationship dependency belongs to a foreign source snapshot.");
    const owned = slots.get(relationship.owned_source_slot); const context = slots.get(relationship.context_source_slot);
    if (!owned || !context || relationship.source_evidence_slots[0] !== owned.slot || relationship.source_evidence_slots[1] !== context.slot) reject("relationship dependency does not match request slots.");
  }
  if (revisionByHash.size !== extension.length) reject("a supplied relationship revision is not represented in the request extension.");
  const sourceAccounting = input.request.sourceSlots.map((slot) => ({ slot: slot.slot, pageNumber: slot.pageNumber, locatorType: slot.locatorType, locatorId: slot.locatorId, disposition: slot.status === "pending_unexamined_visual" ? "pending_unexamined_visual" as const : slot.role === "context_only_reference" ? "conditional_context" as const : "finalized_in_semantic_v1" as const }));
  const body = {
    version: provisionalSemanticSidecarVersion,
    scope: input.scope,
    semanticProfile: input.request.profile,
    requestSha256: input.request.requestSha256,
    canonicalResultSha256: sha256(canonicalResult),
    sourceAccounting,
    relationshipDependencies: extension.map((relationship) => ({ revisionHash: relationship.revision_hash, disposition: relationship.disposition })),
    unresolvedRelationshipRequirements: input.request.unresolvedRelationshipRequirements.map((item) => ({ ownedSourceSlot: item.ownedSourceSlot, contextSourceSlot: item.contextSourceSlot, necessity: item.necessity })),
    authority: { acceptedRelationshipAuthority: null, masterMutation: false, publishing: false, reconciliationTruth: false } as const,
  };
  return { ...body, sidecarHash: sha256(body) };
}

/** Deterministic fake only; it models the fenced winner/replay contract, not SQL durability. */
export class InMemoryProvisionalSemanticSidecarRepository {
  #generations = new Map<string, number>();
  #staged = new Map<string, ProvisionalSemanticSidecar>();
  acquireLease(scope: ProvisionalSemanticScope, idempotencyKey: string): Lease {
    const key = scopeKey(scope, idempotencyKey); const generation = (this.#generations.get(key) ?? 0) + 1;
    this.#generations.set(key, generation); return { key, generation };
  }
  stage(input: { readonly sidecar: ProvisionalSemanticSidecar; readonly idempotencyKey: string; readonly lease: Lease }): ProvisionalSemanticSidecar {
    const key = scopeKey(input.sidecar.scope, input.idempotencyKey);
    if (key !== input.lease.key || this.#generations.get(key) !== input.lease.generation) reject("stale lease generation.");
    const existing = this.#staged.get(key);
    if (existing && existing.sidecarHash !== input.sidecar.sidecarHash) reject("staged winner does not match replay sidecar.");
    const winner = existing ?? input.sidecar;
    if (!existing) this.#staged.set(key, winner);
    return winner;
  }
  acknowledge(input: { readonly sidecar: ProvisionalSemanticSidecar; readonly idempotencyKey: string; readonly failAfterCommit?: boolean }): ProvisionalSemanticSidecar {
    const existing = this.#staged.get(scopeKey(input.sidecar.scope, input.idempotencyKey));
    if (!existing || existing.sidecarHash !== input.sidecar.sidecarHash) reject("acknowledgement does not match staged winner.");
    if (input.failAfterCommit) throw new Error("ACK_LOSS_SIMULATED");
    return existing!;
  }
}
