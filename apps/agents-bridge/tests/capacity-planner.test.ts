import assert from "node:assert/strict";
import test from "node:test";
import { parseProviderCapacityProfile } from "../src/capacity-catalogue.ts";
import { planDesiredAdmissionProfile, type PlannerPolicy } from "../src/capacity-planner.ts";
import { parseProviderProcessProfile, parseWorkloadEnvelopeProfile } from "../src/process-workload-catalogue.ts";

const capacity = (limits: unknown = { rpm: { state: "known", value: 100 }, tpm: { state: "known", value: 10_000 }, rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 10 } }) => parseProviderCapacityProfile({ quotaDomainId: "shared", profileVersion: "v1", nonSecretProviderAccountAlias: "account", activeKeyCount: 1, associatedRoutes: [{ routeId: "route", providerId: "anoman" }], limits, windowPolicies: { rpm: { policyId: "rpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { policyId: "tpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } }, rpd: { policyId: "rpd", policyVersion: "v1", source: "provider_docs", kind: "daily_calendar", parameters: { timeZone: "UTC", resetTime: "00:00" } } }, quotaAccountingPolicyId: "quota", capacitySource: "provider_docs", sourceRef: "docs", sourceVersion: "v1", observedAt: "2026-10-15T00:00:00.000Z", effectiveFrom: "2026-10-15T00:00:00.000Z" });
const workload = (id: string, tokens: number) => parseWorkloadEnvelopeProfile({ workloadId: id, profileVersion: "v1", active: true, compatibleProcessKinds: ["semantic", "chat"], structuralBound: { identity: id, version: "v1", maxRequestBytes: 10_000, maxInputTokens: tokens }, estimator: { identity: "estimate", version: "v1" }, quotaAccountingPolicyId: "quota", outputReservation: { policyId: "output", policyVersion: "v1", maxOutputTokens: 100 }, safetyPolicy: { policyId: "safety", policyVersion: "v1" } });
const process = (id: string, serviceClass: "interactive" | "background", workloadId: string, weight = 1) => parseProviderProcessProfile({ processId: id, profileVersion: "v1", processKind: serviceClass === "interactive" ? "chat" : "semantic", capability: serviceClass === "interactive" ? "atlas.chat.default" : "atlas.semantic.extract", serviceClass, fairnessScope: { kind: "global", identityVersion: "v1" }, allocationPolicy: { ...(serviceClass === "background" ? { background: { weight, mayBorrowIdleCapacity: true, capPolicyId: `${id}-cap` } } : {}), hardInteractiveProtection: { policyId: "reserve", policyVersion: "v1" } }, active: true, eligibleRouteIds: ["route"], workloadProfile: { workloadId, profileVersion: "v1" } });
const policy: PlannerPolicy = { plannerVersion: "planner-v1", effectiveFrom: "2026-10-15T00:00:00.000Z", headroomPolicy: { policyId: "headroom", policyVersion: "v1", reserve: { rpm: 10, tpm: 1_000, rpd: 100, concurrency: 1 } }, interactiveReserveTargets: [{ processId: "chat", profileVersion: "v1", serviceTargetId: "chat-slo", reserve: { rpm: 20, tpm: 2_000, rpd: 200, concurrency: 2 } }] };

test("planner is canonical, pure, and protects the interactive reserve from saturated background", () => {
  const processes = [process("semantic", "background", "semantic", 2), process("chat", "interactive", "chat")];
  const first = planDesiredAdmissionProfile(capacity(), processes, [workload("semantic", 4_000), workload("chat", 500)], policy);
  const second = planDesiredAdmissionProfile(capacity(), processes.slice().reverse(), [workload("chat", 500), workload("semantic", 4_000)], policy);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.usableGlobalCapacity, { rpm: 90, tpm: 9_000, rpd: 900, concurrency: 9 });
  assert.deepEqual(first.backgroundCapacity, { rpm: 70, tpm: 7_000, rpd: 700, concurrency: 7 });
  assert.equal(first.backgroundLanes[0]?.mayBorrowIdleCapacity, true);
  assert.equal(first.backgroundLanes[0]?.planningCost.tpm, 4_100);
});

test("planner fails closed for unknown, zero, headroom, reserve, and inferred concurrency cases", () => {
  const processes = [process("semantic", "background", "semantic"), process("chat", "interactive", "chat")];
  const workloads = [workload("semantic", 100), workload("chat", 100)];
  assert.throws(() => planDesiredAdmissionProfile(capacity({ rpm: { state: "known", value: 1 }, tpm: { state: "known", value: 1 }, rpd: { state: "known", value: 1 }, concurrency: { state: "unknown" } }), processes, workloads, policy), /unknown concurrency/);
  assert.throws(() => planDesiredAdmissionProfile(capacity({ rpm: { state: "zero" }, tpm: { state: "known", value: 1 }, rpd: { state: "known", value: 1 }, concurrency: { state: "known", value: 1 } }), processes, workloads, policy), /zero rpm/);
  assert.throws(() => planDesiredAdmissionProfile(capacity(), processes, workloads, { ...policy, headroomPolicy: { ...policy.headroomPolicy, reserve: { rpm: 101, tpm: 0, rpd: 0, concurrency: 0 } } }), /headroom oversubscribes rpm/);
  assert.throws(() => planDesiredAdmissionProfile(capacity(), processes, workloads, { ...policy, interactiveReserveTargets: [{ ...policy.interactiveReserveTargets[0]!, reserve: { rpm: 99, tpm: 0, rpd: 0, concurrency: 0 } }] }), /hard interactive reserve oversubscribes rpm/);
});

test("background planning costs preserve dominant resource differences and normalized weighted policy", () => {
  const processes = [process("request-heavy", "background", "request", 1), process("token-heavy", "background", "token", 3), process("chat", "interactive", "chat")];
  const plan = planDesiredAdmissionProfile(capacity(), processes, [workload("request", 100), workload("token", 8_000), workload("chat", 100)], policy);
  assert.deepEqual(plan.backgroundLanes.map((lane) => [lane.processId, lane.normalizedWeight, lane.planningCost.tpm]), [["request-heavy", 0.25, 200], ["token-heavy", 0.75, 8_100]]);
  assert.ok(plan.backgroundLanes[1]!.dominantResourceCost > plan.backgroundLanes[0]!.dominantResourceCost);
});
