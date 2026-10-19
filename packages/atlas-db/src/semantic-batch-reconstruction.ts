import { buildStepwiseSourcePacket, type StepwiseSourceAssetIdentity, type StepwiseSourceLocator } from "@atlas/skills";
import {
  parseImmutableSemanticCorpusPlanRecord,
  parsePlannedSemanticCorpusHandoffRecord,
  replayImmutableSemanticCorpusPlanHashV2,
} from "./immutable-semantic-corpus-plan.js";
import {
  PostgresAcceptedSemanticBatchPlanDocumentResolver,
  type AcceptedDocumentPlannerResultV1,
  type AcceptedDocumentResolverScope,
  type SemanticBatchPlanInputV1,
} from "./semantic-batch-plan-input.js";

type Row = Record<string, unknown>;
type ReadOnlySql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };

export class SemanticBatchReconstructionError extends Error {}

/** The immutable identifiers needed to redeem exactly one persisted v2 handoff. */
export type SemanticBatchReconstructionReferenceV1 = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchId: string;
  batchHandoffRef: string;
  batchHandoffHash: string;
}>;

export type VerifiedSemanticBatchReconstructionV1 = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchId: string;
  batchHandoffRef: string;
  batchHandoffHash: string;
  sourceSpecification: string;
  sourceSpecificationSha256: string;
}>;

type AcceptedDocumentResolver = Pick<PostgresAcceptedSemanticBatchPlanDocumentResolver, "resolve">;
const opaque = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const hash = /^[a-f0-9]{64}$/;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const sameIdentity = (left: unknown, right: unknown): boolean => record(left) && record(right) && left.identity === right.identity && left.version === right.version;
const locatorKey = (locator: Record<string, unknown>) => `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`;
const fail = (message: string): never => { throw new SemanticBatchReconstructionError(`Semantic batch reconstruction is unavailable or invalid: ${message}`); };

function reference(value: SemanticBatchReconstructionReferenceV1): SemanticBatchReconstructionReferenceV1 {
  if (!value || typeof value !== "object" || ![value.documentPlanRef, value.batchId, value.batchHandoffRef].every((part) => typeof part === "string" && opaque.test(part))
    || ![value.planHash, value.batchHandoffHash].every((part) => typeof part === "string" && hash.test(part))) fail("reference is malformed");
  return value;
}

function planInput(source: Record<string, unknown>): SemanticBatchPlanInputV1 {
  return {
    normalizedDocumentRef: String(source.normalizedDocumentRef),
    perceptionExecutionId: String(source.perceptionExecutionId),
    normalizedDocumentFingerprint: String(source.normalizedDocumentFingerprint),
    sourceSha256: String(source.sourceSha256),
    normalizedDocumentVersion: "v1",
  };
}

function selectedLocators(value: unknown): readonly StepwiseSourceLocator[] {
  if (!Array.isArray(value)) fail("persisted locator selection is invalid");
  const locators = value as unknown[];
  return locators.map((locator) => {
    if (!record(locator)) fail("persisted locator selection is invalid");
    const persisted = locator as Record<string, unknown>;
    const pageNumber = persisted.pageNumber;
    const locatorType = persisted.sourceKind;
    const locatorId = persisted.localId;
    if (typeof pageNumber !== "number" || !Number.isSafeInteger(pageNumber)
      || typeof locatorId !== "string" || !["text_block", "table", "visual_region"].includes(String(locatorType))) fail("persisted locator selection is invalid");
    return { pageNumber: pageNumber as number, locatorType: locatorType as StepwiseSourceLocator["locatorType"], locatorId: locatorId as string };
  });
}

function assetIdentities(accepted: AcceptedDocumentPlannerResultV1): readonly StepwiseSourceAssetIdentity[] {
  const expected = new Map<string, string>();
  for (const page of accepted.normalizedDocument.pages) for (const visual of page.visualRegions) if (visual.assetRef) expected.set(`${page.number}\u0000${visual.id}`, visual.assetRef);
  const seen = new Set<string>();
  return accepted.media.map((media) => {
    const key = `${media.pageNumber}\u0000${media.locatorId}`;
    if (seen.has(key) || expected.get(key) !== media.assetRef || media.mediaType !== "image/png" || !hash.test(media.sha256) || !Number.isSafeInteger(media.byteLength) || media.byteLength <= 0) fail("accepted media binding is invalid");
    seen.add(key);
    return { pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256: accepted.source.sourceSha256 };
  });
}

