import { createHash } from "node:crypto";
import { parseSemanticExtractionResult, type SemanticExtractionResult } from "@atlas/contracts";
import { provisionalSemanticCompositeAccountingVersion, relationshipContractVersion, relationshipSha256 } from "@atlas/skills";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };
const sha256 = /^[a-f0-9]{64}$/u;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Composite payload contains a non-finite number."); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!isRecord(value)) throw new Error("Composite payload is not JSON-compatible.");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
const digest = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const requireHash = (value: unknown, label: string): string => { if (typeof value !== "string" || !sha256.test(value)) throw new Error(`Invalid ${label}.`); return value; };
const sameJson = (left: unknown, right: unknown) => canonicalJson(left) === canonicalJson(right);

export class SemanticCompositeLeaseLostError extends Error {
  constructor(message = "Semantic composite claimant lease was superseded or expired.") { super(message); this.name = "SemanticCompositeLeaseLostError"; }
}
export class SemanticCompositeConflictError extends Error {
  constructor(message = "Semantic composite staging conflicts with the immutable winner.") { super(message); this.name = "SemanticCompositeConflictError"; }
}

export type SemanticCompositeStageInput = {
  readonly idempotencyKey: string;
  readonly executionId: string;
  readonly lease: { readonly owner: string; readonly generation: number };
  readonly sourceSnapshot: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string };
  readonly profile: { readonly id: string; readonly hash: string };
  readonly request: { readonly id: string; readonly hash: string };
  readonly canonicalResult: SemanticExtractionResult | null;
  readonly provisionalRelationshipRevisions: readonly Record<string, unknown>[];
  readonly provisionalSidecar: Record<string, unknown>;
  readonly compositeHash: string;
};

type ValidComposite = Omit<SemanticCompositeStageInput, "canonicalResult"> & { readonly canonicalResult: SemanticExtractionResult | null; readonly revisionSetHash: string; readonly sidecarHash: string };
export type SemanticCompositeWinner = Omit<ValidComposite, "lease"> & { readonly lease: { readonly owner: string; readonly generation: number } };

