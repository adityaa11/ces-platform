import { createHash } from "node:crypto";
import { parseSemanticExtractionResult, semanticContractVersion, type QualifiedStepwiseAcceptanceInput, type SemanticExtractionResult } from "@atlas/contracts";
import {
  provisionalSemanticCompositeAccountingVersion,
  prepareQualifiedStepwiseSemanticCompositeAccounting,
  verifyQualifiedStepwiseSemanticPreparation,
  type ParsedStepwiseRelationshipEnvelope,
  type ProvisionalSemanticCompositeAccounting,
  type StepwiseRelationshipEnvelopeRequest,
} from "@atlas/skills";
import { projectQualifiedStepwiseSemanticResult } from "./semantic-extraction-finalizer.js";
import { prepareQualifiedStepwiseSemanticPreparation, projectStepwiseSlotsForRel03 } from "./semantic-relationship-interoperability-bridge.js";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };
const sha256 = /^[a-f0-9]{64}$/u;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Composite payload contains a non-finite number."); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!isRecord(value)) throw new Error("Composite payload is not JSON-compatible.");
  return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
const digest = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");

export class SemanticCompositeLeaseLostError extends Error {
  constructor(message = "Semantic composite claimant lease was superseded or expired.") { super(message); this.name = "SemanticCompositeLeaseLostError"; }
}
export class SemanticCompositeConflictError extends Error {
  constructor(message = "Semantic composite staging conflicts with the immutable winner.") { super(message); this.name = "SemanticCompositeConflictError"; }
}

/**
 * `request` and `providerProposal` are independent qualification evidence.
 * They are verified before SQL and deliberately never persisted.
 */
export type QualifiedSemanticCompositePreparation = Readonly<{
  readonly accounting: ProvisionalSemanticCompositeAccounting;
  readonly request: StepwiseRelationshipEnvelopeRequest;
  readonly providerProposal: ParsedStepwiseRelationshipEnvelope["semanticProposal"];
  readonly canonicalResult: SemanticExtractionResult | null;
  /** Original REL-03 qualification inputs, held independently from accounting. */
  readonly relationshipQualification: Parameters<typeof prepareQualifiedStepwiseSemanticPreparation>[0];
}>;

export type SemanticCompositeStageInput = Readonly<{
  readonly idempotencyKey: string;
  /** Semantic execution identity. The request snapshot retains perception identity. */
  readonly executionId: string;
  readonly lease: { readonly owner: string; readonly generation: number };
  readonly preparation: QualifiedSemanticCompositePreparation;
  readonly compositeHash: string;
}>;

type PersistedSidecar = Record<string, unknown> & { readonly qualifiedPreparationHash: string; readonly persistedCompositeHash: string };
type ValidComposite = Readonly<{
  readonly idempotencyKey: string;
  readonly executionId: string;
  readonly lease: { readonly owner: string; readonly generation: number };
  readonly sourceSnapshot: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string };
  readonly profile: { readonly id: string; readonly hash: string };
  readonly request: { readonly id: string; readonly hash: string };
  readonly canonicalResult: SemanticExtractionResult | null;
  readonly provisionalRelationshipRevisions: readonly Record<string, unknown>[];
  readonly provisionalSidecar: PersistedSidecar;
  readonly compositeHash: string;
  readonly revisionSetHash: string;
  readonly sidecarHash: string;
  readonly providerProvenance: Record<string, unknown>;
  readonly deliveryBindingHash: string | null;
}>;
export type SemanticCompositeWinner = ValidComposite;

/** Explicit durable projection: strips transient source/provider context and binds its qualified identity. */
function persistableAccounting(accounting: ProvisionalSemanticCompositeAccounting): PersistedSidecar {
  const { preparationContext: _transientContext, compositeHash: qualifiedPreparationHash, ...accountingBody } = accounting;
  const projection = { ...accountingBody, qualifiedPreparationHash };
  return { ...projection, persistedCompositeHash: digest(projection) };
}

