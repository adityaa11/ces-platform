import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseProviderCapacityProfile } from "../src/capacity-catalogue.ts";
import { CapacityPlannerError, planEffectiveDesiredAdmissionProfile, planDesiredAdmissionProfile, type PlannerPolicy } from "../src/capacity-planner.ts";
import { parseProviderProcessProfile, parseWorkloadEnvelopeProfile } from "../src/process-workload-catalogue.ts";

const capacity = (limits: unknown, profileVersion = "v1") => parseProviderCapacityProfile({
  quotaDomainId: "weighted-domain", profileVersion, nonSecretProviderAccountAlias: "weighted-fixture", activeKeyCount: 1,
  associatedRoutes: [{ routeId: "weighted-route", providerId: "fixture" }], limits,
  windowPolicies: {
    rpm: { policyId: "rpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } },
    tpm: { policyId: "tpm", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } },
    rpd: { policyId: "rpd", policyVersion: "v1", source: "provider_docs", kind: "unknown" },
  }, capacitySource: "provider_docs", sourceRef: "fixture://weighted", sourceVersion: "v1",
  observedAt: "2026-10-23T00:00:00.000Z", effectiveFrom: "2026-10-23T00:00:00.000Z",
});

const workload = (id: string, kind: "semantic" | "reconciliation" | "chat") => parseWorkloadEnvelopeProfile({
  workloadId: id, profileVersion: "v1", active: true, compatibleProcessKinds: [kind],
  structuralBound: { identity: `${id}-bound`, version: "v1", maxRequestBytes: 10_000, maxInputTokens: 100 },
  estimator: { identity: `${id}-estimator`, version: "v1" },
  outputReservation: { policyId: `${id}-output`, policyVersion: "v1", maxOutputTokens: 100 },
  safetyPolicy: { policyId: `${id}-safety`, policyVersion: "v1" },
});

const process = (id: string, serviceClass: "background" | "interactive", weight: number) => parseProviderProcessProfile({
  processId: id, profileVersion: "v1", processKind: serviceClass === "interactive" ? "chat" : id === "reconciliation" ? "reconciliation" : "semantic",
  capability: serviceClass === "interactive" ? "atlas.chat.default" : "atlas.semantic.extract", serviceClass,
  fairnessScope: { kind: "global", identityVersion: "v1" },
  allocationPolicy: {
    ...(serviceClass === "background" ? { background: { weight, mayBorrowIdleCapacity: true, capPolicyId: `${id}-cap` } } : { interactive: { weight } }),
    hardInteractiveProtection: { policyId: "interactive-protection", policyVersion: "v1" },
  },
  active: true, eligibleRouteIds: ["weighted-route"], workloadProfile: { workloadId: id, profileVersion: "v1" },
});

const classPolicy = {
  apiVersion: "ClassAllocationPolicy/v1", policyId: "weighted-class-allocation", policyVersion: "v1", effectiveFrom: "2026-10-23T00:00:00.000Z",
  headroomBps: 1000, interactiveBps: 2000, backgroundBps: 7000,
} as const;

const planner = (caps: PlannerPolicy["backgroundCaps"] = []): PlannerPolicy => ({
  plannerVersion: "planner-v2", effectiveFrom: "2026-10-23T00:00:00.000Z", classAllocationPolicy: classPolicy,
  headroomPolicy: { policyId: "legacy-headroom", policyVersion: "v1", reserve: { rpm: 1, tpm: 1, rpd: 0, concurrency: 1 } },
  interactiveReserveTargets: [{ processId: "interactive", profileVersion: "v1", serviceTargetId: "interactive-slo", reserve: { rpm: 1, tpm: 1, rpd: 0, concurrency: 1 } }],
  backgroundCaps: caps,
});

test("RC-01401-01/02: class totals and per-process integer baselines are deterministic, exact, and immutable", () => {
  const processes = [process("semantic", "background", 3), process("reconciliation", "background", 1), process("interactive", "interactive", 1)];
  const workloads = [workload("semantic", "semantic"), workload("reconciliation", "reconciliation"), workload("interactive", "chat")];
  const profile = capacity({ rpm: { state: "known", value: 5_000 }, tpm: { state: "known", value: 2_000_000 }, rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 40 } });
  const first = planDesiredAdmissionProfile(profile, processes, workloads, planner()).calculatedClassProcessAllocation!;
  const second = planDesiredAdmissionProfile(profile, processes.slice().reverse(), workloads.slice().reverse(), planner()).calculatedClassProcessAllocation!;
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.classTotals, {
    headroom: { rpm: 500, tpm: 200_000, rpd: 100, concurrency: 4 },
    interactive: { rpm: 1_000, tpm: 400_000, rpd: 200, concurrency: 8 },
    background: { rpm: 3_500, tpm: 1_400_000, rpd: 700, concurrency: 28 },
  });
  assert.deepEqual(first.processes.map(({ processId, normalizedWeight, baseline }) => ({ processId, normalizedWeight, baseline })), [
    { processId: "interactive", normalizedWeight: { numerator: 1, denominator: 1 }, baseline: { rpm: 1_000, tpm: 400_000, rpd: 200, concurrency: 8 } },
    { processId: "reconciliation", normalizedWeight: { numerator: 1, denominator: 4 }, baseline: { rpm: 875, tpm: 350_000, rpd: 175, concurrency: 7 } },
    { processId: "semantic", normalizedWeight: { numerator: 3, denominator: 4 }, baseline: { rpm: 2_625, tpm: 1_050_000, rpd: 525, concurrency: 21 } },
  ]);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.processes));
  assert.throws(() => { (first.classTotals.background as Record<string, number>).rpm = 0; }, TypeError);
});

