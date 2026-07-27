#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  FixtureAtlasProvider,
  HttpAtlasProvider,
  AtlasProviderResultSchema,
} from "@company/ces-agent-provider-sdk";
import {
  ApprovedConceptSchema,
  projectApprovedModel,
  publishApprovedProjectModel,
} from "@company/ces-approved-project-model";
import { analyzeAtlasCandidates } from "@company/ces-atlas-extraction";
import { CoverageReportSchema } from "@company/ces-atlas-coverage";
import {
  AtlasQualityEvidenceInputSchema,
  calculateAtlasQualityEvidence,
} from "@company/ces-atlas-quality-evidence";
import {
  buildIntentGraph,
  compileAtlasCoreHandoff,
  renderIntentGraphJson,
  renderIntentGraphMarkdown,
  renderIntentGraphMermaid,
} from "@company/ces-atlas-intent-graph";
import {
  candidateRevisionHash,
  ClarificationAnswerSchema,
  compileAtlasReview,
} from "@company/ces-atlas-review";
import {
  SourceIndexSchema,
  sourceContentHash,
} from "@company/ces-document-ingestion";
import {
  ProjectIntentSchema,
  RequirementLinkSchema,
  ReviewDecisionSchema,
} from "@company/ces-greenfield-contracts";
import { ingestPdfDocument } from "@company/ces-pdf-ingestion";
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
  ProjectAssuranceContextSchema,
  parseProjectText,
  splitProjectContext,
} from "@company/ces-project-schema";
import { parseRequirementText } from "@company/ces-requirement-schema";
import { canonicalJson as collectionCanonicalJson } from "@company/ces-requirement-collection-schema";
import { SemanticCollectionSchema } from "@company/ces-semantic-record-schema";
import { z, ZodError } from "zod";

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
  ces atlas run --prd <file.md|file.pdf> --project-intent <json> --output <directory> (--provider-result <json> | --provider-endpoint <https-url> --provider <id> --model <id>)
  ces atlas analyze --prd <file.md|file.pdf> --project-intent <json> --output <directory> (--provider-result <json> | --provider-endpoint <https-url> --provider <id> --model <id>)
  ces atlas coverage --output <directory>
  ces atlas questions --output <directory>
  ces atlas approve --output <directory> --publication-input <json>
  ces atlas approve --output <directory> --decisions <json> --assurance <json> --baseline-version <version> [--links <json>]
  ces atlas graph --output <directory> [--format json|markdown|mermaid]
  ces atlas quality-report --input <redacted-mapping.json> [--output <report.json>]
  ces atlas resume --output <directory> --decisions <json> --assurance <json> --baseline-version <version> [--links <json>]
  ces atlas inspect --output <directory>
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
  7  Atlas paused for human review (resumable review artifacts are written)
  8  Atlas incomplete normative coverage
  9  Atlas unsupported or distorted candidate
  10 Atlas semantic conflict
  12 Atlas real-provider semantic quality gate failed
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
    if (command === "atlas") {
      return await runAtlasCommand(argv.slice(1), io);
    }
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

const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const AtlasReviewInputFileSchema = z.object({
  schema_version: z.literal("1.0.0"),
  analysis_revision_hash: Sha256Schema,
  candidates: z.array(z.object({
    candidate_id: z.string().trim().min(1),
    candidate_revision_hash: Sha256Schema,
    source_revision_hash: Sha256Schema,
  }).strict()),
  clarification_questions: z.array(z.unknown()),
}).strict();
const AtlasDecisionFileSchema = z.object({
  schema_version: z.literal("1.0.0"),
  decisions: z.array(ReviewDecisionSchema).min(1),
  clarification_answers: z.array(ClarificationAnswerSchema).default([]),
}).strict();

