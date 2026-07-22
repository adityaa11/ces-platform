import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseProjectText } from "@company/ces-project-schema";
import { CesLockSchema, ExecutionReportSchema, parseCesLockText, phase1Status, readPinnedToolchain, validateVersionAgreement } from "./index.js";

const commit = "0123456789abcdef0123456789abcdef01234567";
const lock = { schema_version: "1.0.0", ces: { commit }, adapter: { id: "example", version: "0.1.0" } } as const;
const project = parseProjectText(`
schema_version: 1.0.0
project: { id: example, name: Example }
assurance: { exposure: private_network, criticality: standard }
technical: { language: example, framework: example }
ces:
  baseline_version: 0.1.0
  adapter: { id: example, version: 0.1.0 }
`, "yaml");

describe("Phase 2 integration contracts", () => {
  it("accepts only an exact lowercase 40-character commit and exact lock fields", () => {
    expect(CesLockSchema.parse(lock).ces.commit).toBe(commit);
    for (const invalid of [commit.slice(0, 39), commit.toUpperCase(), "main", `${commit}0`]) {
      expect(() => CesLockSchema.parse({ ...lock, ces: { commit: invalid } })).toThrow();
    }
    expect(() => CesLockSchema.parse({ ...lock, repository: "https://unapproved.invalid" })).toThrow();
  });

  it("maps every approved Phase 1 exit code", () => {
    expect([0, 2, 3, 4, 5].map(phase1Status)).toEqual(["success", "input_error", "blocked", "conflict", "adapter_gap"]);
    expect(phase1Status(6)).toBeUndefined();
  });

  it("enforces conditional exit codes and outcome-specific artifacts", () => {
    const base = { schema_version: "1.0.0", artifacts: {}, diagnostics: [] };
    expect(ExecutionReportSchema.parse({ ...base, status: "execution_error", runner_exit_code: 1 })).not.toHaveProperty("phase_1_exit_code");
    expect(() => ExecutionReportSchema.parse({ ...base, status: "blocked", runner_exit_code: 3 })).toThrow();
    expect(() => ExecutionReportSchema.parse({ ...base, status: "blocked", runner_exit_code: 3, phase_1_exit_code: 3, artifacts: { adapter: ["adapters/example/implementation-plan.json"] } })).toThrow();
    expect(ExecutionReportSchema.parse({ ...base, status: "input_error", runner_exit_code: 2, phase_1_exit_code: 2, artifacts: { core: ["core/policy-manifest.json"] } })).toBeTruthy();
    expect(() => ExecutionReportSchema.parse({ ...base, status: "success", runner_exit_code: 0, phase_1_exit_code: 0, artifacts: { core: ["C:\\temp\\result.json"] } })).toThrow();
  });

  it("checks adapter agreement and supported baselines", () => {
    expect(validateVersionAgreement(lock, project)).toEqual([]);
    expect(validateVersionAgreement({ ...lock, adapter: { id: "other", version: "9" } }, project, ["2.0.0"]))
      .toEqual(["CES_ADAPTER_ID_MISMATCH", "CES_ADAPTER_VERSION_MISMATCH", "CES_BASELINE_UNSUPPORTED"]);
  });

  it("discovers exact mutually consistent toolchain requirements from the checkout", () => {
    expect(readPinnedToolchain({ packageManager: "pnpm@11.15.1", engines: { node: "24.12.0", pnpm: "11.15.1" } }, "24.12.0\n"))
      .toEqual({ node: "24.12.0", pnpm: "11.15.1" });
    expect(() => readPinnedToolchain({ packageManager: "pnpm@11.15.0", engines: { node: "24.12.0", pnpm: "11.15.1" } }, "24.12.0")).toThrow();
  });

  it("keeps the published contract fixtures executable", () => {
    const fixtureRoot = "docs/contracts/phase-2/v1.0.0/fixtures";
    expect(parseCesLockText(readFileSync(`${fixtureRoot}/ces-lock.valid.yaml`, "utf8"))).toBeTruthy();
    expect(() => parseCesLockText(readFileSync(`${fixtureRoot}/ces-lock.invalid.yaml`, "utf8"))).toThrow();
    const reports = JSON.parse(readFileSync(`${fixtureRoot}/execution-reports.json`, "utf8")) as unknown[];
    expect(reports.map((report) => ExecutionReportSchema.parse(report).status))
      .toEqual(["success", "input_error", "execution_error", "blocked", "conflict", "adapter_gap"]);
  });
});
