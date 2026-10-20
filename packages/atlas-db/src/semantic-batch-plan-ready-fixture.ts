import { createHash } from "node:crypto";
import {
  parseImmutableSemanticCorpusPlanRecord,
  parsePlannedSemanticCorpusHandoffRecord,
  replayImmutableSemanticCorpusPlanHashV3,
  type PersistedSemanticCorpusPlanV1,
  type PersistedSemanticCorpusPlanV2,
  type PersistedSemanticCorpusPlanV3,
} from "./immutable-semantic-corpus-plan.js";

type Row = Record<string, unknown>;
type ReadOnlySql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };

/** A non-delivering draft body for the future GHR semantic-batch-plan route. */
export type SemanticBatchPlanReadyV1 = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchCount: number;
  batchHandoffRefs: readonly Readonly<{ batchId: string; ref: string; hash: string }>[];
}>;

export type SemanticBatchPlanReadyFixtureV1 = Readonly<{
  body: SemanticBatchPlanReadyV1;
  canonicalJson: string;
  canonicalJsonSha256: string;
}>;

export class SemanticBatchPlanReadyFixtureError extends Error {}
export class SemanticBatchPlanReadyManifestRequiredError extends SemanticBatchPlanReadyFixtureError {}

const maxBodyBytes = 32 * 1024;
// Atlas's v1 bounded semantic retrieval/list envelope is also the only
// approved in-body fan-out ceiling. Larger plans need a separately-versioned
// manifest pointer; this receiver never truncates them.
const maxBatchHandoffRefs = 100;
const hash = /^[a-f0-9]{64}$/;
const opaque = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const bodyKeys = ["documentPlanRef", "planHash", "batchCount", "batchHandoffRefs"] as const;
const memberKeys = ["batchId", "ref", "hash"] as const;

function fail(message: string): never { throw new SemanticBatchPlanReadyFixtureError(`SemanticBatchPlanReady/v1 is invalid: ${message}`); }
function plain(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}
function locatorKey(value: unknown): string | null {
  if (!plain(value) || !exactKeys(value, ["documentId", "pageNumber", "sourceKind", "localId"])
    || typeof value.documentId !== "string" || typeof value.pageNumber !== "number" || !Number.isSafeInteger(value.pageNumber)
    || typeof value.sourceKind !== "string" || !["text_block", "table", "visual_region"].includes(value.sourceKind)
    || typeof value.localId !== "string") return null;
  return `${value.documentId}\u0000${value.pageNumber}\u0000${value.sourceKind}\u0000${value.localId}`;
}
function canonical(body: SemanticBatchPlanReadyV1): string {
  return JSON.stringify({
    documentPlanRef: body.documentPlanRef,
    planHash: body.planHash,
    batchCount: body.batchCount,
    batchHandoffRefs: body.batchHandoffRefs.map((member) => ({ batchId: member.batchId, ref: member.ref, hash: member.hash })),
  });
}

function validate(value: unknown): SemanticBatchPlanReadyV1 {
  if (!plain(value) || !exactKeys(value, bodyKeys)) fail("body fields are not exact");
  const documentPlanRef = value.documentPlanRef;
  const planHash = value.planHash;
  const batchCount = value.batchCount;
  const batchHandoffRefs = value.batchHandoffRefs;
  if (typeof documentPlanRef !== "string" || !opaque.test(documentPlanRef)) fail("documentPlanRef is not a bounded opaque reference");
  if (typeof planHash !== "string" || !hash.test(planHash)) fail("planHash must be lowercase 64-hex");
  if (typeof batchCount !== "number" || !Number.isSafeInteger(batchCount) || batchCount <= 0) fail("batchCount must be positive");
  const count = batchCount;
  if (count > maxBatchHandoffRefs) throw new SemanticBatchPlanReadyManifestRequiredError("SemanticBatchPlanReady/v1 exceeds the bounded in-body handoff manifest; a separately versioned manifest pointer is required.");
  if (!Array.isArray(batchHandoffRefs) || batchHandoffRefs.length !== count) fail("batchCount does not match batchHandoffRefs");
  const members = batchHandoffRefs.map((member) => {
    if (!plain(member) || !exactKeys(member, memberKeys)
      || typeof member.batchId !== "string" || !opaque.test(member.batchId)
      || typeof member.ref !== "string" || !opaque.test(member.ref)
      || typeof member.hash !== "string" || !hash.test(member.hash)) fail("batchHandoffRefs contains an invalid member");
    return { batchId: member.batchId, ref: member.ref, hash: member.hash };
  });
  if (new Set(members.map((member) => member.batchId)).size !== members.length) fail("batchHandoffRefs contains duplicate batchId values");
  if (new Set(members.map((member) => member.ref)).size !== members.length) fail("batchHandoffRefs contains duplicate references");
  return { documentPlanRef, planHash, batchCount: count, batchHandoffRefs: members };
}