async function runAtlasCommand(
  args: readonly string[],
  io: CliIo,
): Promise<number> {
  const subcommand = args[0];
  if (!subcommand || subcommand === "help" || subcommand === "--help") {
    io.stdout(HELP);
    return 0;
  }
  const options = parseOptions(args.slice(1));
  if (subcommand === "run" || subcommand === "analyze") {
    return runAtlasExtraction(options, io);
  }
  if (subcommand === "approve" && options["publication-input"]) {
    return publishCanonicalAtlasModel(options, io);
  }
  if (subcommand === "resume" || subcommand === "approve") {
    return resumeAtlasRun(options, io);
  }
  if (subcommand === "coverage") {
    const outputDirectory = requireOption(options, "output");
    const report = CoverageReportSchema.parse(
      await readJsonValue(resolve(outputDirectory, "coverage-report.json")),
    );
    io.stdout(collectionCanonicalJson(report));
    return report.status === "success" ? 0
      : report.status === "incomplete_coverage" ? 8
      : report.status === "unsupported_candidate" ? 9
      : report.status === "conflict" ? 10 : 7;
  }
  if (subcommand === "questions") {
    const outputDirectory = requireOption(options, "output");
    io.stdout(await readFile(resolve(outputDirectory, "clarification-questions.json"), "utf8"));
    return 0;
  }
  if (subcommand === "graph") {
    const outputDirectory = requireOption(options, "output");
    const format = options.format ?? "json";
    const file = format === "json" ? "system-intent-graph.json"
      : format === "markdown" ? "system-intent-graph.md"
      : format === "mermaid" ? "system-intent-graph.mmd"
      : undefined;
    if (!file) throw new CliInputError("Atlas graph --format must be json, markdown, or mermaid");
    io.stdout(await readFile(resolve(outputDirectory, file), "utf8"));
    return 0;
  }
  if (subcommand === "quality-report") {
    const input = AtlasQualityEvidenceInputSchema.parse(
      await readJsonValue(requireOption(options, "input")),
    );
    const report = calculateAtlasQualityEvidence(input);
    const rendered = collectionCanonicalJson(report);
    if (options.output) await writeOutput(options.output, rendered);
    else io.stdout(rendered);
    return report.release_decision === "pass" ? 0
      : report.release_decision === "quality_gate_failed" ? 12 : 7;
  }
  if (subcommand === "inspect") {
    const outputDirectory = requireOption(options, "output");
    io.stdout(await readFile(resolve(outputDirectory, "run-manifest.json"), "utf8"));
    return 0;
  }
  throw new CliInputError(`Unknown Atlas command: ${subcommand}`);
}

const CanonicalPublicationInputSchema = z.object({
  schema_version: z.literal("1.0.0"),
  project_id: z.string(),
  source_revision_id: z.string(),
  source_content_hash: Sha256Schema,
  lexicon_revision_id: z.string(),
  lexicon_content_hash: Sha256Schema,
  concepts: z.array(ApprovedConceptSchema),
  semantic_collection: SemanticCollectionSchema,
  coverage_report: CoverageReportSchema,
  review: z.object({
    status: z.enum(["reviewed", "review_required", "clarification_required"]),
    source_revision_id: z.string(),
    lexicon_revision_id: z.string(),
    semantic_revision_id: z.string(),
    decision_hash: Sha256Schema,
    approved_by: z.array(z.string().trim().min(1)),
    approved_at: z.string(),
    reviewed_payloads: z.record(z.string(), z.record(z.string(), z.unknown())),
  }).strict(),
  projection_consumers: z.array(z.string()).default(["legacy-core"]),
}).strict();

async function publishCanonicalAtlasModel(
  options: Readonly<Record<string, string>>,
  io: CliIo,
): Promise<number> {
  const outputDirectory = requireOption(options, "output");
  const publicationInput = CanonicalPublicationInputSchema.parse(
    await readJsonValue(requireOption(options, "publication-input")),
  );
  const model = publishApprovedProjectModel(publicationInput);
  const projections = publicationInput.projection_consumers
    .map((consumer) => projectApprovedModel(model, consumer))
    .sort((left, right) => compareText(left.consumer, right.consumer));
  const retained = await retainedPendingArtifacts(outputDirectory);
  const manifestBase = {
    schema_version: "1.0.0",
    status: "completed",
    tool: CLI_PACKAGE_ID,
    pipeline: "dynamic-atlas-p0",
    project_model_id: model.id,
    project_model_hash: model.content_hash,
    source_revision_id: model.source_revision_id,
    lexicon_revision_id: model.lexicon_revision_id,
    semantic_revision_id: model.semantic_revision_id,
    coverage_hash: model.coverage_content_hash,
    review_decision_hash: model.review_decision_hash,
    projection_statuses: Object.fromEntries(
      projections.map(({ consumer, status }) => [consumer, status]),
    ),
  };
  const artifacts: Record<string, string> = {
    ...retained,
    "approved-project-model.json": collectionCanonicalJson(model),
    "coverage-report.json": collectionCanonicalJson(publicationInput.coverage_report),
    "semantic-collection.json": collectionCanonicalJson(publicationInput.semantic_collection),
    "run-manifest.json": collectionCanonicalJson({
      ...manifestBase,
      run_revision_hash: hashCanonical(manifestBase),
    }),
  };
  for (const projection of projections) {
    artifacts[`projections/${projection.consumer}.json`] =
      collectionCanonicalJson(projection);
  }
  await publishAtlasArtifacts(outputDirectory, artifacts);
  io.stdout(`ApprovedProjectModel written to ${outputDirectory}\n`);
  return 0;
}

