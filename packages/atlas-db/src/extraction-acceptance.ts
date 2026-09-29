import { createHash, randomUUID } from "node:crypto";
import { parseNormalizedDocument, parseSemanticExtractionResult } from "@atlas/contracts";
import type { SemanticAcceptanceHandler } from "@atlas/core";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };
type Candidate = { local_candidate_id: string; semantic_key: string; kind: string; payload: unknown; normalized_meaning: string; source_wording?: string; needs_resolution: boolean; evidence_refs: readonly Evidence[] };
type Evidence = { page_number: number; locator_type: "text_block" | "table" | "visual_region"; locator_id: string; excerpt?: string };
type Inventory = { page_number: number; locator_type: Evidence["locator_type"]; locator_id: string; classification: string; destination_local_candidate_ids: readonly string[] };
type Question = { evidence_refs?: readonly Evidence[] };
type SemanticKickoffQueue = { enqueue(transaction: unknown, job: { readonly idempotencyKey: string; readonly execution: { readonly version: "v1"; readonly executionId: string; readonly mode: "background"; readonly skill: { readonly id: "atlas.semantic.reconcile"; readonly version: "v1" }; readonly input: { readonly contextCapability: string }; readonly context: { readonly boundary: string; readonly items: readonly [] } } }): Promise<string | null> };
const stableId = (executionId: string, localId: string) => createHash("sha256").update(`${executionId}:${localId}`).digest("hex");
const json = (value: unknown) => typeof value === "string" ? JSON.parse(value) : value;

/** IDSER-006 Atlas-side extraction validator and materializer.  It deliberately
 * receives the authority transaction so result rows and execution completion
 * cannot become separately visible. */
export class PostgresExtractionAcceptanceHandler implements SemanticAcceptanceHandler {
  constructor(private readonly semanticQueue?: SemanticKickoffQueue) {}