test("RC-01401-02/05: canonical largest remainder, typed unfit, and a hard cap never redistribute", () => {
  const workloads = [workload("alpha", "semantic"), workload("beta", "semantic"), workload("interactive", "chat")];
  const tied = [process("beta", "background", 1), process("alpha", "background", 1), process("interactive", "interactive", 1)];
  const small = capacity({ rpm: { state: "known", value: 3 }, tpm: { state: "known", value: 3 }, rpd: { state: "known", value: 3 }, concurrency: { state: "known", value: 3 } });
  const tiedAllocation = planDesiredAdmissionProfile(small, tied, workloads, planner()).calculatedClassProcessAllocation!;
  assert.deepEqual(tiedAllocation.processes.filter((entry) => entry.serviceClass === "background").map((entry) => [entry.processId, entry.baseline.rpm, entry.status]), [["alpha", 1, "qualified"], ["beta", 0, "unfit"]]);

  const large = capacity({ rpm: { state: "known", value: 5_000 }, tpm: { state: "known", value: 2_000_000 }, rpd: { state: "known", value: 1_000 }, concurrency: { state: "known", value: 40 } });
  const capped = planDesiredAdmissionProfile(large, [process("semantic", "background", 3), process("reconciliation", "background", 1), process("interactive", "interactive", 1)], [workload("semantic", "semantic"), workload("reconciliation", "reconciliation"), workload("interactive", "chat")], planner([{ processId: "semantic", profileVersion: "v1", cap: { rpm: 100, tpm: 100_000, rpd: 100, concurrency: 1 } }])).calculatedClassProcessAllocation!;
  assert.deepEqual(capped.processes.find((entry) => entry.processId === "semantic")!.baseline, { rpm: 100, tpm: 100_000, rpd: 100, concurrency: 1 });
  assert.deepEqual(capped.unallocatedRemainder, { rpm: 2_525, tpm: 950_000, rpd: 425, concurrency: 20 });
  assert.equal(capped.processes.find((entry) => entry.processId === "reconciliation")!.baseline.rpm, 875);
});

test("RC-01401-03: authorized Anoman unknown RPD is excluded; malformed exclusions fail closed", () => {
  const anoman = capacity({ rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40_000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } }, "anoman-v1");
  const effective = {
    apiVersion: "EffectiveEnforcementPolicy/v1" as const, quotaDomainId: "weighted-domain", providerCapacityProfileVersion: "anoman-v1", routeId: "weighted-route", policyId: "capacity-dimension-enforcement", policyVersion: "anoman-v1", effectiveFrom: "2026-10-23T00:00:00.000Z",
    dimensions: {
      rpm: { mode: "enforced" as const, providerState: "known" as const, limit: 20 }, tpm: { mode: "enforced" as const, providerState: "known" as const, limit: 40_000 },
      rpd: { mode: "not_enforced" as const, providerState: "unknown" as const, approvalRef: "anoman-rpd-not-published-approval-2026-10-18" }, concurrency: { mode: "enforced" as const, providerState: "known" as const, limit: 25 },
    },
  };
  const result = planEffectiveDesiredAdmissionProfile(anoman, [process("semantic", "background", 1), process("interactive", "interactive", 1)], [workload("semantic", "semantic"), workload("interactive", "chat")], planner(), effective).calculatedClassProcessAllocation!;
  assert.deepEqual(result.effectiveDimensions, ["rpm", "tpm", "concurrency"]);
  assert.deepEqual(result.classTotals, { headroom: { rpm: 2, tpm: 4_000, concurrency: 3 }, interactive: { rpm: 4, tpm: 8_000, concurrency: 5 }, background: { rpm: 14, tpm: 28_000, concurrency: 17 } });
  assert.ok(!("rpd" in result.classTotals.background));
  assert.throws(() => planEffectiveDesiredAdmissionProfile(anoman, [process("semantic", "background", 1), process("interactive", "interactive", 1)], [workload("semantic", "semantic"), workload("interactive", "chat")], planner(), { ...effective, dimensions: { ...effective.dimensions, rpd: { mode: "not_enforced", providerState: "unknown" } } } as any), CapacityPlannerError);
});

test("RC-01401-06: the weighted allocator remains a static pure-planning boundary", () => {
  const source = readFileSync(new URL("../src/capacity-planner.ts", import.meta.url), "utf8");
  assert.deepEqual([...source.matchAll(/^import .* from "(.*)";/gmu)].map((match) => match[1]), ["./capacity-catalogue.js", "./process-workload-catalogue.js"]);
  assert.doesNotMatch(source, /postgres|fetch\(|createJob|providerClient|requestBody/iu);
});