function derive(input: Omit<SemanticCompositeStageInput, "compositeHash">): Omit<ValidComposite, "compositeHash" | "revisionSetHash" | "sidecarHash"> {
  if (!nonEmpty(input.idempotencyKey) || !nonEmpty(input.executionId) || !nonEmpty(input.lease?.owner) || !Number.isSafeInteger(input.lease.generation) || input.lease.generation < 1) throw new Error("Composite idempotency, execution, or lease identity is invalid.");
  const { accounting, request, providerProposal, relationshipQualification } = input.preparation;
  if (!accounting || accounting.version !== provisionalSemanticCompositeAccountingVersion) throw new Error("Composite accounting is not a qualified preparation.");
  // Re-run only published predecessor APIs against independently retained
  // evidence. Durable staging owns no relationship, projection, or accounting
  // rule; it rejects any alleged prepared result that cannot be reproduced.
  const qualified = prepareQualifiedStepwiseSemanticPreparation(relationshipQualification);
  if (canonicalJson(request) !== canonicalJson(relationshipQualification.request) || canonicalJson(providerProposal) !== canonicalJson(qualified.parsed.semanticProposal)) throw new Error("Qualified preparation evidence does not match the original relationship qualification.");
  const projectionSlots = projectStepwiseSlotsForRel03(request).map((slot) => {
    const source = request.sourceSlots.find((candidate) => candidate.slot === slot.slot);
    return source?.content === undefined ? slot : { ...slot, content: source.content };
  });
  const projection = projectQualifiedStepwiseSemanticResult({ proposal: qualified.parsed.semanticProposal, sourceSlots: projectionSlots, qualifiedDeferredInterpretations: qualified.qualified.deferred_interpretations, qualifiedRelationshipRevisions: qualified.currentResponseRevisions });
  const expectedAccounting = prepareQualifiedStepwiseSemanticCompositeAccounting({ scope: accounting.scope, request, providerProposal: qualified.parsed.semanticProposal, relationshipRevisions: relationshipQualification.trustedPriorRevisions, currentResponseRelationshipRevisions: qualified.currentResponseRevisions, qualifiedRelationshipResult: qualified.qualified, canonicalProjection: projection });
  if (canonicalJson(accounting) !== canonicalJson(expectedAccounting) || canonicalJson(input.preparation.canonicalResult) !== canonicalJson(projection.canonicalResult)) throw new Error("Prepared accounting or canonical projection does not correspond to qualified predecessor inputs.");
  // The accounting owner additionally verifies immutable retained evidence.
  verifyQualifiedStepwiseSemanticPreparation({ accounting, request, providerProposal });
  const canonicalResult = input.preparation.canonicalResult === null ? null : parseSemanticExtractionResult(input.preparation.canonicalResult);
  if (accounting.canonicalResultSha256 === null) {
    if (canonicalResult !== null) throw new Error("Qualified fully deferred accounting cannot carry canonical Semantic V1 output.");
  } else if (canonicalResult === null || accounting.canonicalResultSha256 !== digest(canonicalResult)) throw new Error("Canonical result does not match qualified accounting.");
  if (accounting.scope.executionId !== input.executionId || accounting.scope.documentId !== request.sourceSnapshot.artifactId || accounting.scope.sourceSha256 !== request.sourceSnapshot.sourceSha256 || accounting.semanticProfile !== request.profile || accounting.semanticProfileSha256 !== request.profileSha256 || accounting.requestSha256 !== request.requestSha256) throw new Error("Qualified preparation identities do not match durable staging identity.");
  if (!nonEmpty(request.sourceSnapshot.executionId) || !nonEmpty(request.sourceSnapshot.artifactId) || !sha256.test(request.sourceSnapshot.sourceSha256)) throw new Error("Qualified perception source snapshot is malformed.");
  if (canonicalResult === null && accounting.deferredInterpretations.length === 0) throw new Error("A fully deferred composite requires qualified deferred meaning; non_fact cannot be fabricated.");
  const sourceSnapshot = { projectId: accounting.scope.projectId, workspaceId: accounting.scope.workspaceId, bundleId: accounting.scope.bundleId, documentId: accounting.scope.documentId, executionId: request.sourceSnapshot.executionId, artifactId: request.sourceSnapshot.artifactId, sourceSha256: request.sourceSnapshot.sourceSha256 };
  const profile = { id: accounting.semanticProfile, hash: accounting.semanticProfileSha256 };
  const requestIdentity = { id: accounting.requestSha256, hash: accounting.requestSha256 };
  const provisionalRelationshipRevisions = accounting.relationshipDependencies as readonly Record<string, unknown>[];
  const qualifiedDeferredCoverage = accounting.sourceCoverage.filter((coverage) => coverage.disposition === "essential_dependent_deferred").map((coverage) => {
    const slot = request.sourceSlots.find((candidate) => candidate.slot === coverage.slot);
    if (!slot) throw new Error("Qualified deferred source coverage is detached from the request.");
    return { source_unit_id: `source-unit-${slot.slot}`, page_number: slot.pageNumber, locator_type: slot.locatorType, locator_id: slot.locatorId, classification: "essential_dependent_deferred" as const };
  });
  const provisionalSidecar = { ...persistableAccounting(accounting), qualifiedDeferredCoverage };
  const provenance = relationshipQualification.providerProvenance;
  if (!isRecord(provenance) || !nonEmpty(provenance.provider) || !nonEmpty(provenance.model) || !nonEmpty(provenance.endpoint) || !Number.isSafeInteger(provenance.attempt) || provenance.attempt < 1) throw new Error("Qualified provider provenance is malformed.");
  return { idempotencyKey: input.idempotencyKey, executionId: input.executionId, lease: input.lease, sourceSnapshot, profile, request: requestIdentity, canonicalResult, provisionalRelationshipRevisions, provisionalSidecar, providerProvenance: provenance, deliveryBindingHash: null };
}

