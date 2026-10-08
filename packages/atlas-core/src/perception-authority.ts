import type { DocumentPerceptionRequest, DocumentPerceptionTechnicalFailure, NormalizedDocument } from "@atlas/contracts";

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

/** Metadata crosses the Bridge boundary; raw bytes travel separately. */
export type DerivedAssetDescriptor = {
  readonly sourceSha256: string;
  readonly profile: string;
  readonly pageNumber: number;
  readonly locatorId: string;
  readonly mediaType: "image/png";
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly sha256: string;
};

export type DerivedAssetAuthority = {
  handoffDerived(request: DocumentPerceptionRequest, descriptor: DerivedAssetDescriptor, bytes: Uint8Array): Promise<{ readonly assetRef: string }>;
  resolveDerived(input: { readonly callerUserId: string; readonly artifactId: string; readonly sourceSha256: string; readonly locatorId: string; readonly assetRef: string }): Promise<{ readonly bytes: Uint8Array; readonly mediaType: "image/png"; readonly byteLength: number; readonly sha256: string }>;
};

export interface PerceptionAuthority {
  create(input: PerceptionExecutionInput): Promise<DocumentPerceptionRequest>;
  redeem(input: Pick<DocumentPerceptionRequest, "executionId" | "artifact" | "source">): Promise<AuthorityRedeemedPerceptionSource>;
  deliver(request: DocumentPerceptionRequest, result: NormalizedDocument): Promise<void>;
  fail(failure: DocumentPerceptionTechnicalFailure): Promise<void>;
  getCached(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<NormalizedDocument | undefined>;
  invalidateCache(input: Pick<NormalizedDocument, "sourceSha256" | "perception"> & { readonly capabilityIdentity: string }): Promise<void>;
}
