import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canonicalMultimodalSha256 } from "@atlas/skills";
import {
  ImmutableSemanticCorpusPlanError,
  PostgresImmutableSemanticCorpusPlanRepository,
  canonicalImmutableSemanticCorpusPlanV3,
  parseImmutableSemanticCorpusPlanInputV3,
  parseImmutableSemanticCorpusPlanRecord,
  parsePlannedSemanticCorpusHandoffRecord,
  replayImmutableSemanticCorpusPlanHashV3,
  replayPlannedSemanticCorpusHandoffHashV3,
  type ImmutableSemanticCorpusPlanInputV3,
} from "../src/immutable-semantic-corpus-plan.ts";
import { bindSemanticMultimodalReconstructionPolicyV1 } from "../src/semantic-multimodal-reconstruction-policy-binding.ts";
import { PostgresSemanticBatchPlanReadyFixtureReceiver, fixtureSemanticBatchPlanReadyV1 } from "../src/semantic-batch-plan-ready-fixture.ts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const identity = (name: string) => ({ identity: name, version: "v3" });
const locator = (suffix: string, localId: string, sourceKind: "text_block" | "table" | "visual_region" = "text_block") => ({ documentId: `document-${suffix}`, pageNumber: 1, sourceKind, localId });

function input(suffix: string): ImmutableSemanticCorpusPlanInputV3 {
  const owned = locator(suffix, "owned");
  const visual = locator(suffix, "visual", "visual_region");
  const sourceSpecificationSha256 = hash(`source-specification-${suffix}`);
  const manifestSha256 = hash(`manifest-${suffix}`);
  const requestSha256 = hash(`request-${suffix}`);
  const packetProfile = identity("packet-profile");
  const estimator = identity("estimator");
  const configuration = identity("configuration");
  const estimatorConfiguration = { estimator, configuration, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } };
  return {
    version: "ImmutableSemanticCorpusPlan/v3",
    scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
    source: {
      sourceSha256: hash(`source-${suffix}`), normalizedDocumentRef: `cache-${suffix}`, perceptionExecutionId: `execution-${suffix}`, normalizedDocumentFingerprint: hash(`fingerprint-${suffix}`), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" },
      acceptedMedia: [{ assetRef: "derived/01234567-89ab-cdef-0123-456789abcdef", locator: visual, sha256: hash(`asset-${suffix}`), mediaType: "image/png", byteLength: 100 }],
    },
    proposal: {
      proposalId: `proposal-${suffix}`, proposalHash: hash(`proposal-${suffix}`), sourceHash: hash(`source-hash-${suffix}`), policyHash: hash(`policy-${suffix}`), estimatorHash: canonicalMultimodalSha256(estimatorConfiguration), manifestSha256,
      structuralBound: { identity: "structural-bound", version: "v3", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 2048, maxContextTokens: 1024 },
      bssSnapshot: { source: { sourceId: "capacity-source", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "process", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator } },
      packetProfile, estimator, configuration, promptIdentity: identity("prompt"), schema: identity("schema"), composer: identity("composer"), route: identity("route"), adapter: identity("adapter"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 },
      inventory: [{ locator: owned, classification: "eligible" }, { locator: visual, classification: "unexamined", reason: "visual_context_only" }],
      batches: [{ batchId: "batch-0001", ownedLocators: [owned], contextOnlyLocators: [visual], sourceSpecificationSha256, requestSha256, manifestSha256, packetProfile, estimator, configuration, conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 120 }, requestBytes: 120, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256, requestBytes: 120, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] }],
    },
  };
}

function policyBinding(plan: ImmutableSemanticCorpusPlanInputV3) {
  const canonical = canonicalImmutableSemanticCorpusPlanV3(plan);
  const handoffHash = replayPlannedSemanticCorpusHandoffHashV3(canonical.handoffContents[0]!);
  const configuration = { estimator: plan.proposal.estimator, configuration: plan.proposal.configuration, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } };
  return bindSemanticMultimodalReconstructionPolicyV1({
    bindingVersion: "SemanticMultimodalReconstructionPolicyBinding/v1", planRef: `semantic-plan-${canonical.planHash}`, handoffRef: `semantic-handoff-${handoffHash}`, planHash: canonical.planHash, handoffHash, batchId: "batch-0001", batchSlot: 1,
    identityBinding: { prompt: plan.proposal.promptIdentity, schema: plan.proposal.schema, composer: plan.proposal.composer, route: plan.proposal.route, adapter: plan.proposal.adapter },
    estimatorBinding: { estimator: plan.proposal.estimator, configuration: plan.proposal.configuration, configurationSha256: plan.proposal.estimatorHash, inputBytesPerToken: configuration.inputBytesPerToken, framingAllowanceBytes: configuration.framingAllowanceBytes, requestByteSafetyMargin: configuration.requestByteSafetyMargin, inputTokenSafetyMargin: configuration.inputTokenSafetyMargin, reservedOutputTokens: configuration.reservedOutputTokens, requestResourceEnvelope: configuration.requestResourceEnvelope, imageTokenPolicy: { identity: "atlas.multimodal-image-grid-estimate", version: "v1", policySha256: hash("image-policy") } },
    routeBinding: { routeId: "route", profileId: "profile", profileVersion: "v1", maxPromptBytes: 2048, image: { version: "v1", mediaTypes: ["image/png"], maxImageCount: 1, maxImageBytes: 1024, maxImageWidth: 64, maxImageHeight: 64 }, imageTpm: { state: "unknown" } },
    serializerBinding: { identity: "anoman.openai-chat.multipart-data-url", version: "v1", model: "model", policySha256: hash("serializer-policy") },
  });
}