function validate(input: SemanticCompositeStageInput): ValidComposite {
  const material = derive(input);
  const revisionSetHash = digest(material.provisionalRelationshipRevisions);
  const sidecarHash = digest(material.provisionalSidecar);
  const expectedCompositeHash = digest({ idempotencyKey: material.idempotencyKey, executionId: material.executionId, sourceSnapshot: material.sourceSnapshot, profile: material.profile, request: material.request, canonicalResult: material.canonicalResult, provisionalRelationshipRevisions: material.provisionalRelationshipRevisions, provisionalSidecar: material.provisionalSidecar, providerProvenance: material.providerProvenance, revisionSetHash, sidecarHash });
  if (input.compositeHash !== expectedCompositeHash) throw new Error("Composite hash does not match the complete immutable winner.");
  return { ...material, compositeHash: input.compositeHash, revisionSetHash, sidecarHash };
}

/** Hash of the sanitized persisted winner, never of request/provider evidence. */
export function semanticCompositeHash(input: Omit<SemanticCompositeStageInput, "compositeHash">): string {
  const material = derive(input);
  const revisionSetHash = digest(material.provisionalRelationshipRevisions); const sidecarHash = digest(material.provisionalSidecar);
  return digest({ idempotencyKey: material.idempotencyKey, executionId: material.executionId, sourceSnapshot: material.sourceSnapshot, profile: material.profile, request: material.request, canonicalResult: material.canonicalResult, provisionalRelationshipRevisions: material.provisionalRelationshipRevisions, provisionalSidecar: material.provisionalSidecar, providerProvenance: material.providerProvenance, revisionSetHash, sidecarHash });
}

export function semanticDeliveryBindingHash(input: { readonly compositeHash: string; readonly envelope: unknown }): string {
  return digest({ compositeHash: input.compositeHash, envelope: input.envelope });
}

/** Rebuilds the already-validated lifecycle handoff from the immutable winner.
 * It has no provider-response, media, or raw prompt dependency. */
