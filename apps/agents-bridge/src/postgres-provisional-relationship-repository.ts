import { relationshipContractVersion, relationshipSha256, relationshipStableJson, type ContextSourceRelationshipRevisionV1, type RelationshipPacketIdentity } from "@atlas/skills";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };

const parseJson = (value: unknown): unknown => typeof value === "string" ? JSON.parse(value) : value;
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function verifyRevision(value: unknown, identity: Pick<RelationshipPacketIdentity, "projectId" | "workspaceId" | "bundleId" | "documentId" | "sourceSha256">): ContextSourceRelationshipRevisionV1 {
  if (!isRecord(value) || value.contractVersion !== relationshipContractVersion || typeof value.revisionHash !== "string" || typeof value.relationshipLineageId !== "string" || !isRecord(value.scope) || !isRecord(value.normalizedDocument) || !isRecord(value.ownedSource) || !isRecord(value.contextSource) || !isRecord(value.relationship)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: persisted provisional relationship is malformed.");
  const revision = value as unknown as ContextSourceRelationshipRevisionV1;
  const scope = revision.scope;
  if (scope.projectId !== identity.projectId || scope.workspaceId !== identity.workspaceId || scope.bundleId !== identity.bundleId || scope.documentId !== identity.documentId || scope.sourceSha256 !== identity.sourceSha256 || revision.normalizedDocument.artifactId !== identity.documentId || revision.normalizedDocument.sourceSha256 !== identity.sourceSha256) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: persisted provisional relationship has foreign scope.");
  const { revisionHash: ignored, ...immutable } = revision;
  if (revision.relationshipLineageId !== relationshipSha256({ scope: revision.scope, ownedSource: revision.ownedSource, contextSource: revision.contextSource, relationship: revision.relationship }) || revision.revisionHash !== relationshipSha256(immutable)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: persisted provisional relationship hash is invalid.");
  return revision;
}

/** Bridge-owned read-only view of immutable provisional relationship history.
 * It never treats provisional rows as human-accepted relationships. */
export class PostgresProvisionalRelationshipRepository {
  constructor(private readonly database: Database) {}

  async loadForSnapshot(identity: Pick<RelationshipPacketIdentity, "projectId" | "workspaceId" | "bundleId" | "documentId" | "sourceSha256">): Promise<readonly ContextSourceRelationshipRevisionV1[]> {
    const result = await this.database.executeSql(`SELECT provisional_relationship_revisions
      FROM bridge.semantic_composite_stage
      WHERE source_snapshot @> $1::jsonb
      ORDER BY created_at, idempotency_key`, [JSON.stringify(identity)]);
    const revisions = new Map<string, ContextSourceRelationshipRevisionV1>();
    for (const row of result.rows) {
      const values = parseJson(row.provisional_relationship_revisions);
      if (!Array.isArray(values)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: persisted provisional relationship collection is malformed.");
      for (const value of values) {
        const revision = verifyRevision(value, identity);
        const existing = revisions.get(revision.revisionHash);
        if (existing && relationshipStableJson(existing) !== relationshipStableJson(revision)) throw new Error("SOURCE_RELATIONSHIP_BLOCKED: duplicate relationship hash has conflicting content.");
        revisions.set(revision.revisionHash, revision);
      }
    }
    return [...revisions.values()].sort((left, right) => left.revisionHash.localeCompare(right.revisionHash));
  }
}
