import { semanticLimits } from "@atlas/contracts";
import type { SemanticCandidateQuery, SemanticCandidateRecord, SemanticCandidateRepository, SemanticCandidateScope, SemanticEvidenceRecord } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };
const json = (value: unknown): unknown => typeof value === "string" ? JSON.parse(value) : value;

const candidateFrom = (row: Row): SemanticCandidateRecord => ({
  semanticId: String(row.semantic_id), candidateId: String(row.candidate_id), documentId: String(row.document_id),
  semanticKey: String(row.semantic_key), kind: String(row.kind), payload: json(row.payload), normalizedMeaning: String(row.normalized_meaning),
  sourceWording: row.source_wording === null ? null : String(row.source_wording), needsResolution: row.needs_resolution === true,
});

/** Atlas-only SQL adapter for bounded candidate and evidence retrieval. */
export class PostgresSemanticCandidateRepository implements SemanticCandidateRepository {
  constructor(private readonly sql: Sql) {}

  async findCandidate(scope: SemanticCandidateScope & { readonly semanticId: string }): Promise<SemanticCandidateRecord | null> {
    const rows = await this.sql.unsafe("SELECT k.semantic_id, c.id AS candidate_id, c.document_id, c.semantic_key, c.kind, c.payload, c.normalized_meaning, c.source_wording, c.needs_resolution FROM atlas.knowledge_index k JOIN atlas.semantic_candidate c ON c.id=k.semantic_candidate_id WHERE k.semantic_id=$1 AND k.project_id=$2 AND k.workspace_id=$3 AND k.bundle_id=$4", [scope.semanticId, scope.projectId, scope.workspaceId, scope.bundleId]);
    return rows.length ? candidateFrom(rows[0]) : null;
  }

  async listCandidates(query: SemanticCandidateQuery): Promise<readonly SemanticCandidateRecord[]> {
    const limit = Math.max(1, Math.min(query.limit ?? semanticLimits.retrievalPage, semanticLimits.retrievalPage));
    const clauses = ["k.project_id=$1", "k.workspace_id=$2", "k.bundle_id=$3"];
    const values: unknown[] = [query.projectId, query.workspaceId, query.bundleId];
    const add = (clause: string, value: string | undefined) => { if (value !== undefined) { values.push(value); clauses.push(clause.replace("?", `$${values.length}`)); } };
    add("k.document_id=?", query.documentId); add("k.semantic_key=?", query.semanticKey); add("k.kind=?", query.kind);
    values.push(limit);
    const rows = await this.sql.unsafe(`SELECT k.semantic_id, c.id AS candidate_id, c.document_id, c.semantic_key, c.kind, c.payload, c.normalized_meaning, c.source_wording, c.needs_resolution FROM atlas.knowledge_index k JOIN atlas.semantic_candidate c ON c.id=k.semantic_candidate_id WHERE ${clauses.join(" AND ")} ORDER BY k.semantic_id ASC LIMIT $${values.length}`, values);
    return rows.map(candidateFrom);
  }

  async listEvidence(scope: SemanticCandidateScope & { readonly semanticId: string }): Promise<readonly SemanticEvidenceRecord[]> {
    const rows = await this.sql.unsafe("SELECT e.page_number, e.locator_type, e.locator_id, e.excerpt FROM atlas.knowledge_index k JOIN atlas.semantic_evidence e ON e.semantic_candidate_id=k.semantic_candidate_id WHERE k.semantic_id=$1 AND k.project_id=$2 AND k.workspace_id=$3 AND k.bundle_id=$4 ORDER BY e.page_number ASC, e.locator_type ASC, e.locator_id ASC", [scope.semanticId, scope.projectId, scope.workspaceId, scope.bundleId]);
    return rows.map((row) => ({ pageNumber: Number(row.page_number), locatorType: row.locator_type as SemanticEvidenceRecord["locatorType"], locatorId: String(row.locator_id), excerpt: row.excerpt === null ? null : String(row.excerpt) }));
  }
}
