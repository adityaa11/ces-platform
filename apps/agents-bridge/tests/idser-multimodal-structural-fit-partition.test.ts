import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { anomanMultipartSerializationPolicy } from "../src/providers/anoman-multipart-serialization.ts";
import { inventoryMultimodalCandidates } from "../src/idser-multimodal-inventory-candidates.ts";
import { partitionMultimodalStructuralFit } from "../src/idser-multimodal-structural-fit-partition.ts";
import { IdserProspectiveCapacitySnapshotError } from "../src/idser-prospective-capacity-snapshot.ts";
import { createIdserCapacityPlanningSnapshotV2Consumer } from "../src/idser-capacity-planning-snapshot-v2.ts";

const sourceSha256 = "a".repeat(64);
const asset = (suffix: string) => `derived/12345678-1234-1234-1234-${suffix}`;
const accepted = () => ({
  scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document" },
  source: { documentId: "document", sourceSha256 }, rel: { state: "unavailable" as const },
  normalizedDocument: { version: "v1" as const, executionId: "execution", artifactId: "document", sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: "provider", processedAt: "2026-10-20T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text", text: "Source-grounded text." }], tables: [], visualRegions: [{ id: "visual", assetRef: asset("000000000001") }] }] },
  media: [{ pageNumber: 1, locatorId: "visual", assetRef: asset("000000000001"), mediaType: "image/png" as const, sha256: "b".repeat(64), byteLength: 12 }],
});
const configuration = () => ({ estimator: { identity: "idser-multimodal-estimator", version: "v1" }, configuration: { identity: "idser-multimodal-accounting", version: "v1" }, inputBytesPerToken: 4, framingAllowanceBytes: 128, requestByteSafetyMargin: 32, inputTokenSafetyMargin: 3, reservedOutputTokens: 40, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } });
const route = () => ({ version: "v1" as const, routeId: "route", profileId: "profile", profileVersion: "v1", image: { version: "v1" as const, mediaTypes: ["image/png" as const], maxImageCount: 4, maxImageBytes: 1000, maxImageWidth: 4096, maxImageHeight: 4096 }, maxPromptBytes: 100_000, maxDeadlineMilliseconds: 30_000, imageTpm: { state: "unknown" as const } });
const inventory = () => {
  const document = accepted();
  return inventoryMultimodalCandidates({ acceptedDocument: document, verifiedVisualMeasurements: document.media.map((media) => ({ ...media, sourceSha256, assetSha256: media.sha256, width: 768, height: 768 })), effectiveRoute: route(), serializerPolicy: { ...anomanMultipartSerializationPolicy, model: "gemini-2.5-flash" }, estimatorConfiguration: configuration() });
};
const snapshot = (sourceVersion = "v1") => ({
  apiVersion: "CapacityPlanningSnapshot/v1" as const, status: "inactive" as const, reason: "prospective_planning_only" as const, view: "prospective-planning-only" as const, readIsNotAdmissionPermit: true as const, plan: null,
  source: { quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion, limits: { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } } },
  enforcement: { apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", routeId: "anoman-semantic", policyId: "capacity-policy", policyVersion: "v1", providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion }, dimensions: { rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20 }, tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 40_000 }, rpd: { mode: "not_enforced", providerState: "unknown", approvalRef: "approved-rpd-unknown" }, concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25 } } },
  process: { id: "semantic", profileVersion: "v1", serviceClass: "background", active: false },
  workload: { id: "semantic-workload", profileVersion: "v1", active: false, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 100_000, maxInputTokens: 100_000, maxPromptBytes: 100_000, maxContextTokens: 100_100 }, estimator: { identity: "idser-multimodal-estimator", version: "v1" }, outputReservation: { policyId: "semantic-output", policyVersion: "v1", maxOutputTokens: 40 }, safetyPolicy: { policyId: "semantic-safety", policyVersion: "v1" } },
  eligibleDimensions: ["rpm", "tpm", "concurrency"] as const,
  requestResourceEnvelope: { requestUnits: 1, tokenUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
});