test("v3 canonicalization retains only reconstruction commitments", () => {
  const plan = input("canonical");
  const first = canonicalImmutableSemanticCorpusPlanV3(plan);
  const second = canonicalImmutableSemanticCorpusPlanV3(plan);
  assert.deepEqual(first, second, "same commitments yield the same plan and handoff identities");
  assert.equal(replayImmutableSemanticCorpusPlanHashV3(first.planContent), first.planHash);
  assert.doesNotThrow(() => parseImmutableSemanticCorpusPlanRecord(first.planContent));
  assert.doesNotThrow(() => parsePlannedSemanticCorpusHandoffRecord(first.handoffContents[0]));
  const serialized = JSON.stringify(first);
  for (const forbidden of ["rawRequest", "promptBody", "schemaBody", "sourceText", "mediaBytes", "base64", "adapterJson", "providerResponse", "credentials"]) assert.equal(serialized.includes(forbidden), false, `${forbidden} is never persisted`);
  const parent = first.planContent as { source: { acceptedMedia: unknown[] }; proposal: Record<string, unknown> };
  const handoff = first.handoffContents[0] as Record<string, unknown>;
  assert.equal(parent.source.acceptedMedia.length, 1, "accepted media is a resolvable reference only");
  assert.deepEqual(Object.keys(parent.proposal).sort(), ["adapter", "batchIds", "bssSnapshot", "composer", "configuration", "eligibleDimensions", "estimator", "estimatorHash", "inventory", "manifestSha256", "packetProfile", "policyHash", "promptIdentity", "proposalHash", "proposalId", "requestResourceEnvelope", "route", "schema", "sourceHash", "structuralBound"].sort());
  assert.match(String(handoff.sourceSpecificationSha256), /^[a-f0-9]{64}$/);
  assert.match(String(handoff.requestSha256), /^[a-f0-9]{64}$/);
  assert.equal(handoff.manifestSha256, parent.proposal.manifestSha256, "the future reader has one manifest commitment without storing the manifest");
});

test("v3 rejects foreign, duplicate, payload-bearing, and inconsistent commitments", () => {
  const reject = (mutate: (plan: any) => void) => {
    const plan = structuredClone(input("reject")) as any;
    mutate(plan);
    assert.throws(() => parseImmutableSemanticCorpusPlanInputV3(plan), ImmutableSemanticCorpusPlanError);
  };
  reject((plan) => { plan.source.acceptedMedia[0].raw = "media bytes"; });
  reject((plan) => { plan.proposal.promptIdentity.body = "full prompt"; });
  reject((plan) => { plan.proposal.batches[0].requestSha256 = "not-a-hash"; });
  reject((plan) => { plan.proposal.batches[0].manifestSha256 = hash("different-manifest"); });
  reject((plan) => { plan.source.acceptedMedia.push(structuredClone(plan.source.acceptedMedia[0])); });
  reject((plan) => { plan.source.acceptedMedia[0].locator.documentId = "foreign-document"; });
  reject((plan) => { plan.proposal.replanPredecessor = { planId: "prior", planHash: hash("prior"), cancellationPlanId: "other" }; });
});

test("v3 persisted records reject post-canonical payload injection and broken parent-child bindings", () => {
  const canonical = canonicalImmutableSemanticCorpusPlanV3(input("stored"));
  const parent = structuredClone(canonical.planContent) as any;
  parent.source.acceptedMedia[0].bytes = "AA==";
  assert.throws(() => parseImmutableSemanticCorpusPlanRecord(parent), ImmutableSemanticCorpusPlanError);
  const child = structuredClone(canonical.handoffContents[0]) as any;
  child.requestSha256 = hash("substituted-request");
  assert.doesNotThrow(() => parsePlannedSemanticCorpusHandoffRecord(child), "a request hash is self-contained; parent/child equality is checked by the persistence/reconstruction consumer");
  child.providerBody = "forbidden";
  assert.throws(() => parsePlannedSemanticCorpusHandoffRecord(child), ImmutableSemanticCorpusPlanError);
});