async function runAtlasExtraction(
  options: Readonly<Record<string, string>>,
  io: CliIo,
): Promise<number> {
  rejectAtlasSecretArguments(options);
  const prdPath = requireOption(options, "prd");
  const intentPath = requireOption(options, "project-intent");
  const outputDirectory = requireOption(options, "output");
  const projectIntent = ProjectIntentSchema.parse(await readJsonValue(intentPath));
  const promptContractVersion = options["prompt-contract-version"] ?? "1.0.0";
  const provider = await atlasProvider(options);
  const documentId = options["document-id"] ?? "PRD-MAIN";
  const relativeInputPath = relative(".", resolve(prdPath)).replaceAll("\\", "/");
  const workspacePath = relativeInputPath.startsWith("../")
    ? `external/${basename(prdPath)}`
    : relativeInputPath;
  let pdfArtifact: string | undefined;
  let documents: Array<{ document_id: string; path: string; content: string }>;
  if (extname(prdPath).toLowerCase() === ".pdf") {
    const ingested = await ingestPdfDocument({
      document_id: documentId,
      path: workspacePath,
      bytes: await readFile(prdPath),
    });
    documents = [{
      document_id: ingested.normalized_document.document_id,
      path: ingested.normalized_document.path,
      content: ingested.normalized_document.content,
    }];
    pdfArtifact = collectionCanonicalJson({
      schema_version: ingested.schema_version,
      original: ingested.original,
      normalized_document: {
        document_id: ingested.normalized_document.document_id,
        path: ingested.normalized_document.path,
        content_hash: ingested.normalized_document.content_hash,
      },
      pages: ingested.pages,
      warnings: ingested.warnings,
      parser: ingested.parser,
    });
  } else if (extname(prdPath).toLowerCase() === ".md") {
    documents = [{
      document_id: documentId,
      path: workspacePath,
      content: await readFile(prdPath, "utf8"),
    }];
  } else {
    throw new CliInputError("Atlas PRD input must use .md or .pdf");
  }
  const extracted = await analyzeAtlasCandidates({
    documents,
    projectIntent,
    provider,
    promptContractVersion,
  });
  const analysisRevisionHash = hashCanonical(extracted.analysis);
  const reviewInput = AtlasReviewInputFileSchema.parse({
    schema_version: "1.0.0",
    analysis_revision_hash: analysisRevisionHash,
    candidates: [
      ...extracted.analysis.candidate_requirements,
      ...extracted.analysis.candidate_business_rules,
    ].map((candidate) => ({
      candidate_id: candidate.candidate_id,
      candidate_revision_hash: candidateRevisionHash(candidate),
      source_revision_hash: candidate.source.content_hash,
    })).sort((left, right) => compareText(left.candidate_id, right.candidate_id)),
    clarification_questions: extracted.analysis.clarification_questions,
  });
  const manifest = {
    schema_version: "1.0.0",
    status: "awaiting_human_review",
    tool: CLI_PACKAGE_ID,
    prompt_contract_version: promptContractVersion,
    provider: provider.metadata,
    project_intent_hash: hashCanonical(projectIntent),
    analysis_revision_hash: analysisRevisionHash,
    source_hashes: extracted.extraction_report.source_hashes,
  };
  const artifacts: Record<string, string> = {
    "run-manifest.json": collectionCanonicalJson({
      ...manifest,
      run_revision_hash: hashCanonical(manifest),
    }),
    "source-index.json": collectionCanonicalJson(extracted.source_index),
    "candidate-analysis.json": collectionCanonicalJson(extracted.analysis),
    "clarification-questions.json": collectionCanonicalJson(
      extracted.analysis.clarification_questions,
    ),
    "review-input.json": collectionCanonicalJson(reviewInput),
  };
  if (pdfArtifact) artifacts["pdf-ingestion.json"] = pdfArtifact;
  await publishAtlasArtifacts(outputDirectory, artifacts);
  io.stdout(`Atlas review artifacts written to ${outputDirectory}\n`);
  return 7;
}

