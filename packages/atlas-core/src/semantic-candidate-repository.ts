/**
 * Read-only, persistence-neutral view of validated incoming semantics.  These
 * records deliberately do not expose any resolved-knowledge or projection
 * state: IDSER-006 materializes candidates only.
 */
export type SemanticCandidateScope = {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
};

export type SemanticEvidenceRecord = {
  readonly pageNumber: number;
  readonly locatorType: "text_block" | "table" | "visual_region";
  readonly locatorId: string;
  readonly excerpt: string | null;
};

export type SemanticCandidateRecord = {
  /** Stable Atlas semantic identity, suitable for bounded later retrieval. */
  readonly semanticId: string;
  readonly candidateId: string;
  readonly documentId: string;
  readonly semanticKey: string;
  readonly kind: string;
  readonly payload: unknown;
  readonly normalizedMeaning: string;
  readonly sourceWording: string | null;
  readonly needsResolution: boolean;
};

export type SemanticCandidateQuery = SemanticCandidateScope & {
  readonly documentId?: string;
  readonly semanticKey?: string;
  readonly kind?: string;
  /** The implementation clamps this value to the semantic retrieval limit. */
  readonly limit?: number;
};

/** Atlas-selected bounded reads for later projections and chatbot context. */
export interface SemanticCandidateRepository {
  findCandidate(scope: SemanticCandidateScope & { readonly semanticId: string }): Promise<SemanticCandidateRecord | null>;
  listCandidates(query: SemanticCandidateQuery): Promise<readonly SemanticCandidateRecord[]>;
  listEvidence(scope: SemanticCandidateScope & { readonly semanticId: string }): Promise<readonly SemanticEvidenceRecord[]>;
}
