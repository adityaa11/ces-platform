import { randomUUID } from "node:crypto";
import { parseSemanticReconciliationContext, parseSemanticReconciliationResult, type DocumentPerceptionRequest } from "@atlas/contracts";
import { SemanticAcceptanceRejection, type PerceptionExecutionInput, type SemanticAcceptanceHandler } from "@atlas/core";
import { PostgresPerceptionAuthority } from "./perception-authority.js";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
type Relationship = { source_candidate_id: string; target_candidate_id?: string; relationship_type: string; payload: unknown; requires_resolution: boolean; evidence_refs: readonly { page_number: number; locator_type: string; locator_id: string; excerpt?: string }[] };
type PerceptionQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest }): Promise<string | null> };
const json = (value: unknown): unknown => typeof value === "string" ? JSON.parse(value) : value;

/** Atomically accepts one authorized reconciliation and starts only D(n + 1). */
export class PostgresReconciliationAcceptanceHandler implements SemanticAcceptanceHandler {
  constructor(private readonly nextPerception?: { readonly authority: PostgresPerceptionAuthority; readonly queue: PerceptionQueue }) {}

  async accept(input: { readonly executionId: string; readonly completionFingerprint: string; readonly envelope: unknown }, transaction?: unknown): Promise<void> {
    const sql = transaction as Sql | undefined;
    if (!sql) throw new Error("Reconciliation acceptance requires the authority transaction.");
    const envelope = input.envelope as { skill?: { id?: string }; scope?: Record<string, string>; provider?: unknown; result?: unknown };
    if (envelope.skill?.id !== "atlas.semantic.reconcile" || !envelope.scope) throw new Error("Reconciliation handler received the wrong semantic stage.");
    const scope = envelope.scope;
    const member = await sql.unsafe("SELECT m.sequence, m.state, b.state AS bundle_state FROM atlas.extraction_bundle_document m JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE m.bundle_id=$1 AND m.document_id=$2 AND m.project_id=$3 AND m.workspace_id=$4 AND m.semantic_reconciliation_execution_id=$5 FOR UPDATE OF m,b", [scope.bundleId, scope.documentId, scope.projectId, scope.workspaceId, input.executionId]);
    if (member.length !== 1 || member[0].state !== "reconciling" || member[0].bundle_state !== "processing") throw new Error("Reconciliation bundle state is unavailable.");
    const stored = await sql.unsafe("SELECT context_json FROM atlas.semantic_execution_context WHERE execution_id=$1 FOR UPDATE", [input.executionId]);
    if (stored.length !== 1) throw new Error("Reconciliation authorized context is unavailable.");
    const context = parseSemanticReconciliationContext(json(stored[0].context_json)) as unknown as { currentCandidates: readonly { id: string; evidence_refs: readonly Evidence[] }[]; priorCandidates: readonly { id: string; evidence_refs: readonly Evidence[] }[] };
    const result = parseSemanticReconciliationResult(envelope.result) as unknown as { relationships: readonly Relationship[] };
    this.validate(context, result.relationships);
    const existing = await sql.unsafe("SELECT completion_fingerprint FROM atlas.semantic_reconciliation_result WHERE execution_id=$1 FOR UPDATE", [input.executionId]);
    if (existing.length) { if (String(existing[0].completion_fingerprint) === input.completionFingerprint) return; throw new Error("Reconciliation completion conflicts with existing materialization."); }
    const resultId = randomUUID();
    await sql.unsafe("INSERT INTO atlas.semantic_reconciliation_result (id, execution_id, project_id, workspace_id, bundle_id, current_document_id, contract_version, provider_provenance, result_json, completion_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,'v1',$7::jsonb,$8::jsonb,$9)", [resultId, input.executionId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, envelope.provider, result, input.completionFingerprint]);
    for (const relationship of result.relationships) await sql.unsafe("INSERT INTO atlas.reconciliation_relationship (id,reconciliation_result_id,project_id,workspace_id,bundle_id,source_semantic_id,target_semantic_id,relationship_type,payload,requires_resolution) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)", [randomUUID(), resultId, scope.projectId, scope.workspaceId, scope.bundleId, relationship.source_candidate_id, relationship.target_candidate_id ?? null, relationship.relationship_type, relationship.payload, relationship.requires_resolution]);
    await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='completed', completed_at=now() WHERE bundle_id=$1 AND document_id=$2 AND state='reconciling'", [scope.bundleId, scope.documentId]);
    // Make the accepted final result visible to the completion gate in this
    // same transaction. The authority's outer completion update is therefore
    // idempotent; any later gate failure rolls this state back as well.
    await sql.unsafe("UPDATE atlas.semantic_execution SET lifecycle='completed', completion_fingerprint=$2, completed_at=now() WHERE id=$1 AND lifecycle IN ('queued','running')", [input.executionId, input.completionFingerprint]);
    const count = await sql.unsafe("SELECT count(*)::int AS count FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND state='completed'", [scope.bundleId]);
    await sql.unsafe("UPDATE atlas.extraction_bundle SET completed_document_count=$2 WHERE id=$1", [scope.bundleId, count[0].count]);
    const next = await sql.unsafe("SELECT m.document_id, d.storage_key, d.source_sha256, d.byte_size, d.media_type FROM atlas.extraction_bundle_document m JOIN atlas.document d ON d.id=m.document_id AND d.project_id=m.project_id AND d.workspace_id=m.workspace_id WHERE m.bundle_id=$1 AND m.sequence=$2 AND m.state='pending' FOR UPDATE OF m", [scope.bundleId, Number(member[0].sequence) + 1]);
    if (next.length) {
      if (!this.nextPerception) throw new Error("Next-document perception authority is unavailable.");
      const executionId = randomUUID(); const idempotencyKey = `perception:${scope.bundleId}:${String(next[0].document_id)}:v1`;
      const perceptionInput: PerceptionExecutionInput = { executionId, artifactId: String(next[0].document_id), storageKey: String(next[0].storage_key), sourceSha256: String(next[0].source_sha256), mimeType: String(next[0].media_type) as "application/pdf", byteSize: Number(next[0].byte_size), idempotencyKey, capabilityIdentity: `bundle:${scope.bundleId}:document:${String(next[0].document_id)}:perception:v1` };
      const request = await this.nextPerception.authority.createInTransaction(sql, perceptionInput);
      const queued = await this.nextPerception.queue.enqueue(sql, { idempotencyKey, request });
      if (queued === null) throw new Error("Next perception was deduplicated before reconciliation committed.");
      await sql.unsafe("UPDATE atlas.extraction_bundle_document SET state='perception_queued', perception_execution_id=$3, started_at=COALESCE(started_at,now()) WHERE bundle_id=$1 AND document_id=$2 AND state='pending'", [scope.bundleId, next[0].document_id, executionId]);
      return;
    }
    await this.completeBundle(sql, scope.bundleId, scope.projectId, scope.workspaceId);
  }

