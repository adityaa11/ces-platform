#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, compilePolicyManifest } from "@company/ces-policy-engine";
import { PolicyManifestSchema } from "@company/ces-policy-manifest";
import {
  compileImplementationArtifacts,
  type ImplementationCompilationResult,
} from "@company/ces-implementation-compiler";
import {
  VerificationManifestSchema,
  type AdapterDefinition,
} from "@company/ces-adapter-sdk";
import {
  VerificationConfigurationSchema,
  verifyImplementation,
  type AdapterVerificationRules,
} from "@company/ces-verification-engine";
import {
  parseProjectText,
  splitProjectContext,
} from "@company/ces-project-schema";
import { parseRequirementText } from "@company/ces-requirement-schema";
import { ZodError } from "zod";

export const CLI_PACKAGE_ID = "@company/ces-cli";

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

const HELP = `CES core CLI

Usage:
  ces validate-requirement --input <file> [--output <file>]
  ces validate-project --input <file> [--output <file>]
  ces resolve-policy --requirement <file> --project <file> --output <directory>
  ces compile-adapter --policy-manifest <file> --project <file> --output <directory> [--override-adapter <id>@<version>] [--test-mode true]
  ces compile --requirement <file> --project <file> --output <directory> [--override-adapter <id>@<version>] [--test-mode true]
  ces verify --manifest <verification-manifest.json> --project-root <directory>
  ces help

Inputs may be JSON (.json) or YAML (.yaml/.yml). Validation output is normalized JSON.
resolve-policy writes a stack-agnostic Policy Manifest and never loads an adapter.
compile uses the exact adapter ID and version pinned in the project. Diagnostic overrides must use --override-adapter <id>@<version>.

Exit codes:
  0  success
  2  input, argument, or schema error
  3  blocked obligation (diagnostic manifest is written)
  4  registry or policy conflict (diagnostic manifest is written)
  5  adapter gap (adapter-report.json is written; no partial adapter artifacts)
  6  verification failure (verification-report.json is written)
`;