function validate(input: SemanticCompositeStageInput): ValidComposite {
  if (!nonEmpty(input.idempotencyKey) || !nonEmpty(input.executionId) || !nonEmpty(input.lease?.owner) || !Number.isSafeInteger(input.lease?.generation) || input.lease.generation < 1) throw new Error("Composite idempotency, execution, or lease identity is invalid.");
  const source = input.sourceSnapshot;
  if (!isRecord(source) || ![source.projectId, source.workspaceId, source.bundleId, source.documentId, source.executionId, source.artifactId].every(nonEmpty) || source.executionId !== input.executionId || source.artifactId !== source.documentId) throw new Error("Composite source snapshot is malformed or does not match the execution.");
  requireHash(source.sourceSha256, "source SHA-256");
  if (!isRecord(input.profile) || !nonEmpty(input.profile.id)) throw new Error("Composite profile identity is invalid.");
  if (!isRecord(input.request) || !nonEmpty(input.request.id)) throw new Error("Composite request identity is invalid.");
  requireHash(input.profile.hash, "profile hash"); requireHash(input.request.hash, "request hash");
  const canonicalResult = input.canonicalResult === null ? null : parseSemanticExtractionResult(input.canonicalResult);
  if (!Array.isArray(input.provisionalRelationshipRevisions)) throw new Error("Composite relationship revisions are invalid.");
  const revisionHashes = new Set<string>();
  for (const revision of input.provisionalRelationshipRevisions) {
    if (!isRecord(revision) || !isRecord(revision.scope) || revision.contractVersion !== relationshipContractVersion || !nonEmpty(revision.relationshipLineageId) || !isRecord(revision.normalizedDocument) || !isRecord(revision.ownedSource) || !isRecord(revision.contextSource) || !isRecord(revision.relationship) || !Array.isArray(revision.candidateRefs) || !isRecord(revision.proposalProvenance) || revision.authorization !== null || !["proposed", "unresolved"].includes(String(revision.disposition)) || !["low", "medium", "high", "unknown"].includes(String(revision.uncertainty)) || !nonEmpty(revision.proposedMeaning) || (revision.sourceLanguage !== null && !nonEmpty(revision.sourceLanguage))) throw new Error("Composite relationship revision is unqualified or malformed.");
    if (revision.scope.executionId !== input.executionId || revision.scope.sourceSha256 !== source.sourceSha256 || revision.scope.documentId !== source.documentId || revision.scope.artifactId !== source.artifactId || revision.scope.projectId !== source.projectId || revision.scope.workspaceId !== source.workspaceId || revision.scope.bundleId !== source.bundleId || revision.normalizedDocument.executionId !== input.executionId || revision.normalizedDocument.artifactId !== source.artifactId || revision.normalizedDocument.sourceSha256 !== source.sourceSha256) throw new Error("Composite relationship revision is foreign or malformed.");
    const immutable = { ...revision }; delete immutable.revisionHash;
    const revisionHash = requireHash(revision.revisionHash, "relationship revision hash"); if (revisionHash !== relationshipSha256(immutable) || revisionHashes.has(revisionHash)) throw new Error("Composite relationship revision hash is tampered or duplicated."); revisionHashes.add(revisionHash);
  }
  if (!isRecord(input.provisionalSidecar) || input.provisionalSidecar.version !== provisionalSemanticCompositeAccountingVersion || !isRecord(input.provisionalSidecar.scope) || input.provisionalSidecar.scope.executionId !== input.executionId || input.provisionalSidecar.scope.projectId !== source.projectId || input.provisionalSidecar.scope.workspaceId !== source.workspaceId || input.provisionalSidecar.scope.bundleId !== source.bundleId || input.provisionalSidecar.scope.documentId !== source.documentId || input.provisionalSidecar.scope.sourceSha256 !== source.sourceSha256 || input.provisionalSidecar.semanticProfile !== input.profile.id || input.provisionalSidecar.semanticProfileSha256 !== input.profile.hash || input.provisionalSidecar.requestSha256 !== input.request.hash || !Array.isArray(input.provisionalSidecar.deferredInterpretations) || !Array.isArray(input.provisionalSidecar.relationshipDependencies) || !Array.isArray(input.provisionalSidecar.tupleCoverage) || !Array.isArray(input.provisionalSidecar.sourceCoverage) || !isRecord(input.provisionalSidecar.authority) || input.provisionalSidecar.authority.acceptedRelationshipAuthority !== null || input.provisionalSidecar.authority.masterMutation !== false || input.provisionalSidecar.authority.publishing !== false || input.provisionalSidecar.authority.reconciliationTruth !== false) throw new Error("Composite provisional sidecar is unqualified or invalid.");
  const { compositeHash: sidecarCompositeHash, ...sidecarBody } = input.provisionalSidecar;
  if (!sameJson(input.provisionalSidecar.relationshipDependencies, input.provisionalRelationshipRevisions) || input.provisionalSidecar.canonicalResultSha256 !== digest(canonicalResult) || requireHash(sidecarCompositeHash, "provisional sidecar composite hash") !== digest(sidecarBody)) throw new Error("Composite provisional sidecar is tampered or inconsistent.");
  const deferredIds = new Set<string>();
  for (const item of input.provisionalSidecar.deferredInterpretations) {
    if (!isRecord(item) || !isRecord(item.provider_candidate_tuple) || !isRecord(item.source) || !isRecord(item.source.owned_source) || !isRecord(item.source.context_source) || item.reason !== "essential_provisional_relationship" || item.canonical_candidate_id !== null || item.proposed_candidate_meaning === undefined || !["low", "medium", "high", "unknown"].includes(String(item.uncertainty))) throw new Error("Composite deferred interpretation is unqualified or invalid.");
    const id = requireHash(item.deferred_interpretation_id, "deferred interpretation identity");
    const revisionHash = requireHash(item.relationship_revision_hash, "deferred relationship revision hash");
    const tuple = item.provider_candidate_tuple;
    const revision = input.provisionalRelationshipRevisions.find((candidate: Record<string, unknown>) => candidate.revisionHash === revisionHash);
    if (!revision || deferredIds.has(id) || !Array.isArray(revision.candidateRefs) || !revision.candidateRefs.some((candidate: unknown) => isRecord(candidate) && candidate.sourceSlot === tuple.source_slot && candidate.candidateIndex === tuple.candidate_index) || !sameJson(item.source.context_source, revision.contextSource) || id !== relationshipSha256({ scope: revision.scope, sourceSlot: tuple.source_slot, candidateIndex: tuple.candidate_index, relationshipRevisionHash: revisionHash })) throw new Error("Composite deferred interpretation is foreign or duplicated."); deferredIds.add(id);
  }
  if (canonicalResult === null && deferredIds.size === 0) throw new Error("A fully deferred composite requires qualified deferred meaning; non_fact cannot be fabricated.");
  const revisionSetHash = digest(input.provisionalRelationshipRevisions);
  const sidecarHash = digest(input.provisionalSidecar);
  const expectedCompositeHash = digest({ idempotencyKey: input.idempotencyKey, executionId: input.executionId, sourceSnapshot: source, profile: input.profile, request: input.request, canonicalResult, provisionalRelationshipRevisions: input.provisionalRelationshipRevisions, provisionalSidecar: input.provisionalSidecar, revisionSetHash, sidecarHash });
  if (input.compositeHash !== expectedCompositeHash) throw new Error("Composite hash does not match the complete immutable winner.");
  return { ...input, canonicalResult, revisionSetHash, sidecarHash };
}