export function qualifiedAcceptanceFromWinner(value: SemanticCompositeWinner): QualifiedStepwiseAcceptanceInput {
  const coverage = value.provisionalSidecar.qualifiedDeferredCoverage;
  if (!Array.isArray(coverage)) throw new Error("Stepwise winner lacks its qualified deferred coverage projection.");
  const base = { version: semanticContractVersion, scope: { projectId: value.sourceSnapshot.projectId, workspaceId: value.sourceSnapshot.workspaceId, bundleId: value.sourceSnapshot.bundleId, documentId: value.sourceSnapshot.documentId, executionId: value.executionId, contractVersion: semanticContractVersion }, composite: { compositeHash: value.compositeHash, relationshipRevisionSetHash: value.revisionSetHash, provisionalSidecarHash: value.sidecarHash }, deferredCoverage: coverage } as const;
  return value.canonicalResult === null
    ? { ...base, outcome: "qualified_deferred" }
    : { ...base, outcome: "partial_accepted", canonical: { provider: value.providerProvenance, result: value.canonicalResult } };
}

function winner(row: Record<string, unknown>): SemanticCompositeWinner {
  return { idempotencyKey: String(row.idempotency_key), executionId: String(row.execution_id), lease: { owner: String(row.lease_owner), generation: Number(row.lease_generation) }, sourceSnapshot: row.source_snapshot as ValidComposite["sourceSnapshot"], profile: row.profile_identity as ValidComposite["profile"], request: row.request_identity as ValidComposite["request"], canonicalResult: row.canonical_result as SemanticExtractionResult | null, provisionalRelationshipRevisions: row.provisional_relationship_revisions as readonly Record<string, unknown>[], provisionalSidecar: row.provisional_sidecar as PersistedSidecar, compositeHash: String(row.composite_hash), revisionSetHash: String(row.revision_set_hash), sidecarHash: String(row.sidecar_hash), providerProvenance: (row.provider_provenance ?? {}) as Record<string, unknown>, deliveryBindingHash: row.delivery_binding_hash === null || row.delivery_binding_hash === undefined ? null : String(row.delivery_binding_hash) };
}
const columns = "idempotency_key, execution_id, lease_owner, lease_generation, source_snapshot, profile_identity, request_identity, canonical_result, provisional_relationship_revisions, provisional_sidecar, composite_hash, revision_set_hash, sidecar_hash, provider_provenance, delivery_binding_hash";

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
      const values = [input.idempotencyKey, input.executionId, input.lease.owner, input.lease.generation, JSON.stringify(input.sourceSnapshot), JSON.stringify(input.profile), JSON.stringify(input.request), input.canonicalResult === null ? null : JSON.stringify(input.canonicalResult), JSON.stringify(input.provisionalRelationshipRevisions), JSON.stringify(input.provisionalSidecar), input.compositeHash, input.revisionSetHash, input.sidecarHash, JSON.stringify(input.providerProvenance), input.deliveryBindingHash];
      const statement = `WITH claimant AS (SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now() FOR UPDATE), staged AS (INSERT INTO bridge.semantic_composite_stage (${columns}) SELECT $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14::jsonb,$15 FROM claimant ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=bridge.semantic_composite_stage.idempotency_key WHERE bridge.semantic_composite_stage.execution_id=EXCLUDED.execution_id AND bridge.semantic_composite_stage.source_snapshot=EXCLUDED.source_snapshot AND bridge.semantic_composite_stage.profile_identity=EXCLUDED.profile_identity AND bridge.semantic_composite_stage.request_identity=EXCLUDED.request_identity AND bridge.semantic_composite_stage.canonical_result IS NOT DISTINCT FROM EXCLUDED.canonical_result AND bridge.semantic_composite_stage.provisional_relationship_revisions=EXCLUDED.provisional_relationship_revisions AND bridge.semantic_composite_stage.provisional_sidecar=EXCLUDED.provisional_sidecar AND bridge.semantic_composite_stage.composite_hash=EXCLUDED.composite_hash AND bridge.semantic_composite_stage.revision_set_hash=EXCLUDED.revision_set_hash AND bridge.semantic_composite_stage.sidecar_hash=EXCLUDED.sidecar_hash AND bridge.semantic_composite_stage.provider_provenance=EXCLUDED.provider_provenance RETURNING ${columns}) SELECT * FROM staged`;
      const result = await database.executeSql(statement, values);
      if (result.rows[0]) return winner(result.rows[0]);
      const current = await database.executeSql("SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now()", values.slice(0, 4));
      if (!current.rows.length) throw new SemanticCompositeLeaseLostError();
      throw new SemanticCompositeConflictError();
    },
    /** Atomically stores the stepwise winner and its qualified Atlas handoff.
     * Both partial acceptance and qualified deferral are lifecycle outcomes,
     * so each needs a replayable, composite-bound delivery. */
    async stageAndBindDelivery(raw: SemanticCompositeStageInput): Promise<{ readonly winner: SemanticCompositeWinner; readonly envelope: unknown }> {
      const validated = validate(raw);
      const envelope = qualifiedAcceptanceFromWinner(validated);
      const binding = semanticDeliveryBindingHash({ compositeHash: validated.compositeHash, envelope });
      const input = { ...validated, deliveryBindingHash: binding };
      const values = [input.idempotencyKey, input.executionId, input.lease.owner, input.lease.generation, JSON.stringify(input.sourceSnapshot), JSON.stringify(input.profile), JSON.stringify(input.request), input.canonicalResult === null ? null : JSON.stringify(input.canonicalResult), JSON.stringify(input.provisionalRelationshipRevisions), JSON.stringify(input.provisionalSidecar), input.compositeHash, input.revisionSetHash, input.sidecarHash, JSON.stringify(input.providerProvenance), binding, JSON.stringify(envelope)];
      const statement = `WITH claimant AS (SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now() FOR UPDATE), staged AS (INSERT INTO bridge.semantic_composite_stage (${columns}) SELECT $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14::jsonb,$15 FROM claimant ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=bridge.semantic_composite_stage.idempotency_key WHERE bridge.semantic_composite_stage.execution_id=EXCLUDED.execution_id AND bridge.semantic_composite_stage.source_snapshot=EXCLUDED.source_snapshot AND bridge.semantic_composite_stage.profile_identity=EXCLUDED.profile_identity AND bridge.semantic_composite_stage.request_identity=EXCLUDED.request_identity AND bridge.semantic_composite_stage.canonical_result IS NOT DISTINCT FROM EXCLUDED.canonical_result AND bridge.semantic_composite_stage.provisional_relationship_revisions=EXCLUDED.provisional_relationship_revisions AND bridge.semantic_composite_stage.provisional_sidecar=EXCLUDED.provisional_sidecar AND bridge.semantic_composite_stage.composite_hash=EXCLUDED.composite_hash AND bridge.semantic_composite_stage.revision_set_hash=EXCLUDED.revision_set_hash AND bridge.semantic_composite_stage.sidecar_hash=EXCLUDED.sidecar_hash AND bridge.semantic_composite_stage.provider_provenance=EXCLUDED.provider_provenance AND bridge.semantic_composite_stage.delivery_binding_hash IS NOT DISTINCT FROM EXCLUDED.delivery_binding_hash RETURNING ${columns}), delivery AS (INSERT INTO bridge.semantic_result_delivery (idempotency_key,execution_id,stage,validated_envelope,provenance,completion_fingerprint,lease_owner,lease_generation,composite_hash,delivery_binding_hash) SELECT $1,$2,'extraction',$16::jsonb,$14::jsonb,'staged',$3,$4,$11,$15 FROM staged ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=bridge.semantic_result_delivery.idempotency_key WHERE bridge.semantic_result_delivery.execution_id=EXCLUDED.execution_id AND bridge.semantic_result_delivery.composite_hash=EXCLUDED.composite_hash AND bridge.semantic_result_delivery.delivery_binding_hash=EXCLUDED.delivery_binding_hash AND bridge.semantic_result_delivery.validated_envelope=EXCLUDED.validated_envelope RETURNING idempotency_key) SELECT * FROM staged`;
      const result = await database.executeSql(statement, values);
      if (result.rows[0]) return { winner: winner(result.rows[0]), envelope };
      const current = await database.executeSql("SELECT 1 FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2 AND status='running' AND lease_owner=$3 AND lease_generation=$4 AND lease_expires_at > now()", values.slice(0, 4));
      if (!current.rows.length) throw new SemanticCompositeLeaseLostError();
      throw new SemanticCompositeConflictError();
    },
  };
}