export async function runCli(
  argv: readonly string[],
  io: CliIo = {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
): Promise<number> {
  const command = argv[0];
  if (!command || command === "help" || command === "--help" || command === "-h") {
    io.stdout(HELP);
    return 0;
  }

  try {
    const options = parseOptions(argv.slice(1));
    if (command === "validate-requirement") {
      const input = requireOption(options, "input");
      const requirement = await parseFile(input, parseRequirementText);
      const output = canonicalJson(requirement);
      if (options.output) await writeOutput(options.output, output);
      else io.stdout(output);
      return 0;
    }

    if (command === "validate-project") {
      const input = requireOption(options, "input");
      const project = await parseFile(input, parseProjectText);
      const output = canonicalJson(project);
      if (options.output) await writeOutput(options.output, output);
      else io.stdout(output);
      return 0;
    }

    if (command === "resolve-policy") {
      const requirementPath = requireOption(options, "requirement");
      const projectPath = requireOption(options, "project");
      const outputDirectory = requireOption(options, "output");
      const requirement = await parseFile(requirementPath, parseRequirementText);
      const project = await parseFile(projectPath, parseProjectText);
      const { assurance, ces } = splitProjectContext(project);
      const result = compilePolicyManifest({
        requirement,
        assurance,
        ces_baseline_version: ces.baseline_version,
      });
      await writeOutput(
        resolve(outputDirectory, "requirement-package.json"),
        canonicalJson(requirement),
      );
      await writeOutput(
        resolve(outputDirectory, "policy-manifest.json"),
        canonicalJson(result.manifest),
      );
      io.stdout(`Core artifacts written to ${outputDirectory}\n`);
      return result.exit_code;
    }

    if (command === "compile-adapter") {
      const manifestPath = requireOption(options, "policy-manifest");
      const projectPath = requireOption(options, "project");
      const outputDirectory = requireOption(options, "output");
      const manifest = await parseJsonFile(manifestPath, PolicyManifestSchema.parse);
      const project = await parseFile(projectPath, parseProjectText);
      const { technical, ces } = splitProjectContext(project);
      const selection = resolveAdapterSelection(options, ces.adapter);
      const adapter = await loadAdapter(selection.id, selection.version, options["test-mode"] === "true");
      const result = compileImplementationArtifacts({ manifest, technical, adapter });
      await writeCompilationResult(outputDirectory, result);
      return result.exit_code;
    }

    if (command === "compile") {
      const requirementPath = requireOption(options, "requirement");
      const projectPath = requireOption(options, "project");
      const outputDirectory = requireOption(options, "output");
      rejectLegacyAdapterOption(options);
      const requirement = await parseFile(requirementPath, parseRequirementText);
      const project = await parseFile(projectPath, parseProjectText);
      const { assurance, technical, ces } = splitProjectContext(project);
      const policy = compilePolicyManifest({
        requirement,
        assurance,
        ces_baseline_version: ces.baseline_version,
      });
      const coreDirectory = resolve(outputDirectory, "core");
      await writeOutput(
        resolve(coreDirectory, "requirement-package.json"),
        canonicalJson(requirement),
      );
      await writeOutput(
        resolve(coreDirectory, "policy-manifest.json"),
        canonicalJson(policy.manifest),
      );
      if (policy.exit_code !== 0) return policy.exit_code;
      const selection = resolveAdapterSelection(options, ces.adapter);
      const adapter = await loadAdapter(selection.id, selection.version, options["test-mode"] === "true");
      const result = compileImplementationArtifacts({
        manifest: policy.manifest,
        technical,
        adapter,
      });
      await writeCompilationResult(
        resolve(outputDirectory, "adapters", selection.id),
        result,
      );
      return result.exit_code;
    }

    if (command === "verify") {
      const manifestPath = requireOption(options, "manifest");
      const projectRoot = requireOption(options, "project-root");
      const verificationManifest = await parseJsonFile(
        manifestPath,
        VerificationManifestSchema.parse,
      );
      const policyManifest = await parseJsonFile(
        resolve(manifestPath, "..", "..", "..", "core", "policy-manifest.json"),
        PolicyManifestSchema.parse,
      );
      const configuration = await readVerificationConfiguration(projectRoot);
      const adapterRules = await loadVerificationRules(
        verificationManifest.adapter.id,
      );
      const report = await verifyImplementation({
        verification_manifest: verificationManifest,
        policy_manifest: policyManifest,
        project_root: projectRoot,
        adapter_rules: adapterRules,
        ...(configuration ? { configuration } : {}),
      });
      await writeOutput(
        resolve(manifestPath, "..", "verification-report.json"),
        canonicalJson(report),
      );
      return report.exit_code;
    }

    throw new CliInputError(`Unknown command: ${command}`);
  } catch (error) {
    io.stderr(`${formatError(error)}\n`);
    return 2;
  }
}

function parseOptions(args: readonly string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value || value.startsWith("--")) {
      throw new CliInputError(`Expected --option value, received: ${args.slice(index).join(" ")}`);
    }
    const name = flag.slice(2);
    if (options[name]) throw new CliInputError(`Duplicate option: --${name}`);
    options[name] = value;
  }
  return options;
}

function requireOption(options: Readonly<Record<string, string>>, name: string): string {
  const value = options[name];
  if (!value) throw new CliInputError(`Missing required option: --${name}`);
  return value;
}

function inputFormat(path: string): "json" | "yaml" {
  const extension = extname(path).toLowerCase();
  if (extension === ".json") return "json";
  if (extension === ".yaml" || extension === ".yml") return "yaml";
  throw new CliInputError(`Unsupported input format for ${path}; use .json, .yaml, or .yml`);
}

async function writeOutput(path: string, content: string): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, content, "utf8");
}

async function parseFile<T>(
  path: string,
  parser: (text: string, format: "json" | "yaml") => T,
): Promise<T> {
  try {
    return parser(await readFile(path, "utf8"), inputFormat(path));
  } catch (error) {
    throw new CliInputError(`${path}: ${formatError(error)}`);
  }
}

