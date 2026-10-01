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
export { SemanticAcceptanceRejection, type AuthorizedSemanticContext, type SemanticAcceptanceHandler, type SemanticAuthority, type SemanticExecutionRequest, type SemanticReconciliationSelectionPort } from "./semantic-authority.js";
export { createSemanticInternalRoutes, type InternalSemanticResponse } from "./semantic-internal-route.js";
export { type SemanticCandidateScope, type SemanticEvidenceRecord, type SemanticCandidateRecord, type SemanticCandidateQuery, type SemanticRelationshipRecord, type SemanticCandidateRepository } from "./semantic-candidate-repository.js";
export { assertCreateAtlasProjectInput, projectIdPattern, sourceSha256Pattern, type AccessibleAtlasProject, type AtlasProjectRepository, type AuthorizedPersistedLifecycle, type CreateAtlasProjectInput, type ExtractionBundleDocumentState, type ExtractionBundleScope, type ExtractionBundleState, type PersistedLifecycleMemberFact, type ProjectMemberRole, type ProjectSourceDocument, type ProjectWorkspaceKind, type SemanticExecutionScope, type SemanticFoundationRepository, type SemanticStage } from "./project.js";
export { createStoredAtlasProject, maxProjectRequestBytes, maxProjectSourceBytes, maxProjectSources, ProjectCreationConflictError, ProjectCreationValidationError, type CreatedAtlasProject, type CreateProjectSource, type CreateStoredAtlasProjectCommand } from "./project-creation.js";
