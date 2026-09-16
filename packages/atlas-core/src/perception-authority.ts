import type { DocumentPerceptionRequest, NormalizedDocument } from "@atlas/contracts";

/**
 * Atlas's persistence-neutral boundary for document perception. Implementations
 * own operational state and source storage references; callers never receive a
 * storage key or a database handle.
 */
export type PerceptionExecutionInput = {
  readonly executionId: string;
  readonly artifactId: string;
  readonly storageKey: string;
  readonly sourceSha256: string;
  readonly mimeType: "application/pdf";
  readonly byteSize: number;
  readonly idempotencyKey: string;
  readonly capabilityIdentity: string;
};

export type AuthorityRedeemedPerceptionSource = {
  readonly executionId: string;
  readonly artifactId: string;
  readonly sourceSha256: string;
  readonly mimeType: "application/pdf";
  readonly byteSize: number;
  /** Atlas-only: this value must never cross the internal HTTP boundary. */
  readonly storageKey: string;
};

export interface PerceptionAuthority {
  create(input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest>;
  redeem(input: Pick<DocumentPerceptionRequest, "executionId" | "artifact" | "source">): Promise<AuthorityRedeemedPerceptionSource>;
  deliver(request: DocumentPerceptionRequest, result: NormalizedDocument): Promise<void>;
  getCached(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<NormalizedDocument | undefined>;
  invalidateCache(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<void>;
}
