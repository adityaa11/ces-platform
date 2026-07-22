import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { VerificationManifest } from "@company/ces-adapter-sdk";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import { describe, expect, it } from "vitest";
import { verifyImplementation } from "./index.js";

const compilationId = `sha256:${"a".repeat(64)}`;
const policy: PolicyManifest = {
  schema_version: "1.0.0",
  compilation_id: compilationId,
  input_hash: `sha256:${"b".repeat(64)}`,
  requirement_id: "REQ-1",
  ces_baseline_version: "0.1.0",
  capability_registry_version: "0.1.0",
  trait_registry_version: "0.1.0",
  policy_registry_version: "0.1.0",
  policy_registry_hash: `sha256:${"c".repeat(64)}`,
  resolved_capabilities: [],
  resolved_traits: [],
  obligations: [],
};
const verification: VerificationManifest = {
  schema_version: "1.0.0",
  source_requirement_id: "REQ-1",
  source_compilation_id: compilationId,
  ces_baseline_version: "0.1.0",
  policy_registry_version: "0.1.0",
  adapter: { id: "fixture", version: "0.1.0", mapping_version: "0.1.0" },
  checks: [{
    id: "VERIFY-INPUT",
    source_policy_id: "INPUT_VALIDATION",
    mapping_id: "MAP-INPUT",
    mapping_version: "0.1.0",
    guidance: "Require source comment marker CES-EVIDENCE:INPUT_VALIDATION",
  }],
};

async function project(files: Readonly<Record<string, string>>): Promise<string> {
  const root = join(tmpdir(), `ces-verify-${crypto.randomUUID()}`);
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

describe("verification engine", () => {
  it("passes real evidence, required files, patterns, and configured tests", async () => {
    const root = await project({
      "src/Action.php": "// CES-EVIDENCE:INPUT_VALIDATION\nvalidated_boundary();",
      "tests/ActionTest.php": "test('input');",
    });
    const report = await verifyImplementation({
      verification_manifest: verification,
      policy_manifest: policy,
      project_root: root,
      configuration: {
        required_files: ["tests/ActionTest.php"],
        simple_patterns: [{ id: "PATTERN-1", policy_id: "INPUT_VALIDATION", pattern: "validated_boundary" }],
        test_commands: [{ id: "TESTS", command: process.execPath, args: ["-e", "process.exit(0)"] }],
        gate_human_review: false,
      },
    });
    expect(report).toMatchObject({ status: "passed", exit_code: 0 });
    expect(report.checks.find(({ check_id }) => check_id === "VERIFY-INPUT")?.files).toEqual(["src/Action.php"]);
  });

  it("fails missing evidence, prohibited patterns, and failed tests", async () => {
    const root = await project({ "src/Action.php": "dangerous_call();" });
    const report = await verifyImplementation({
      verification_manifest: verification,
      policy_manifest: policy,
      project_root: root,
      adapter_rules: { prohibited_patterns: [{ id: "NO-DANGER", policy_id: "SAFE_LOGGING", pattern: "dangerous_call", reason: "Dangerous call is prohibited" }] },
      configuration: {
        required_files: [], simple_patterns: [], gate_human_review: false,
        test_commands: [{ id: "TESTS", command: process.execPath, args: ["-e", "process.exit(7)"] }],
      },
    });
    expect(report).toMatchObject({ status: "failed", exit_code: 6 });
    expect(report.checks.filter(({ status }) => status === "failed").map(({ check_id }) => check_id)).toEqual(["VERIFY-INPUT", "NO-DANGER", "TESTS"]);
  });

  it("reports semantic review without failing by default", async () => {
    const root = await project({ "Action.php": "// CES-EVIDENCE:INPUT_VALIDATION" });
    const report = await verifyImplementation({
      verification_manifest: verification,
      policy_manifest: policy,
      project_root: root,
      adapter_rules: { semantic_review_policy_ids: ["RESOURCE_LEVEL_AUTHORIZATION", "ATOMIC_RESOURCE_REPLACEMENT"] },
    });
    expect(report).toMatchObject({ status: "passed", exit_code: 0, summary: { human_review_required: 2 } });
  });

  it("gates semantic review when assurance configuration requires it", async () => {
    const root = await project({ "Action.php": "// CES-EVIDENCE:INPUT_VALIDATION" });
    const report = await verifyImplementation({
      verification_manifest: verification,
      policy_manifest: policy,
      project_root: root,
      adapter_rules: { semantic_review_policy_ids: ["RESOURCE_LEVEL_AUTHORIZATION"] },
      configuration: { required_files: [], simple_patterns: [], test_commands: [], gate_human_review: true },
    });
    expect(report).toMatchObject({ status: "failed", exit_code: 6, summary: { human_review_required: 1 } });
  });
});