async function resumeAtlasRun(
  options: Readonly<Record<string, string>>,
  io: CliIo,
): Promise<number> {
  const outputDirectory = requireOption(options, "output");
  const decisionsPath = requireOption(options, "decisions");
  const assurancePath = requireOption(options, "assurance");
  const baselineVersion = requireOption(options, "baseline-version");
  const analysis = AtlasProviderResultSchema.parse(
    await readJsonValue(resolve(outputDirectory, "candidate-analysis.json")),
  );
  const reviewInput = AtlasReviewInputFileSchema.parse(
    await readJsonValue(resolve(outputDirectory, "review-input.json")),
  );
  const pendingManifest = z.record(z.string(), z.unknown()).parse(
    await readJsonValue(resolve(outputDirectory, "run-manifest.json")),
  );
  const runRevisionHash = Sha256Schema.parse(pendingManifest.run_revision_hash);
  const { run_revision_hash: _storedRunRevision, ...runManifestHashInput } =
    pendingManifest;
  void _storedRunRevision;
  if (hashCanonical(runManifestHashInput) !== runRevisionHash) {
    throw new CliInputError("Atlas resume state is stale: run configuration revision changed");
  }
  const sourceIndex = SourceIndexSchema.parse(
    await readJsonValue(resolve(outputDirectory, "source-index.json")),
  );
  for (const document of sourceIndex.documents) {
    if (sourceContentHash(document.content) !== document.content_hash) {
      throw new CliInputError(
        `Atlas resume state is stale: source content changed for ${document.document_id}`,
      );
    }
  }
  const manifestSourceHashes = z.array(z.object({
    document_id: z.string(),
    content_hash: Sha256Schema,
  }).strict()).parse(pendingManifest.source_hashes);
  if (collectionCanonicalJson(manifestSourceHashes)
    !== collectionCanonicalJson(sourceIndex.documents.map(
      ({ document_id, content_hash }) => ({ document_id, content_hash }),
    ))) {
    throw new CliInputError("Atlas resume state is stale: source index revision changed");
  }
  if (hashCanonical(analysis) !== reviewInput.analysis_revision_hash) {
    throw new CliInputError("Atlas resume state is stale: candidate analysis revision changed");
  }
  if (pendingManifest.analysis_revision_hash !== reviewInput.analysis_revision_hash) {
    throw new CliInputError("Atlas resume state is stale: run configuration changed");
  }
  const decisionFile = AtlasDecisionFileSchema.parse(await readJsonValue(decisionsPath));
  const assurance = ProjectAssuranceContextSchema.parse(await readJsonValue(assurancePath));
  const review = compileAtlasReview({
    collection_id: options["collection-id"] ?? "ATLAS-REQUIREMENTS",
    analysis,
    decisions: decisionFile.decisions,
    clarification_answers: decisionFile.clarification_answers,
  });
  const handoff = compileAtlasCoreHandoff(review, assurance, baselineVersion);
  const links = options.links
    ? z.array(RequirementLinkSchema).parse(await readJsonValue(options.links))
    : [];
  const graph = buildIntentGraph({
    graph_id: options["graph-id"] ?? "ATLAS-SYSTEM-INTENT",
    review,
    links,
    uncertainties: analysis.uncertainties,
    core_handoff: handoff,
  });
  const previousArtifacts = await retainedPendingArtifacts(outputDirectory);
  const manifestBase = {
    schema_version: "1.0.0",
    status: "completed",
    tool: CLI_PACKAGE_ID,
    prompt_contract_version: pendingManifest.prompt_contract_version,
    provider: pendingManifest.provider,
    project_intent_hash: pendingManifest.project_intent_hash,
    source_hashes: pendingManifest.source_hashes,
    extraction_run_revision_hash:
      pendingManifest.extraction_run_revision_hash ?? pendingManifest.run_revision_hash,
    analysis_revision_hash: reviewInput.analysis_revision_hash,
    review_decision_hash: review.review_report.decision_hash,
    collection_revision_hash: review.collection.collection.revision_hash,
    graph_revision_hash: graph.graph.revision_hash,
    baseline_version: baselineVersion,
  };
  const artifacts: Record<string, string> = {
    ...previousArtifacts,
    "run-manifest.json": collectionCanonicalJson({
      ...manifestBase,
      run_revision_hash: hashCanonical(manifestBase),
    }),
    "review-report.json": collectionCanonicalJson(review.review_report),
    "requirement-collection.json": collectionCanonicalJson(review.collection),
    "system-intent-graph.json": renderIntentGraphJson(graph),
    "system-intent-graph.md": renderIntentGraphMarkdown(graph),
    "system-intent-graph.mmd": renderIntentGraphMermaid(graph),
    "core-handoff/summary.json": collectionCanonicalJson({
      requirement_ids: Object.keys(review.packages).sort(compareText),
      capabilities: handoff.capabilities,
    }),
  };
  for (const [logicalId, requirement] of Object.entries(review.packages)) {
    artifacts[`requirement-packages/${logicalId}.json`] =
      collectionCanonicalJson(requirement);
  }
  for (const [logicalId, manifest] of Object.entries(handoff.manifests)) {
    artifacts[`core-handoff/${logicalId}.policy-manifest.json`] =
      collectionCanonicalJson(manifest);
  }
  await publishAtlasArtifacts(outputDirectory, artifacts);
  io.stdout(`Approved Atlas artifacts written to ${outputDirectory}\n`);
  return 0;
}

