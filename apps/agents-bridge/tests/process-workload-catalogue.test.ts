import assert from "node:assert/strict";
import test from "node:test";
import { ProcessWorkloadCatalogueError, parseProviderProcessProfile, parseRequestResourceEnvelope, parseServerProcessRegistry, parseWorkloadEnvelopeProfile, validateProcessWorkloadCatalogue } from "../src/process-workload-catalogue.ts";

const workload = (overrides: Record<string, unknown> = {}) => ({ workloadId: "semantic-bounded", profileVersion: "v1", active: true, compatibleProcessKinds: ["semantic"], structuralBound: { identity: "semantic-source-units", version: "v1", maxRequestBytes: 100_000, maxInputTokens: 20_000 }, estimator: { identity: "semantic-estimator", version: "v2" }, quotaAccountingPolicyId: "anoman-quota-tokens-v1", outputReservation: { policyId: "semantic-output", policyVersion: "v1", maxOutputTokens: 2_000 }, safetyPolicy: { policyId: "semantic-safety", policyVersion: "v1" }, ...overrides });
const process = (overrides: Record<string, unknown> = {}) => ({ processId: "semantic-extraction", profileVersion: "v1", processKind: "semantic", capability: "atlas.semantic.extract", serviceClass: "background", fairnessScope: { kind: "bundle", identityVersion: "v1" }, allocationPolicy: { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "semantic-cap-v1" }, hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } }, active: true, eligibleRouteIds: ["anoman-semantic"], workloadProfile: { workloadId: "semantic-bounded", profileVersion: "v1" }, ...overrides });

test("process policy is operational and unknown or entitlement-shaped input fails closed", () => {
  const parsed = parseProviderProcessProfile(process());
  assert.equal(parsed.serviceClass, "background");
  assert.throws(() => parseProviderProcessProfile(process({ capability: "unknown.capability" })), /unknown process kind/);
  assert.throws(() => parseProviderProcessProfile({ ...process(), customerPlan: "premium" }), /unsupported field/);
  assert.throws(() => parseProviderProcessProfile(process({ active: true, eligibleRouteIds: [] })), /eligible route/);
});

test("RC-01401-04: interactive weight exists only in the versioned server registry path", () => {
  const interactive = {
    ...process({ processId: "interactive-chat", processKind: "chat", capability: "atlas.chat.default", serviceClass: "interactive", workloadProfile: { workloadId: "chat-bounded", profileVersion: "v1" } }),
    allocationPolicy: { interactive: { weight: 3 }, hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } },
  };
  assert.deepEqual(parseProviderProcessProfile(interactive).allocationPolicy.interactive, { weight: 3 });
  assert.throws(() => parseProviderProcessProfile({ ...interactive, allocationPolicy: { hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } } }), /interactive allocation policy/);
  assert.throws(() => parseProviderProcessProfile({ ...interactive, allocationPolicy: { interactive: { weight: 1 }, background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "wrong-class" }, hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } } }), /interactive profiles cannot declare background/);
  assert.throws(() => parseProviderProcessProfile({ ...process(), allocationPolicy: { background: { weight: 1, mayBorrowIdleCapacity: true, capPolicyId: "background" }, interactive: { weight: 1 }, hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } } }), /background profiles cannot declare interactive/);
  const registry = parseServerProcessRegistry({ registryId: "process-registry", registryVersion: "v2", policies: [{ quotaDomainId: "anoman", process: interactive }] });
  assert.deepEqual(registry.policies[0]?.process.allocationPolicy.interactive, { weight: 3 });
});

test("workloads require concrete bounds and versioned estimator, accounting, output, and safety policies", () => {
  const parsed = parseWorkloadEnvelopeProfile(workload());
  assert.equal(parsed.structuralBound.maxInputTokens, 20_000);
  assert.throws(() => parseWorkloadEnvelopeProfile(workload({ structuralBound: { identity: "x", version: "v1", maxRequestBytes: 1 } })), /maxInputTokens/);
  assert.throws(() => parseWorkloadEnvelopeProfile({ ...workload(), averageTokens: 123 }), /unsupported field/);
  assert.throws(() => parseWorkloadEnvelopeProfile(workload({ outputReservation: { policyId: "x", policyVersion: "v1", maxOutputTokens: 0 } })), /positive safe integer/);
});

test("resource envelopes preserve separate request, token, day, and concurrency dimensions", () => {
  assert.deepEqual(parseRequestResourceEnvelope({ requestUnits: 1, tokenUnits: 1200, dayUnits: 1, concurrencyUnits: 1 }), { requestUnits: 1, tokenUnits: 1200, dayUnits: 1, concurrencyUnits: 1 });
  assert.throws(() => parseRequestResourceEnvelope({ requestUnits: 1, tokenUnits: -1, dayUnits: 1, concurrencyUnits: 1 }), ProcessWorkloadCatalogueError);
  assert.throws(() => parseRequestResourceEnvelope({ requestUnits: 1, tokenUnits: 1, dayUnits: 1 }), /concurrencyUnits/);
  assert.throws(() => parseRequestResourceEnvelope({ requestUnits: 1, tokenUnits: Number.MAX_SAFE_INTEGER + 1, dayUnits: 1, concurrencyUnits: 1 }), /safe integer/);
  assert.throws(() => parseRequestResourceEnvelope({ scalar: 4 }), /unsupported field/);
});

test("activation uses explicit quota accounting, immutable version references, and never billing weights", () => {
  const v1 = parseWorkloadEnvelopeProfile(workload());
  const v2 = parseWorkloadEnvelopeProfile(workload({ profileVersion: "v2", estimator: { identity: "semantic-estimator", version: "v3" } }));
  const active = parseProviderProcessProfile(process());
  assert.doesNotThrow(() => validateProcessWorkloadCatalogue([active], [v1, v2], new Set(["anoman-semantic"]), new Set(["anoman-quota-tokens-v1"])));
  assert.throws(() => validateProcessWorkloadCatalogue([active], [v1], new Set(["anoman-semantic"]), new Set()), /quota-accounting authority/);
  assert.throws(() => parseWorkloadEnvelopeProfile({ ...workload(), weightedTokens: 5 }), /unsupported field/);
  assert.throws(() => validateProcessWorkloadCatalogue([active], [v1], new Set(), new Set(["anoman-quota-tokens-v1"])), /unknown route/);
});
