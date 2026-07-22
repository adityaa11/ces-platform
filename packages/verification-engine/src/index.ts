import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { VerificationManifestSchema, type VerificationManifest } from "@company/ces-adapter-sdk";
import { PolicyManifestSchema, type PolicyManifest } from "@company/ces-policy-manifest";
import { z } from "zod";

export const VERIFICATION_REPORT_SCHEMA_VERSION = "1.0.0" as const;
const NonEmptyString = z.string().trim().min(1);
const CheckStatusSchema = z.enum([
  "passed",
  "failed",
  "not_applicable",
  "human_review_required",
  "unsupported",
  "blocked",
]);

export const VerificationConfigurationSchema = z
  .object({
    required_files: z.array(NonEmptyString).default([]),
    simple_patterns: z.array(z.object({ id: NonEmptyString, policy_id: NonEmptyString, pattern: NonEmptyString }).strict()).default([]),
    test_commands: z.array(z.object({ id: NonEmptyString, command: NonEmptyString, args: z.array(z.string()).default([]) }).strict()).default([]),
    gate_human_review: z.boolean().default(false),
  })
  .strict();

export const VerificationCheckResultSchema = z
  .object({
    check_id: NonEmptyString,
    policy_id: NonEmptyString.optional(),
    type: z.enum(["schema", "identity", "evidence", "required_file", "simple_pattern", "prohibited_pattern", "test_execution", "semantic_review", "adapter_support"]),
    status: CheckStatusSchema,
    message: NonEmptyString,
    files: z.array(NonEmptyString).default([]),
    command: z.array(z.string()).optional(),
    exit_code: z.number().int().nullable().optional(),
    stdout: z.string().optional(),
    stderr: z.string().optional(),
  })
  .strict();

export const VerificationReportSchema = z
  .object({
    schema_version: z.literal(VERIFICATION_REPORT_SCHEMA_VERSION),
    source_requirement_id: NonEmptyString,
    source_compilation_id: NonEmptyString,
    adapter: z.object({ id: NonEmptyString, version: NonEmptyString, mapping_version: NonEmptyString }).strict(),
    status: z.enum(["passed", "failed"]),
    exit_code: z.union([z.literal(0), z.literal(6)]),
    summary: z.object({ passed: z.number().int(), failed: z.number().int(), not_applicable: z.number().int(), human_review_required: z.number().int(), unsupported: z.number().int(), blocked: z.number().int() }).strict(),
    checks: z.array(VerificationCheckResultSchema),
  })
  .strict();

export interface AdapterVerificationRules {
  readonly prohibited_patterns?: readonly {
    readonly id: string;
    readonly policy_id: string;
    readonly pattern: string;
    readonly reason: string;
  }[];
  readonly semantic_review_policy_ids?: readonly string[];
  readonly supported?: boolean;
}

export type VerificationConfiguration = z.infer<typeof VerificationConfigurationSchema>;
export type VerificationReport = z.infer<typeof VerificationReportSchema>;
type CheckResult = z.infer<typeof VerificationCheckResultSchema>;