async function atlasProvider(options: Readonly<Record<string, string>>) {
  if (options["provider-result"]) {
    if (options["provider-endpoint"]) {
      throw new CliInputError("Choose either --provider-result or --provider-endpoint");
    }
    return new FixtureAtlasProvider(
      await readJsonValue(options["provider-result"]),
      {
        provider: options.provider ?? "fixture",
        model: options.model ?? "deterministic-fixture",
      },
    );
  }
  const endpoint = requireOption(options, "provider-endpoint");
  const provider = requireOption(options, "provider");
  const model = requireOption(options, "model");
  return new HttpAtlasProvider({
    endpoint,
    provider,
    model,
    ...(process.env.CES_ATLAS_API_KEY
      ? { apiKey: process.env.CES_ATLAS_API_KEY }
      : {}),
  });
}

function rejectAtlasSecretArguments(options: Readonly<Record<string, string>>): void {
  for (const name of ["api-key", "token", "secret"]) {
    if (options[name]) {
      throw new CliInputError(
        `--${name} is forbidden; use the CES_ATLAS_API_KEY environment variable`,
      );
    }
  }
}

async function retainedPendingArtifacts(
  outputDirectory: string,
): Promise<Record<string, string>> {
  const retained: Record<string, string> = {};
  for (const path of [
    "source-index.json",
    "candidate-analysis.json",
    "clarification-questions.json",
    "review-input.json",
    "pdf-ingestion.json",
  ]) {
    const content = await readOptionalText(resolve(outputDirectory, path));
    if (content !== undefined) retained[path] = content;
  }
  return retained;
}

async function publishAtlasArtifacts(
  outputDirectory: string,
  artifacts: Readonly<Record<string, string>>,
): Promise<void> {
  const finalDirectory = resolve(outputDirectory);
  const parent = dirname(finalDirectory);
  const nonce = randomUUID();
  const staged = resolve(parent, `.${basename(finalDirectory)}.staging-${nonce}`);
  const backup = resolve(parent, `.${basename(finalDirectory)}.backup-${nonce}`);
  await mkdir(parent, { recursive: true });
  await mkdir(staged);
  try {
    for (const path of Object.keys(artifacts).sort(compareText)) {
      const target = resolve(staged, path);
      const boundary = relative(staged, target);
      if (boundary.startsWith("..") || resolve(target) === resolve(staged)) {
        throw new CliInputError(`Unsafe Atlas artifact path: ${path}`);
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, artifacts[path]!, "utf8");
    }
    const hadFinal = await pathExists(finalDirectory);
    if (hadFinal) await rename(finalDirectory, backup);
    try {
      await rename(staged, finalDirectory);
      if (hadFinal) await rm(backup, { recursive: true, force: true });
    } catch (error) {
      if (hadFinal && await pathExists(backup) && !await pathExists(finalDirectory)) {
        await rename(backup, finalDirectory);
      }
      throw error;
    }
  } finally {
    if (await pathExists(staged)) await rm(staged, { recursive: true, force: true });
  }
}

async function readJsonValue(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new CliInputError(`${path}: ${formatError(error)}`);
  }
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function hashCanonical(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(collectionCanonicalJson(value))
    .digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
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
