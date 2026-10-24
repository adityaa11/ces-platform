import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createIdserCapacityPlanningSnapshotV2Consumer, IdserCapacityPlanningSnapshotV2Error } from "../src/idser-capacity-planning-snapshot-v2.ts";
import { createIdserCapacityPlanningSnapshotV2ProductionComposition } from "../src/idser-capacity-planning-snapshot-v2-composition.ts";
import { proposeStructuralFitCorpusPartition } from "../src/idser-structural-fit-corpus-partition.ts";

const identity = { quotaDomainId: "anoman", processId: "semantic", processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background" as const };
const input = { requestBytes: 400, inputTokens: 160, reservedOutputTokens: 40, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 200, dayUnits: 1, concurrencyUnits: 1 } };

const qualified = () => ({
  apiVersion: "CapacityPlanningSnapshot/v2" as const, status: "qualified" as const, reason: "qualified_calculated_capacity", readIsNotAdmissionPermit: true as const,
  identity: { ...identity, processKind: "semantic", capability: "atlas.semantic.extract", providerId: "anoman", modelOrProcessorId: "gemini-2.5-flash", adapterVersion: "anoman-v1", qualificationRef: "qualification://anoman", qualificationVersion: "v1", authorityVersion: 1 },
  revisions: { providerCapacityProfileVersion: "capacity-v1", policyId: "policy", policyVersion: "v1", desiredProfileVersion: "desired-v1", candidateActivationRevision: 2, processProfileVersion: "v1", workloadProfileVersion: "workload-v1", estimator: { identity: "complete-sem", version: "v1" }, safetyPolicy: { policyId: "safety", policyVersion: "v1" } },
  allocation: { allocationVersion: "v1", effectiveMask: ["rpm", "tpm", "concurrency"], baseline: { rpm: 14, tpm: 400, concurrency: 17 }, normalizedWeight: { numerator: 1, denominator: 1 }, cap: { tpm: 400 }, allocationFingerprint: "allocation-v1" },
  sizing: { maxEligibleCompleteRequestTokens: 300, maxEligibleInputTokens: 260, maxRequestBytes: 500, maxContextTokens: 300, maxOutputTokens: 80, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 500, maxPromptBytes: 480, maxInputTokens: 260, maxContextTokens: 300 }, outputReservation: { policyId: "output", policyVersion: "v1", maxOutputTokens: 80 }, estimator: { identity: "complete-sem", version: "v1" }, safetyPolicy: { policyId: "safety", policyVersion: "v1" } },
  borrowing: { mayBorrowIdleCapacity: true, sameBackgroundClass: true, runtimeOnly: true },
  policyProvenance: { policyId: "policy", policyVersion: "v1", routeId: "anoman-semantic", providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider://anoman", sourceVersion: "v1" }, dimensions: { rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20 }, tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 400 }, rpd: { mode: "not_enforced", providerState: "unknown", approvalRef: "approved-unknown-rpd" }, concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25 } } },
  canonicalFingerprint: "a".repeat(32), qualification: { candidateActivationRevision: 2, productionActive: false, isolated: true },
});

test("consumes only an authenticated qualified v2 snapshot and includes IDSER output reservation in one complete request", async () => {
  const calls: unknown[][] = [];
  const consumer = createIdserCapacityPlanningSnapshotV2Consumer({
    reader: { read: async (credential, request) => { calls.push([credential, request]); return qualified(); } },
    serverCredential: "server-owned", expectedIdentity: identity,
  });
  const result = await consumer.read(input);
  assert.deepEqual(calls, [["server-owned", { requestBytes: 400, inputTokens: 160, outputTokens: 40 }]], "the sole reader receives full request demand; no prospective flag, TPM division, or alternate reader exists");
  assert.equal(result.sizing.maxEligibleCompleteRequestTokens, 300);
  assert.equal(result.workload.structuralBound.maxPromptBytes, 480, "the qualified snapshot supplies the prompt-byte bound required by the splitter");
  assert.deepEqual(result.eligibleDimensions, ["rpm", "tpm", "concurrency"], "approved unknown RPD remains provenance rather than a numeric limit");
  assert.equal(Object.isFrozen(result), true);
});