  /** The final result remains inside the semantic-authority transaction: a
   * failed integrity check rolls back the result, relationship rows, member
   * completion, progress count, and both lifecycle transitions together. */
  private async completeBundle(sql: Sql, bundleId: string, projectId: string, workspaceId: string): Promise<void> {
    const bundles = await sql.unsafe("SELECT expected_document_count, completed_document_count, semantic_contract_version, reconciliation_contract_version FROM atlas.extraction_bundle WHERE id=$1 AND project_id=$2 AND workspace_id=$3 AND state='processing' FOR UPDATE", [bundleId, projectId, workspaceId]);
    if (bundles.length !== 1) throw new Error("Bundle completion state is unavailable.");
    const bundle = bundles[0];
    const expected = Number(bundle.expected_document_count);
    if (Number(bundle.completed_document_count) !== expected) throw new Error("Bundle completion count does not match its manifest.");
    const members = await sql.unsafe("SELECT m.document_id, m.state, m.perception_execution_id, m.semantic_extraction_execution_id, m.semantic_reconciliation_execution_id, p.state AS perception_state FROM atlas.extraction_bundle_document m LEFT JOIN atlas.document_perception_execution p ON p.id=m.perception_execution_id WHERE m.bundle_id=$1 AND m.project_id=$2 AND m.workspace_id=$3 ORDER BY m.sequence FOR UPDATE OF m", [bundleId, projectId, workspaceId]);
    if (members.length !== expected || members.some((member) => member.state !== "completed" || member.perception_state !== "completed" || !member.semantic_extraction_execution_id || !member.semantic_reconciliation_execution_id)) throw new Error(`Bundle completion has incomplete member stages: ${JSON.stringify(members.map((member) => ({ state: member.state, perception: member.perception_state, extraction: Boolean(member.semantic_extraction_execution_id), reconciliation: Boolean(member.semantic_reconciliation_execution_id) })))}`);
    for (const member of members) {
      for (const [stage, executionId] of [["extraction", member.semantic_extraction_execution_id], ["reconciliation", member.semantic_reconciliation_execution_id]] as const) {
        const executions = await sql.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_execution WHERE id=$1 AND bundle_id=$2 AND document_id=$3 AND project_id=$4 AND workspace_id=$5 AND stage=$6 AND contract_version=$7 AND lifecycle='completed'", [executionId, bundleId, member.document_id, projectId, workspaceId, stage, stage === "extraction" ? bundle.semantic_contract_version : bundle.reconciliation_contract_version]);
        if (Number(executions[0].count) !== 1) throw new Error("Bundle completion has an incomplete semantic stage.");
      }
    }
    const invalid = await sql.unsafe(`
      SELECT c.id
      FROM atlas.semantic_candidate c
      LEFT JOIN atlas.semantic_extraction_result r ON r.id=c.extraction_result_id AND r.project_id=c.project_id AND r.workspace_id=c.workspace_id AND r.bundle_id=c.bundle_id AND r.document_id=c.document_id
      LEFT JOIN atlas.extraction_bundle_document m ON m.bundle_id=c.bundle_id AND m.document_id=c.document_id AND m.project_id=c.project_id AND m.workspace_id=c.workspace_id
      LEFT JOIN atlas.document_perception_execution p ON p.id=m.perception_execution_id
      LEFT JOIN atlas.normalized_document_cache n ON n.source_sha256=(SELECT d.source_sha256 FROM atlas.document d WHERE d.id=c.document_id AND d.project_id=c.project_id AND d.workspace_id=c.workspace_id) AND n.contract_version=p.contract_version AND n.capability='atlas.document.perceive' AND n.capability_identity=p.capability_identity AND n.invalidated_at IS NULL
      WHERE c.bundle_id=$1 AND c.project_id=$2 AND c.workspace_id=$3 AND (
        r.id IS NULL OR c.state IN ('accepted','resolved') OR n.cache_key IS NULL OR EXISTS (
          SELECT 1 FROM atlas.semantic_evidence e
          WHERE e.semantic_candidate_id=c.id AND (
            e.document_id<>c.document_id OR NOT COALESCE(CASE e.locator_type
              WHEN 'text_block' THEN jsonb_path_exists(CASE jsonb_typeof(n.normalized_document) WHEN 'string' THEN (n.normalized_document #>> '{}')::jsonb ELSE n.normalized_document END, '$.pages[*] ? (@.number == $page && @.textBlocks[*].id == $locator)', jsonb_build_object('page', to_jsonb(e.page_number), 'locator', to_jsonb(e.locator_id)))
              WHEN 'table' THEN jsonb_path_exists(CASE jsonb_typeof(n.normalized_document) WHEN 'string' THEN (n.normalized_document #>> '{}')::jsonb ELSE n.normalized_document END, '$.pages[*] ? (@.number == $page && @.tables[*].id == $locator)', jsonb_build_object('page', to_jsonb(e.page_number), 'locator', to_jsonb(e.locator_id)))
              WHEN 'visual_region' THEN jsonb_path_exists(CASE jsonb_typeof(n.normalized_document) WHEN 'string' THEN (n.normalized_document #>> '{}')::jsonb ELSE n.normalized_document END, '$.pages[*] ? (@.number == $page && @.visualRegions[*].id == $locator)', jsonb_build_object('page', to_jsonb(e.page_number), 'locator', to_jsonb(e.locator_id)))
              ELSE false
            END, false)
          )
        )
      )
      LIMIT 1
    `, [bundleId, projectId, workspaceId]);
    if (invalid.length) throw new Error("Bundle completion detected invalid candidate or evidence authority.");
    const unresolved = await sql.unsafe("SELECT 1 FROM atlas.semantic_execution WHERE bundle_id=$1 AND project_id=$2 AND workspace_id=$3 AND contract_version IN ($4,$5) AND lifecycle IN ('queued','running','failed') LIMIT 1", [bundleId, projectId, workspaceId, bundle.semantic_contract_version, bundle.reconciliation_contract_version]);
    if (unresolved.length) throw new Error("Bundle completion has an active or failed semantic stage.");
    const master = await sql.unsafe("SELECT state FROM atlas.workspace WHERE project_id=$1 AND kind='master' FOR UPDATE", [projectId]);
    if (master.length !== 1 || master[0].state !== "empty") throw new Error("Bundle completion requires an empty Master workspace.");
    const workspace = await sql.unsafe("UPDATE atlas.workspace SET state='ready_for_review' WHERE id=$1 AND project_id=$2 AND kind='initial_draft' AND state='draft' RETURNING id", [workspaceId, projectId]);
    if (workspace.length !== 1) throw new Error("Bootstrap workspace cannot become review-ready.");
    await sql.unsafe("UPDATE atlas.extraction_bundle SET state='ready_for_review', completed_at=now() WHERE id=$1 AND state='processing'", [bundleId]);
  }

