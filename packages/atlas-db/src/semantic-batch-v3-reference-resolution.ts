import {
  parseImmutableSemanticCorpusPlanRecord,
  parsePlannedSemanticCorpusHandoffRecord,
  replayImmutableSemanticCorpusPlanHashV3,
  replayPlannedSemanticCorpusHandoffHashV3,
} from "./immutable-semantic-corpus-plan.js";

type Row = Record<string, unknown>;
type ReadOnlySql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };

/** The only persisted identities a v3 reader may redeem. */
export type SemanticBatchV3Reference = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchId: string;
  batchHandoffRef: string;
  batchHandoffHash: string;
}>;

/** Server-authenticated source-read scope. This is never returned or converted into execution authority. */
export type SemanticBatchV3ReferenceScope = Readonly<{
  callerUserId: string;
  callerSessionToken: string;
  projectId: string;
  workspaceId: string;
  bundleId: string;
  documentId: string;
}>;

type Locator = Readonly<{ documentId: string; pageNumber: number; sourceKind: "text_block" | "table" | "visual_region"; localId: string }>;
type Identity = Readonly<{ identity: string; version: string }>;

/**
 * Bounded, reference-only result for the later transient reconstruction step.
 * It deliberately has no normalized content, asset bytes, session, grant,
 * provider route, or materialized logical request.
 */
export type ResolvedSemanticBatchV3References = Readonly<{
  reference: SemanticBatchV3Reference;
  scope: Readonly<{ projectId: string; workspaceId: string; bundleId: string; documentId: string }>;
  source: Readonly<{
    sourceSha256: string;
    normalizedDocumentRef: string;
    perceptionExecutionId: string;
    normalizedDocumentFingerprint: string;
    normalizedDocumentVersion: "v1";
    perceptionCapability: string;
    perceptionContractVersion: "v1";
  }>;
  acceptedMedia: readonly Readonly<{ assetRef: string; locator: Locator; sha256: string; mediaType: "image/png"; byteLength: number }>[];
  selection: Readonly<{ ownedLocators: readonly Locator[]; contextOnlyLocators: readonly Locator[] }>;
  commitments: Readonly<{
    sourceSpecificationSha256: string;
    requestSha256: string;
    manifestSha256: string;
    packetProfile: Identity;
    estimator: Identity;
    configuration: Identity;
    conservativeLogicalRequestBytes: Readonly<{ version: "ConservativeLogicalRequestBytes/v1"; value: number }>;
    requestBytes: number;
    inputTokens: number;
    reservedOutputTokens: number;
    requestResourceEnvelope: Readonly<{ requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number }>;
  }>;
}>;

export class SemanticBatchV3ReferenceResolutionError extends Error {}

const opaque = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const hash = /^[a-f0-9]{64}$/;
const plain = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const locatorKey = (value: Locator) => `${value.documentId}\u0000${value.pageNumber}\u0000${value.sourceKind}\u0000${value.localId}`;
const fail = (message: string): never => { throw new SemanticBatchV3ReferenceResolutionError(`Semantic v3 reference resolution is unavailable or invalid: ${message}`); };

function reference(value: SemanticBatchV3Reference): SemanticBatchV3Reference {
  if (!value || typeof value !== "object" || ![value.documentPlanRef, value.batchId, value.batchHandoffRef].every((part) => typeof part === "string" && opaque.test(part))
    || ![value.planHash, value.batchHandoffHash].every((part) => typeof part === "string" && hash.test(part))) fail("reference is malformed");
  return value;
}

function validScope(scope: SemanticBatchV3ReferenceScope): void {
  if (!scope || typeof scope !== "object" || ![scope.callerUserId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId].every((part) => typeof part === "string" && opaque.test(part))
    || typeof scope.callerSessionToken !== "string" || Buffer.byteLength(scope.callerSessionToken, "utf8") < 1 || Buffer.byteLength(scope.callerSessionToken, "utf8") > 500) fail("authorized source-read scope is invalid");
}