test("fails closed for identity, revision/fingerprint, structural, and unknown-RPD provenance defects", async () => {
  const cases: readonly [string, (snapshot: any) => void][] = [
    ["foreign identity", (snapshot) => { snapshot.identity.routeId = "foreign-route"; }],
    ["revision mismatch", (snapshot) => { snapshot.revisions.processProfileVersion = "v2"; }],
    ["fingerprint", (snapshot) => { snapshot.canonicalFingerprint = "not-a-fingerprint"; }],
    ["missing prompt bound", (snapshot) => { delete snapshot.sizing.structuralBound.maxPromptBytes; }],
    ["unapproved unknown rpd", (snapshot) => { delete snapshot.policyProvenance.dimensions.rpd.approvalRef; }],
    ["candidate marked active without an exact activation revision", (snapshot) => { snapshot.qualification = { ...snapshot.qualification, productionActive: true, isolated: false }; }],
    ["candidate includes an activation revision", (snapshot) => { snapshot.qualification.activationRevision = 1; }],
  ];
  for (const [label, mutate] of cases) {
    const malformed = qualified(); mutate(malformed);
    const consumer = createIdserCapacityPlanningSnapshotV2Consumer({ reader: { read: async () => malformed }, serverCredential: "server-owned", expectedIdentity: identity });
    await assert.rejects(() => consumer.read(input), IdserCapacityPlanningSnapshotV2Error, label);
  }
  const unfit = createIdserCapacityPlanningSnapshotV2Consumer({ reader: { read: async () => ({ apiVersion: "CapacityPlanningSnapshot/v2" as const, status: "unfit" as const, readIsNotAdmissionPermit: true as const }) }, serverCredential: "server-owned", expectedIdentity: identity });
  await assert.rejects(() => unfit.read(input), (error: unknown) => error instanceof IdserCapacityPlanningSnapshotV2Error && error.disposition === "structurally_unfit");
});

test("enforces every complete-request bound locally even if a malformed reader response claims qualified", async () => {
  const consumer = createIdserCapacityPlanningSnapshotV2Consumer({ reader: { read: async () => qualified() }, serverCredential: "server-owned", expectedIdentity: identity });
  for (const request of [
    { ...input, requestBytes: 501 },
    { ...input, requestBytes: 481 },
    { ...input, inputTokens: 261 },
    { ...input, reservedOutputTokens: 81 },
    { ...input, inputTokens: 261, reservedOutputTokens: 40 },
  ]) await assert.rejects(() => consumer.read(request), (error: unknown) => error instanceof IdserCapacityPlanningSnapshotV2Error && error.disposition === "structurally_unfit");
});

test("integrates the v2-only consumer with deterministic text structural fitting", async () => {
  const calls: any[] = [];
  const consumer = createIdserCapacityPlanningSnapshotV2Consumer({ reader: { read: async (_credential, request) => {
    calls.push(request);
    const snapshot = qualified();
    snapshot.allocation.baseline.tpm = 50_000;
    Object.assign(snapshot.sizing, { maxEligibleCompleteRequestTokens: 20_000, maxEligibleInputTokens: 19_000, maxRequestBytes: 50_000, maxContextTokens: 20_000, maxOutputTokens: 1_000 });
    Object.assign(snapshot.sizing.structuralBound, { maxRequestBytes: 50_000, maxPromptBytes: 49_000, maxInputTokens: 19_000, maxContextTokens: 20_000 });
    snapshot.sizing.outputReservation.maxOutputTokens = 1_000;
    return snapshot;
  } }, serverCredential: "server-owned", expectedIdentity: identity });
  const result = await proposeStructuralFitCorpusPartition({
    acceptedDocument: {
      scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document" }, source: { documentId: "document", sourceSha256: "b".repeat(64) }, rel: { state: "unavailable" },
      normalizedDocument: { version: "v1", executionId: "execution", artifactId: "document", sourceSha256: "b".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "docling", processor: "pdf", executionId: "execution", processedAt: "2026-10-24T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text", text: "Eligible complete request." }], tables: [], visualRegions: [] }] }, media: [],
    } as any,
    estimatorConfiguration: { estimator: { identity: "complete-sem", version: "v1" }, configuration: { identity: "accounting", version: "v1" }, inputBytesPerToken: 4, framingAllowanceBytes: 0, requestByteSafetyMargin: 0, inputTokenSafetyMargin: 0, reservedOutputTokens: 40, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } },
    capacityConsumer: consumer,
  });
  assert.equal(result.disposition, "READY", JSON.stringify(result));
  assert.equal(calls[0]?.outputTokens, 0, "the pinned read is metadata-only");
  assert.equal(calls[1]?.outputTokens, 40, "the fitting read carries IDSER's reserved output and cannot be a token-input-only check");
});

