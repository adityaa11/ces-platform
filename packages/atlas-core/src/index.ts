/** Persistence-neutral contracts. Domain records are intentionally deferred. */
export interface RepositoryTransaction {
  readonly commit: () => Promise<void>;
  readonly rollback: () => Promise<void>;
}

export interface TransactionRunner {
  transaction<T>(work: (transaction: RepositoryTransaction) => Promise<T>): Promise<T>;
}
