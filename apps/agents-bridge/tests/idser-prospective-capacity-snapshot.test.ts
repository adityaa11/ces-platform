import assert from "node:assert/strict";
import test from "node:test";
import { createIdserProspectiveCapacitySnapshotConsumer, IdserProspectiveCapacitySnapshotError } from "../src/idser-prospective-capacity-snapshot.ts";
import type { CapacityPlanningSnapshot } from "../src/capacity-planning-snapshot.ts";

const valid = (): CapacityPlanningSnapshot => ({
  apiVersion: "CapacityPlanningSnapshot/v1", status: "inactive", reason: "prospective_planning_only", view: "prospective-planning-only", readIsNotAdmissionPermit: true, plan: null,
  source: { quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion: "2026-10-19", limits: { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } } },
  enforcement: { apiVersion: "EffectiveEnforcementPolicy/v1", quotaDomainId: "anoman", providerCapacityProfileVersion: "v1", routeId: "anoman-semantic", policyId: "capacity-policy", policyVersion: "v1", providerProfileProvenance: { capacitySource: "provider_api", sourceRef: "provider://limits", sourceVersion: "2026-10-19" }, dimensions: { rpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 20 }, tpm: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 40_000 }, rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: "approved-rpd-unknown" }, concurrency: { mode: "enforced", providerState: "known", limitSource: "provider", limit: 25 } } },
  process: { id: "semantic", profileVersion: "v1", serviceClass: "background", active: false },
  workload: { id: "semantic-workload", profileVersion: "v1", active: false, structuralBound: { identity: "semantic-bound", version: "v1", maxRequestBytes: 10_000, maxInputTokens: 4_000 }, estimator: { identity: "semantic-estimator", version: "v2" }, outputReservation: { policyId: "semantic-output", policyVersion: "v1", maxOutputTokens: 100 }, safetyPolicy: { policyId: "semantic-safety", policyVersion: "v1" } },
});
const input = { requestBytes: 100, inputTokens: 100, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 100, dayUnits: 1, concurrencyUnits: 1 } };

test("IDSER prospective consumer preserves the four demand dimensions without inventing an RPD limit", async () => {
  const consumer = createIdserProspectiveCapacitySnapshotConsumer({ reader: { read: async () => valid() }, serverCredential: "server-owned" });
  const snapshot = await consumer.read(input);
  assert.deepEqual(snapshot.eligibleDimensions, ["requestUnits", "tokenUnits", "dayUnits", "concurrencyUnits"]);
  assert.deepEqual(snapshot.requestResourceEnvelope, input.requestResourceEnvelope);
  assert.equal(snapshot.enforcement.dimensions as unknown as Record<string, unknown> ? (snapshot.enforcement.dimensions as Record<string, any>).rpd.limit : undefined, undefined);
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.requestResourceEnvelope));
});

test("IDSER prospective consumer fails closed for every non-exact inactive status and missing provenance", async () => {
  const mutations: readonly [string, (snapshot: any) => void][] = [
    ["qualified", (snapshot) => { snapshot.status = "qualified"; snapshot.reason = "qualified_planning_policy"; snapshot.view = "active-planning-read"; snapshot.plan = {}; }],
    ["alternate inactive", (snapshot) => { snapshot.reason = "inactive_or_unqualified_plan"; }],
    ["unknown", (snapshot) => { snapshot.status = "unknown"; }],
    ["stale", (snapshot) => { snapshot.status = "stale"; }],
    ["unfit", (snapshot) => { snapshot.status = "unfit"; }],
    ["foreign provenance", (snapshot) => { snapshot.enforcement.quotaDomainId = "foreign"; }],
    ["missing version", (snapshot) => { delete snapshot.workload.estimator.version; }],
    ["unsupported dimension", (snapshot) => { delete snapshot.enforcement.dimensions.concurrency; }],
    ["known zero", (snapshot) => { snapshot.source.limits.tpm = { state: "known", value: 0 }; snapshot.enforcement.dimensions.tpm.limit = 0; }],
    ["unauthorized RPD", (snapshot) => { snapshot.enforcement.dimensions.rpd.mode = "enforced"; }],
  ];
  for (const [name, mutate] of mutations) {
    const snapshot: any = valid(); mutate(snapshot);
    const consumer = createIdserProspectiveCapacitySnapshotConsumer({ reader: { read: async () => snapshot }, serverCredential: "server-owned" });
    await assert.rejects(() => consumer.read(input), IdserProspectiveCapacitySnapshotError, name);
  }
});