function locators(value: unknown, documentId: string): readonly Locator[] {
  if (!Array.isArray(value)) fail("locator membership is invalid");
  const candidates = value as unknown[];
  const resolved = candidates.map((candidate) => {
    const locator = candidate as Record<string, unknown>;
    if (!plain(candidate) || Object.keys(locator).length !== 4 || locator.documentId !== documentId || !Number.isSafeInteger(locator.pageNumber)
      || !["text_block", "table", "visual_region"].includes(String(locator.sourceKind)) || typeof locator.localId !== "string") fail("locator membership is foreign or invalid");
    return { documentId, pageNumber: locator.pageNumber as number, sourceKind: locator.sourceKind as Locator["sourceKind"], localId: locator.localId as string };
  });
  if (new Set(resolved.map(locatorKey)).size !== resolved.length) fail("locator membership is duplicate");
  return resolved;
}

function identity(value: unknown): Identity {
  if (!plain(value) || Object.keys(value).length !== 2 || typeof value.identity !== "string" || typeof value.version !== "string" || !opaque.test(value.identity) || !opaque.test(value.version)) fail("pinned identity is invalid");
  const parsed = value as Record<string, unknown>;
  return { identity: parsed.identity as string, version: parsed.version as string };
}

/**
 * SELECT-only resolution of one immutable v3 handoff. It verifies the caller,
 * current accepted perception/cache binding, plan/handoff commitments, exact
 * locators, and accepted derived-media identities before returning references.
 */
export class PostgresSemanticBatchV3ReferenceResolver {
  constructor(private readonly sql: ReadOnlySql) {}