  private validate(context: { currentCandidates: readonly { id: string; evidence_refs: readonly Evidence[] }[]; priorCandidates: readonly { id: string; evidence_refs: readonly Evidence[] }[] }, relationships: readonly Relationship[]): void {
    const current = new Set(context.currentCandidates.map((candidate) => candidate.id));
    const authorized = new Set([...context.currentCandidates, ...context.priorCandidates].map((candidate) => candidate.id));
    const evidence = new Set([...context.currentCandidates, ...context.priorCandidates].flatMap((candidate) => candidate.evidence_refs.map(evidenceKey)));
    const accounted = new Set<string>();
    for (const relationship of relationships) {
      if (!current.has(relationship.source_candidate_id)) throw new SemanticAcceptanceRejection("Reconciliation source is not in the current authorized set.");
      if (relationship.relationship_type === "new") { if (relationship.target_candidate_id !== undefined) throw new SemanticAcceptanceRejection("New reconciliation relationship cannot have a target."); }
      else if (!relationship.target_candidate_id || !authorized.has(relationship.target_candidate_id)) throw new SemanticAcceptanceRejection("Reconciliation target is outside the authorized context.");
      for (const ref of relationship.evidence_refs) if (!evidence.has(evidenceKey(ref))) throw new SemanticAcceptanceRejection("Reconciliation evidence is outside the authorized context.");
      accounted.add(relationship.source_candidate_id);
    }
    for (const id of current) if (!accounted.has(id)) throw new SemanticAcceptanceRejection("Reconciliation result does not account for every current candidate.");
  }
}

type Evidence = { page_number: number; locator_type: string; locator_id: string; excerpt?: string };
const evidenceKey = (evidence: Evidence) => `${evidence.page_number}:${evidence.locator_type}:${evidence.locator_id}:${evidence.excerpt ?? ""}`;
