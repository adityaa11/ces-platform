import assert from "node:assert/strict";
import test from "node:test";
import { parseProviderCapacityProfile } from "../src/capacity-catalogue.ts";
import { planDesiredAdmissionProfile, type PlannerPolicy } from "../src/capacity-planner.ts";
import { parseProviderProcessProfile, parseRegisteredProcessReference, parseServerProcessRegistry, parseWorkloadEnvelopeProfile, resolveRegisteredProcessPolicy } from "../src/process-workload-catalogue.ts";

const kinds = new Set(["synthetic-index", "semantic", "chat"]);
const capacity = (quotaDomainId: string, limits: unknown = { rpm: { state: "known", value: 100 }, tpm: { state: "known", value: 10_000 }, rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 10 } }) => parseProviderCapacityProfile({ quotaDomainId, profileVersion: "v1", nonSecretProviderAccountAlias: `${quotaDomainId}-account`, associatedRoutes: [{ routeId: `${quotaDomainId}-route`, providerId: "anoman" }], limits, windowPolicies: { rpm: { policyId: "rpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { policyId: "tpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { policyId: "rpd", policyVersion: "v1", source: "provider_docs", kind: "daily_calendar", parameters: { timeZone: "UTC", resetTime: "00:00" } } }, quotaAccountingPolicyId: "quota-v1", capacitySource: "provider_docs", sourceRef: "docs", sourceVersion: "v1", observedAt: "2026-10-17T00:00:00.000Z", effectiveFrom: "2026-10-17T00:00:00.000Z" });

const workload = (id: string, compatibleProcessKinds: readonly string[], active = true, version = "v1") => parseWorkloadEnvelopeProfile({ workloadId: id, profileVersion: version, active, compatibleProcessKinds, structuralBound: { identity: `${id}-bound`, version: "v1", maxRequestBytes: 10_000, maxInputTokens: id === "semantic" ? 4_000 : 500 }, estimator: { identity: `${id}-estimator`, version: "v2" }, quotaAccountingPolicyId: "quota-v1", outputReservation: { policyId: `${id}-output`, policyVersion: "v1", maxOutputTokens: 100 }, safetyPolicy: { policyId: `${id}-safety`, policyVersion: "v1" } }, kinds);

const policy = (processId: string, processKind: string, capability: string, serviceClass: "interactive" | "background", workloadId: string, quotaDomainId = "shared", active = true, profileVersion = "v1", workloadProfileVersion = "v1", routeId = `${quotaDomainId}-route`) => ({
  quotaDomainId,
  process: {
    processId, profileVersion, processKind, capability, serviceClass,
    fairnessScope: { kind: "global", identityVersion: "v1" },
    allocationPolicy: { ...(serviceClass === "background" ? { background: { weight: processId === "synthetic" ? 2 : 1, mayBorrowIdleCapacity: true, capPolicyId: `${processId}-cap-v1` } } : {}), hardInteractiveProtection: { policyId: "interactive-reserve", policyVersion: "v1" } },
    active, eligibleRouteIds: [routeId], workloadProfile: { workloadId, profileVersion: workloadProfileVersion },
  },
});

const registry = (overrides: readonly unknown[] = [
  policy("synthetic", "synthetic-index", "atlas.semantic.extract", "background", "synthetic"),
  policy("semantic", "semantic", "atlas.semantic.extract", "background", "semantic"),
  policy("chat", "chat", "atlas.chat.default", "interactive", "chat"),
  policy("isolated", "synthetic-index", "atlas.semantic.extract", "background", "synthetic", "isolated"),
]) => parseServerProcessRegistry({ registryId: "server-processes", registryVersion: "v1", policies: overrides });

const workloads = [workload("synthetic", ["synthetic-index"]), workload("semantic", ["semantic"]), workload("chat", ["chat"])] as const;
const plannerPolicy: PlannerPolicy = { plannerVersion: "planner-v1", effectiveFrom: "2026-10-17T00:00:00.000Z", headroomPolicy: { policyId: "headroom", policyVersion: "v1", reserve: { rpm: 10, tpm: 1_000, rpd: 100, concurrency: 1 } }, interactiveReserveTargets: [{ processId: "chat", profileVersion: "v1", serviceTargetId: "chat-slo", reserve: { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 } }], backgroundCaps: [{ processId: "synthetic", profileVersion: "v1", cap: { rpm: 40, tpm: 4_000, rpd: 400, concurrency: 4 } }] };
const authorities = { qualifiedQuotaDomainIds: new Set(["shared", "isolated"]), qualifiedRouteIds: new Set(["shared-route", "isolated-route"]), workloads, quotaAccountingPolicyIds: new Set(["quota-v1"]) };
const reference = (processId: string, quotaDomainId = "shared", profileVersion = "v1") => parseRegisteredProcessReference({ registryId: "server-processes", registryVersion: "v1", quotaDomainId, processId, profileVersion });

test("RC-00505-01 registers a synthetic process without widening the legacy parser and fails closed for foreign or unqualified identity", () => {
  assert.throws(() => parseProviderProcessProfile(policy("synthetic", "synthetic-index", "atlas.semantic.extract", "background", "synthetic").process), /unknown process kind/);
  const serverRegistry = registry();
  assert.equal(resolveRegisteredProcessPolicy(serverRegistry, reference("synthetic"), authorities).processKind, "synthetic-index");
  assert.throws(() => resolveRegisteredProcessPolicy(serverRegistry, { ...reference("synthetic"), registryVersion: "foreign" }, authorities), /foreign or stale/);
  assert.throws(() => resolveRegisteredProcessPolicy(serverRegistry, reference("synthetic"), { ...authorities, qualifiedRouteIds: new Set() }), /unknown route/);
  assert.throws(() => parseServerProcessRegistry({ registryId: "x", registryVersion: "v1", policies: [policy("bad", "synthetic-index", "foreign.capability", "background", "synthetic")] }), /unknown process kind, capability/);
});

test("RC-00505-02 keeps shared-domain processes deterministic and an isolated domain unreachable", () => {
  const serverRegistry = registry();
  const shared = ["synthetic", "semantic", "chat"].map((id) => resolveRegisteredProcessPolicy(serverRegistry, reference(id), authorities));
  const first = planDesiredAdmissionProfile(capacity("shared"), shared, workloads, plannerPolicy);
  const second = planDesiredAdmissionProfile(capacity("shared"), shared.slice().reverse(), workloads.slice().reverse(), plannerPolicy);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.throws(() => resolveRegisteredProcessPolicy(serverRegistry, reference("isolated", "shared"), authorities), /unknown for the quota domain/);
  const inactive = registry([policy("chat", "chat", "atlas.chat.default", "interactive", "chat"), policy("semantic", "semantic", "atlas.semantic.extract", "background", "semantic", "shared", false)]);
  const recomputed = planDesiredAdmissionProfile(capacity("shared"), [resolveRegisteredProcessPolicy(inactive, reference("chat"), authorities), resolveRegisteredProcessPolicy(inactive, reference("semantic"), authorities)], workloads, { ...plannerPolicy, backgroundCaps: [] });
  assert.deepEqual(recomputed.backgroundLanes, []);
  const semanticV2 = workload("semantic", ["semantic"], true, "v2");
  const updatedRegistry = parseServerProcessRegistry({ registryId: "server-processes", registryVersion: "v2", policies: [
    policy("semantic", "semantic", "atlas.semantic.extract", "background", "semantic", "shared", true, "v2", "v2", "shared-route-v2"),
    policy("chat", "chat", "atlas.chat.default", "interactive", "chat"),
  ] });
  const updatedAuthorities = { ...authorities, workloads: [semanticV2, workloads[2]] as const, qualifiedRouteIds: new Set(["shared-route-v2", "shared-route"]) };
  const updated = [
    resolveRegisteredProcessPolicy(updatedRegistry, parseRegisteredProcessReference({ registryId: "server-processes", registryVersion: "v2", quotaDomainId: "shared", processId: "semantic", profileVersion: "v2" }), updatedAuthorities),
    resolveRegisteredProcessPolicy(updatedRegistry, parseRegisteredProcessReference({ registryId: "server-processes", registryVersion: "v2", quotaDomainId: "shared", processId: "chat", profileVersion: "v1" }), updatedAuthorities),
  ];
  const updatedPlan = planDesiredAdmissionProfile(capacity("shared"), updated, updatedAuthorities.workloads, { ...plannerPolicy, backgroundCaps: [] });
  assert.equal(updatedPlan.backgroundLanes[0]?.workloadProfile.profileVersion, "v2");
});

test("RC-00505-04 retains independent dimensions and versioned workload/policy constraints through registry resolution", () => {
  const serverRegistry = registry();
  const processes = ["synthetic", "semantic", "chat"].map((id) => resolveRegisteredProcessPolicy(serverRegistry, reference(id), authorities));
  const plan = planDesiredAdmissionProfile(capacity("shared"), processes, workloads, plannerPolicy);
  assert.deepEqual(plan.usableGlobalCapacity, { rpm: 90, tpm: 9_000, rpd: 900, concurrency: 9 });
  assert.deepEqual(plan.hardInteractiveReserve, { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 });
  assert.deepEqual(plan.backgroundCapacity, { rpm: 70, tpm: 7_000, rpd: 700, concurrency: 7 });
  assert.equal(plan.backgroundLanes.find((lane) => lane.processId === "synthetic")?.workloadProfile.profileVersion, "v1");
  assert.throws(() => planDesiredAdmissionProfile(capacity("shared", { rpm: { state: "zero" }, tpm: { state: "known", value: 1 }, rpd: { state: "known", value: 1 }, concurrency: { state: "known", value: 1 } }), processes, workloads, plannerPolicy), /zero rpm/);
});

test("RC-00505-06 rejects transient or sensitive registry input and registry resolution has no wakeup metadata", () => {
  assert.throws(() => parseServerProcessRegistry({ registryId: "server-processes", registryVersion: "v1", queueDepth: 5, policies: [] }), /unsupported field/);
  assert.throws(() => parseServerProcessRegistry({ registryId: "server-processes", registryVersion: "v1", policies: [{ ...policy("synthetic", "synthetic-index", "atlas.semantic.extract", "background", "synthetic"), sourceBytes: "private" }] }), /unsupported field/);
  assert.throws(() => parseRegisteredProcessReference({ ...reference("semantic"), serviceClass: "interactive" }), /unsupported field/);
  const resolved = resolveRegisteredProcessPolicy(registry(), reference("semantic"), authorities);
  assert.equal(JSON.stringify(resolved).includes("queue"), false);
  assert.equal(JSON.stringify(resolved).includes("secret"), false);
});

test("RC-00505-09 preserves generic interactive reserve while consumers cannot forge a background process into interactive", () => {
  const serverRegistry = registry();
  const semantic = resolveRegisteredProcessPolicy(serverRegistry, reference("semantic"), authorities);
  const chat = resolveRegisteredProcessPolicy(serverRegistry, reference("chat"), authorities);
  const plan = planDesiredAdmissionProfile(capacity("shared"), [semantic, chat], workloads, { ...plannerPolicy, backgroundCaps: [] });
  assert.equal(semantic.serviceClass, "background");
  assert.equal(chat.serviceClass, "interactive");
  assert.deepEqual(plan.backgroundCapacity, { rpm: 70, tpm: 7_000, rpd: 700, concurrency: 7 });
  assert.throws(() => parseRegisteredProcessReference({ ...reference("semantic"), serviceClass: "interactive" }), /unsupported field/);
});
