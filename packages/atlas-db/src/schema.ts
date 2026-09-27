import { bigint, boolean, index, jsonb, pgSchema, text, timestamp, unique } from "drizzle-orm/pg-core";

/** Schema ownership is established here; application tables are deferred. */
export const authSchema = pgSchema("auth");
export const atlasSchema = pgSchema("atlas");
export const bridgeSchema = pgSchema("bridge");

/** Better Auth-owned identity records. Atlas domain tables remain deferred. */
export const authUser = authSchema.table("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const authSession = authSchema.table("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => authUser.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_id_idx").on(table.userId)]);

export const authAccount = authSchema.table("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => authUser.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
}, (table) => [index("account_user_id_idx").on(table.userId)]);

export const authVerification = authSchema.table("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }),
  updatedAt: timestamp("updatedAt", { withTimezone: true }),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

/** Atlas-owned project metadata. Immutable source bytes belong to DocumentStore. */
export const atlasProject = atlasSchema.table("project", {
  id: text("id").primaryKey(),
  stableId: text("stable_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: text("created_by_user_id").notNull().references(() => authUser.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const atlasProjectMember = atlasSchema.table("project_member", {
  projectId: text("project_id").notNull().references(() => atlasProject.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => authUser.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => [unique("project_member_pkey").on(table.projectId, table.userId), index("project_member_user_project_idx").on(table.userId, table.projectId)]);

export const atlasWorkspace = atlasSchema.table("workspace", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => atlasProject.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  state: text("state").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const atlasDocument = atlasSchema.table("document", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => atlasProject.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull().references(() => atlasWorkspace.id),
  originalFilename: text("original_filename").notNull(),
  storageKey: text("storage_key").notNull(),
  sourceSha256: text("source_sha256").notNull(),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  mediaType: text("media_type").notNull(),
  createdByUserId: text("created_by_user_id").notNull().references(() => authUser.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => [index("document_workspace_idx").on(table.workspaceId)]);

export const atlasExtractionBundle = atlasSchema.table("extraction_bundle", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => atlasProject.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull().references(() => atlasWorkspace.id),
  state: text("state").notNull(),
  semanticContractVersion: text("semantic_contract_version").notNull(),
  reconciliationContractVersion: text("reconciliation_contract_version").notNull(),
  expectedDocumentCount: bigint("expected_document_count", { mode: "number" }).notNull(),
  completedDocumentCount: bigint("completed_document_count", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastFailureCode: text("last_failure_code"),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
});

export const atlasExtractionBundleDocument = atlasSchema.table("extraction_bundle_document", {
  bundleId: text("bundle_id").notNull().references(() => atlasExtractionBundle.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull().references(() => atlasDocument.id),
  sequence: bigint("sequence", { mode: "number" }).notNull(),
  state: text("state").notNull(),
  perceptionExecutionId: text("perception_execution_id"),
  semanticExtractionExecutionId: text("semantic_extraction_execution_id"),
  semanticReconciliationExecutionId: text("semantic_reconciliation_execution_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastFailureCode: text("last_failure_code"),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
}, (table) => [unique("extraction_bundle_document_pkey").on(table.bundleId, table.documentId), unique("extraction_bundle_document_sequence_key").on(table.bundleId, table.sequence)]);

export const atlasSemanticExecution = atlasSchema.table("semantic_execution", {
  id: text("id").primaryKey(), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), documentId: text("document_id").notNull(),
  stage: text("stage").notNull(), contractVersion: text("contract_version").notNull(), skillVersion: text("skill_version").notNull(), logicalIdentity: text("logical_identity").notNull(), lifecycle: text("lifecycle").notNull(),
  authorizedContextIdentity: text("authorized_context_identity").notNull(), authorizedContextFingerprint: text("authorized_context_fingerprint").notNull(), capabilityValidUntil: timestamp("capability_valid_until", { withTimezone: true }).notNull(), completionFingerprint: text("completion_fingerprint"), failureCode: text("failure_code"), failureDetail: text("failure_detail"), createdAt: timestamp("created_at", { withTimezone: true }).notNull(), completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const atlasSemanticExtractionResult = atlasSchema.table("semantic_extraction_result", { id: text("id").primaryKey(), executionId: text("execution_id").notNull().references(() => atlasSemanticExecution.id), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), documentId: text("document_id").notNull(), contractVersion: text("contract_version").notNull(), sourceSha256: text("source_sha256").notNull(), providerProvenance: jsonb("provider_provenance").notNull(), resultJson: jsonb("result_json").notNull(), completionFingerprint: text("completion_fingerprint").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
export const atlasSemanticCandidate = atlasSchema.table("semantic_candidate", { id: text("id").primaryKey(), extractionResultId: text("extraction_result_id").notNull().references(() => atlasSemanticExtractionResult.id), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), documentId: text("document_id").notNull(), semanticKey: text("semantic_key").notNull(), kind: text("kind").notNull(), payload: jsonb("payload").notNull(), normalizedMeaning: text("normalized_meaning").notNull(), sourceWording: text("source_wording"), needsResolution: boolean("needs_resolution").notNull(), state: text("state").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
export const atlasSemanticEvidence = atlasSchema.table("semantic_evidence", { id: text("id").primaryKey(), semanticCandidateId: text("semantic_candidate_id").notNull().references(() => atlasSemanticCandidate.id), documentId: text("document_id").notNull(), pageNumber: bigint("page_number", { mode: "number" }).notNull(), locatorType: text("locator_type").notNull(), locatorId: text("locator_id").notNull(), excerpt: text("excerpt"), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
export const atlasKnowledgeIndex = atlasSchema.table("knowledge_index", { semanticId: text("semantic_id").primaryKey(), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), documentId: text("document_id").notNull(), semanticKey: text("semantic_key").notNull(), kind: text("kind").notNull(), semanticCandidateId: text("semantic_candidate_id").notNull().references(() => atlasSemanticCandidate.id), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
export const atlasSemanticReconciliationResult = atlasSchema.table("semantic_reconciliation_result", { id: text("id").primaryKey(), executionId: text("execution_id").notNull().references(() => atlasSemanticExecution.id), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), currentDocumentId: text("current_document_id").notNull(), contractVersion: text("contract_version").notNull(), providerProvenance: jsonb("provider_provenance").notNull(), resultJson: jsonb("result_json").notNull(), completionFingerprint: text("completion_fingerprint").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
export const atlasReconciliationRelationship = atlasSchema.table("reconciliation_relationship", { id: text("id").primaryKey(), reconciliationResultId: text("reconciliation_result_id").notNull().references(() => atlasSemanticReconciliationResult.id), projectId: text("project_id").notNull(), workspaceId: text("workspace_id").notNull(), bundleId: text("bundle_id").notNull(), sourceSemanticId: text("source_semantic_id").notNull().references(() => atlasKnowledgeIndex.semanticId), targetSemanticId: text("target_semantic_id").references(() => atlasKnowledgeIndex.semanticId), relationshipType: text("relationship_type").notNull(), payload: jsonb("payload").notNull(), requiresResolution: boolean("requires_resolution").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });
