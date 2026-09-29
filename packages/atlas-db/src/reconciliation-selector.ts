import { parseSemanticReconciliationContext, semanticContractVersion, semanticLimits, type SemanticReconciliationContext } from "@atlas/contracts";
import type { AuthorizedSemanticContext, SemanticReconciliationSelectionPort } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };
type ContextCandidate = { id: string; semantic_key: string; kind: string; normalized_meaning: string; payload: unknown; evidence_refs: readonly { page_number: number; locator_type: string; locator_id: string; excerpt?: string }[] };
const json = (value: unknown): unknown => typeof value === "string" ? JSON.parse(value) : value;
const serializedBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;

/**
 * Atlas-owned v1 neighborhood policy. It deliberately selects incoming
 * candidates only; neither Master nor an accepted-base query participates.
 */
export class PostgresReconciliationSelector implements SemanticReconciliationSelectionPort {
  constructor(private readonly sql: Sql) {}

  async select(scope: AuthorizedSemanticContext["scope"], transaction?: unknown): Promise<SemanticReconciliationContext> {
    const sql = (transaction as Sql | undefined) ?? this.sql;
    const member = await sql.unsafe("SELECT sequence FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2 AND project_id=$3 AND workspace_id=$4", [scope.bundleId, scope.documentId, scope.projectId, scope.workspaceId]);
    if (member.length !== 1) throw new Error("Reconciliation bundle member is unavailable.");
    const currentRows = await sql.unsafe("SELECT k.semantic_id, c.semantic_key, c.kind, c.normalized_meaning, c.payload FROM atlas.knowledge_index k JOIN atlas.semantic_candidate c ON c.id=k.semantic_candidate_id WHERE k.project_id=$1 AND k.workspace_id=$2 AND k.bundle_id=$3 AND k.document_id=$4 ORDER BY k.semantic_id ASC LIMIT $5", [scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, semanticLimits.currentCandidates + 1]);
    if (currentRows.length > semanticLimits.currentCandidates) throw new Error("Current reconciliation candidates exceed the mandatory limit.");
    const current = await Promise.all(currentRows.map((row) => this.withEvidence(sql, scope, row)));
    const keys = [...new Set(current.map((candidate) => candidate.semantic_key))];
    const kinds = [...new Set(current.map((candidate) => candidate.kind))];
    let priorRows: readonly Row[] = [];
    if (keys.length || kinds.length) {
      priorRows = await sql.unsafe(`SELECT k.semantic_id, c.semantic_key, c.kind, c.normalized_meaning, c.payload, m.sequence,
        CASE WHEN k.semantic_key = ANY($6::text[]) THEN 0 ELSE 1 END AS match_rank
        FROM atlas.knowledge_index k
        JOIN atlas.semantic_candidate c ON c.id=k.semantic_candidate_id
        JOIN atlas.extraction_bundle_document m ON m.bundle_id=k.bundle_id AND m.document_id=k.document_id AND m.project_id=k.project_id AND m.workspace_id=k.workspace_id
        JOIN atlas.semantic_execution prior_reconciliation ON prior_reconciliation.id=m.semantic_reconciliation_execution_id AND prior_reconciliation.stage='reconciliation' AND prior_reconciliation.lifecycle='completed'
        WHERE k.project_id=$1 AND k.workspace_id=$2 AND k.bundle_id=$3 AND m.sequence < $4
          AND m.state='completed'
          AND (k.semantic_key = ANY($6::text[]) OR k.kind = ANY($7::text[]))
        ORDER BY match_rank ASC, m.sequence ASC, k.semantic_id ASC
        LIMIT $5`, [scope.projectId, scope.workspaceId, scope.bundleId, member[0].sequence, semanticLimits.priorCandidates + 1, keys, kinds]);
    }
    const rankedPrior = await Promise.all(priorRows.slice(0, semanticLimits.priorCandidates).map((row) => this.withEvidence(sql, scope, row)));
    const sourceOverflow = priorRows.length > semanticLimits.priorCandidates;
    const contextFor = (prior: readonly ContextCandidate[], omittedPriorCount: number, overflow: boolean, byteCount = 0) => ({
      version: semanticContractVersion,
      skill: "atlas.semantic.reconcile" as const,
      scope,
      currentCandidates: current,
      priorCandidates: prior,
      selection: {
        policy: "idser-007.semantic-key-then-kind.v1", version: "v1" as const, overflow,
        selectedCount: prior.length, currentCount: current.length, totalCount: current.length + prior.length,
        byteLimit: semanticLimits.contextBytes, byteCount, omittedPriorCount,
      },
    });
    const withExactByteCount = (prior: readonly ContextCandidate[], omittedPriorCount: number, overflow: boolean) => {
      let context = contextFor(prior, omittedPriorCount, overflow);
      // The recorded byte count is itself serialized. Iterate to its stable value.
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const count = serializedBytes(context);
        const next = contextFor(prior, omittedPriorCount, overflow, count);
        if (serializedBytes(next) === count) return next;
        context = next;
      }
      throw new Error("Reconciliation selection byte accounting did not stabilize.");
    };
    const currentOnly = withExactByteCount([], rankedPrior.length + (sourceOverflow ? 1 : 0), rankedPrior.length > 0 || sourceOverflow);
    if (serializedBytes(currentOnly) > semanticLimits.contextBytes) throw new Error("Current reconciliation candidates and required evidence exceed the mandatory context limit.");
    const selected: ContextCandidate[] = [];
    for (const candidate of rankedPrior) {
      const proposed = withExactByteCount([...selected, candidate], rankedPrior.length - selected.length - 1 + (sourceOverflow ? 1 : 0), sourceOverflow || rankedPrior.length > selected.length + 1);
      if (serializedBytes(proposed) > semanticLimits.contextBytes) break;
      selected.push(candidate);
    }
    const omittedPriorCount = rankedPrior.length - selected.length + (sourceOverflow ? 1 : 0);
    const context = withExactByteCount(selected, omittedPriorCount, omittedPriorCount > 0);
    if (serializedBytes(context) > semanticLimits.contextBytes) throw new Error("Reconciliation selection exceeds the mandatory context limit.");
    return parseSemanticReconciliationContext(context);
  }

  private async withEvidence(sql: Sql, scope: AuthorizedSemanticContext["scope"], row: Row): Promise<ContextCandidate> {
    const evidence = await sql.unsafe("SELECT e.page_number, e.locator_type, e.locator_id, e.excerpt FROM atlas.knowledge_index k JOIN atlas.semantic_evidence e ON e.semantic_candidate_id=k.semantic_candidate_id WHERE k.semantic_id=$1 AND k.project_id=$2 AND k.workspace_id=$3 AND k.bundle_id=$4 ORDER BY e.page_number ASC, e.locator_type ASC, e.locator_id ASC", [row.semantic_id, scope.projectId, scope.workspaceId, scope.bundleId]);
    return { id: String(row.semantic_id), semantic_key: String(row.semantic_key), kind: String(row.kind), normalized_meaning: String(row.normalized_meaning), payload: json(row.payload), evidence_refs: evidence.map((item) => ({ page_number: Number(item.page_number), locator_type: String(item.locator_type), locator_id: String(item.locator_id), ...(item.excerpt === null ? {} : { excerpt: String(item.excerpt) }) })) };
  }
}
