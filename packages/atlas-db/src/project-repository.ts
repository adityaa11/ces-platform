import { randomUUID } from "node:crypto";
import { documentPerceptionContractVersion, type DocumentPerceptionRequest } from "@atlas/core";
import { assertCreateAtlasProjectInput, type AccessibleAtlasProject, type AtlasProjectRepository, type CreateAtlasProjectInput } from "@atlas/core";
import { PostgresPerceptionAuthority } from "./perception-authority.js";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
export type PerceptionKickoffQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest }): Promise<string | null> };

/** PostgreSQL adapter for the Atlas project graph; core receives no SQL details. */
export class PostgresAtlasProjectRepository implements AtlasProjectRepository {
  constructor(private readonly sql: Sql, private readonly kickoff?: { readonly authority: PostgresPerceptionAuthority; readonly queue: PerceptionKickoffQueue }) {}

  async create(input: CreateAtlasProjectInput): Promise<void> {
    assertCreateAtlasProjectInput(input);
    await this.sql.begin(async (sql) => {
      await sql.unsafe("INSERT INTO atlas.project (id, stable_id, name, description, created_by_user_id) VALUES ($1,$2,$3,$4,$5)", [input.id, input.projectId, input.name, input.description, input.creatorUserId]);
      await sql.unsafe("INSERT INTO atlas.project_member (project_id, user_id, role) VALUES ($1,$2,'owner')", [input.id, input.creatorUserId]);
      await sql.unsafe("INSERT INTO atlas.workspace (id, project_id, kind, state, display_name) VALUES ($1,$2,'master','empty','Master'),($3,$2,'initial_draft','draft','Initial Draft')", [input.masterWorkspaceId, input.id, input.initialDraftWorkspaceId]);
      for (const document of input.documents) {
        await sql.unsafe("INSERT INTO atlas.document (id, project_id, workspace_id, original_filename, storage_key, source_sha256, byte_size, media_type, created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [document.id, input.id, input.initialDraftWorkspaceId, document.originalFilename, document.storageKey, document.sourceSha256, document.byteSize, document.mediaType, document.createdByUserId]);
      }
      if (this.kickoff) {
        const bundleId = randomUUID();
        await sql.unsafe("INSERT INTO atlas.extraction_bundle (id, project_id, workspace_id, state, semantic_contract_version, reconciliation_contract_version, expected_document_count, completed_document_count) VALUES ($1,$2,$3,'waiting',$4,$4,$5,0)", [bundleId, input.id, input.initialDraftWorkspaceId, documentPerceptionContractVersion, input.documents.length]);
        for (const [index, document] of input.documents.entries()) {
          await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id, document_id, project_id, workspace_id, sequence, state) VALUES ($1,$2,$3,$4,$5,$6)", [bundleId, document.id, input.id, input.initialDraftWorkspaceId, index + 1, index === 0 ? "perception_queued" : "pending"]);
        }
        await sql.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1 AND state='waiting'", [bundleId]);
        const first = input.documents[0];
        const executionId = randomUUID();
        const idempotencyKey = `perception:${bundleId}:${first.id}:${documentPerceptionContractVersion}`;
        const request = await this.kickoff.authority.createInTransaction(sql, { executionId, artifactId: first.id, storageKey: first.storageKey, sourceSha256: first.sourceSha256, mimeType: first.mediaType, byteSize: first.byteSize, idempotencyKey, capabilityIdentity: `bundle:${bundleId}:document:${first.id}:perception:${documentPerceptionContractVersion}` });
        // postgres.js transaction scopes do not carry the parent's parser
        // configuration, while the pg-boss Drizzle bridge requires it.
        const transactionClient = sql as unknown as { options?: unknown };
        transactionClient.options ??= (this.sql as unknown as { options?: unknown }).options;
        const queued = await this.kickoff.queue.enqueue(sql, { idempotencyKey, request });
        if (queued === null) throw new Error("Perception kickoff was deduplicated before the new project committed.");
        await sql.unsafe("UPDATE atlas.extraction_bundle_document SET perception_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [bundleId, first.id, executionId]);
      }
    });
  }

  async isProjectIdAvailable(projectId: string): Promise<boolean> {
    const rows = await this.sql.unsafe("SELECT 1 FROM atlas.project WHERE stable_id=$1 LIMIT 1", [projectId]);
    return rows.length === 0;
  }

  async listAccessibleTo(userId: string): Promise<readonly AccessibleAtlasProject[]> {
    const rows = await this.sql.unsafe("SELECT p.id, p.stable_id, p.name, p.description, p.created_at, COUNT(d.id)::integer AS initial_draft_document_count, MAX(w_master.state) AS master_workspace_state, MAX(w_draft.state) AS initial_draft_workspace_state, EXISTS (SELECT 1 FROM atlas.document_perception_execution e JOIN atlas.document extraction_document ON extraction_document.id=e.artifact_id WHERE extraction_document.project_id=p.id) AS has_downstream_extraction_state FROM atlas.project p JOIN atlas.project_member m ON m.project_id=p.id AND m.user_id=$1 LEFT JOIN atlas.workspace w_draft ON w_draft.project_id=p.id AND w_draft.kind='initial_draft' LEFT JOIN atlas.workspace w_master ON w_master.project_id=p.id AND w_master.kind='master' LEFT JOIN atlas.document d ON d.workspace_id=w_draft.id GROUP BY p.id ORDER BY p.created_at DESC", [userId]);
    return rows.map((row) => ({ id: String(row.id), projectId: String(row.stable_id), name: String(row.name), description: row.description === null ? null : String(row.description), createdAt: new Date(String(row.created_at)), initialDraftDocumentCount: Number(row.initial_draft_document_count), masterWorkspaceState: row.master_workspace_state === "empty" ? "empty" : null, initialDraftWorkspaceState: row.initial_draft_workspace_state === "draft" ? "draft" : null, hasDownstreamExtractionState: row.has_downstream_extraction_state === true }));
  }
}
