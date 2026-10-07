import { randomUUID } from "node:crypto";
import { documentPerceptionContractVersion, type DocumentPerceptionRequest } from "@atlas/core";
import { assertCreateAtlasProjectInput, type AccessibleAtlasProject, type AtlasProjectRepository, type CreateAtlasProjectInput, type ExtractionBundleDocumentState, type ExtractionBundleState, type PersistedLifecycleMemberFact } from "@atlas/core";
import { PostgresPerceptionAuthority } from "./perception-authority.js";

type Row = Record<string, unknown>;
type Sql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]>; begin<T>(work: (transaction: Sql) => Promise<T>): Promise<T> };
export type PerceptionKickoffQueue = { enqueue(transaction: Sql, job: { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest }): Promise<string | null> };

const bundleStates = new Set<ExtractionBundleState>(["waiting", "processing", "ready_for_review", "needs_attention"]);
const memberStates = new Set<ExtractionBundleDocumentState>(["pending", "perception_queued", "perceiving", "extracting", "reconciling", "completed", "needs_attention"]);
const integer = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};
const text = (value: unknown): string | null => typeof value === "string" && value.length > 0 ? value : null;

function readMemberFacts(value: unknown): readonly PersistedLifecycleMemberFact[] | null {
  if (!Array.isArray(value)) return null;
  const facts: PersistedLifecycleMemberFact[] = [];
  for (const member of value) {
    if (!member || typeof member !== "object") return null;
    const row = member as Row;
    const documentId = text(row.document_id);
    const sequence = integer(row.sequence);
    const state = text(row.state);
    if (!documentId || sequence === null || sequence < 1 || !state || !memberStates.has(state as ExtractionBundleDocumentState)) return null;
    facts.push({ documentId, sequence, state: state as ExtractionBundleDocumentState, hasTechnicalFailure: row.has_technical_failure === true });
  }
  return facts.sort((left, right) => left.sequence - right.sequence);
}