export async function verifyImplementation(input: {
  readonly verification_manifest: VerificationManifest;
  readonly policy_manifest: PolicyManifest;
  readonly project_root: string;
  readonly adapter_rules?: AdapterVerificationRules;
  readonly configuration?: VerificationConfiguration;
}): Promise<VerificationReport> {
  const verification = VerificationManifestSchema.parse(input.verification_manifest);
  const policy = PolicyManifestSchema.parse(input.policy_manifest);
  const configuration = VerificationConfigurationSchema.parse(input.configuration ?? {});
  const files = await collectFiles(input.project_root);
  const contents = await Promise.all(files.map(async (file) => [file, await readFile(resolve(input.project_root, file), "utf8")] as const));
  const checks: CheckResult[] = [
    result("SCHEMA-VALID", "schema", "passed", "Verification and Policy Manifests match their schemas"),
  ];

  checks.push(
    verification.source_compilation_id === policy.compilation_id &&
      verification.source_requirement_id === policy.requirement_id
      ? result("SOURCE-IDENTITY", "identity", "passed", "Generated manifest identity matches the source Policy Manifest")
      : result("SOURCE-IDENTITY", "identity", "failed", "Generated manifest identity does not match the source Policy Manifest"),
  );

  for (const obligation of policy.obligations.filter(({ resolution_state }) => resolution_state !== "resolved")) {
    checks.push(result(`POLICY-${obligation.policy_id}`, "adapter_support", "blocked", `Policy ${obligation.policy_id} is ${obligation.resolution_state}`, obligation.policy_id));
  }

  if (input.adapter_rules?.supported === false) {
    checks.push(result("ADAPTER-SUPPORT", "adapter_support", "unsupported", `No verification rules support adapter ${verification.adapter.id}`));
  }

  for (const check of verification.checks) {
    const marker = extractMarker(check.guidance);
    if (!marker) {
      checks.push(result(check.id, "evidence", "unsupported", `Unsupported verification guidance: ${check.guidance}`, check.source_policy_id));
      continue;
    }
    const references = contents.filter(([, content]) => content.includes(marker)).map(([file]) => file);
    checks.push(result(check.id, "evidence", references.length > 0 ? "passed" : "failed", references.length > 0 ? `Found ${marker} in real project files` : `Missing ${marker}`, check.source_policy_id, references));
  }

  for (const requiredFile of [...configuration.required_files].sort(compareText)) {
    const exists = files.includes(normalizePath(requiredFile));
    checks.push(result(`FILE-${requiredFile}`, "required_file", exists ? "passed" : "failed", exists ? `Found required file ${requiredFile}` : `Missing required file ${requiredFile}`, undefined, exists ? [requiredFile] : []));
  }

  for (const rule of [...configuration.simple_patterns].sort((left, right) => compareText(left.id, right.id))) {
    const expression = new RegExp(rule.pattern, "u");
    const references = contents.filter(([, content]) => expression.test(content)).map(([file]) => file);
    checks.push(result(rule.id, "simple_pattern", references.length > 0 ? "passed" : "failed", references.length > 0 ? `Required pattern found for ${rule.policy_id}` : `Required pattern missing for ${rule.policy_id}`, rule.policy_id, references));
  }

  for (const rule of [...(input.adapter_rules?.prohibited_patterns ?? [])].sort((left, right) => compareText(left.id, right.id))) {
    const expression = new RegExp(rule.pattern, "u");
    const references = contents.filter(([, content]) => expression.test(content)).map(([file]) => file);
    checks.push(result(rule.id, "prohibited_pattern", references.length === 0 ? "passed" : "failed", references.length === 0 ? rule.reason : `Prohibited pattern found: ${rule.reason}`, rule.policy_id, references));
  }

  for (const policyId of [...new Set(input.adapter_rules?.semantic_review_policy_ids ?? [])].sort(compareText)) {
    checks.push(result(`SEMANTIC-${policyId}`, "semantic_review", "human_review_required", `Semantic correctness for ${policyId} requires human review`, policyId));
  }

  if (configuration.test_commands.length === 0) {
    checks.push(result("TEST-EXECUTION", "test_execution", "not_applicable", "No test command is configured"));
  } else {
    for (const command of [...configuration.test_commands].sort((left, right) => compareText(left.id, right.id))) {
      checks.push(await runTestCommand(command, input.project_root));
    }
  }

  const normalizedChecks = checks.map((check) => VerificationCheckResultSchema.parse(check));
  const summary = Object.fromEntries(CheckStatusSchema.options.map((status) => [status, normalizedChecks.filter((check) => check.status === status).length])) as VerificationReport["summary"];
  const failed = summary.failed > 0 || summary.blocked > 0 || summary.unsupported > 0 || (configuration.gate_human_review && summary.human_review_required > 0);
  return VerificationReportSchema.parse({
    schema_version: VERIFICATION_REPORT_SCHEMA_VERSION,
    source_requirement_id: verification.source_requirement_id,
    source_compilation_id: verification.source_compilation_id,
    adapter: verification.adapter,
    status: failed ? "failed" : "passed",
    exit_code: failed ? 6 : 0,
    summary,
    checks: normalizedChecks,
  });
}

function result(check_id: string, type: CheckResult["type"], status: CheckResult["status"], message: string, policy_id?: string, files: readonly string[] = []): CheckResult {
  return VerificationCheckResultSchema.parse({ check_id, type, status, message, ...(policy_id ? { policy_id } : {}), files });
}

async function collectFiles(root: string): Promise<string[]> {
  const collected: string[] = [];
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
      if (entry.isDirectory() && [".git", "node_modules", "vendor"].includes(entry.name)) continue;
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) collected.push(normalizePath(relative(root, absolute)));
    }
  }
  await visit(resolve(root));
  return collected.sort(compareText);
}

function extractMarker(guidance: string): string | undefined {
  return guidance.match(/CES-EVIDENCE:[A-Z0-9_:-]+/u)?.[0];
}

async function runTestCommand(command: VerificationConfiguration["test_commands"][number], root: string): Promise<CheckResult> {
  return new Promise((resolveResult) => {
    const child = spawn(command.command, command.args, { cwd: root, shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => { stdout += data.toString("utf8"); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString("utf8"); });
    child.on("error", (error) => resolveResult(VerificationCheckResultSchema.parse({ check_id: command.id, type: "test_execution", status: "failed", message: `Test command failed to start: ${error.message}`, files: [], command: [command.command, ...command.args], exit_code: null, stdout, stderr })));
    child.on("close", (code) => resolveResult(VerificationCheckResultSchema.parse({ check_id: command.id, type: "test_execution", status: code === 0 ? "passed" : "failed", message: code === 0 ? "Configured test command passed" : `Configured test command exited with ${String(code)}`, files: [], command: [command.command, ...command.args], exit_code: code, stdout, stderr })));
  });
}

function normalizePath(path: string): string { return path.replaceAll("\\", "/"); }
function compareText(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