async function parseJsonFile<T>(
  path: string,
  parser: (value: unknown) => T,
): Promise<T> {
  try {
    return parser(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    throw new CliInputError(`${path}: ${formatError(error)}`);
  }
}

function rejectLegacyAdapterOption(options: Readonly<Record<string, string>>): void {
  if (options.adapter) {
    throw new CliInputError(
      "--adapter is not supported; configure ces.adapter in the project or use --override-adapter <id>@<version>",
    );
  }
}

function resolveAdapterSelection(
  options: Readonly<Record<string, string>>,
  configured: { readonly id: string; readonly version: string },
): { readonly id: string; readonly version: string } {
  rejectLegacyAdapterOption(options);
  const override = options["override-adapter"];
  if (!override) return configured;
  const separator = override.lastIndexOf("@");
  if (separator <= 0 || separator === override.length - 1) {
    throw new CliInputError("--override-adapter must use <id>@<version>");
  }
  return { id: override.slice(0, separator), version: override.slice(separator + 1) };
}

async function loadAdapter(id: string, version: string, testMode: boolean): Promise<AdapterDefinition> {
  if (id === "laravel" || id === "laravel-gap-fixture") {
    const { laravelAdapterRegistry } = await import("@company/ces-laravel-adapter");
    return laravelAdapterRegistry.get(id, version);
  }
  if (id === "test-fixture" || id === "test-fixture-with-gap") {
    const { testFixtureAdapterRegistry } = await import(
      "@company/ces-test-fixture-adapter"
    );
    return testFixtureAdapterRegistry.get(id, version, { test_mode: testMode });
  }
  throw new CliInputError(`Unknown adapter: ${id}@${version}`);
}

async function loadVerificationRules(id: string): Promise<AdapterVerificationRules> {
  if (id === "laravel" || id === "laravel-gap-fixture") {
    const { laravelProhibitedPatterns } = await import("@company/ces-laravel-adapter");
    return {
      prohibited_patterns: laravelProhibitedPatterns,
      semantic_review_policy_ids: [
        "ATOMIC_RESOURCE_REPLACEMENT",
        "REPLACED_RESOURCE_LIFECYCLE",
        "RESOURCE_LEVEL_AUTHORIZATION",
      ],
      supported: true,
    };
  }
  if (id === "test-fixture" || id === "test-fixture-with-gap") {
    return { supported: true, semantic_review_policy_ids: [] };
  }
  return { supported: false };
}

async function readVerificationConfiguration(projectRoot: string) {
  const path = resolve(projectRoot, ".ces", "verification.json");
  try {
    return VerificationConfigurationSchema.parse(
      JSON.parse(await readFile(path, "utf8")),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw new CliInputError(`${path}: ${formatError(error)}`);
  }
}

async function writeCompilationResult(
  outputDirectory: string,
  result: ImplementationCompilationResult,
): Promise<void> {
  if (!result.ok) {
    if (result.kind === "adapter_gap") {
      await writeOutput(
        resolve(outputDirectory, "adapter-report.json"),
        canonicalJson(result.report),
      );
    }
    return;
  }
  await writeOutput(
    resolve(outputDirectory, "implementation-plan.json"),
    canonicalJson(result.artifacts.implementation_plan),
  );
  await writeOutput(
    resolve(outputDirectory, "implementation-task.md"),
    result.artifacts.implementation_task,
  );
  await writeOutput(
    resolve(outputDirectory, "test-manifest.json"),
    canonicalJson(result.artifacts.test_manifest),
  );
  await writeOutput(
    resolve(outputDirectory, "verification-manifest.json"),
    canonicalJson(result.artifacts.verification_manifest),
  );
}

function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "<root>"}: ${issue.message}`)
      .join("\n");
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

class CliInputError extends Error {}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;
if (isMain) process.exitCode = await runCli(process.argv.slice(2));
