/**
 * Pure, provider-neutral boundary for consuming an accepted-context decision.
 * The verification mechanism and its authority state must be injected by an
 * independently owned authority. This module never issues, stores, redeems, or
 * mutates decisions.
 */

export type AcceptedContextLocator = {
  readonly slot: string;
  readonly canonicalLocator: string;
};

export type AcceptedContextAsset = {
  readonly assetId: string;
  readonly assetSourceId: string;
  readonly assetSha256: string;
};

export type AcceptedContextBinding = {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
  readonly documentId: string;
  readonly sourceSha256: string;
  readonly perceptionExecutionId: string;
  readonly semanticExecutionId?: string;
  readonly relationshipLineageId: string;
  readonly relationshipRevisionHash: string;
  readonly ownedSource: AcceptedContextLocator;
  readonly contextSource: AcceptedContextLocator;
  readonly contextAsset: AcceptedContextAsset;
  readonly contextualRole: "title" | "legend" | "scope" | "interpretation";
  readonly necessity: "essential" | "optional";
};

export type AuthenticatedAcceptedContextDecision = {
  readonly version: "atlas.accepted-context-decision/v1";
  readonly issuerId: string;
  readonly decisionId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly authorizationState: "accepted";
  readonly binding: AcceptedContextBinding;
};

export type AuthenticatedAuthorityState = {
  readonly version: "atlas.accepted-context-authority-state/v1";
  readonly issuerId: string;
  readonly fetchedAt: string;
  readonly expiresAt: string;
  readonly decisions: Readonly<Record<string, "authorized" | "invalid" | "replayed" | "revoked">>;
};

/** Implemented by a separately owned authority; the verifier never trusts raw inputs directly. */
export interface AcceptedContextVerificationMechanism {
  readonly mechanismId: string;
  verify(input: { readonly rawDecision: unknown; readonly rawAuthorityState: unknown }):
    | { readonly decision: AuthenticatedAcceptedContextDecision; readonly authorityState: AuthenticatedAuthorityState }
    | undefined;
}

export type VerifiedAcceptedContextDecision = Readonly<{
  decisionId: string;
  issuerId: string;
  binding: AcceptedContextBinding;
  verifiedAt: string;
}>;

const reject = (reason: string): never => { throw new Error(`ACCEPTED_CONTEXT_REJECTED: ${reason}`); };
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const timestamp = (value: unknown): number | undefined => nonEmpty(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : undefined;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sha256 = (value: string) => /^[a-f0-9]{64}$/.test(value);

function validBinding(binding: AcceptedContextBinding): boolean {
  const strings = [binding.projectId, binding.workspaceId, binding.bundleId, binding.documentId, binding.sourceSha256, binding.perceptionExecutionId, binding.relationshipLineageId, binding.relationshipRevisionHash, binding.ownedSource.slot, binding.ownedSource.canonicalLocator, binding.contextSource.slot, binding.contextSource.canonicalLocator, binding.contextAsset.assetId, binding.contextAsset.assetSourceId, binding.contextAsset.assetSha256];
  return strings.every(nonEmpty)
    && sha256(binding.sourceSha256)
    && sha256(binding.relationshipRevisionHash)
    && sha256(binding.contextAsset.assetSha256)
    && binding.ownedSource.slot !== binding.contextSource.slot
    && binding.ownedSource.canonicalLocator !== binding.contextSource.canonicalLocator
    && (!binding.semanticExecutionId || nonEmpty(binding.semanticExecutionId));
}

/**
 * Verifies raw material through the injected authority mechanism, then validates
 * exact same-snapshot identity and fresh authority status. Repeating a valid
 * call has no effect; only trusted state can mark a use invalid or replayed.
 */
export function verifyAcceptedContextDecision(input: {
  readonly rawDecision: unknown;
  readonly rawAuthorityState: unknown;
  readonly expectedBinding: AcceptedContextBinding;
  readonly mechanism: AcceptedContextVerificationMechanism;
  readonly now: string;
}): VerifiedAcceptedContextDecision {
  if (!nonEmpty(input.mechanism.mechanismId) || !validBinding(input.expectedBinding)) reject("malformed verifier input.");
  const verified = input.mechanism.verify({ rawDecision: input.rawDecision, rawAuthorityState: input.rawAuthorityState });
  if (!verified) return reject("decision or authority state was not authenticated.");
  const { decision, authorityState } = verified;
  if (decision.version !== "atlas.accepted-context-decision/v1" || authorityState.version !== "atlas.accepted-context-authority-state/v1") reject("unsupported authenticated contract version.");
  if (!nonEmpty(decision.issuerId) || !nonEmpty(decision.decisionId) || decision.issuerId !== authorityState.issuerId || decision.authorizationState !== "accepted") reject("issuer or authorization state is invalid.");
  if (!validBinding(decision.binding) || !same(decision.binding, input.expectedBinding)) reject("authenticated decision does not exactly bind the requested source snapshot.");
  const now = timestamp(input.now); const issuedAt = timestamp(decision.issuedAt); const decisionExpiry = timestamp(decision.expiresAt); const fetchedAt = timestamp(authorityState.fetchedAt); const stateExpiry = timestamp(authorityState.expiresAt);
  if (now === undefined || issuedAt === undefined || decisionExpiry === undefined || fetchedAt === undefined || stateExpiry === undefined || issuedAt > now || decisionExpiry <= now || fetchedAt > now || stateExpiry <= now) reject("decision or authority state is expired, stale, or malformed.");
  const status = authorityState.decisions[decision.decisionId];
  if (status !== "authorized") reject("trusted authority state does not authorize this decision use.");
  return Object.freeze({ decisionId: decision.decisionId, issuerId: decision.issuerId, binding: decision.binding, verifiedAt: input.now });
}