/** Produces only a canonical fixture body; it neither writes nor issues it. */
export function fixtureSemanticBatchPlanReadyV1(plan: PersistedSemanticCorpusPlanV1 | PersistedSemanticCorpusPlanV2 | PersistedSemanticCorpusPlanV3): SemanticBatchPlanReadyFixtureV1 {
  const body = validate({
    documentPlanRef: plan.planId,
    planHash: plan.planHash,
    batchCount: plan.handoffs.length,
    batchHandoffRefs: plan.handoffs.map((handoff) => ({ batchId: handoff.batchId, ref: handoff.handoffId, hash: handoff.handoffHash })),
  });
  const canonicalJson = canonical(body);
  return { body, canonicalJson, canonicalJsonSha256: createHash("sha256").update(canonicalJson).digest("hex") };
}

function parsePersistedPlan(content: unknown): Readonly<{ version: "ImmutableSemanticCorpusPlan/v1" | "ImmutableSemanticCorpusPlan/v2" | "ImmutableSemanticCorpusPlan/v3"; content: unknown }> {
  try { return parseImmutableSemanticCorpusPlanRecord(content); } catch { return fail("persisted plan record is invalid or unsupported"); }
}

function parsePersistedHandoff(content: unknown): Readonly<{ version: "PlannedSemanticCorpusHandoff/v1" | "PlannedSemanticCorpusHandoff/v2" | "PlannedSemanticCorpusHandoff/v3"; content: unknown }> {
  try { return parsePlannedSemanticCorpusHandoffRecord(content); } catch { return fail("persisted handoff record is invalid or unsupported"); }
}

/**
 * The active receiver validates only immutable v3 plan/handoff facts. It has
 * no route, queue, outbox, scheduler, acknowledgement, or delivery API.
 */
export class PostgresSemanticBatchPlanReadyFixtureReceiver {
  constructor(private readonly sql: ReadOnlySql) {}