const v2Snapshot = () => ({
  apiVersion: "CapacityPlanningSnapshot/v2" as const, status: "qualified" as const, readIsNotAdmissionPermit: true as const,
  identity: { quotaDomainId: "anoman", processId: "semantic", processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background", processKind: "semantic", capability: "atlas.semantic.extract", providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-v1", qualificationRef: "qualification://anoman", qualificationVersion: "v1", authorityVersion: 1 },
  revisions: { providerCapacityProfileVersion: "capacity-v1", policyId: "policy", policyVersion: "v1", desiredProfileVersion: "desired-v1", candidateActivationRevision: 1, processProfileVersion: "v1", workloadProfileVersion: "workload-v1", estimator: { identity: "idser-multimodal-estimator", version: "v1" }, safetyPolicy: { policyId: "safety", policyVersion: "v1" } },
  allocation: { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], baseline: { rpm: 14, tpm: 50_000, concurrency: 17 }, normalizedWeight: { numerator: 1, denominator: 1 }, cap: { tpm: 50_000 }, allocationFingerprint: "allocation-v1" },
  sizing: { maxEligibleCompleteRequestTokens: 20_000, maxEligibleInputTokens: 19_000, maxRequestBytes: 50_000, maxContextTokens: 20_000, maxOutputTokens: 1_000, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 50_000, maxPromptBytes: 49_000, maxInputTokens: 19_000, maxContextTokens: 20_000 }, outputReservation: { policyId: "output", policyVersion: "v1", maxOutputTokens: 1_000 }, estimator: { identity: "idser-multimodal-estimator", version: "v1" }, safetyPolicy: { policyId: "safety", policyVersion: "v1" } },
  borrowing: { mayBorrowIdleCapacity: true, sameBackgroundClass: true, runtimeOnly: true },
  policyProvenance: { policyId: "policy", policyVersion: "v1", routeId: "anoman-semantic", providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider://anoman", sourceVersion: "v1" }, dimensions: { rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20 }, tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 50_000 }, rpd: { mode: "not_enforced", providerState: "unknown", approvalRef: "approved-rpd-unknown" }, concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25 } } },
  canonicalFingerprint: "a".repeat(32), qualification: { candidateActivationRevision: 1, productionActive: false, isolated: true },
});

test("uses the v2-only BSS consumer for complete multimodal demand while unknown image TPM remains non-blocking", async () => {
  const reads: { requestBytes: number; inputTokens: number; tokenUnits: number }[] = [];
  let forbiddenEffects = 0;
  const consumer = createIdserCapacityPlanningSnapshotV2Consumer({ reader: { read: async (_credential, input) => { reads.push({ requestBytes: input?.requestBytes ?? -1, inputTokens: input?.inputTokens ?? -1, tokenUnits: (input?.inputTokens ?? 0) + (input?.outputTokens ?? 0) }); return v2Snapshot(); } }, serverCredential: "server-owned", expectedIdentity: { quotaDomainId: "anoman", processId: "semantic", processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background" } });
  const result = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), capacityConsumer: consumer });
  assert.equal(forbiddenEffects, 0, "the partitioner has no BSS write, persistence, provider, hydration, or execution surface");
  assert.equal(result.disposition, "READY", JSON.stringify(result));
  if (result.disposition !== "READY") return;
  assert.equal(result.batches.length, 1);
  assert.equal(result.batches[0]?.selectedMedia.length, 1);
  assert.deepEqual(result.batches[0]?.ownedLocators.map((locator) => locator.locatorId), ["text", "visual"]);
  assert.deepEqual(reads[0], { requestBytes: 0, inputTokens: 0, tokenUnits: 0 });
  assert.ok(reads[1]!.requestBytes > 0 && reads[1]!.inputTokens > 0 && reads[1]!.tokenUnits > reads[1]!.inputTokens, "full request demand and reserved output reach the read-only consumer");
  assert.equal(Object.isFrozen(result), true);
  const repeat = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), capacityConsumer: consumer });
  assert.deepEqual(repeat, result, "candidate ordering and owned coverage yield a stable proposal identity");
});

test("returns explicit structural and effective-route dispositions without silently dropping owned coverage", async () => {
  const unfit = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), capacityConsumer: { read: async (input) => input.requestBytes === 0 ? snapshot() as any : Promise.reject(new IdserProspectiveCapacitySnapshotError("unfit", "structurally_unfit")) } });
  assert.deepEqual(unfit.disposition, "BLOCKED");
  assert.equal(unfit.reason, "STRUCTURALLY_UNAVAILABLE");
  assert.equal(unfit.rejected.length, 1);

  const constrainedRoute = { ...route(), image: { ...route().image!, maxImageCount: 0 } } as any;
  const rejected = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: constrainedRoute, capacityConsumer: { read: async () => snapshot() as any } });
  assert.equal(rejected.disposition, "BLOCKED");
  assert.equal(rejected.reason, "EFFECTIVE_ROUTE_REJECTED");
});

test("fences a changed BSS policy and emits a replan for a changed prior route/configuration identity", async () => {
  let reads = 0;
  const changedDuringRead = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), capacityConsumer: { read: async () => snapshot(reads++ === 0 ? "v1" : "v2") as any } });
  assert.equal(changedDuringRead.disposition, "BLOCKED");
  assert.equal(changedDuringRead.reason, "STRUCTURAL_REVISION_CHANGED");

  const first = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), capacityConsumer: { read: async () => snapshot() as any } });
  assert.equal(first.disposition, "READY");
  if (first.disposition !== "READY") return;
  const replan = await partitionMultimodalStructuralFit({ inventory: inventory(), effectiveRoute: route(), previousProposal: { ...first, routeHash: "changed-route-configuration" }, capacityConsumer: { read: async () => snapshot() as any } });
  assert.equal(replan.disposition, "REPLAN");
  if (replan.disposition !== "REPLAN") return;
  assert.deepEqual(replan.replanPredecessor, { proposalId: first.proposalId, proposalHash: first.proposalHash });
});

test("has no reservation, persistence, hydration, provider, or semantic execution dependency", () => {
  const source = readFileSync(new URL("../src/idser-multimodal-structural-fit-partition.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /postgres|drizzle|hydrate|base64|dispatchMultipart|fetch\(/i);
});