export function semanticCompositeHash(input: Omit<SemanticCompositeStageInput, "compositeHash">): string {
  const revisionSetHash = digest(input.provisionalRelationshipRevisions); const sidecarHash = digest(input.provisionalSidecar);
  return digest({ idempotencyKey: input.idempotencyKey, executionId: input.executionId, sourceSnapshot: input.sourceSnapshot, profile: input.profile, request: input.request, canonicalResult: input.canonicalResult, provisionalRelationshipRevisions: input.provisionalRelationshipRevisions, provisionalSidecar: input.provisionalSidecar, revisionSetHash, sidecarHash });
}

function winner(row: Record<string, unknown>): SemanticCompositeWinner {
  return { idempotencyKey: String(row.idempotency_key), executionId: String(row.execution_id), lease: { owner: String(row.lease_owner), generation: Number(row.lease_generation) }, sourceSnapshot: row.source_snapshot as SemanticCompositeStageInput["sourceSnapshot"], profile: row.profile_identity as SemanticCompositeStageInput["profile"], request: row.request_identity as SemanticCompositeStageInput["request"], canonicalResult: row.canonical_result as SemanticExtractionResult | null, provisionalRelationshipRevisions: row.provisional_relationship_revisions as readonly Record<string, unknown>[], provisionalSidecar: row.provisional_sidecar as SemanticCompositeStageInput["provisionalSidecar"], compositeHash: String(row.composite_hash), revisionSetHash: String(row.revision_set_hash), sidecarHash: String(row.sidecar_hash) };
}
const columns = "idempotency_key, execution_id, lease_owner, lease_generation, source_snapshot, profile_identity, request_identity, canonical_result, provisional_relationship_revisions, provisional_sidecar, composite_hash, revision_set_hash, sidecar_hash";

/** Bridge-only, immutable composite staging. It neither publishes nor acknowledges semantic output. */
export function createSemanticCompositeReplay(database: Database) {
  const load = async (idempotencyKey: string, executionId: string): Promise<SemanticCompositeWinner | undefined> => {
    const result = await database.executeSql(`SELECT ${columns} FROM bridge.semantic_composite_stage WHERE idempotency_key=$1 AND execution_id=$2`, [idempotencyKey, executionId]);
    return result.rows[0] ? winner(result.rows[0]) : undefined;
  };
  return {
    load,
    async stage(raw: SemanticCompositeStageInput): Promise<SemanticCompositeWinner> {
      const input = validate(raw);
      const values = [input.idempotencyKey, input.executionId, input.lease.owner, input.lease.generation, JSON.stringify(input.sourceSnapshot), JSON.stringify(input.profile), JSON.stringify(input.request), input.canonicalResult === null ? null : JSON.stringify(input.canonicalResult), JSON.stringify(input.provisionalRelationshipRevisions), JSON.stringify(input.provisionalSidecar), input.compositeHash, input.revisionSetHash, input.sidecarHash];
      const statement = `WITH claimant AS (SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now() FOR UPDATE), staged AS (INSERT INTO bridge.semantic_composite_stage (${columns}) SELECT $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13 FROM claimant ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=bridge.semantic_composite_stage.idempotency_key WHERE bridge.semantic_composite_stage.execution_id=EXCLUDED.execution_id AND bridge.semantic_composite_stage.source_snapshot=EXCLUDED.source_snapshot AND bridge.semantic_composite_stage.profile_identity=EXCLUDED.profile_identity AND bridge.semantic_composite_stage.request_identity=EXCLUDED.request_identity AND bridge.semantic_composite_stage.canonical_result IS NOT DISTINCT FROM EXCLUDED.canonical_result AND bridge.semantic_composite_stage.provisional_relationship_revisions=EXCLUDED.provisional_relationship_revisions AND bridge.semantic_composite_stage.provisional_sidecar=EXCLUDED.provisional_sidecar AND bridge.semantic_composite_stage.composite_hash=EXCLUDED.composite_hash AND bridge.semantic_composite_stage.revision_set_hash=EXCLUDED.revision_set_hash AND bridge.semantic_composite_stage.sidecar_hash=EXCLUDED.sidecar_hash RETURNING ${columns}) SELECT * FROM staged`;
      const result = await database.executeSql(statement, values);
      if (result.rows[0]) return winner(result.rows[0]);
      const current = await database.executeSql("SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now()", values.slice(0, 4));
      if (!current.rows.length) throw new SemanticCompositeLeaseLostError();
      throw new SemanticCompositeConflictError();
    },
  };
}