  async receive(rawBody: string | Uint8Array): Promise<SemanticBatchPlanReadyV1> {
    const raw = typeof rawBody === "string" ? rawBody : Buffer.from(rawBody).toString("utf8");
    if (Buffer.byteLength(raw, "utf8") < 1 || Buffer.byteLength(raw, "utf8") > maxBodyBytes) fail("body exceeds the bounded size");
    let decoded: unknown;
    try { decoded = JSON.parse(raw); } catch { fail("body is not JSON"); }
    const body = validate(decoded);
    if (raw !== canonical(body)) fail("body is not canonical");

    const rows = await this.sql.unsafe(`SELECT
        plan.id AS plan_id, plan.plan_hash, plan.project_id, plan.workspace_id, plan.bundle_id, plan.document_id, plan.immutable_content AS plan_content,
        handoff.id AS handoff_id, handoff.plan_id AS handoff_plan_id, handoff.batch_id, handoff.batch_slot, handoff.handoff_hash, handoff.immutable_content AS handoff_content,
        cancellation.plan_id AS cancelled_plan_id
      FROM atlas.semantic_corpus_plan plan
      LEFT JOIN atlas.planned_semantic_corpus_handoff handoff ON handoff.plan_id=plan.id
      LEFT JOIN atlas.semantic_corpus_plan_cancellation cancellation ON cancellation.plan_id=plan.id
      WHERE plan.id=$1 AND plan.plan_hash=$2
      ORDER BY handoff.batch_slot`, [body.documentPlanRef, body.planHash]);
    if (rows.length !== body.batchCount) fail("persisted plan is missing handoffs or is stale");

    const expected = new Map(body.batchHandoffRefs.map((member) => [member.batchId, member]));
    const storedIds = new Set<string>();
    const eligible = new Set<string>();
    const owned = new Set<string>();
    const inventory = new Set<string>();
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]!;
      const member = expected.get(String(row.batch_id));
      if (!member || String(row.plan_id) !== body.documentPlanRef || String(row.handoff_plan_id) !== body.documentPlanRef
        || String(row.handoff_id) !== member.ref || String(row.handoff_hash) !== member.hash
        || Number(row.batch_slot) !== index + 1 || storedIds.has(String(row.handoff_id))) fail("persisted handoff membership is foreign, duplicate, or stale");
      storedIds.add(String(row.handoff_id));
      const parsedPlan = parsePersistedPlan(row.plan_content);
      const parsedHandoff = parsePersistedHandoff(row.handoff_content);
      if (parsedPlan.version !== "ImmutableSemanticCorpusPlan/v3" || parsedHandoff.version !== "PlannedSemanticCorpusHandoff/v3") fail("v1/v2 plan or handoff paths are retired at the active receiver");
      const plan = parsedPlan.content as Record<string, unknown>;
      const handoff = parsedHandoff.content as Record<string, unknown>;
      const scope = plan?.scope as Record<string, unknown>;
      const proposal = plan?.proposal as Record<string, unknown>;
      if (row.cancelled_plan_id !== null && row.cancelled_plan_id !== undefined
        || String(row.plan_hash) !== body.planHash
        || replayImmutableSemanticCorpusPlanHashV3(plan) !== body.planHash
        || !plain(plan) || plan.version !== parsedPlan.version || !plain(scope)
        || scope.projectId !== row.project_id || scope.workspaceId !== row.workspace_id || scope.bundleId !== row.bundle_id || scope.documentId !== row.document_id
        || !plain(proposal) || !Array.isArray(proposal.batchIds) || proposal.batchIds.length !== body.batchCount || proposal.batchIds[index] !== member.batchId
        || !plain(handoff) || handoff.version !== parsedHandoff.version || handoff.planHash !== body.planHash || handoff.batchId !== member.batchId || handoff.batchSlot !== index + 1) {
        fail("persisted plan or handoff scope is inconsistent");
      }
      const units = proposal.inventory;
      const ownedLocators = handoff.ownedLocators;
      const contextOnlyLocators = Array.isArray(handoff.contextOnlyLocators) ? handoff.contextOnlyLocators : null;
      if (!Array.isArray(units) || !Array.isArray(ownedLocators) || !contextOnlyLocators || handoff.manifestSha256 !== proposal.manifestSha256) fail("persisted ownership or manifest membership is inconsistent");
      if (index === 0) for (const unit of units) {
        if (!plain(unit)) continue;
        const key = locatorKey(unit.locator);
        if (key) inventory.add(key);
        if (unit.classification !== "eligible") continue;
        if (!key || eligible.has(key)) fail("persisted eligible ownership is invalid");
        eligible.add(key);
      }
      for (const locator of ownedLocators) {
        const key = locatorKey(locator);
        if (!key || owned.has(key)) fail("persisted handoff ownership is duplicate or invalid");
        owned.add(key);
      }
      for (const locator of contextOnlyLocators) {
        const key = locatorKey(locator);
        if (!plain(locator) || locator.documentId !== scope.documentId || !key || !inventory.has(key)) fail("persisted context-only locator is foreign or outside the parent inventory");
      }
    }
    if (storedIds.size !== expected.size) fail("persisted handoff coverage is incomplete");
    if (eligible.size === 0) fail("persisted plan has no eligible source");
    if (eligible.size !== owned.size || [...eligible].some((key) => !owned.has(key))) fail("persisted handoff ownership coverage is incomplete or foreign");
    return body;
  }
}