/** PostgreSQL adapter for the Atlas project graph; core receives no SQL details. */
export class PostgresAtlasProjectRepository implements AtlasProjectRepository {
  constructor(private readonly sql: Sql, private readonly kickoff?: { readonly authority: PostgresPerceptionAuthority; readonly queue: PerceptionKickoffQueue; readonly capabilityIdentity?: string }) {}

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
        await sql.unsafe("INSERT INTO atlas.extraction_bundle (id, project_id, workspace_id, state, semantic_contract_version, reconciliation_contract_version, perception_admission_policy, expected_document_count, completed_document_count) VALUES ($1,$2,$3,'waiting',$4,$4,'staged-fair-local-v1',$5,0)", [bundleId, input.id, input.initialDraftWorkspaceId, documentPerceptionContractVersion, input.documents.length]);
        for (const [index, document] of input.documents.entries()) {
          await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id, document_id, project_id, workspace_id, sequence, state) VALUES ($1,$2,$3,$4,$5,'pending')", [bundleId, document.id, input.id, input.initialDraftWorkspaceId, index + 1]);
        }
        // The gate holds the only global local-perception capacity lock.  A
        // saturated creation intentionally commits with every member pending.
        await this.kickoff.authority.admitStagedInTransaction(sql, this.kickoff.queue, this.kickoff.capabilityIdentity);
      }
    });
  }

  async isProjectIdAvailable(projectId: string): Promise<boolean> {
    const rows = await this.sql.unsafe("SELECT 1 FROM atlas.project WHERE stable_id=$1 LIMIT 1", [projectId]);
    return rows.length === 0;
  }

  async listAccessibleTo(userId: string): Promise<readonly AccessibleAtlasProject[]> {
    // The membership join is intentionally the first authorization boundary;
    // lifecycle rows are only reached through its selected project IDs.
    const rows = await this.sql.unsafe(`SELECT p.id, p.stable_id, p.name, p.description, p.created_at,
      workspace.master_workspace_id, workspace.master_workspace_state, workspace.initial_draft_workspace_id, workspace.initial_draft_workspace_state,
      COALESCE(workspace.initial_draft_document_count, 0)::integer AS initial_draft_document_count,
      EXISTS (SELECT 1 FROM atlas.document_perception_execution e JOIN atlas.document d ON d.id=e.artifact_id WHERE d.project_id=p.id) AS has_downstream_extraction_state,
      bundle.id AS bundle_id, bundle.state AS bundle_state, bundle.expected_document_count, bundle.completed_document_count, bundle.workspace_id AS bundle_workspace_id,
      COALESCE(semantic.has_semantic_uncertainty, false) AS has_semantic_uncertainty,
      COALESCE(members.member_facts, '[]'::jsonb) AS member_facts
      FROM atlas.project p
      JOIN atlas.project_member membership ON membership.project_id=p.id AND membership.user_id=$1
      LEFT JOIN LATERAL (
        SELECT MAX(w.id) FILTER (WHERE w.kind='master') AS master_workspace_id,
          MAX(w.state) FILTER (WHERE w.kind='master') AS master_workspace_state,
          MAX(w.id) FILTER (WHERE w.kind='initial_draft') AS initial_draft_workspace_id,
          MAX(w.state) FILTER (WHERE w.kind='initial_draft') AS initial_draft_workspace_state,
          COUNT(DISTINCT w.id) FILTER (WHERE w.kind='master') AS master_count,
          COUNT(DISTINCT w.id) FILTER (WHERE w.kind='initial_draft') AS initial_draft_count,
          COUNT(d.id) FILTER (WHERE w.kind='initial_draft') AS initial_draft_document_count
        FROM atlas.workspace w LEFT JOIN atlas.document d ON d.workspace_id=w.id WHERE w.project_id=p.id
      ) workspace ON true
      LEFT JOIN atlas.extraction_bundle bundle ON bundle.project_id=p.id
      LEFT JOIN LATERAL (
        SELECT EXISTS (
          SELECT 1 FROM atlas.semantic_candidate candidate
          WHERE candidate.project_id=p.id AND candidate.workspace_id=bundle.workspace_id AND candidate.bundle_id=bundle.id AND candidate.needs_resolution=true
        ) OR EXISTS (
          SELECT 1 FROM atlas.reconciliation_relationship relationship
          WHERE relationship.project_id=p.id AND relationship.workspace_id=bundle.workspace_id AND relationship.bundle_id=bundle.id AND relationship.requires_resolution=true
        ) AS has_semantic_uncertainty
      ) semantic ON bundle.id IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object('document_id', member.document_id, 'sequence', member.sequence, 'state', member.state, 'has_technical_failure', member.last_failure_code IS NOT NULL OR member.last_failure_at IS NOT NULL) ORDER BY member.sequence) AS member_facts
        FROM atlas.extraction_bundle_document member
        WHERE member.bundle_id=bundle.id AND member.project_id=p.id AND member.workspace_id=bundle.workspace_id
      ) members ON true
      WHERE workspace.master_count=1 AND workspace.initial_draft_count=1
      ORDER BY p.created_at DESC`, [userId]);
    const byProject = new Map<string, Row[]>();
    for (const row of rows) {
      const projectId = text(row.id);
      if (!projectId) continue;
      byProject.set(projectId, [...(byProject.get(projectId) ?? []), row]);
    }
    const projects: AccessibleAtlasProject[] = [];
    for (const projectRows of byProject.values()) {
      // Zero bundles is legacy only. More than one bundle is malformed and is
      // deliberately withheld instead of guessing which lifecycle is current.
      if (projectRows.length !== 1) continue;
      const row = projectRows[0];
      const id = text(row.id), projectId = text(row.stable_id), name = text(row.name), masterWorkspaceId = text(row.master_workspace_id), draftWorkspaceId = text(row.initial_draft_workspace_id);
      const documentCount = integer(row.initial_draft_document_count);
      if (!id || !projectId || !name || !masterWorkspaceId || !draftWorkspaceId || documentCount === null || documentCount < 0) continue;
      const masterState = row.master_workspace_state === "empty" ? "empty" : null;
      const draftState = row.initial_draft_workspace_state === "draft" ? "draft" : null;
      const hasDownstream = row.has_downstream_extraction_state === true;
      const common = { id, projectId, name, description: row.description === null ? null : String(row.description), createdAt: new Date(String(row.created_at)), masterWorkspaceId, initialDraftWorkspaceId: draftWorkspaceId, initialDraftDocumentCount: documentCount, masterWorkspaceState: masterState, initialDraftWorkspaceState: draftState, hasDownstreamExtractionState: hasDownstream, hasSemanticUncertainty: row.has_semantic_uncertainty === true } as const;
      if (row.bundle_id === null) {
        if (!hasDownstream && masterState === "empty" && draftState === "draft") projects.push({ ...common, lifecycle: { kind: "legacy_no_bundle" } });
        continue;
      }
      const bundleId = text(row.bundle_id), bundleState = text(row.bundle_state), bundleWorkspaceId = text(row.bundle_workspace_id), expected = integer(row.expected_document_count), completed = integer(row.completed_document_count), memberFacts = readMemberFacts(row.member_facts);
      if (!bundleId || !bundleState || !bundleStates.has(bundleState as ExtractionBundleState) || bundleWorkspaceId !== draftWorkspaceId || expected === null || completed === null || expected < 1 || completed < 0 || completed > expected || memberFacts === null || memberFacts.length !== expected || documentCount !== expected || memberFacts.some((member, index) => member.sequence !== index + 1)) continue;
      const completedFacts = memberFacts.filter((member) => member.state === "completed").length;
      const failedFacts = memberFacts.filter((member) => member.hasTechnicalFailure || member.state === "needs_attention").length;
      const complete = completed === expected && completedFacts === expected;
      const waitingMembers = memberFacts.every((member) => member.state === "pending" || member.state === "perception_queued");
      const validState = bundleState === "waiting" && draftState === "draft" && masterState === "empty" && completed === completedFacts && failedFacts === 0 && waitingMembers
        || bundleState === "processing" && draftState === "draft" && masterState === "empty" && completed === completedFacts && failedFacts === 0
        || bundleState === "ready_for_review" && complete && masterState === "empty" && row.initial_draft_workspace_state === "ready_for_review"
        || bundleState === "needs_attention" && draftState === "draft" && masterState === "empty" && completed === completedFacts && failedFacts > 0;
      if (!validState) continue;
      const lifecycle = bundleState === "needs_attention"
        ? { kind: "technical_failure" as const, bundleId, expectedDocumentCount: expected, completedDocumentCount: completed, memberFacts }
        : { kind: "bundle" as const, bundleId, bundleState: bundleState as ExtractionBundleState, expectedDocumentCount: expected, completedDocumentCount: completed, memberFacts };
      projects.push({ ...common, lifecycle });
    }
    return projects;
  }
}