/**
 * SELECT-only SEM compatibility boundary. It redeems one authenticated Atlas
 * handoff and rebuilds its source bytes through the sole shared packet builder.
 */
export class PostgresSemanticBatchReconstructionResolver {
  private readonly acceptedDocumentResolver: AcceptedDocumentResolver;

  constructor(private readonly sql: ReadOnlySql, acceptedDocumentResolver: AcceptedDocumentResolver = new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql)) {
    this.acceptedDocumentResolver = acceptedDocumentResolver;
  }

  async reconstruct(scope: AcceptedDocumentResolverScope, input: SemanticBatchReconstructionReferenceV1): Promise<VerifiedSemanticBatchReconstructionV1> {
    const requested = reference(input);
    if (![scope.callerUserId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId].every((part) => opaque.test(part)) || Buffer.byteLength(scope.callerSessionToken, "utf8") < 1 || Buffer.byteLength(scope.callerSessionToken, "utf8") > 500) fail("authorized scope is invalid");
    const rows = await this.sql.unsafe(`SELECT
        plan.id AS plan_id, plan.plan_hash, plan.project_id, plan.workspace_id, plan.bundle_id, plan.document_id, plan.immutable_content AS plan_content,
        handoff.id AS handoff_id, handoff.plan_id AS handoff_plan_id, handoff.batch_id, handoff.batch_slot, handoff.handoff_hash, handoff.immutable_content AS handoff_content,
        cancellation.plan_id AS cancelled_plan_id
      FROM atlas.semantic_corpus_plan plan
      JOIN atlas.planned_semantic_corpus_handoff handoff ON handoff.plan_id=plan.id
      JOIN atlas.project_member membership ON membership.project_id=plan.project_id AND membership.user_id=$1
      JOIN auth."session" session ON session."userId"=membership.user_id AND session.token=$2 AND session."expiresAt">now()
      LEFT JOIN atlas.semantic_corpus_plan_cancellation cancellation ON cancellation.plan_id=plan.id
      WHERE plan.id=$3 AND plan.plan_hash=$4 AND plan.project_id=$5 AND plan.workspace_id=$6 AND plan.bundle_id=$7 AND plan.document_id=$8
        AND handoff.id=$9 AND handoff.batch_id=$10 AND handoff.handoff_hash=$11
      LIMIT 2`, [scope.callerUserId, scope.callerSessionToken, requested.documentPlanRef, requested.planHash, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, requested.batchHandoffRef, requested.batchId, requested.batchHandoffHash]);
    if (rows.length !== 1) fail("handoff is missing, foreign, stale, or unauthorized");
    const row = rows[0]!;
    if (row.cancelled_plan_id !== null && row.cancelled_plan_id !== undefined) fail("plan is cancelled");
    if (String(row.plan_id) !== requested.documentPlanRef || String(row.handoff_id) !== requested.batchHandoffRef || String(row.handoff_plan_id) !== requested.documentPlanRef
      || String(row.plan_hash) !== requested.planHash || String(row.handoff_hash) !== requested.batchHandoffHash || String(row.batch_id) !== requested.batchId) fail("persisted reference binding is inconsistent");

    const parsed = (() => {
      try { return { plan: parseImmutableSemanticCorpusPlanRecord(row.plan_content), handoff: parsePlannedSemanticCorpusHandoffRecord(row.handoff_content) }; }
      catch { return fail("persisted records are malformed or unsupported"); }
    })();
    const parsedPlan = parsed.plan;
    const parsedHandoff = parsed.handoff;
    if (parsedPlan.version !== "ImmutableSemanticCorpusPlan/v2" || parsedHandoff.version !== "PlannedSemanticCorpusHandoff/v2") fail("persisted records are not v2");
    const plan = parsedPlan.content as Record<string, unknown>;
    const handoff = parsedHandoff.content as Record<string, unknown>;
    const planScope = plan.scope as Record<string, unknown>;
    const source = plan.source as Record<string, unknown>;
    const proposal = plan.proposal as Record<string, unknown>;
    if (!record(planScope) || !record(source) || !record(proposal) || replayImmutableSemanticCorpusPlanHashV2(plan) !== requested.planHash
      || planScope.projectId !== scope.projectId || planScope.workspaceId !== scope.workspaceId || planScope.bundleId !== scope.bundleId || planScope.documentId !== scope.documentId
      || handoff.planHash !== requested.planHash || handoff.batchId !== requested.batchId || handoff.batchSlot !== row.batch_slot
      || !Array.isArray(proposal.batchIds) || proposal.batchIds[Number(row.batch_slot) - 1] !== requested.batchId
      || !sameIdentity(proposal.packetProfile, handoff.packetProfile) || !sameIdentity(proposal.estimator, handoff.estimator) || !sameIdentity(proposal.configuration, handoff.configuration)) fail("parent, selection, or profile identity is inconsistent");
    const inventory: unknown = proposal.inventory;
    if (!Array.isArray(inventory)) fail("parent inventory is invalid");
    const inventoryEntries = inventory as unknown[];
    const inventoryKeys = new Set(inventoryEntries.map((entry) => record(entry) && record(entry.locator) ? locatorKey(entry.locator) : ""));
    const eligibleKeys = new Set(inventoryEntries.map((entry) => record(entry) && entry.classification === "eligible" && record(entry.locator) ? locatorKey(entry.locator) : ""));
    const owned = selectedLocators(handoff.ownedLocators);
    const context = selectedLocators(handoff.contextOnlyLocators);
    const selected = [...owned, ...context];
    if (new Set(selected.map((locator) => `${scope.documentId}\u0000${locator.pageNumber}\u0000${locator.locatorType}\u0000${locator.locatorId}`)).size !== selected.length
      || selected.some((locator) => !inventoryKeys.has(`${scope.documentId}\u0000${locator.pageNumber}\u0000${locator.locatorType}\u0000${locator.locatorId}`))
      || owned.some((locator) => !eligibleKeys.has(`${scope.documentId}\u0000${locator.pageNumber}\u0000${locator.locatorType}\u0000${locator.locatorId}`))) fail("persisted selection is foreign or duplicate");

    const accepted = await this.acceptedDocumentResolver.resolve(scope, planInput(source));
    if (accepted.scope.projectId !== scope.projectId || accepted.scope.workspaceId !== scope.workspaceId || accepted.scope.bundleId !== scope.bundleId || accepted.scope.documentId !== scope.documentId
      || accepted.source.documentId !== scope.documentId || accepted.source.sourceSha256 !== source.sourceSha256 || accepted.normalizedDocument.executionId !== source.perceptionExecutionId
      || accepted.normalizedDocument.artifactId !== scope.documentId || accepted.normalizedDocument.sourceSha256 !== source.sourceSha256 || accepted.rel.state !== "unavailable") fail("accepted document binding is inconsistent");
    const packet = (() => {
      try { return buildStepwiseSourcePacket({ document: accepted.normalizedDocument, ownedLocators: owned, contextOnlyLocators: context, assetIdentities: assetIdentities(accepted) }); }
      catch { return fail("shared packet reconstruction rejected the persisted selection"); }
    })();
    if (packet.sourceSpecificationSha256 !== handoff.sourceSpecificationSha256) fail("source specification integrity hash does not match");
    return { documentPlanRef: requested.documentPlanRef, planHash: requested.planHash, batchId: requested.batchId, batchHandoffRef: requested.batchHandoffRef, batchHandoffHash: requested.batchHandoffHash, sourceSpecification: packet.sourceSpecification, sourceSpecificationSha256: packet.sourceSpecificationSha256 };
  }
}