test("the active writer and reference-only receiver accept only internally consistent v3 commitments", async () => {
  const plan = input("active-boundary");
  const canonical = canonicalImmutableSemanticCorpusPlanV3(plan);
  const persisted = {
    planId: `semantic-plan-${canonical.planHash}`,
    planHash: canonical.planHash,
    handoffs: [{ batchId: "batch-0001", handoffId: `semantic-handoff-${replayPlannedSemanticCorpusHandoffHashV3(canonical.handoffContents[0])}`, handoffHash: replayPlannedSemanticCorpusHandoffHashV3(canonical.handoffContents[0]) }],
  };
  const fixture = fixtureSemanticBatchPlanReadyV1(persisted);
  const [handoff] = persisted.handoffs;
  const receiver = new PostgresSemanticBatchPlanReadyFixtureReceiver({
    unsafe: async () => [{
      plan_id: persisted.planId, plan_hash: persisted.planHash,
      project_id: plan.scope.projectId, workspace_id: plan.scope.workspaceId, bundle_id: plan.scope.bundleId, document_id: plan.scope.documentId,
      plan_content: canonical.planContent,
      handoff_id: handoff!.handoffId, handoff_plan_id: persisted.planId, batch_id: handoff!.batchId, batch_slot: 1, handoff_hash: handoff!.handoffHash,
      handoff_content: canonical.handoffContents[0], cancelled_plan_id: null,
    }],
  });
  assert.deepEqual(await receiver.receive(fixture.canonicalJson), fixture.body, "validation returns the unchanged reference body without a delivery API");
  const tamperedHandoff = structuredClone(canonical.handoffContents[0]) as { requestSha256: string };
  tamperedHandoff.requestSha256 = hash("tampered-request");
  const tamperedReceiver = new PostgresSemanticBatchPlanReadyFixtureReceiver({
    unsafe: async () => [{
      plan_id: persisted.planId, plan_hash: persisted.planHash,
      project_id: plan.scope.projectId, workspace_id: plan.scope.workspaceId, bundle_id: plan.scope.bundleId, document_id: plan.scope.documentId,
      plan_content: canonical.planContent,
      handoff_id: handoff!.handoffId, handoff_plan_id: persisted.planId, batch_id: handoff!.batchId, batch_slot: 1, handoff_hash: handoff!.handoffHash,
      handoff_content: tamperedHandoff, cancelled_plan_id: null,
    }],
  });
  await assert.rejects(() => tamperedReceiver.receive(fixture.canonicalJson), /persisted plan or handoff scope is inconsistent/, "a persisted handoff whose immutable content no longer matches its stored hash is rejected before any delivery API");

  const unavailableSql = { unsafe: async () => { throw new Error("old inputs must fail before database access"); }, begin: async () => { throw new Error("old inputs must fail before a transaction"); } };
  const writer = new PostgresImmutableSemanticCorpusPlanRepository(unavailableSql as never);
  await assert.rejects(() => writer.persist({ ...plan, version: "ImmutableSemanticCorpusPlan/v2" } as never), /v3 is accepted at the active persistence boundary/);
  await assert.rejects(() => writer.persist(({ ...plan, version: undefined } as unknown) as never), /v3 is accepted at the active persistence boundary/);
  await assert.rejects(() => writer.persist(({ ...plan, version: "mixed" } as unknown) as never), /v3 is accepted at the active persistence boundary/);
  await assert.rejects(() => writer.persist(plan, []), /requires one immutable reconstruction policy binding/);
  const statements: string[] = [];
  const transaction = {
    unsafe: async (statement: string) => {
      statements.push(statement);
      if (statement.startsWith("SELECT 1 FROM atlas.extraction_bundle_document")) return [{}];
      return [];
    },
    begin: async <T>(work: (sql: any) => Promise<T>) => work(transaction),
  };
  await new PostgresImmutableSemanticCorpusPlanRepository(transaction as never).persist(plan, [policyBinding(plan)]);
  const handoffInsert = statements.findIndex((statement) => statement.startsWith("INSERT INTO atlas.planned_semantic_corpus_handoff"));
  const sidecarInsert = statements.findIndex((statement) => statement.startsWith("INSERT INTO atlas.semantic_multimodal_reconstruction_policy_binding"));
  assert.ok(handoffInsert >= 0 && sidecarInsert > handoffInsert, "the v3 writer inserts the immutable policy binding after its immutable handoff inside the same transaction");
});
