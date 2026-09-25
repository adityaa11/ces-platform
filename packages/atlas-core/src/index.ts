/** Persistence-neutral contracts. */
export { documentPerceptionContractVersion, parseDocumentPerceptionRequest, parseNormalizedDocument, type DocumentPerceptionRequest, type NormalizedDocument } from "@atlas/contracts";
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
export { type PerceptionAuthority, type PerceptionExecutionInput, type AuthorityRedeemedPerceptionSource } from "./perception-authority.js";
export { createPerceptionInternalRoutes, type InternalPerceptionResponse } from "./perception-internal-route.js";
export { assertCreateAtlasProjectInput, projectIdPattern, sourceSha256Pattern, type AccessibleAtlasProject, type AtlasProjectRepository, type CreateAtlasProjectInput, type ProjectMemberRole, type ProjectSourceDocument, type ProjectWorkspaceKind } from "./project.js";
export { createStoredAtlasProject, maxProjectRequestBytes, maxProjectSourceBytes, maxProjectSources, ProjectCreationConflictError, ProjectCreationValidationError, type CreatedAtlasProject, type CreateProjectSource, type CreateStoredAtlasProjectCommand } from "./project-creation.js";
