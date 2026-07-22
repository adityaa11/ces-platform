import type { ProjectContext } from "@company/ces-project-schema";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const INTEGRATION_CONTRACT_VERSION = "1.0.0" as const;
export const SUPPORTED_CES_BASELINES = ["0.1.0"] as const;

const NonEmptyString = z.string().trim().min(1);
const RelativeArtifactPath = NonEmptyString.refine(
  (path) => !path.startsWith("/") && !path.startsWith("\\") && !/^[A-Za-z]:[\\/]/u.test(path) && !path.split(/[\\/]/u).includes(".."),
  "Artifact paths must be relative and may not traverse the workspace",
);

export const CesLockSchema = z.object({
  schema_version: z.literal(INTEGRATION_CONTRACT_VERSION),
  ces: z.object({ commit: z.string().regex(/^[0-9a-f]{40}$/u) }).strict(),
  adapter: z.object({ id: NonEmptyString, version: NonEmptyString }).strict(),
}).strict();

export const ExecutionStatusSchema = z.enum([
  "success", "input_error", "execution_error", "blocked", "conflict", "adapter_gap",
]);
export const DiagnosticSourceSchema = z.enum([
  "phase_2_runner", "phase_1_exit_code", "policy_manifest", "adapter_report",
]);
export const DiagnosticSchema = z.object({
  code: z.string().regex(/^CES_[A-Z0-9_]+$/u),
  source: DiagnosticSourceSchema,
  severity: z.enum(["error", "warning", "info"]),
  message: NonEmptyString,
  policy_id: NonEmptyString.optional(),
  requirement_id: NonEmptyString.optional(),
  rule_id: NonEmptyString.optional(),
  field_path: NonEmptyString.optional(),
  adapter_id: NonEmptyString.optional(),
  details: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const ArtifactListingSchema = z.object({
  core: z.array(RelativeArtifactPath).min(1).optional(),
  adapter: z.array(RelativeArtifactPath).min(1).optional(),
}).strict();

const ReportBaseSchema = z.object({
  schema_version: z.literal(INTEGRATION_CONTRACT_VERSION),
  status: ExecutionStatusSchema,
  runner_exit_code: z.number().int().min(0).max(255),
  phase_1_exit_code: z.number().int().min(0).max(255).optional(),
  requirement_id: NonEmptyString.optional(),
  compilation_id: z.string().regex(/^sha256:[0-9a-f]{64}$/u).optional(),
  ces: z.object({ commit: z.string().regex(/^[0-9a-f]{40}$/u) }).strict().optional(),
  adapter: z.object({ id: NonEmptyString, version: NonEmptyString }).strict().optional(),
  artifacts: ArtifactListingSchema,
  diagnostics: z.array(DiagnosticSchema),
}).strict();

const PHASE_1_STATUS_BY_EXIT_CODE = {
  0: "success", 2: "input_error", 3: "blocked", 4: "conflict", 5: "adapter_gap",
} as const;

export const ExecutionReportSchema = ReportBaseSchema.superRefine((report, context) => {
  if (report.phase_1_exit_code !== undefined) {
    const expected = phase1Status(report.phase_1_exit_code);
    if (expected === undefined) context.addIssue({ code: "custom", path: ["phase_1_exit_code"], message: "Unsupported Phase 1 exit code" });
    else if (report.status !== expected) context.addIssue({ code: "custom", path: ["status"], message: `Phase 1 exit code ${report.phase_1_exit_code} requires status ${expected}` });
    if (report.runner_exit_code !== report.phase_1_exit_code) context.addIssue({ code: "custom", path: ["runner_exit_code"], message: "The runner must preserve an invoked Phase 1 exit code" });
  } else if (!["input_error", "execution_error"].includes(report.status)) {
    context.addIssue({ code: "custom", path: ["phase_1_exit_code"], message: "Completed Phase 1 outcomes require phase_1_exit_code" });
  }
  const adapterFiles = report.artifacts.adapter ?? [];
  if (["blocked", "conflict"].includes(report.status) && adapterFiles.length > 0) context.addIssue({ code: "custom", path: ["artifacts", "adapter"], message: "Blocked and conflict outcomes may not claim adapter artifacts" });
  if (report.status === "adapter_gap" && adapterFiles.some((path) => !path.endsWith("/adapter-report.json"))) context.addIssue({ code: "custom", path: ["artifacts", "adapter"], message: "Adapter-gap outcomes may claim only adapter-report.json" });
  if (report.phase_1_exit_code === undefined && ((report.artifacts.core?.length ?? 0) > 0 || adapterFiles.length > 0)) context.addIssue({ code: "custom", path: ["artifacts"], message: "Pre-invocation failures may publish only the execution report" });
});

export type CesLock = z.infer<typeof CesLockSchema>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type ExecutionReport = z.infer<typeof ReportBaseSchema>;

export function parseCesLockText(text: string): CesLock {
  return CesLockSchema.parse(parseYaml(text));
}

export function phase1Status(exitCode: number): ExecutionStatus | undefined {
  return PHASE_1_STATUS_BY_EXIT_CODE[exitCode as keyof typeof PHASE_1_STATUS_BY_EXIT_CODE];
}

export function validateVersionAgreement(
  lock: CesLock,
  project: ProjectContext,
  supportedBaselines: readonly string[] = SUPPORTED_CES_BASELINES,
): readonly string[] {
  const diagnostics: string[] = [];
  if (lock.adapter.id !== project.ces.adapter.id) diagnostics.push("CES_ADAPTER_ID_MISMATCH");
  if (lock.adapter.version !== project.ces.adapter.version) diagnostics.push("CES_ADAPTER_VERSION_MISMATCH");
  if (!supportedBaselines.includes(project.ces.baseline_version)) diagnostics.push("CES_BASELINE_UNSUPPORTED");
  return diagnostics;
}

export function readPinnedToolchain(packageManifest: unknown, nodeVersionFile: string): { node: string; pnpm: string } {
  const manifest = z.object({
    packageManager: z.string().regex(/^pnpm@[^\s@]+$/u),
    engines: z.object({ node: NonEmptyString, pnpm: NonEmptyString }).strict(),
  }).passthrough().parse(packageManifest);
  const node = nodeVersionFile.trim();
  if (node.length === 0 || manifest.engines.node !== node) throw new Error("Pinned checkout has inconsistent Node.js declarations");
  const pnpm = manifest.packageManager.slice("pnpm@".length);
  if (manifest.engines.pnpm !== pnpm) throw new Error("Pinned checkout has inconsistent pnpm declarations");
  return { node, pnpm };
}
