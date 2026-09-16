/** Persistence-neutral contracts. Domain records are intentionally deferred. */
export interface RepositoryTransaction {
  readonly commit: () => Promise<void>;
  readonly rollback: () => Promise<void>;
}

export interface TransactionRunner {
  transaction<T>(work: (transaction: RepositoryTransaction) => Promise<T>): Promise<T>;
}

export { normalizePerceptionResult, type PerceptionProviderResult, type PerceptionProvenance } from "./document-perception.js";
export { PerceptionSourceGrantIssuer, type PerceptionSourceIdentity, type RedeemedPerceptionSource } from "./source-grant.js";
export { readVerifiedPerceptionSource, type ImmutablePerceptionSource, type SourceReader } from "./source-handoff.js";
export { AtlasPerceptionHandoff, type PerceptionOperation, type PerceptionOperationState, type StartPerceptionOperation } from "./perception-handoff.js";