  async resolve(scope: SemanticBatchV3ReferenceScope, input: SemanticBatchV3Reference): Promise<ResolvedSemanticBatchV3References> {
    validScope(scope);
    const requested = reference(input);
    const rows = await this.sql.unsafe(`SELECT
        plan.id AS plan_id, plan.plan_hash, plan.project_id, plan.workspace_id, plan.bundle_id, plan.document_id, plan.source_sha256 AS persisted_source_sha256, plan.source_fingerprint AS persisted_source_fingerprint, plan.immutable_content AS plan_content,
        handoff.id AS handoff_id, handoff.plan_id AS handoff_plan_id, handoff.batch_id, handoff.batch_slot, handoff.handoff_hash, handoff.immutable_content AS handoff_content,
        cancellation.plan_id AS cancelled_plan_id,
        execution.id AS perception_execution_id, execution.source_sha256 AS execution_source_sha256, execution.completion_fingerprint, execution.contract_version AS execution_contract_version,
        cache.cache_key AS normalized_document_ref, cache.source_sha256 AS cache_source_sha256, cache.contract_version AS cache_contract_version, cache.capability AS cache_capability
      FROM atlas.semantic_corpus_plan plan
      JOIN atlas.planned_semantic_corpus_handoff handoff ON handoff.plan_id=plan.id
      JOIN atlas.project_member membership ON membership.project_id=plan.project_id AND membership.user_id=$1
      JOIN auth."session" session ON session."userId"=membership.user_id AND session.token=$2 AND session."expiresAt">now()
      JOIN atlas.extraction_bundle_document member ON member.bundle_id=plan.bundle_id AND member.document_id=plan.document_id AND member.project_id=plan.project_id AND member.workspace_id=plan.workspace_id
      JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id
      JOIN atlas.document document ON document.id=member.document_id AND document.project_id=member.project_id AND document.workspace_id=member.workspace_id
      JOIN atlas.document_perception_execution execution ON execution.id=plan.immutable_content->'source'->>'perceptionExecutionId' AND execution.artifact_id=document.id AND execution.source_sha256=document.source_sha256
      JOIN atlas.normalized_document_cache cache ON cache.cache_key=plan.immutable_content->'source'->>'normalizedDocumentRef' AND cache.source_sha256=document.source_sha256 AND cache.capability_identity=execution.capability_identity AND cache.invalidated_at IS NULL
      LEFT JOIN atlas.semantic_corpus_plan_cancellation cancellation ON cancellation.plan_id=plan.id
      WHERE plan.id=$3 AND plan.plan_hash=$4 AND plan.project_id=$5 AND plan.workspace_id=$6 AND plan.bundle_id=$7 AND plan.document_id=$8
        AND handoff.id=$9 AND handoff.batch_id=$10 AND handoff.handoff_hash=$11
        AND member.state='perceived' AND bundle.state='processing' AND execution.state='completed'
      LIMIT 2`, [scope.callerUserId, scope.callerSessionToken, requested.documentPlanRef, requested.planHash, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, requested.batchHandoffRef, requested.batchId, requested.batchHandoffHash]);
    if (rows.length !== 1) fail("handoff is missing, foreign, stale, or unauthorized");
    const row = rows[0]!;
    if (row.cancelled_plan_id !== null && row.cancelled_plan_id !== undefined) fail("plan is cancelled");
    if (String(row.plan_id) !== requested.documentPlanRef || String(row.plan_hash) !== requested.planHash || String(row.handoff_id) !== requested.batchHandoffRef
      || String(row.handoff_plan_id) !== requested.documentPlanRef || String(row.handoff_hash) !== requested.batchHandoffHash || String(row.batch_id) !== requested.batchId) fail("persisted reference binding is inconsistent");

    let parsedPlan: ReturnType<typeof parseImmutableSemanticCorpusPlanRecord>;
    let parsedHandoff: ReturnType<typeof parsePlannedSemanticCorpusHandoffRecord>;
    try { parsedPlan = parseImmutableSemanticCorpusPlanRecord(row.plan_content); parsedHandoff = parsePlannedSemanticCorpusHandoffRecord(row.handoff_content); }
    catch { return fail("persisted records are malformed or unsupported"); }
    if (parsedPlan.version !== "ImmutableSemanticCorpusPlan/v3" || parsedHandoff.version !== "PlannedSemanticCorpusHandoff/v3") fail("v1, v2, or mixed-version records are retired");
    const plan = parsedPlan.content as Record<string, unknown>;
    const handoff = parsedHandoff.content as Record<string, unknown>;
    const planScope = plan.scope as Record<string, unknown>;
    const source = plan.source as Record<string, unknown>;
    const proposal = plan.proposal as Record<string, unknown>;
    if (!plain(planScope) || !plain(source) || !plain(proposal) || replayImmutableSemanticCorpusPlanHashV3(plan) !== requested.planHash
      || replayPlannedSemanticCorpusHandoffHashV3(handoff) !== requested.batchHandoffHash
      || planScope.projectId !== scope.projectId || planScope.workspaceId !== scope.workspaceId || planScope.bundleId !== scope.bundleId || planScope.documentId !== scope.documentId
      || String(row.persisted_source_sha256) !== source.sourceSha256 || String(row.persisted_source_fingerprint) !== source.normalizedDocumentFingerprint
      || String(row.perception_execution_id) !== source.perceptionExecutionId || String(row.execution_source_sha256) !== source.sourceSha256 || String(row.completion_fingerprint) !== source.normalizedDocumentFingerprint
      || row.execution_contract_version !== source.perceptionContractVersion
      || String(row.normalized_document_ref) !== source.normalizedDocumentRef || String(row.cache_source_sha256) !== source.sourceSha256 || row.cache_contract_version !== source.normalizedDocumentVersion || row.cache_capability !== source.perceptionCapability
      || handoff.planHash !== requested.planHash || handoff.batchId !== requested.batchId || handoff.batchSlot !== row.batch_slot) fail("accepted source or immutable binding is inconsistent");

    const batchIds = proposal.batchIds as unknown;
    if (!Array.isArray(batchIds) || batchIds[Number(row.batch_slot) - 1] !== requested.batchId) fail("batch membership or order is inconsistent");
    const inventory: unknown[] = Array.isArray(proposal.inventory) ? proposal.inventory as unknown[] : fail("parent inventory is invalid");
    const inventoryKeys = new Set(inventory.map((entry) => plain(entry) && plain(entry.locator) ? `${entry.locator.documentId}\u0000${entry.locator.pageNumber}\u0000${entry.locator.sourceKind}\u0000${entry.locator.localId}` : ""));
    const eligibleKeys = new Set(inventory.filter((entry) => plain(entry) && entry.classification === "eligible" && plain(entry.locator)).map((entry) => { const locator = (entry as Record<string, unknown>).locator as Record<string, unknown>; return `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`; }));
    const ownedLocators = locators(handoff.ownedLocators, scope.documentId);
    const contextOnlyLocators = locators(handoff.contextOnlyLocators, scope.documentId);
    const selected = [...ownedLocators, ...contextOnlyLocators];
    if (new Set(selected.map(locatorKey)).size !== selected.length || selected.some((locator) => !inventoryKeys.has(locatorKey(locator))) || ownedLocators.some((locator) => !eligibleKeys.has(locatorKey(locator)))) fail("selected locator membership is foreign, missing, reordered, or substituted");

    const acceptedMedia = Array.isArray(source.acceptedMedia) ? (source.acceptedMedia as unknown[]).map((media) => {
      const parsedMedia = media as Record<string, unknown>;
      const parsedLocator = parsedMedia.locator as Record<string, unknown>;
      if (!plain(media) || !plain(parsedMedia.locator) || parsedLocator.sourceKind !== "visual_region") fail("accepted derived-media reference is invalid");
      const locator = locators([parsedMedia.locator], scope.documentId)[0]!;
      if (typeof parsedMedia.assetRef !== "string" || typeof parsedMedia.sha256 !== "string" || !hash.test(parsedMedia.sha256) || parsedMedia.mediaType !== "image/png" || !Number.isSafeInteger(parsedMedia.byteLength) || (parsedMedia.byteLength as number) <= 0 || !inventoryKeys.has(locatorKey(locator))) fail("accepted derived-media reference is foreign or invalid");
      return { assetRef: parsedMedia.assetRef as string, locator, sha256: parsedMedia.sha256 as string, mediaType: "image/png" as const, byteLength: parsedMedia.byteLength as number };
    }) : fail("accepted derived-media references are missing");
    if (new Set(acceptedMedia.map((media) => media.assetRef)).size !== acceptedMedia.length || new Set(acceptedMedia.map((media) => locatorKey(media.locator))).size !== acceptedMedia.length) fail("accepted derived-media references are duplicate");
    const mediaRows = acceptedMedia.length ? await this.sql.unsafe(`SELECT manifest.asset_ref, manifest.locator_id, manifest.page_number, manifest.media_type, manifest.sha256, manifest.byte_size
      FROM atlas.document_perception_derived_manifest manifest
      JOIN atlas.document_perception_derived_asset asset ON asset.cache_key=$1 AND asset.asset_ref=manifest.asset_ref AND asset.deleted_at IS NULL
      WHERE manifest.execution_id=$2 AND manifest.artifact_id=$3 AND manifest.source_sha256=$4 AND manifest.accepted_at IS NOT NULL
        AND manifest.asset_ref=ANY($5::text[])`, [source.normalizedDocumentRef, source.perceptionExecutionId, scope.documentId, source.sourceSha256, acceptedMedia.map((media) => media.assetRef)]) : [];
    if (mediaRows.length !== acceptedMedia.length || mediaRows.some((asset) => !acceptedMedia.some((media) => media.assetRef === asset.asset_ref && media.locator.localId === asset.locator_id && media.locator.pageNumber === Number(asset.page_number) && media.mediaType === asset.media_type && media.sha256 === asset.sha256 && media.byteLength === Number(asset.byte_size)))) fail("accepted derived-media reference is missing or substituted");

    const commitments = {
      sourceSpecificationSha256: String(handoff.sourceSpecificationSha256), requestSha256: String(handoff.requestSha256), manifestSha256: String(handoff.manifestSha256),
      packetProfile: identity(handoff.packetProfile), estimator: identity(handoff.estimator), configuration: identity(handoff.configuration),
      conservativeLogicalRequestBytes: handoff.conservativeLogicalRequestBytes as { version: "ConservativeLogicalRequestBytes/v1"; value: number }, requestBytes: Number(handoff.requestBytes), inputTokens: Number(handoff.inputTokens), reservedOutputTokens: Number(handoff.reservedOutputTokens), requestResourceEnvelope: handoff.requestResourceEnvelope as { requestUnits: number; tokenUnits: number; dayUnits: number; concurrencyUnits: number },
    };
    if (![commitments.sourceSpecificationSha256, commitments.requestSha256, commitments.manifestSha256].every((value) => hash.test(value)) || commitments.manifestSha256 !== proposal.manifestSha256) fail("bounded commitments are inconsistent");
    return { reference: requested, scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId }, source: { sourceSha256: String(source.sourceSha256), normalizedDocumentRef: String(source.normalizedDocumentRef), perceptionExecutionId: String(source.perceptionExecutionId), normalizedDocumentFingerprint: String(source.normalizedDocumentFingerprint), normalizedDocumentVersion: "v1", perceptionCapability: String(source.perceptionCapability), perceptionContractVersion: "v1" }, acceptedMedia, selection: { ownedLocators, contextOnlyLocators }, commitments };
  }
}
