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
  readonly initialDraftDocumentCount: number;
};

export interface AtlasProjectRepository {
  /** Creates the project graph atomically after the caller has stored source bytes. */
  create(input: CreateAtlasProjectInput): Promise<void>;
  /** A best-effort preflight; the database unique key remains the race-safe authority. */
  isProjectIdAvailable(projectId: string): Promise<boolean>;
  /** Returns only projects to which the supplied Better Auth identity belongs. */
  listAccessibleTo(userId: string): Promise<readonly AccessibleAtlasProject[]>;
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