  async accept(input: { readonly executionId: string; readonly completionFingerprint: string; readonly envelope: unknown }, transaction?: unknown): Promise<void> {
    const sql = transaction as Sql | undefined;
    if (!sql) throw new Error("Extraction acceptance requires the authority transaction.");
    const envelope = input.envelope as { skill?: { id?: string }; scope?: Record<string, string>; provider?: unknown; result?: unknown };
    if (envelope.skill?.id !== "atlas.semantic.extract" || !envelope.scope) throw new Error("Extraction handler received the wrong semantic stage.");
    const scope = envelope.scope;
    const result = parseSemanticExtractionResult(envelope.result) as unknown as { candidate_assertions: readonly Candidate[]; source_statement_inventory: readonly Inventory[]; questions: readonly Question[] };
    const source = await sql.unsafe("SELECT d.source_sha256, p.id AS perception_execution_id, c.normalized_document FROM atlas.document d JOIN atlas.extraction_bundle_document m ON m.document_id=d.id JOIN atlas.document_perception_execution p ON p.id=m.perception_execution_id JOIN atlas.normalized_document_cache c ON c.source_sha256=d.source_sha256 AND c.capability_identity=p.capability_identity AND c.invalidated_at IS NULL WHERE d.id=$1 AND d.project_id=$2 AND d.workspace_id=$3 AND m.bundle_id=$4 AND m.semantic_extraction_execution_id=$5 FOR UPDATE", [scope.documentId, scope.projectId, scope.workspaceId, scope.bundleId, input.executionId]);
    if (!source.length) throw new Error("Extraction source is unavailable.");
    const normalized = parseNormalizedDocument(json(source[0].normalized_document));
    if (normalized.executionId !== source[0].perception_execution_id || normalized.artifactId !== scope.documentId || normalized.sourceSha256 !== source[0].source_sha256) throw new Error("Extraction source binding is invalid.");
    const locators = new Map<string, { excerpt?: string }>();
    for (const page of normalized.pages) {
      for (const block of page.textBlocks) if (block.text.trim()) locators.set(`${page.number}:text_block:${block.id}`, { excerpt: block.text });
      for (const table of page.tables) if (table.content.trim()) locators.set(`${page.number}:table:${table.id}`, { excerpt: table.content });
      for (const visual of page.visualRegions) if (visual.label?.trim() || visual.assetRef) locators.set(`${page.number}:visual_region:${visual.id}`, {});
    }
    const inventory = new Set(result.source_statement_inventory.map((item) => `${item.page_number}:${item.locator_type}:${item.locator_id}`));
    if (inventory.size !== locators.size || [...locators.keys()].some((key) => !inventory.has(key))) throw new Error("Extraction result does not account for normalized source units.");
    const evidenceKeys = (evidence: readonly Evidence[]) => new Set(evidence.map((item) => `${item.page_number}:${item.locator_type}:${item.locator_id}`));
    const validateEvidence = (evidence: readonly Evidence[]) => {
      const seen = new Set<string>();
      for (const item of evidence) {
        const key = `${item.page_number}:${item.locator_type}:${item.locator_id}`;
        const locator = locators.get(key);
        if (!locator || seen.has(key) || (item.excerpt && (!locator.excerpt || !locator.excerpt.includes(item.excerpt)))) throw new Error("Extraction evidence is not grounded in the normalized document.");
        seen.add(key);
      }
    };
    for (const candidate of result.candidate_assertions) {
      validateEvidence(candidate.evidence_refs);
      const candidateEvidence = evidenceKeys(candidate.evidence_refs);
      for (const item of result.source_statement_inventory.filter((entry) => entry.destination_local_candidate_ids.includes(candidate.local_candidate_id))) {
        if (!candidateEvidence.has(`${item.page_number}:${item.locator_type}:${item.locator_id}`)) throw new Error("Candidate source accounting lacks matching evidence.");
      }
    }
    for (const question of result.questions) if (question.evidence_refs) validateEvidence(question.evidence_refs);
    const existing = await sql.unsafe("SELECT id, completion_fingerprint FROM atlas.semantic_extraction_result WHERE execution_id=$1 FOR UPDATE", [input.executionId]);
    if (existing.length) { if (String(existing[0].completion_fingerprint) === input.completionFingerprint) return; throw new Error("Extraction completion conflicts with existing materialization."); }
    const resultId = randomUUID();
    await sql.unsafe("INSERT INTO atlas.semantic_extraction_result (id, execution_id, project_id, workspace_id, bundle_id, document_id, contract_version, source_sha256, provider_provenance, result_json, completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7,$8::jsonb,$9::jsonb,$10)", [resultId, input.executionId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, source[0].source_sha256, envelope.provider, result, input.completionFingerprint]);
    for (const candidate of [...result.candidate_assertions].sort((left, right) => left.local_candidate_id.localeCompare(right.local_candidate_id))) {
      const id = stableId(input.executionId, candidate.local_candidate_id);
      await sql.unsafe("INSERT INTO atlas.semantic_candidate (id, extraction_result_id, project_id, workspace_id, bundle_id, document_id, semantic_key, kind, payload, normalized_meaning, source_wording, needs_resolution, state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,'candidate')", [id, resultId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, candidate.semantic_key, candidate.kind, candidate.payload, candidate.normalized_meaning, candidate.source_wording ?? null, candidate.needs_resolution]);
      const semanticId = stableId(scope.documentId, candidate.local_candidate_id);
      await sql.unsafe("INSERT INTO atlas.knowledge_index (semantic_id, project_id, workspace_id, bundle_id, document_id, semantic_key, kind, semantic_candidate_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [semanticId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, candidate.semantic_key, candidate.kind, id]);
      await sql.unsafe("INSERT INTO atlas.semantic_candidate_identity_map (semantic_candidate_id, canonical_semantic_id, local_candidate_id, extraction_execution_id) VALUES ($1,$2,$3,$4)", [id, semanticId, candidate.local_candidate_id, input.executionId]);
      for (const evidence of candidate.evidence_refs) await sql.unsafe("INSERT INTO atlas.semantic_evidence (id, semantic_candidate_id, document_id, page_number, locator_type, locator_id, excerpt) VALUES ($1,$2,$3,$4,$5,$6,$7)", [randomUUID(), id, scope.documentId, evidence.page_number, evidence.locator_type, evidence.locator_id, evidence.excerpt ?? null]);
    }
    const reconciliationExecutionId = randomUUID();
    const reconciliationCapability = randomUUID();
    const reconciliationLogicalIdentity = `reconcile:${scope.bundleId}:${scope.documentId}:v1`;
    const existingReconciliation = await sql.unsafe("SELECT id FROM atlas.semantic_execution WHERE logical_identity=$1 FOR UPDATE", [reconciliationLogicalIdentity]);
    const actualReconciliationExecutionId = existingReconciliation.length ? String(existingReconciliation[0].id) : reconciliationExecutionId;
    if (!existingReconciliation.length) {
      if (!this.semanticQueue) throw new Error("Semantic reconciliation queue is unavailable.");
      await sql.unsafe("INSERT INTO atlas.semantic_execution (id, project_id, workspace_id, bundle_id, document_id, stage, contract_version, skill_version, logical_identity, lifecycle, authorized_context_identity, authorized_context_fingerprint, capability_valid_until) VALUES ($1,$2,$3,$4,$5,'reconciliation','v1','v1',$6,'queued',$7,$8,now()+interval '1 hour')", [actualReconciliationExecutionId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, reconciliationLogicalIdentity, `extraction:${input.executionId}`, createHash("sha256").update(JSON.stringify(reconciliationCapability)).digest("hex")]);
      const queued = await this.semanticQueue.enqueue(sql, { idempotencyKey: `semantic:${actualReconciliationExecutionId}`, execution: { version: "v1", executionId: actualReconciliationExecutionId, mode: "background", skill: { id: "atlas.semantic.reconcile", version: "v1" }, input: { contextCapability: reconciliationCapability }, context: { boundary: "atlas.semantic.internal/v1", items: [] } } });
      if (queued === null) throw new Error("Semantic reconciliation queue was deduplicated before extraction committed.");
    }
    await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='reconciling', semantic_reconciliation_execution_id=$3 WHERE bundle_id=$1 AND document_id=$2", [scope.bundleId, scope.documentId, actualReconciliationExecutionId]);
  }
}