test("has no legacy reader, direct database, admission, or execution dependency", () => {
  const source = readFileSync(new URL("../src/idser-capacity-planning-snapshot-v2.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from "\.\/idser-prospective-capacity-snapshot|from "postgres"|drizzle|\.unsafe\(|createProviderWorkAdmission|fetch\(/i);
});

test("the production IDSER fitting seams name one v2 consumer and no v1/adapter/fallback capacity path", () => {
  const consumer = readFileSync(new URL("../src/idser-capacity-planning-snapshot-v2.ts", import.meta.url), "utf8");
  const composition = readFileSync(new URL("../src/idser-capacity-planning-snapshot-v2-composition.ts", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const structural = readFileSync(new URL("../src/idser-structural-fit-corpus-partition.ts", import.meta.url), "utf8");
  const multimodal = readFileSync(new URL("../src/idser-multimodal-structural-fit-partition.ts", import.meta.url), "utf8");
  assert.equal((consumer.match(/export function createIdserCapacityPlanningSnapshotV2Consumer/g) ?? []).length, 1);
  for (const source of [structural, multimodal]) {
    assert.match(source, /idser-capacity-planning-snapshot-v2/);
    assert.doesNotMatch(source, /idser-prospective-capacity-snapshot|CapacityPlanningSnapshot\/v1|fallback|adapter|postgres|drizzle/i);
  }
  assert.match(main, /createIdserCapacityPlanningSnapshotV2ProductionComposition/);
  assert.equal((main.match(/createIdserCapacityPlanningSnapshotV2ProductionComposition\(/g) ?? []).length, 1, "the production entrypoint creates one v2 composition");
  assert.doesNotMatch(main, /idser-prospective-capacity-snapshot|CapacityPlanningSnapshot\/v1|fallback/i);
  assert.match(composition, /binding\.prospective === false && binding\.qualificationVersion === "v2"/);
  assert.match(composition, /v2Bindings\.length !== 1/);
  assert.doesNotMatch(composition, /idser-prospective-capacity-snapshot|CapacityPlanningSnapshot\/v1|fallback|adapter|postgres|drizzle/i);
});

test("production composition binds exactly one non-prospective v2 credential and fails closed when ambiguous", async () => {
  const binding = { credential: "server-owned", principalId: "idser", quotaDomainId: "anoman", processId: "semantic", processProfileVersion: "v1", routeId: "anoman-semantic", serviceClass: "background" as const, prospective: false, qualificationVersion: "v2" as const };
  const consumer = createIdserCapacityPlanningSnapshotV2ProductionComposition({ reader: { read: async () => qualified() as any }, bindings: [binding] });
  assert.ok(consumer, "one qualified v2 credential creates the sole production composition");
  await consumer.read(input);
  assert.equal(createIdserCapacityPlanningSnapshotV2ProductionComposition({ reader: { read: async () => qualified() as any }, bindings: [] }), undefined, "no v2 credential creates no fallback consumer");
  assert.throws(() => createIdserCapacityPlanningSnapshotV2ProductionComposition({ reader: { read: async () => qualified() as any }, bindings: [binding, { ...binding, credential: "second" }] }), /Exactly one non-prospective/);
});
