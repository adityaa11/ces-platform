import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  canonicalImmutableSemanticCorpusPlanV3,
  replayPlannedSemanticCorpusHandoffHashV3,
  type ImmutableSemanticCorpusPlanInputV3,
} from "../src/immutable-semantic-corpus-plan.ts";
import {
  canonicalSemanticBatchV3Reference,
  createSemanticBatchV3ReferenceReceivingBoundary,
  PostgresSemanticBatchV3ReferenceResolver,
  SemanticBatchV3ReferenceResolutionError,
} from "../src/semantic-batch-v3-reference-resolution.ts";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const scope = { projectId: "v3-project", workspaceId: "v3-workspace", bundleId: "v3-bundle", documentId: "v3-document" };
const identity = (name: string) => ({ identity: name, version: "v3" });

function input(): ImmutableSemanticCorpusPlanInputV3 {
  const owned = { documentId: scope.documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "owned" };
  return {
    version: "ImmutableSemanticCorpusPlan/v3", scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId },
    source: { sourceSha256: digest("source"), normalizedDocumentRef: digest("cache"), perceptionExecutionId: "v3-execution", normalizedDocumentFingerprint: digest("fingerprint"), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" }, acceptedMedia: [] },
    proposal: {
      proposalId: "v3-proposal", proposalHash: digest("proposal"), sourceHash: digest("source-hash"), policyHash: digest("policy"), estimatorHash: digest("estimator-hash"), manifestSha256: digest("manifest"),
      structuralBound: { identity: "v3-bound", version: "v3", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 2048, maxContextTokens: 1024 },
      bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } },
      packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), promptIdentity: identity("prompt"), schema: identity("schema"), composer: identity("composer"), route: identity("route"), adapter: identity("adapter"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 },
      inventory: [{ locator: owned, classification: "eligible" }],
      batches: [{ batchId: "batch-0001", ownedLocators: [owned], contextOnlyLocators: [], sourceSpecificationSha256: digest("source-spec"), requestSha256: digest("request"), manifestSha256: digest("manifest"), packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 100 }, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: digest("source-spec"), requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] }],
    },
  };
}

function fixture(mutator?: (row: Record<string, unknown>) => void) {
  const canonical = canonicalImmutableSemanticCorpusPlanV3(input());
  const handoff = canonical.handoffContents[0]!;
  const handoffHash = replayPlannedSemanticCorpusHandoffHashV3(handoff);
  const reference = { documentPlanRef: `semantic-plan-${canonical.planHash}`, planHash: canonical.planHash, batchId: "batch-0001", batchHandoffRef: `semantic-handoff-${handoffHash}`, batchHandoffHash: handoffHash };
  const source = (canonical.planContent as any).source;
  const row: Record<string, unknown> = {
    plan_id: reference.documentPlanRef, plan_hash: reference.planHash, project_id: scope.projectId, workspace_id: scope.workspaceId, bundle_id: scope.bundleId, document_id: scope.documentId, persisted_source_sha256: source.sourceSha256, persisted_source_fingerprint: source.normalizedDocumentFingerprint, plan_content: canonical.planContent,
    handoff_id: reference.batchHandoffRef, handoff_plan_id: reference.documentPlanRef, batch_id: reference.batchId, batch_slot: 1, handoff_hash: reference.batchHandoffHash, handoff_content: handoff, cancelled_plan_id: null,
    perception_execution_id: source.perceptionExecutionId, execution_source_sha256: source.sourceSha256, completion_fingerprint: source.normalizedDocumentFingerprint, execution_contract_version: source.perceptionContractVersion,
    normalized_document_ref: source.normalizedDocumentRef, cache_source_sha256: source.sourceSha256, cache_contract_version: source.normalizedDocumentVersion, cache_capability: source.perceptionCapability,
  };
  mutator?.(row);
  return { row, reference };
}

test("resolves only immutable v3 references from persisted scope and returns no execution authority", async () => {
  const data = fixture();
  const statements: string[] = [];
  const result = await new PostgresSemanticBatchV3ReferenceResolver({ unsafe: async (statement) => { statements.push(statement); return [data.row]; } }).resolveBackground(data.reference);
  assert.deepEqual(result.reference, data.reference);
  assert.deepEqual(result.selection.ownedLocators, [{ documentId: scope.documentId, pageNumber: 1, sourceKind: "text_block", localId: "owned" }]);
  assert.deepEqual(result.acceptedMedia, []);
  assert.equal(result.commitments.requestSha256, digest("request"));
  assert.equal(statements.length, 1);
  assert.match(statements[0]!, /^SELECT/i, "the resolver has no write path");
  assert.doesNotMatch(statements[0]!, /normalized_document\s+AS/i, "the resolver does not hydrate normalized content");
});

test("fails closed for cancelled, tampered, foreign, and mixed-version inputs", async () => {
  for (const data of [
    fixture((row) => { row.cancelled_plan_id = row.plan_id; }),
    fixture((row) => { (row.handoff_content as any).requestSha256 = digest("tampered"); }),
    fixture((row) => { (row.plan_content as any).version = "ImmutableSemanticCorpusPlan/v2"; }),
  ]) await assert.rejects(() => new PostgresSemanticBatchV3ReferenceResolver({ unsafe: async () => [data.row] }).resolveBackground(data.reference), SemanticBatchV3ReferenceResolutionError);
  const data = fixture();
  await assert.rejects(() => new PostgresSemanticBatchV3ReferenceResolver({ unsafe: async () => [] }).resolveBackground(data.reference), SemanticBatchV3ReferenceResolutionError);
});

test("the internal receiver authenticates before parsing or v3 background redemption", async () => {
  const data = fixture();
  let sqlCalls = 0;
  const resolver = new PostgresSemanticBatchV3ReferenceResolver({ unsafe: async () => { sqlCalls += 1; return [data.row]; } });
  const credential = "v".repeat(32);
  const receiver = createSemanticBatchV3ReferenceReceivingBoundary(credential, resolver);
  const body = canonicalSemanticBatchV3Reference(data.reference);
  await assert.rejects(() => receiver.receive(undefined, body), /unauthorized internal service request/i);
  await assert.rejects(() => receiver.receive("invalid", body), /unauthorized internal service request/i);
  assert.equal(sqlCalls, 0, "unauthenticated input never reaches parser or resolver");
  assert.deepEqual((await receiver.receive(credential, body)).scope, scope);
  assert.equal(sqlCalls, 1);
});
