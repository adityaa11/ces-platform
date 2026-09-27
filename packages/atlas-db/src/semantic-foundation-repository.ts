import type { ExtractionBundleScope, SemanticFoundationRepository } from "@atlas/core";
import type postgres from "postgres";

/** Atlas-only adapter. Bridge has no import or database permission for this seam. */
export class PostgresSemanticFoundationRepository implements SemanticFoundationRepository {
  constructor(private readonly sql: postgres.Sql) {}

  async findBundle(id: string): Promise<ExtractionBundleScope | null> {
    const rows = await this.sql.unsafe("SELECT id, project_id, workspace_id, state, expected_document_count, completed_document_count FROM atlas.extraction_bundle WHERE id=$1", [id]);
    if (!rows.length) return null;
    const row = rows[0];
    return { id: String(row.id), projectId: String(row.project_id), workspaceId: String(row.workspace_id), state: row.state as ExtractionBundleScope["state"], expectedDocumentCount: Number(row.expected_document_count), completedDocumentCount: Number(row.completed_document_count) };
  }
}
