import { assertCreateAtlasProjectInput, type AccessibleAtlasProject, type AtlasProjectRepository, type CreateAtlasProjectInput } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };

/** PostgreSQL adapter for the Atlas project graph; core receives no SQL details. */
export class PostgresAtlasProjectRepository implements AtlasProjectRepository {
  constructor(private readonly sql: Sql) {}

  async create(input: CreateAtlasProjectInput): Promise<void> {
    assertCreateAtlasProjectInput(input);
    await this.sql.begin(async (sql) => {
      await sql.unsafe("INSERT INTO atlas.project (id, stable_id, name, description, created_by_user_id) VALUES ($1,$2,$3,$4,$5)", [input.id, input.projectId, input.name, input.description, input.creatorUserId]);
      await sql.unsafe("INSERT INTO atlas.project_member (project_id, user_id, role) VALUES ($1,$2,'owner')", [input.id, input.creatorUserId]);
      await sql.unsafe("INSERT INTO atlas.workspace (id, project_id, kind, state) VALUES ($1,$2,'master','empty'),($3,$2,'initial_draft','draft')", [input.masterWorkspaceId, input.id, input.initialDraftWorkspaceId]);
      for (const document of input.documents) {
        await sql.unsafe("INSERT INTO atlas.document (id, project_id, workspace_id, original_filename, storage_key, source_sha256, byte_size, media_type, created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [document.id, input.id, input.initialDraftWorkspaceId, document.originalFilename, document.storageKey, document.sourceSha256, document.byteSize, document.mediaType, document.createdByUserId]);
      }
    });
  }

  async listAccessibleTo(userId: string): Promise<readonly AccessibleAtlasProject[]> {
    const rows = await this.sql.unsafe("SELECT p.id, p.stable_id, p.name, p.description, p.created_at, COUNT(d.id)::integer AS initial_draft_document_count FROM atlas.project p JOIN atlas.project_member m ON m.project_id=p.id AND m.user_id=$1 LEFT JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' LEFT JOIN atlas.document d ON d.workspace_id=w.id GROUP BY p.id ORDER BY p.created_at DESC", [userId]);
    return rows.map((row) => ({ id: String(row.id), projectId: String(row.stable_id), name: String(row.name), description: row.description === null ? null : String(row.description), createdAt: new Date(String(row.created_at)), initialDraftDocumentCount: Number(row.initial_draft_document_count) }));
  }
}
