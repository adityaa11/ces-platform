import { bigint, boolean, index, pgSchema, text, timestamp, unique } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => [unique("workspace_project_kind_key").on(table.projectId, table.kind)]);

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
