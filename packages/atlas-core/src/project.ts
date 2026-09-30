/** Persistence-neutral contracts for the initial Atlas project lifecycle. */
export type ProjectWorkspaceKind = "master" | "initial_draft";
export type ProjectMemberRole = "owner";

export type ProjectSourceDocument = {
  readonly id: string;
  readonly originalFilename: string;
  /** Atlas-only metadata; never include this in a browser-facing projection. */
  readonly storageKey: string;
  readonly sourceSha256: string;
  readonly byteSize: number;
  readonly mediaType: "application/pdf";
  readonly createdByUserId: string;
};

export type CreateAtlasProjectInput = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly creatorUserId: string;
  readonly masterWorkspaceId: string;
  readonly initialDraftWorkspaceId: string;
  readonly documents: readonly ProjectSourceDocument[];
};

export type AccessibleAtlasProject = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly masterWorkspaceId: string;
  readonly initialDraftWorkspaceId: string;
  readonly initialDraftDocumentCount: number;
  /** Persisted lifecycle prerequisites; these are evaluated before browser projection. */
  readonly masterWorkspaceState: "empty" | null;
  readonly initialDraftWorkspaceState: "draft" | null;
  readonly hasDownstreamExtractionState: boolean;
  /** A bounded server-derived signal; never a semantic record or lifecycle decision. */
  readonly hasSemanticUncertainty: boolean;
  /**
   * Server-validated persisted lifecycle truth. This deliberately remains a
   * domain read record: browser labels, percentages and card states belong to
   * IDSER-009-02.
   */
  readonly lifecycle: AuthorizedPersistedLifecycle;
};

export type AuthorizedPersistedLifecycle =
  | { readonly kind: "legacy_no_bundle" }
  | {
    readonly kind: "bundle";
    readonly bundleId: string;
    readonly bundleState: ExtractionBundleState;
    readonly expectedDocumentCount: number;
    readonly completedDocumentCount: number;
    readonly memberFacts: readonly PersistedLifecycleMemberFact[];
  }
  | {
    /** A bounded signal only; raw failure code/detail never leaves persistence. */
    readonly kind: "technical_failure";
    readonly bundleId: string;
    readonly expectedDocumentCount: number;
    readonly completedDocumentCount: number;
    readonly memberFacts: readonly PersistedLifecycleMemberFact[];
  };

export type PersistedLifecycleMemberFact = {
  readonly documentId: string;
  readonly sequence: number;
  readonly state: ExtractionBundleDocumentState;
  readonly hasTechnicalFailure: boolean;
};

export interface AtlasProjectRepository {
  /** Creates the project graph atomically after the caller has stored source bytes. */
  create(input: CreateAtlasProjectInput): Promise<void>;
  /** A best-effort preflight; the database unique key remains the race-safe authority. */
  isProjectIdAvailable(projectId: string): Promise<boolean>;
  /** Returns only projects to which the supplied Better Auth identity belongs. */
  listAccessibleTo(userId: string): Promise<readonly AccessibleAtlasProject[]>;
}

/** Candidate-pipeline records stay persistence-neutral so Bridge and UI cannot own Atlas state. */
export type ExtractionBundleState = "waiting" | "processing" | "ready_for_review" | "needs_attention";
export type ExtractionBundleDocumentState = "pending" | "perception_queued" | "perceiving" | "extracting" | "reconciling" | "completed" | "needs_attention";
export type SemanticStage = "extraction" | "reconciliation";

export interface ExtractionBundleScope {
  readonly id: string;
  readonly projectId: string;
  readonly workspaceId: string;
  readonly state: ExtractionBundleState;
  readonly expectedDocumentCount: number;
  readonly completedDocumentCount: number;
}

export interface SemanticExecutionScope {
  readonly id: string;
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
  readonly documentId: string;
  readonly stage: SemanticStage;
  readonly contractVersion: string;
  readonly skillVersion: string;
  readonly logicalIdentity: string;
}

/** Read seam for later pipeline tickets; callers receive domain records, never SQL handles. */
export interface SemanticFoundationRepository {
  findBundle(id: string): Promise<ExtractionBundleScope | null>;
}

export const projectIdPattern = /^[a-z0-9-]{3,48}$/;
export const sourceSha256Pattern = /^[a-f0-9]{64}$/;

/** Validates the persistence boundary without assigning any storage identity. */
export function assertCreateAtlasProjectInput(input: CreateAtlasProjectInput): void {
  if (!projectIdPattern.test(input.projectId)) throw new Error("Project ID must be 3-48 lowercase letters, numbers, or hyphens.");
  if (!input.creatorUserId) throw new Error("Creator identity is required.");
  if (!input.id || !input.masterWorkspaceId || !input.initialDraftWorkspaceId) throw new Error("Project and workspace identities are required.");
  if (input.masterWorkspaceId === input.initialDraftWorkspaceId) throw new Error("Master and Initial Draft must have distinct identities.");
  if (!input.documents.length) throw new Error("At least one source document is required.");
  for (const document of input.documents) {
    if (!document.id || !document.storageKey || !document.originalFilename) throw new Error("Document identity and server storage metadata are required.");
    if (document.mediaType !== "application/pdf" || !sourceSha256Pattern.test(document.sourceSha256) || document.byteSize <= 0) throw new Error("Document metadata is invalid.");
    if (document.createdByUserId !== input.creatorUserId) throw new Error("Source documents must be attributed to the project creator.");
  }
}
