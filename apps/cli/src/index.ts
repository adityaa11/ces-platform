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
import {
  calculateAtomicClaimCoverage,
  calculatePipelineCoverage,
  CoverageReportSchema,
  createAtomicClaimRetryScope,
  createAtomicClaims,
  createCompletenessCriticReport,
  decomposeAtomicClaims,
} from "@company/ces-atlas-coverage";
import {
  createAtlasCandidateInventory,
  AtlasCandidateSchema,
  AtlasCandidateInventorySchema,
  createCategoryExtractorRegistry,
  CategoryExtractorRegistrySchema,
  createSectionPurposeRegistry,
  CanonicalCandidateExtractionOutputSchema,
  finalizeSectionClassifications,
  SectionClassifierOutputSchema,
} from "@company/ces-atlas-role-contracts";
import {
  AtlasQualityEvidenceInputSchema,
  calculateAtlasQualityEvidence,
} from "@company/ces-atlas-quality-evidence";
import {
  buildIntentGraph,
  compileAtlasCoreHandoff,
  createFocusedAtlasProjections,
  createIntegratedSemanticGraphProjection,
  renderIntentGraphJson,
  renderIntentGraphMarkdown,
  renderIntentGraphMermaid,
  projectProposedWorkflowGraph,
  renderWorkflowGraphJson,
  renderWorkflowGraphMarkdown,
  renderWorkflowGraphMermaid,
  renderFocusedWorkflowMermaid,
  renderProjectOverviewMermaid,
} from "@company/ces-atlas-intent-graph";
import {
  candidateRevisionHash,
  ClarificationAnswerSchema,
  compileAtlasReview,
} from "@company/ces-atlas-review";
import {
  SourceIndexSchema,
  ingestMarkdownDocuments,
  sourceContentHash,
} from "@company/ces-document-ingestion";
import {
  ProjectIntentSchema,
  RequirementLinkSchema,
  ReviewDecisionSchema,
} from "@company/ces-greenfield-contracts";
import { ingestPdfDocument } from "@company/ces-pdf-ingestion";
import {
  assessSupportedModelKinds,
  calculateExpandedApprovalEligibility,
  createCanonicalRecordIdentity,
  createProposedProjectModel,
  createRecordIdentityReport,
  GovernedWorkflowEdgeSchema,
} from "@company/ces-proposed-project-model";
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
import {
  createMultilingualStatement,
  createSemanticKindRegistry,
  createTerminologyProposal,
  SemanticKindRegistrySchema,
  SemanticCollectionSchema,
} from "@company/ces-semantic-record-schema";
import { buildSourceArtifacts } from "@company/ces-source-unit-schema";
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
    const approvedFile = format === "json" ? "system-intent-graph.json"
      : format === "markdown" ? "system-intent-graph.md"
      : format === "mermaid" ? "system-intent-graph.mmd"
      : undefined;
    if (!approvedFile) throw new CliInputError("Atlas graph --format must be json, markdown, or mermaid");
    const proposedFile = approvedFile.replace(
      "system-intent-graph",
      "proposed-system-intent-graph",
    );
    const file = await pathExists(resolve(outputDirectory, approvedFile))
      ? approvedFile : proposedFile;
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
  const sectionClassification = await classifyAtlasSections({
    options, documents, projectIntent, promptContractVersion,
  });
  const canonicalExtraction = await extractCanonicalAtlasCandidates({
    options,
    documents,
    projectIntent,
    promptContractVersion,
    sectionClassification,
    ...(options["provider-result"] ? {
      legacyFixture: AtlasProviderResultSchema.parse(
        await readJsonValue(options["provider-result"]),
      ),
    } : {}),
    providerMetadata: provider.metadata,
  });
  const extracted = projectCanonicalCandidatesToLegacy({
    documents,
    promptContractVersion,
    providerMetadata: provider.metadata,
    canonicalExtraction,
    ...(canonicalExtraction.legacyFixture
      ? { legacyFixture: canonicalExtraction.legacyFixture } : {}),
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
  const proposedArtifacts = buildCanonicalProposedAtlasArtifacts({
    canonicalExtraction,
    documents,
    projectIntent,
    sourceHashes: extracted.extraction_report.source_hashes,
    promptContractVersion,
    provider: provider.metadata,
  });
  const manifest = {
    schema_version: "1.0.0",
    status: "awaiting_human_review",
    tool: CLI_PACKAGE_ID,
    prompt_contract_version: promptContractVersion,
    provider: provider.metadata,
    project_intent_hash: hashCanonical(projectIntent),
    analysis_revision_hash: analysisRevisionHash,
    canonical_candidate_inventory_hash: canonicalExtraction.inventory.content_hash,
    section_classification_hash: sectionClassification.output.content_hash,
    extractor_ledger_hash: hashCanonical(canonicalExtraction.ledger),
    source_hashes: extracted.extraction_report.source_hashes,
  };
  const artifacts: Record<string, string> = {
    ...proposedArtifacts,
    "section-purpose-registry.json":
      collectionCanonicalJson(sectionClassification.registry),
    "section-classifications.json":
      collectionCanonicalJson(sectionClassification.output),
    "document-structure.json":
      collectionCanonicalJson(sectionClassification.documentStructures),
    "candidate-inventory.json":
      collectionCanonicalJson(canonicalExtraction.inventory),
    "extractor-ledger.json":
      collectionCanonicalJson(canonicalExtraction.ledger),
    "candidate-merge-report.json":
      collectionCanonicalJson(canonicalExtraction.mergeReport),
    "legacy-projection-losses.json":
      collectionCanonicalJson(extracted.projectionLosses),
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

async function classifyAtlasSections(input: {
  readonly options: Readonly<Record<string, string>>;
  readonly documents: readonly { document_id: string; path: string; content: string }[];
  readonly projectIntent: z.infer<typeof ProjectIntentSchema>;
  readonly promptContractVersion: string;
}) {
  const registry = createSectionPurposeRegistry();
  const sourceArtifacts = input.documents.map((document) => buildSourceArtifacts({
    document_id: stableId(document.document_id),
    path: document.path,
    content: document.content,
    paragraph_mode: document.path.toLowerCase().endsWith(".pdf") ? "line" : "contiguous",
  }));
  const units = sourceArtifacts.flatMap(({ source_units }) => source_units).map((unit) => ({
    id: unit.id,
    order: unit.order,
    section_path: unit.section_path,
    kind: unit.kind,
    text: unit.text,
    content_hash: unit.content_hash,
  }));
  const sourceHash = hashCanonical(input.documents.map(({ document_id, content }) => ({
    document_id, content_hash: sourceContentHash(content),
  })));
  const projectId = stableId(input.projectIntent.project.id);
  const classifierInput = {
    contract_version: "1.0.0" as const,
    revisions: {
      source_revision_id: `${projectId}.rev.${sourceHash.slice(7, 19)}`,
      source_content_hash: sourceHash,
      lexicon_revision_id: `${projectId}.lexicon.default`,
      lexicon_content_hash: hashCanonical({ state: "default" }),
      lexicon_state: "candidate_pinned" as const,
      semantic_schema_version: "1.0.0",
      prompt_contract_version: input.promptContractVersion,
    },
    purpose_registry: registry,
    source_units: units,
  };
  if (input.options["section-classifications"]) {
    return {
      registry,
      documentStructures: sourceArtifacts.map(({ document_structure }) => document_structure),
      output: SectionClassifierOutputSchema.parse(
        await readJsonValue(input.options["section-classifications"]),
      ),
    };
  }
  if (input.options["provider-result"]) {
    return {
      registry,
      documentStructures: sourceArtifacts.map(({ document_structure }) => document_structure),
      output: finalizeSectionClassifications(classifierInput, units.map((unit) => ({
        source_unit_id: unit.id,
        purpose_ids: ["ces.section.unknown"],
        disposition: unit.kind === "heading" ? "structural" : "normative",
        confidence: 0,
        status: "unknown",
        rationale: "Provider fixture supplied no structure-classifier result.",
      }))),
    };
  }
  const configuredEndpoint = requireOption(input.options, "provider-endpoint");
  const endpoint = new URL(configuredEndpoint);
  endpoint.pathname = "/v1/agents/atlas.structure-classifier/execute";
  endpoint.search = "";
  const apiKey = process.env.CES_ATLAS_API_KEY ?? process.env.AGENTS_BRIDGE_API_KEY;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      agent_version: "1.0.0",
      input: classifierInput,
    }),
  });
  if (!response.ok) {
    throw new CliInputError(`Atlas structure classifier failed with status ${response.status}`);
  }
  return {
    registry,
    documentStructures: sourceArtifacts.map(({ document_structure }) => document_structure),
    output: SectionClassifierOutputSchema.parse(await response.json()),
  };
}

async function extractCanonicalAtlasCandidates(input: {
  readonly options: Readonly<Record<string, string>>;
  readonly documents: readonly { document_id: string; path: string; content: string }[];
  readonly projectIntent: z.infer<typeof ProjectIntentSchema>;
  readonly promptContractVersion: string;
  readonly sectionClassification: Awaited<ReturnType<typeof classifyAtlasSections>>;
  readonly legacyFixture?: z.infer<typeof AtlasProviderResultSchema>;
  readonly providerMetadata: { readonly provider: string; readonly model: string };
}) {
  const semanticRegistry = input.options["semantic-kind-registry"]
    ? SemanticKindRegistrySchema.parse(
      await readJsonValue(input.options["semantic-kind-registry"]),
    )
    : createSemanticKindRegistry();
  const extractorRegistry = input.options["extractor-registry"]
    ? CategoryExtractorRegistrySchema.parse(
      await readJsonValue(input.options["extractor-registry"]),
    )
    : createCategoryExtractorRegistry();
  const sourceArtifacts = input.documents.map((document) => buildSourceArtifacts({
    document_id: stableId(document.document_id),
    path: document.path,
    content: document.content,
    paragraph_mode: document.path.toLowerCase().endsWith(".pdf") ? "line" : "contiguous",
  }));
  const units = sourceArtifacts.flatMap(({ source_units }) => source_units).map((unit) => ({
    id: unit.id, order: unit.order, section_path: unit.section_path,
    kind: unit.kind, text: unit.text, content_hash: unit.content_hash,
  }));
  const revisions = input.sectionClassification.output.revisions;
  if (input.options["candidate-inventory"]) {
    const inventory = AtlasCandidateInventorySchema.parse(
      await readJsonValue(input.options["candidate-inventory"]),
    );
    return {
      inventory,
      ledger: {
        schema_version: "1.0.0",
        registry_id: extractorRegistry.id,
        status: "success",
        runs: [{
          extractor_id: "atlas.extractor.canonical-replay",
          status: "success",
          candidate_inventory_hash: inventory.content_hash,
          candidate_ids: inventory.candidates.map(({ candidate_id }) => candidate_id),
        }],
      },
      mergeReport: {
        schema_version: "1.0.0",
        status: "success",
        inventory_hash: inventory.content_hash,
        candidate_count: inventory.candidates.length,
        duplicate_payload_groups: [],
        uncertainties: [],
        conflicts: [],
      },
      runs: [],
      sourceArtifacts,
      sectionClassifications: input.sectionClassification.output.classifications,
    };
  }
  const broadInput = {
    contract_version: "1.0.0" as const,
    revisions,
    extractor_id: "atlas.extractor.broad-discovery",
    semantic_kind_registry_id: semanticRegistry.id,
    semantic_kind_registry_hash: semanticRegistry.content_hash,
    allowed_semantic_kind_ids: semanticRegistry.definitions.map(({ id }) => id),
    source_units: units,
    section_classifications: input.sectionClassification.output.classifications,
  };
  let runs: z.infer<typeof CanonicalCandidateExtractionOutputSchema>[];
  if (input.legacyFixture) {
    const artifactsByDocument = new Map(input.documents.map((document, index) => [
      document.document_id, sourceArtifacts[index]!,
    ]));
    const legacy = [
      ...input.legacyFixture.candidate_requirements.map((candidate) => ({
        statement: candidate.title,
        kind: "ces.kind.capability",
        source: candidate.source,
        confidence: candidate.inference.confidence,
      })),
      ...input.legacyFixture.candidate_business_rules.map((candidate) => ({
        statement: candidate.statement,
        kind: "ces.kind.business-rule",
        source: candidate.source,
        confidence: candidate.inference.confidence,
      })),
    ];
    const drafts = legacy.map((candidate, index) => {
      const sourceUnits = artifactsByDocument.get(candidate.source.document_id)?.source_units ?? [];
      const cited = sourceUnits.filter((unit) =>
        candidate.source.line_start !== undefined
        && candidate.source.line_end !== undefined
        && unit.location.line_start <= candidate.source.line_end
        && unit.location.line_end >= candidate.source.line_start);
      return {
        temporary_id: `TMP-CANDIDATE-${index + 1}`,
        statement: candidate.statement,
        provisional_kind: candidate.kind,
        source_unit_ids: (cited.length > 0 ? cited : sourceUnits.slice(0, 1))
          .map(({ id }) => id),
        confidence: candidate.confidence,
        classification_status: "classified" as const,
        evidence_status: "source_anchored" as const,
      };
    });
    const { finalizeCanonicalCandidateExtraction } =
      await import("@company/ces-atlas-role-contracts");
    runs = [finalizeCanonicalCandidateExtraction(broadInput, {
      candidates: drafts, uncertainties: [], conflicts: [],
    }, {
      provider_id: stableId(input.providerMetadata.provider),
      model_id: input.providerMetadata.model,
    })];
  } else {
    const broad = await executeCanonicalExtractor(input.options, broadInput);
    runs = [broad];
    const purposeKinds = new Map<string, readonly string[]>([
      ["ces.section.normative-rules", [
        "ces.kind.business-rule", "ces.kind.validation-constraint",
        "ces.kind.uniqueness-constraint", "ces.kind.security-sensitive-restriction",
      ]],
      ["ces.section.workflows", [
        "ces.kind.workflow", "ces.kind.operational-procedure", "ces.kind.capability",
      ]],
      ["ces.section.roles-permissions", ["ces.kind.role-permission"]],
      ["ces.section.calculations", ["ces.kind.calculation"]],
      ["ces.section.states-lifecycle", [
        "ces.kind.state-definition", "ces.kind.state-transition", "ces.kind.lifecycle-rule",
      ]],
      ["ces.section.reporting-audit", [
        "ces.kind.reporting-requirement", "ces.kind.business-rule",
      ]],
      ["ces.section.data", [
        "ces.kind.capability", "ces.kind.validation-constraint",
        "ces.kind.uniqueness-constraint",
      ]],
      ["ces.section.acceptance-deliverables", [
        "ces.kind.acceptance-criterion", "ces.kind.acceptance-scenario",
      ]],
      ["ces.section.terminology", ["ces.kind.terminology"]],
    ]);
    for (const extractor of extractorRegistry.extractors) {
      const registeredPurposes = [...purposeKinds.entries()]
        .filter(([, kinds]) => kinds.some((kind) =>
          extractor.supported_semantic_kind_ids.includes(kind)));
      const matchingPurposes = registeredPurposes.length > 0
        ? registeredPurposes
        : extractor.registered_by === "organization"
          ? [...purposeKinds.entries()] : [];
      const selectedKinds = extractor.supported_semantic_kind_ids
        .filter((kind) => registeredPurposes.length === 0
          || matchingPurposes.some(([, kinds]) => kinds.includes(kind)));
      if (selectedKinds.length === 0) continue;
      const matchingPurposeIds = new Set(matchingPurposes.map(([purpose]) => purpose));
      const candidateUnits = new Set(input.sectionClassification.output.classifications
        .filter(({ purpose_ids, disposition }) =>
          (disposition === "normative"
            || (disposition === "contextual"
              && purpose_ids.includes("ces.section.workflows")))
          && purpose_ids.some((purpose) => matchingPurposeIds.has(purpose)))
        .map(({ source_unit_id }) => source_unit_id));
      const scopedUnits = units.filter(({ id }) => candidateUnits.has(id));
      const scopedClassifications = input.sectionClassification.output.classifications
        .filter(({ source_unit_id }) => candidateUnits.has(source_unit_id));
      if (scopedUnits.length === 0 || scopedClassifications.length === 0) continue;
      runs.push(await executeCanonicalExtractor(input.options, {
        ...broadInput,
        extractor_id: extractor.extractor_id,
        allowed_semantic_kind_ids: selectedKinds,
        source_units: scopedUnits,
        section_classifications: scopedClassifications,
      }));
    }
    const covered = new Set(runs.flatMap(({ inventory }) => inventory.candidates)
      .flatMap(({ source_unit_ids }) => source_unit_ids));
    const unresolvedIds = new Set(input.sectionClassification.output.classifications
      .filter(({ disposition }) => disposition === "normative")
      .filter(({ source_unit_id, status }) =>
        status !== "classified" || !covered.has(source_unit_id))
      .map(({ source_unit_id }) => source_unit_id));
    const retryUnits = units.filter(({ id, kind }) =>
      kind !== "heading" && unresolvedIds.has(id));
    const retryClassifications = input.sectionClassification.output.classifications
      .filter(({ source_unit_id }) => unresolvedIds.has(source_unit_id));
    if (retryUnits.length > 0 && retryClassifications.length > 0) {
      runs.push(await executeCanonicalExtractor(input.options, {
        ...broadInput,
        extractor_id: "atlas.extractor.targeted-retry",
        objective: "For each unresolved source unit, atomically decompose every independently testable statement, including each numbered or bulleted rule, threshold, prohibition, permission, validation, calculation, state, report, and acceptance condition. Do not treat one candidate from the unit as coverage of its other statements.",
        source_units: retryUnits,
        section_classifications: retryClassifications,
      }));
      runs.push(await executeCanonicalExtractor(input.options, {
        ...broadInput,
        extractor_id: "atlas.extractor.atomic-retry",
        objective: "Independently re-scan each unresolved unit from beginning to end. Emit one generic candidate for every atomic list item or independently testable clause, including small display-together, retention, confidentiality, quota, and blocking conditions. Do not summarize or omit a clause because another candidate covers the same unit.",
        source_units: retryUnits,
        section_classifications: retryClassifications,
      }));
    }
  }
  const candidates = runs.flatMap(({ inventory }) => inventory.candidates)
    .sort((left, right) => compareText(left.candidate_id, right.candidate_id));
  const inventory = createAtlasCandidateInventory({
    source_revision_id: revisions.source_revision_id,
    lexicon_revision_id: revisions.lexicon_revision_id,
    semantic_schema_version: revisions.semantic_schema_version,
    semantic_kind_registry_id: semanticRegistry.id,
    semantic_kind_registry_hash: semanticRegistry.content_hash,
    prompt_contract_version: revisions.prompt_contract_version,
    allowed_source_unit_ids: units.map(({ id }) => id),
    candidates,
  });
  const ledger = {
    schema_version: "1.0.0",
    registry_id: extractorRegistry.id,
    status: "success",
    runs: runs.map((run) => ({
      extractor_id: run.extractor_id,
      status: "success",
      candidate_inventory_hash: run.inventory.content_hash,
      candidate_ids: run.inventory.candidates.map(({ candidate_id }) => candidate_id),
    })),
  };
  const mergeReport = {
    schema_version: "1.0.0",
    status: "success",
    inventory_hash: inventory.content_hash,
    candidate_count: inventory.candidates.length,
    duplicate_payload_groups: [...Map.groupBy(inventory.candidates, ({ statement, provisional_kind }) =>
      hashCanonical({ statement, provisional_kind })).values()]
      .filter((group) => group.length > 1)
      .map((group) => group.map(({ candidate_id }) => candidate_id).sort(compareText)),
    uncertainties: runs.flatMap(({ uncertainties }) => uncertainties),
    conflicts: runs.flatMap(({ conflicts }) => conflicts),
  };
  return {
    inventory, ledger, mergeReport, runs, sourceArtifacts,
    sectionClassifications: input.sectionClassification.output.classifications,
    ...(input.legacyFixture ? { legacyFixture: input.legacyFixture } : {}),
  };
}

async function executeCanonicalExtractor(
  options: Readonly<Record<string, string>>,
  input: unknown,
): Promise<z.infer<typeof CanonicalCandidateExtractionOutputSchema>> {
  const endpoint = new URL(requireOption(options, "provider-endpoint"));
  endpoint.pathname = "/v1/agents/atlas.candidate-extractor/execute";
  endpoint.search = "";
  const apiKey = process.env.CES_ATLAS_API_KEY ?? process.env.AGENTS_BRIDGE_API_KEY;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ agent_version: "1.0.0", input }),
  });
  if (!response.ok) {
    throw new CliInputError(`Atlas canonical candidate extractor failed with status ${response.status}`);
  }
  return CanonicalCandidateExtractionOutputSchema.parse(await response.json());
}

function projectCanonicalCandidatesToLegacy(input: {
  readonly documents: readonly { document_id: string; path: string; content: string }[];
  readonly promptContractVersion: string;
  readonly providerMetadata: { readonly provider: string; readonly model: string };
  readonly canonicalExtraction: Awaited<ReturnType<typeof extractCanonicalAtlasCandidates>>;
  readonly legacyFixture?: z.infer<typeof AtlasProviderResultSchema>;
}) {
  const sourceIndex = ingestMarkdownDocuments(input.documents);
  const sourceUnit = new Map(input.canonicalExtraction.sourceArtifacts.flatMap(
    (artifact, documentIndex) => artifact.source_units.map((unit) => [
      unit.id, { unit, document: sourceIndex.documents[documentIndex]! },
    ] as const),
  ));
  const requirements = input.canonicalExtraction.inventory.candidates.map((candidate) => {
    const evidence = sourceUnit.get(candidate.source_unit_ids[0]!)!;
    return {
      schema_version: "1.0.0" as const,
      candidate_id: `LEGACY-REQ-${stableId(candidate.candidate_id)}`,
      proposed_logical_id: `legacy.req.${stableId(candidate.candidate_id)}`,
      title: candidate.statement,
      actor: { type: "system" as const },
      operation: { action: "view" as const, resource: "project" as const },
      source: {
        document_id: evidence.document.document_id,
        path: evidence.document.path,
        section: evidence.unit.section_path.at(-1),
        line_start: evidence.unit.location.line_start,
        line_end: evidence.unit.location.line_end,
        content_hash: evidence.document.content_hash,
      },
      inference: {
        origin: "explicit" as const,
        confidence: candidate.confidence,
        agent: {
          provider: candidate.provider_metadata.provider_id,
          model: candidate.provider_metadata.model_id,
          prompt_contract_version: input.promptContractVersion,
        },
        review: {
          status: candidate.classification_status === "classified"
            && candidate.evidence_status === "source_anchored"
            ? "candidate" as const : "needs_confirmation" as const,
        },
      },
    };
  });
  const requirementByCandidate = new Map(input.canonicalExtraction.inventory.candidates
    .map((candidate, index) => [candidate.candidate_id, requirements[index]!] as const));
  const ruleKind = new Set([
    "ces.kind.business-rule", "ces.kind.validation-constraint",
    "ces.kind.uniqueness-constraint", "ces.kind.role-permission",
    "ces.kind.state-transition", "ces.kind.lifecycle-rule",
    "ces.kind.security-sensitive-restriction",
  ]);
  const rules = input.canonicalExtraction.inventory.candidates
    .filter(({ provisional_kind }) => ruleKind.has(provisional_kind))
    .map((candidate) => {
      const parent = requirementByCandidate.get(candidate.candidate_id)!;
      return {
        schema_version: "1.0.0" as const,
        candidate_id: `LEGACY-RULE-${stableId(candidate.candidate_id)}`,
        proposed_logical_id: `legacy.rule.${stableId(candidate.candidate_id)}`,
        type: candidate.provisional_kind.includes("permission") ? "authorization" as const
          : candidate.provisional_kind.includes("validation") ? "validation" as const
            : candidate.provisional_kind.includes("uniqueness") ? "uniqueness" as const
              : candidate.provisional_kind.includes("state") ? "state_transition" as const
                : candidate.provisional_kind.includes("lifecycle") ? "lifecycle" as const
                  : "other" as const,
        statement: candidate.statement,
        source_requirement_ids: [parent.proposed_logical_id],
        source: parent.source,
        inference: parent.inference,
      };
    });
  const projectedAnalysis = AtlasProviderResultSchema.parse({
    schema_version: "1.0.0",
    candidate_requirements: requirements,
    candidate_business_rules: rules,
    uncertainties: [],
    conflicts: [],
    clarification_questions: input.canonicalExtraction.inventory.candidates
      .filter(({ classification_status, provisional_kind }) =>
        classification_status !== "classified" || provisional_kind === "ces.kind.unknown")
      .map((candidate) => ({
        id: `LEGACY-QUESTION-${stableId(candidate.candidate_id)}`,
        question: `Classify canonical candidate ${candidate.candidate_id}.`,
        affected_requirement_ids: [
          requirementByCandidate.get(candidate.candidate_id)!.candidate_id,
        ],
        blocking: true,
      })),
  });
  const analysis = input.legacyFixture ?? projectedAnalysis;
  return {
    schema_version: "1.0.0" as const,
    source_index: sourceIndex,
    analysis,
    extraction_report: {
      schema_version: "1.0.0" as const,
      provider: input.providerMetadata.provider,
      model: input.providerMetadata.model,
      prompt_contract_version: input.promptContractVersion,
      source_hashes: sourceIndex.documents.map(({ document_id, content_hash }) => ({
        document_id, content_hash,
      })),
    },
    projectionLosses: {
      schema_version: "1.0.0",
      direction: "canonical-to-legacy",
      adapter_id: "atlas.adapter.legacy-review-v1",
      projections: input.canonicalExtraction.inventory.candidates.map((candidate) => ({
        candidate_id: candidate.candidate_id,
        legacy_requirement_id: requirementByCandidate.get(candidate.candidate_id)!.candidate_id,
        classification: candidate.provisional_kind === "ces.kind.capability"
          ? "lossless" : "lossy",
        losses: candidate.provisional_kind === "ces.kind.capability" ? []
          : ["semantic-kind-specific-structure", "canonical-source-unit-identity"],
      })),
    },
  };
}

export async function analyzeHardenedAtlasCandidates(
  input: Parameters<typeof analyzeAtlasCandidates>[0],
): Promise<Awaited<ReturnType<typeof analyzeAtlasCandidates>>> {
  const focuses = [
    {
      mode: "broad_discovery" as const,
      instructions: "Extract every material functional requirement and independently testable rule across every section.",
    },
    {
      mode: "rules_validations_permissions" as const,
      instructions: "Extract all business rules, validations, uniqueness constraints, permissions, prohibitions, ownership, security, retention, and consistency requirements.",
    },
    {
      mode: "calculations_states_workflows" as const,
      instructions: "Extract all calculations, derived values, states, transitions, lifecycle conditions, workflow steps, branches, approvals, readiness criteria, and finalization rules.",
    },
    {
      mode: "reporting_audit_data" as const,
      instructions: "Extract all reporting, export, dashboard, audit-history, traceability, data-field, document, notification, and acceptance requirements.",
    },
    {
      mode: "acceptance_deliverables_terminology" as const,
      instructions: "Extract every deliverable, acceptance criterion, acceptance scenario, business objective, named role, defined term, handover obligation, warranty, training, access, and documentation requirement.",
    },
  ];
  const passes: Awaited<ReturnType<typeof analyzeAtlasCandidates>>[] = [];
  for (const focus of focuses) {
    passes.push(await analyzeAtlasCandidates({
      ...input,
      extractionFocus: { ...focus, target_line_ranges: [] },
    }));
  }
  const citedRanges = passes.flatMap(({ analysis }) => [
    ...analysis.candidate_requirements,
    ...analysis.candidate_business_rules,
  ]).flatMap(({ source }) =>
    source.line_start === undefined || source.line_end === undefined
      ? [] : [{
        document_id: source.document_id,
        line_start: source.line_start,
        line_end: source.line_end,
      }]);
  const retryRanges = input.documents.flatMap((document) => {
    const artifacts = buildSourceArtifacts({
      document_id: stableId(document.document_id),
      path: document.path,
      content: document.content,
      paragraph_mode: document.path.toLowerCase().endsWith(".pdf") ? "line" : "contiguous",
    });
    return artifacts.source_units
      .filter((unit) => unit.kind !== "heading")
      .filter((unit) => !citedRanges.some((range) =>
        range.document_id === document.document_id
        && range.line_start <= unit.location.line_end
        && range.line_end >= unit.location.line_start))
      .map((unit) => ({
        document_id: document.document_id,
        line_start: unit.location.line_start,
        line_end: unit.location.line_end,
      }));
  });
  if (retryRanges.length > 0) {
    passes.push(await analyzeAtlasCandidates({
      ...input,
      extractionFocus: {
        mode: "targeted_retry",
        instructions: "Reinspect only the listed uncovered source ranges. Extract every material statement not represented by the earlier passes, including objectives, roles, terminology, small constraints, and acceptance obligations.",
        target_line_ranges: retryRanges,
      },
    }));
  }
  const first = passes[0]!;
  const requirementKeys = new Map<string, typeof first.analysis.candidate_requirements[number]>();
  const proposedRequirementIds = new Set<string>();
  const usedRequirementCandidateIds = new Set<string>();
  const requirementMaps: Map<string, string>[] = [];
  for (const pass of passes) {
    const references = new Map<string, string>();
    for (const candidate of pass.analysis.candidate_requirements) {
      const key = semanticCandidateKey(candidate.title, candidate.source);
      let stored = requirementKeys.get(key);
      if (!stored) {
        const sequence = requirementKeys.size + 1;
        stored = {
          ...candidate,
          candidate_id: usedRequirementCandidateIds.has(candidate.candidate_id)
            ? `REQ-CAND-${String(sequence).padStart(3, "0")}`
            : candidate.candidate_id,
          proposed_logical_id: proposedRequirementIds.has(candidate.proposed_logical_id)
            ? `REQ-HARD-${String(sequence).padStart(3, "0")}`
            : candidate.proposed_logical_id,
        };
        usedRequirementCandidateIds.add(stored.candidate_id);
        proposedRequirementIds.add(stored.proposed_logical_id);
        requirementKeys.set(key, stored);
      }
      references.set(candidate.candidate_id, stored.candidate_id);
      references.set(candidate.proposed_logical_id, stored.candidate_id);
    }
    requirementMaps.push(references);
  }
  const ruleKeys = new Map<string, typeof first.analysis.candidate_business_rules[number]>();
  const usedRuleCandidateIds = new Set<string>();
  passes.forEach((pass, passIndex) => {
    for (const candidate of pass.analysis.candidate_business_rules) {
      const key = semanticCandidateKey(candidate.statement, candidate.source);
      if (ruleKeys.has(key)) continue;
      const sequence = ruleKeys.size + 1;
      const mappedRequirements = candidate.source_requirement_ids
        .map((id) => requirementMaps[passIndex]!.get(id))
        .filter((id): id is string => id !== undefined);
      if (mappedRequirements.length === 0) continue;
      ruleKeys.set(key, {
        ...candidate,
        candidate_id: usedRuleCandidateIds.has(candidate.candidate_id)
          ? `BR-CAND-${String(sequence).padStart(3, "0")}`
          : candidate.candidate_id,
        proposed_logical_id: `RULE-HARD-${String(sequence).padStart(3, "0")}`,
        source_requirement_ids: [...new Set(mappedRequirements)].sort(compareText),
      });
      usedRuleCandidateIds.add(ruleKeys.get(key)!.candidate_id);
    }
  });
  const requirements = [...requirementKeys.values()];
  const requirementIds = new Set(requirements.map(({ candidate_id }) => candidate_id));
  const remapAffected = (ids: readonly string[], passIndex: number) =>
    [...new Set(ids.map((id) => requirementMaps[passIndex]!.get(id))
      .filter((id): id is string => id !== undefined && requirementIds.has(id)))].sort(compareText);
  const uncertainties = passes.flatMap((pass, passIndex) =>
    pass.analysis.uncertainties.map((item) => ({
      ...item,
      id: `UNC-${String(passIndex + 1)}-${stableId(item.id)}`,
      affected_requirement_ids: remapAffected(item.affected_requirement_ids, passIndex),
    })));
  const conflicts = passes.flatMap((pass, passIndex) =>
    pass.analysis.conflicts.flatMap((item) => {
      const ids = remapAffected(item.source_requirement_ids, passIndex);
      return ids.length < 2 ? [] : [{
        ...item,
        id: `CONFLICT-${String(passIndex + 1)}-${stableId(item.id)}`,
        source_requirement_ids: ids,
      }];
    }));
  const questions = passes.flatMap((pass, passIndex) =>
    pass.analysis.clarification_questions.map((item) => ({
      ...item,
      id: `QUESTION-${String(passIndex + 1)}-${stableId(item.id)}`,
      affected_requirement_ids: remapAffected(item.affected_requirement_ids, passIndex),
    })));
  return {
    ...first,
    analysis: AtlasProviderResultSchema.parse({
      schema_version: "1.0.0",
      candidate_requirements: requirements,
      candidate_business_rules: [...ruleKeys.values()],
      uncertainties: uniqueBy(uncertainties, ({ reason }) => reason),
      conflicts: uniqueBy(conflicts, ({ statement }) => statement),
      clarification_questions: uniqueBy(questions, ({ question }) => question),
    }),
  };
}

function semanticCandidateKey(
  statement: string,
  source: {
    document_id: string;
    line_start?: number | undefined;
    line_end?: number | undefined;
  },
): string {
  return [
    statement.trim().toLocaleLowerCase(),
    source.document_id,
    source.line_start ?? "",
    source.line_end ?? "",
  ].join("\u0000");
}

function uniqueBy<T>(values: readonly T[], identify: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const id = identify(value).trim().toLocaleLowerCase();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function consolidateAtlasCandidates(
  candidates: readonly z.infer<typeof AtlasCandidateSchema>[],
): readonly { readonly candidates: readonly z.infer<typeof AtlasCandidateSchema>[] }[] {
  const ordered = [...candidates].sort((left, right) =>
    compareText(left.candidate_id, right.candidate_id));
  const parent = ordered.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[index] !== index) {
      const next = parent[index]!;
      parent[index] = root;
      index = next;
    }
    return root;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
  };
  for (let left = 0; left < ordered.length; left += 1) {
    for (let right = left + 1; right < ordered.length; right += 1) {
      if (candidateMeaningsMatch(ordered[left]!, ordered[right]!)) union(left, right);
    }
  }
  const clustered = new Map<number, z.infer<typeof AtlasCandidateSchema>[]>();
  for (const [index, candidate] of ordered.entries()) {
    const root = find(index);
    const values = clustered.get(root) ?? [];
    values.push(candidate);
    clustered.set(root, values);
  }
  const kindPriority = new Map([
    "ces.kind.state-transition", "ces.kind.calculation", "ces.kind.role-permission",
    "ces.kind.validation-constraint", "ces.kind.uniqueness-constraint",
    "ces.kind.security-sensitive-restriction", "ces.kind.lifecycle-rule",
    "ces.kind.business-rule", "ces.kind.acceptance-scenario",
    "ces.kind.acceptance-criterion", "ces.kind.reporting-requirement",
    "ces.kind.operational-procedure", "ces.kind.workflow",
    "ces.kind.state-definition", "ces.kind.terminology", "ces.kind.capability",
    "ces.kind.unknown",
  ].map((kind, index) => [kind, index]));
  return [...clustered.values()].map((values) => ({
    candidates: values.sort((left, right) =>
      (kindPriority.get(left.provisional_kind) ?? 999)
      - (kindPriority.get(right.provisional_kind) ?? 999)
      || right.confidence - left.confidence
      || compareText(left.statement, right.statement)),
  })).sort((left, right) =>
    compareText(left.candidates[0]!.candidate_id, right.candidates[0]!.candidate_id));
}

function candidateMeaningsMatch(
  left: z.infer<typeof AtlasCandidateSchema>,
  right: z.infer<typeof AtlasCandidateSchema>,
): boolean {
  const leftText = semanticTokens(left.statement);
  const rightText = semanticTokens(right.statement);
  const exact = [...leftText].sort(compareText).join(" ")
    === [...rightText].sort(compareText).join(" ");
  if (exact) return true;
  if (left.provisional_kind !== right.provisional_kind) return false;
  if (!left.source_unit_ids.some((id) => right.source_unit_ids.includes(id))) return false;
  return jaccard(leftText, rightText) >= 0.65;
}

function semanticTokens(statement: string): Set<string> {
  const ignored = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
    "can", "if", "is", "it", "may", "must", "of", "on", "or", "should",
    "the", "to", "with",
    "adalah", "atau", "dan", "dapat", "dari", "dengan", "di", "harus", "ke",
    "oleh", "pada", "yang",
  ]);
  return new Set(statement.normalize("NFKD").toLocaleLowerCase()
    .replaceAll(/\p{M}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !ignored.has(token)));
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / (left.size + right.size - intersection);
}

function buildGroundedAtlasRelationships(input: {
  readonly projectId: string;
  readonly records: readonly {
    readonly id: string;
    readonly semantic_kind_id: string;
    readonly statement: string;
    readonly source_unit_ids: readonly string[];
  }[];
  readonly workflowNodes: readonly {
    readonly id: string;
    readonly semantic_record_ids: readonly string[];
    readonly source_unit_ids: readonly string[];
  }[];
}) {
  const nodeByRecord = new Map(input.workflowNodes.flatMap((node) =>
    node.semantic_record_ids.map((recordId) => [recordId, node] as const)));
  const targetKinds = new Set([
    "ces.kind.capability", "ces.kind.workflow", "ces.kind.operational-procedure",
    "ces.kind.state-definition", "ces.kind.state-transition",
  ]);
  const relationshipFor = (kind: string): { kind: string; reverse: boolean } | undefined => {
    if (["ces.kind.business-rule", "ces.kind.validation-constraint",
      "ces.kind.uniqueness-constraint", "ces.kind.lifecycle-rule",
      "ces.kind.security-sensitive-restriction"].includes(kind)) {
      return { kind: "ces.relationship.constrains", reverse: false };
    }
    if (kind === "ces.kind.role-permission") {
      return { kind: "ces.relationship.governs", reverse: false };
    }
    if (kind === "ces.kind.calculation") {
      return { kind: "ces.relationship.produces", reverse: true };
    }
    if (kind === "ces.kind.reporting-requirement") {
      return { kind: "ces.relationship.produces", reverse: true };
    }
    if (["ces.kind.acceptance-criterion", "ces.kind.acceptance-scenario"].includes(kind)) {
      return { kind: "ces.relationship.verifies", reverse: true };
    }
    return undefined;
  };
  const edges: Array<{
    id: string; from_id: string; to_id: string; kind: string; source_unit_ids: string[];
  }> = [];
  for (const record of input.records) {
    const relationship = relationshipFor(record.semantic_kind_id);
    if (!relationship) continue;
    const targets = input.records.filter((target) =>
      target.id !== record.id && targetKinds.has(target.semantic_kind_id))
      .map((target) => ({
        target,
        evidence: record.source_unit_ids.filter((id) => target.source_unit_ids.includes(id)),
        score: jaccard(semanticTokens(record.statement), semanticTokens(target.statement)),
      }))
      .filter(({ evidence }) => evidence.length > 0)
      .sort((left, right) => right.score - left.score
        || compareText(left.target.id, right.target.id));
    for (const selected of targets.filter(({ score }) => score >= 0.15).slice(0, 5)) {
      const modifierNode = nodeByRecord.get(record.id)!;
      const targetNode = nodeByRecord.get(selected.target.id)!;
      const from = relationship.reverse ? targetNode.id : modifierNode.id;
      const to = relationship.reverse ? modifierNode.id : targetNode.id;
      const core = {
        from_id: from,
        to_id: to,
        kind: relationship.kind,
        source_unit_ids: [...selected.evidence].sort(compareText),
      };
      edges.push({
        id: `${input.projectId}.relationship-target.${hashCanonical(core).slice(7, 19)}`,
        ...core,
      });
    }
  }
  return edges.sort((left, right) => compareText(left.id, right.id));
}

export function buildAtlasRelationshipCandidates(input: {
  readonly projectId: string;
  readonly proposalRevision: number;
  readonly origin?: "explicit" | "derived";
  readonly edges: readonly {
    readonly id: string;
    readonly from_id: string;
    readonly to_id: string;
    readonly kind: string;
    readonly source_unit_ids: readonly string[];
  }[];
  readonly unresolved_intents?: readonly {
    readonly from_id: string;
    readonly relationship_kind: string;
    readonly evidence_source_unit_ids: readonly string[];
    readonly rationale: string;
  }[];
}) {
  const grouped = Map.groupBy(input.edges, (edge) => `${edge.from_id}:${edge.kind}`);
  const resolvedCandidates = [...grouped.values()].map((edges) => {
    const representative = edges[0]!;
    const intentCore = {
      from_id: representative.from_id,
      relationship_kind: representative.kind,
    };
    const relationshipIntentId =
      `${input.projectId}.relationship.${hashCanonical(intentCore).slice(7, 19)}`;
    const evidence = [...new Set(edges.flatMap(({ source_unit_ids }) =>
      source_unit_ids))].sort(compareText);
    return {
      relationship_intent_id: relationshipIntentId,
      from_id: representative.from_id,
      relationship_kind: representative.kind,
      governance: {
        id: `${relationshipIntentId}.governance`,
        origin: input.origin ?? "derived",
        evidence_source_unit_ids: evidence,
        rationale: input.origin === "explicit"
          ? "The source explicitly references independently reviewable targets."
          : "Shared source evidence and lexical support produced independently reviewable targets.",
        confidence: input.origin === "explicit" ? 1 : 0.6,
        review_status: "pending" as const,
        bulk_approval_eligible: false,
        blockers: input.origin === "explicit" ? [] : ["derived-relationship"],
        proposal_revision: input.proposalRevision,
      },
      targets: edges.map((edge) => ({
        target_candidate_id:
          `${relationshipIntentId}.target.${hashCanonical(edge.to_id).slice(7, 19)}`,
        target_id: edge.to_id,
        target_status: input.origin === "explicit" ? "valid" as const : "competing" as const,
        evidence_source_unit_ids: [...edge.source_unit_ids].sort(compareText),
        rationale: input.origin === "explicit"
          ? "The source explicitly identifies this independently reviewable target."
          : "Shared evidence and semantic similarity propose this target for independent review.",
        confidence: input.origin === "explicit" ? 1 : 0.6,
        review_status: "pending" as const,
        blockers: input.origin === "explicit" ? [] : ["derived-target-requires-review"],
      })).sort((left, right) => compareText(left.target_candidate_id, right.target_candidate_id)),
    };
  });
  const unresolvedCandidates = (input.unresolved_intents ?? []).map((intent) => {
    const core = {
      from_id: intent.from_id,
      relationship_kind: intent.relationship_kind,
    };
    const relationshipIntentId =
      `${input.projectId}.relationship.${hashCanonical(core).slice(7, 19)}`;
    return {
      relationship_intent_id: relationshipIntentId,
      from_id: intent.from_id,
      relationship_kind: intent.relationship_kind,
      governance: {
        id: `${relationshipIntentId}.governance`,
        origin: "derived" as const,
        evidence_source_unit_ids: [...new Set(intent.evidence_source_unit_ids)]
          .sort(compareText),
        rationale: intent.rationale,
        confidence: 0,
        review_status: "pending" as const,
        bulk_approval_eligible: false,
        blockers: ["relationship-target-unresolved"],
        proposal_revision: input.proposalRevision,
      },
      targets: [],
    };
  });
  const candidates = [...resolvedCandidates, ...unresolvedCandidates]
    .sort((left, right) =>
      compareText(left.relationship_intent_id, right.relationship_intent_id));
  const diagnostics = {
    schema_version: "1.1.0",
    intent_count: candidates.length,
    zero_target_count: candidates.filter(({ targets }) => targets.length === 0).length,
    one_target_count: candidates.filter(({ targets }) => targets.length === 1).length,
    multi_target_count: candidates.filter(({ targets }) => targets.length > 1).length,
    independently_reviewable_target_count: candidates
      .flatMap(({ targets }) => targets).length,
    source_derived_with_evidence_count: candidates
      .filter(({ governance }) => governance.evidence_source_unit_ids.length > 0).length,
    missing_evidence_count: candidates
      .filter(({ governance }) => governance.evidence_source_unit_ids.length === 0).length,
    derived_without_review_blocker_count: candidates
      .filter(({ governance }) => governance.origin === "derived"
        && !governance.blockers.includes("derived-relationship")).length,
  };
  return { candidates, diagnostics };
}

function assembleAtlasWorkflowTopology(input: {
  readonly projectId: string;
  readonly proposalRevision: number;
  readonly records: readonly { readonly id: string }[];
  readonly workflows: readonly {
    readonly workflow_id: string;
    readonly semantic_role?: "business_workflow" | "shared_data" | "context_provider"
      | "state_workflow" | "reporting_audit";
    readonly label: string;
    readonly summary: string;
    readonly operation_ids: readonly string[];
    readonly source_unit_ids: readonly string[];
    readonly governance: ReturnType<typeof governanceEnvelope>;
  }[];
  readonly operations: readonly {
    readonly operation_id: string;
    readonly workflow_id?: string;
    readonly label: string;
    readonly operation_kind: "action" | "decision" | "state" | "start" | "end" | "unknown";
    readonly semantic_record_ids: readonly string[];
    readonly source_unit_ids: readonly string[];
    readonly governance: ReturnType<typeof governanceEnvelope>;
  }[];
}) {
  const workflowTokens = new Map(input.workflows.map((workflow) =>
    [workflow.workflow_id, semanticTokens(workflow.label)] as const));
  const workflowSources = new Map(input.workflows.map((workflow) =>
    [workflow.workflow_id, new Set(workflow.source_unit_ids)] as const));
  const operationWorkflow = new Map<string, string>();
  for (const operation of input.operations) {
    const declared = operation.workflow_id;
    if (declared) {
      operationWorkflow.set(operation.operation_id, declared);
      continue;
    }
    const operationTokens = semanticTokens(operation.label);
    const ranked = input.workflows.map((workflow) => {
      const sharedEvidence = operation.source_unit_ids.filter((id) =>
        workflowSources.get(workflow.workflow_id)!.has(id));
      return {
        workflow_id: workflow.workflow_id,
        sharedEvidence,
        score: sharedEvidence.length * 10
          + jaccard(operationTokens, workflowTokens.get(workflow.workflow_id)!),
      };
    }).filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score
        || compareText(left.workflow_id, right.workflow_id));
    if (ranked[0]) operationWorkflow.set(operation.operation_id, ranked[0].workflow_id);
  }
  const operations = input.operations.map((operation) => ({
    ...operation,
    ...(operationWorkflow.has(operation.operation_id)
      ? { workflow_id: operationWorkflow.get(operation.operation_id)! }
      : {}),
  }));
  const workflows = input.workflows.map((workflow) => {
    const operationIds = operations.filter(({ workflow_id }) =>
      workflow_id === workflow.workflow_id).map(({ operation_id }) => operation_id);
    return {
      ...workflow,
      operation_ids: [...new Set([...workflow.operation_ids, ...operationIds])].sort(compareText),
      source_unit_ids: [...workflow.source_unit_ids],
    };
  });
  return {
    workflows,
    operations: operations.map((operation) => ({
      ...operation,
      semantic_record_ids: [...operation.semantic_record_ids],
      source_unit_ids: [...operation.source_unit_ids],
    })),
    workflowEdges: [],
  };
}

function assessAtlasModelSupport(input: {
  readonly proposalRevision: number;
  readonly records: readonly {
    readonly semantic_kind_id: string;
    readonly source_unit_ids: readonly string[];
  }[];
  readonly workflowEdges: readonly unknown[];
  readonly overviewRelationshipCount?: number;
}) {
  const count = (kind: string) => input.records
    .filter(({ semantic_kind_id }) => semantic_kind_id === kind).length;
  const workflowRecords = count("ces.kind.workflow")
    + count("ces.kind.operational-procedure");
  const stateDefinitions = count("ces.kind.state-definition");
  const stateTransitions = count("ces.kind.state-transition");
  const businessRules = count("ces.kind.business-rule")
    + count("ces.kind.lifecycle-rule");
  const permissions = count("ces.kind.role-permission");
  const capabilities = count("ces.kind.capability");
  const terminology = count("ces.kind.terminology");
  const sourceIds = [...new Set(input.records.flatMap(({ source_unit_ids }) =>
    source_unit_ids))].sort(compareText);
  return assessSupportedModelKinds({
    proposal_revision: input.proposalRevision,
    evidence_counts: {
      activities: workflowRecords,
      activity_relationships: input.workflowEdges.length + (input.overviewRelationshipCount ?? 0),
      process_structures: input.workflowEdges.length + (input.overviewRelationshipCount ?? 0)
        + stateTransitions + businessRules,
      process_boundaries: workflowRecords > 0 ? 1 : 0,
      bpmn_semantics: stateTransitions,
      functional_areas: capabilities + workflowRecords,
      modules: capabilities,
      module_relationships: 0,
      states: stateDefinitions,
      state_transitions: stateTransitions,
      decision_rules: businessRules,
      actors: permissions,
      actor_goals: permissions,
      participants: permissions,
      ordered_messages: 0,
      entities: terminology,
      entity_attributes: 0,
      entity_relationships: 0,
    },
    evidence_source_unit_ids: Object.fromEntries(
      [
        "activity_flow", "business_workflow", "bpmn_candidate",
        "functional_decomposition", "state_diagram", "decision_model",
        "actor_goal_model", "conceptual_data_model",
      ].map((kind) => [kind, sourceIds]),
    ),
    review_required_model_kinds: ["bpmn_candidate"],
  });
}

function buildCanonicalProposedAtlasArtifacts(input: {
  readonly canonicalExtraction: Awaited<ReturnType<typeof extractCanonicalAtlasCandidates>>;
  readonly documents: readonly { document_id: string; path: string; content: string }[];
  readonly projectIntent: z.infer<typeof ProjectIntentSchema>;
  readonly sourceHashes: readonly { document_id: string; content_hash: string }[];
  readonly promptContractVersion: string;
  readonly provider: { readonly provider: string; readonly model: string };
}): Record<string, string> {
  const projectId = stableId(input.projectIntent.project.id);
  const inventory = input.canonicalExtraction.inventory;
  const registry = createSemanticKindRegistry();
  const units = input.canonicalExtraction.sourceArtifacts
    .flatMap(({ source_units }) => source_units);
  const groups = consolidateAtlasCandidates(inventory.candidates);
  const recordIds = new Map<string, string>();
  const recordIdentities = new Map<string, ReturnType<typeof createCanonicalRecordIdentity>>();
  const nodeIds = new Map<string, string>();
  const sourceLineage = new Map(units.map((unit) => [unit.id, unit.content_hash] as const));
  for (const group of groups) {
    const representative = group.candidates[0]!;
    const identity = createCanonicalRecordIdentity({
      project_id: projectId,
      proposal_revision: 1,
      semantic_kind_id: representative.provisional_kind,
      canonical_semantic_key: representative.statement,
      stable_source_lineage_keys: [...new Set(group.candidates.flatMap(({ source_unit_ids }) =>
        source_unit_ids.map((id) => sourceLineage.get(id)!)))],
    });
    for (const candidate of group.candidates) {
      recordIds.set(candidate.candidate_id, identity.record_id);
      recordIdentities.set(candidate.candidate_id, identity);
      nodeIds.set(candidate.candidate_id, `${projectId}.node.${identity.record_id.split(".").at(-1)!}`);
    }
  }
  let records = groups.map((group) => {
    const representative = group.candidates[0]!;
    const kinds = [...new Set(group.candidates.map(({ provisional_kind }) => provisional_kind))];
    const roles = [...new Set(group.candidates.map(({ extraction_role }) => extraction_role))]
      .sort(compareText);
    return {
    id: recordIds.get(representative.candidate_id)!,
    identity: recordIdentities.get(representative.candidate_id)!,
    candidate_ids: group.candidates.map(({ candidate_id }) => candidate_id).sort(compareText),
    semantic_kind_id: representative.provisional_kind,
    statement: representative.statement,
    multilingual: createMultilingualStatement({
      original_statement: representative.statement,
      original_language: representative.language_detection,
    }),
    source_unit_ids: [...new Set(group.candidates.flatMap(({ source_unit_ids }) =>
      source_unit_ids))].sort(compareText),
    classification_status: group.candidates.every(({ classification_status }) =>
      classification_status === "classified")
      ? "classified" as const : "classification_required" as const,
    origin: "explicit" as const,
    review_status: "pending" as const,
    details: [
      { key: "extraction-roles", value: roles },
      { key: "consolidated-candidate-count", value: group.candidates.length },
    ],
    issues: [
      ...(group.candidates.some(({ evidence_status }) =>
        evidence_status === "support_review_required") ? [{
        code: "support-review-required",
        severity: "review_required" as const,
      }] : []),
      ...(group.candidates.some(({ classification_status }) =>
        classification_status !== "classified") ? [{
        code: "classification-required",
        severity: "review_required" as const,
      }] : []),
      ...(kinds.length > 1 ? [{
        code: "semantic-kind-conflict",
        severity: "review_required" as const,
      }] : []),
    ],
  }});
  const unitOrder = new Map(units.map((unit) => [unit.id, unit.order]));
  const structuralPurposes = new Set([
    "ces.section.workflows", "ces.section.data", "ces.section.states-lifecycle",
    "ces.section.reporting-audit",
  ]);
  const classifications = new Map(input.canonicalExtraction.sectionClassifications
    .map((classification) => [classification.source_unit_id, classification] as const));
  const structuralUnits = units.filter((unit) => {
    const classification = classifications.get(unit.id);
    return classification?.disposition === "structural"
      && classification.purpose_ids.some((purpose) => structuralPurposes.has(purpose))
      && unit.text.length <= 100
      && !/[.!?]\s/u.test(unit.text);
  }).sort((left, right) => left.order - right.order);
  const areaRecords = structuralUnits.map((unit) => {
    const purposes = classifications.get(unit.id)?.purpose_ids ?? [];
    const semanticRole = purposes.includes("ces.section.data")
      ? "shared-data-area"
      : purposes.includes("ces.section.reporting-audit")
        ? "reporting-audit-consumer"
        : purposes.includes("ces.section.states-lifecycle")
          ? "state-workflow-area"
          : "workflow-area";
    const identity = createCanonicalRecordIdentity({
      project_id: projectId,
      proposal_revision: 1,
      semantic_kind_id: "ces.kind.workflow",
      canonical_semantic_key: unit.text,
      stable_source_lineage_keys: [unit.content_hash],
    });
    return {
      id: identity.record_id,
      identity,
      candidate_ids: [
        `${projectId}.candidate.structural-area.${identity.semantic_fingerprint.slice(7, 19)}`,
      ],
      semantic_kind_id: "ces.kind.workflow",
      statement: unit.text,
      multilingual: createMultilingualStatement({ original_statement: unit.text }),
      source_unit_ids: [unit.id],
      classification_status: "classified" as const,
      origin: "explicit" as const,
      review_status: "pending" as const,
      details: [{ key: "structural-area", value: [semanticRole] }],
      issues: [],
    };
  });
  const operationKinds = new Set([
    "ces.kind.workflow",
    "ces.kind.operational-procedure",
    "ces.kind.state-transition",
    "ces.kind.state-definition",
    "ces.kind.capability",
    "ces.kind.role-permission",
    "ces.kind.reporting-requirement",
    "ces.kind.lifecycle-rule",
  ]);
  const candidateKindById = new Map(inventory.candidates.map((candidate) =>
    [candidate.candidate_id, candidate.provisional_kind] as const));
  const kindsForRecord = (record: typeof records[number]) => new Set([
    record.semantic_kind_id,
    ...record.candidate_ids.map((id) => candidateKindById.get(id))
      .filter((kind): kind is string => kind !== undefined),
  ]);
  const operationRecords = records.filter((record) =>
    [...kindsForRecord(record)].some((kind) => operationKinds.has(kind)))
    .filter(({ details }) => !details.some(({ key }) => key === "structural-area"));
  const workflowIdByRecord = new Map(areaRecords
    .map((record) => [record.id, `${projectId}.workflow.${record.id.split(".").at(-1)!}`] as const));
  const operationDescriptors = operationRecords.flatMap((record) => {
    const kinds = kindsForRecord(record);
    const baseKind = kinds.has("ces.kind.state-definition")
      ? "state" as const
      : kinds.has("ces.kind.lifecycle-rule")
        ? "decision" as const : "action" as const;
    const conditionedState = kinds.has("ces.kind.state-definition")
      && (kinds.has("ces.kind.business-rule")
        || kinds.has("ces.kind.validation-constraint"));
    const projectedKinds = conditionedState
      ? ["decision" as const, "state" as const] : [baseKind];
    return projectedKinds.map((operationKind) => ({
      record,
      operationKind,
      conditionedState,
      operationId: `${projectId}.operation.${record.id.split(".").at(-1)!}`
        + (projectedKinds.length > 1 ? `.${operationKind}` : ""),
    }));
  });
  const areaForRecord = (record: typeof records[number]) => {
    const matches = record.source_unit_ids.flatMap((id) => {
      const order = unitOrder.get(id) ?? Number.MAX_SAFE_INTEGER;
      const area = structuralUnits.find((unit, index) =>
        order > unit.order
        && order < (structuralUnits[index + 1]?.order ?? Number.MAX_SAFE_INTEGER));
      return area ? [area] : [];
    }).sort((left, right) => left.order - right.order);
    return matches[0];
  };
  const areaRecordByUnit = new Map(structuralUnits.map((unit, index) =>
    [unit.id, areaRecords[index]!] as const));
  const initialWorkflows = structuralUnits.map((unit) => {
    const record = areaRecordByUnit.get(unit.id)!;
    const role = record.details.find(({ key }) => key === "structural-area")?.value[0];
    const areaOperations = operationDescriptors.filter(({ record: operation }) =>
      areaForRecord(operation)?.id === unit.id);
    const areaKinds = new Set(areaOperations.flatMap(({ record: operation }) =>
      [...kindsForRecord(operation)]));
    const operationIds = areaOperations
      .map(({ operationId }) => operationId);
    return {
      workflow_id: workflowIdByRecord.get(record.id)!,
      semantic_role: role === "reporting-audit-consumer"
        ? "reporting_audit" as const
        : role === "state-workflow-area"
          ? "state_workflow" as const
          : areaKinds.has("ces.kind.operational-procedure")
            ? "business_workflow" as const
            : areaKinds.has("ces.kind.capability")
              ? "shared_data" as const
              : areaKinds.has("ces.kind.role-permission")
                ? "context_provider" as const
                : role === "shared-data-area"
                  ? "shared_data" as const
                  : "business_workflow" as const,
      label: record.statement,
      summary: record.statement,
      operation_ids: operationIds,
      source_unit_ids: record.source_unit_ids,
      governance: governanceEnvelope({
        id: `${projectId}.governance.workflow.${record.id.split(".").at(-1)!}`,
        record,
        proposalRevision: 1,
      }),
    };
  }).filter(({ operation_ids }) => operation_ids.length > 0);
  const initialOperations = operationDescriptors.map(({ record, operationKind, operationId }) => ({
    operation_id: operationId,
    ...(areaForRecord(record)
      ? { workflow_id: workflowIdByRecord.get(
        areaRecordByUnit.get(areaForRecord(record)!.id)!.id,
      )! }
      : {}),
    label: record.statement,
    operation_kind: operationKind,
    semantic_record_ids: [record.id],
    source_unit_ids: record.source_unit_ids,
    governance: governanceEnvelope({
      id: `${projectId}.governance.operation.${record.id.split(".").at(-1)!}`,
      record,
      proposalRevision: 1,
    }),
  }));
  const assembled = assembleAtlasWorkflowTopology({
    projectId,
    proposalRevision: 1,
    records,
    workflows: initialWorkflows,
    operations: initialOperations,
  });
  const operations = assembled.operations;
  const recordById = new Map(records.map((record) => [record.id, record] as const));
  const workflows = assembled.workflows.map((workflow) => {
    const semanticRole = workflow.semantic_role ?? "business_workflow";
    if (["reporting_audit", "state_workflow"].includes(semanticRole)) {
      return { ...workflow, semantic_role: semanticRole };
    }
    const finalizedKinds = new Set(operations
      .filter(({ workflow_id }) => workflow_id === workflow.workflow_id)
      .flatMap(({ semantic_record_ids }) => semantic_record_ids)
      .map((id) => recordById.get(id)?.semantic_kind_id)
      .filter((kind): kind is string => kind !== undefined));
    return {
      ...workflow,
      semantic_role: finalizedKinds.has("ces.kind.operational-procedure")
        ? "business_workflow" as const
        : finalizedKinds.has("ces.kind.capability")
          ? "shared_data" as const
          : finalizedKinds.has("ces.kind.role-permission")
            ? "context_provider" as const
            : semanticRole,
    };
  });
  const workflowEdges: Array<z.input<typeof GovernedWorkflowEdgeSchema>> = [
    ...assembled.workflowEdges,
  ];
  for (const descriptor of operationDescriptors.filter(({ operationKind, conditionedState }) =>
    operationKind === "decision" && conditionedState)) {
    const decision = operations.find(({ operation_id }) =>
      operation_id === descriptor.operationId);
    if (!decision?.workflow_id) continue;
    const readyState = operations.find(({ operation_kind, semantic_record_ids }) =>
      operation_kind === "state"
      && semantic_record_ids.includes(descriptor.record.id));
    const alternateState = operations.find(({ workflow_id, operation_kind, semantic_record_ids }) =>
      workflow_id === decision.workflow_id && operation_kind === "state"
      && !semantic_record_ids.includes(descriptor.record.id)
      && semantic_record_ids.some((id) =>
        recordById.has(id)
        && kindsForRecord(recordById.get(id)!).has("ces.kind.state-transition")));
    for (const [state, outcome, condition] of [
      [readyState, "condition satisfied", descriptor.record.statement],
      [alternateState, "condition not satisfied", `Not: ${descriptor.record.statement}`],
    ] as const) {
      if (!state) continue;
      const core = {
        workflow_id: decision.workflow_id,
        from_operation_id: decision.operation_id,
        to_operation_id: state.operation_id,
        edge_kind: "branch" as const,
      };
      workflowEdges.push({
        edge_id: `${projectId}.workflow-edge.${hashCanonical(core).slice(7, 19)}`,
        ...core,
        condition,
        outcome_label: outcome,
        path_semantics: "conditional_exclusive" as const,
        governance: {
          id: `${projectId}.governance.workflow-edge.${hashCanonical(core).slice(7, 19)}`,
          origin: "explicit" as const,
          evidence_source_unit_ids: [...new Set([
            ...decision.source_unit_ids, ...state.source_unit_ids,
          ])].sort(compareText),
          rationale: "Source-defined condition and state outcome.",
          confidence: 1,
          review_status: "pending" as const,
          bulk_approval_eligible: true,
          blockers: [],
          proposal_revision: 1,
        },
      });
    }
  }
  const unitText = new Map(units.map((unit) => [unit.id, unit.text] as const));
  const overviewRelationshipMap = new Map<string, {
    id: string; from_id: string; to_id: string; kind: string; source_unit_ids: string[];
  }>();
  const addOverviewRelationship = (
    fromId: string,
    toId: string,
    kind: string,
    evidence: readonly string[],
  ) => {
    if (fromId === toId) return;
    const core = { from_id: fromId, to_id: toId, kind };
    overviewRelationshipMap.set(`${fromId}:${toId}:${kind}`, {
      id: `${projectId}.relationship.${hashCanonical(core).slice(7, 19)}`,
      ...core,
      source_unit_ids: [...new Set(evidence)].sort(compareText),
    });
  };
  const workflowEvidence = new Map(workflows.map((workflow) => [
    workflow.workflow_id,
    (() => {
      const headingIndex = structuralUnits.findIndex(({ id }) =>
        id === workflow.source_unit_ids[0]);
      const start = structuralUnits[headingIndex]?.order ?? -1;
      const end = structuralUnits[headingIndex + 1]?.order ?? Number.MAX_SAFE_INTEGER;
      return [...new Set(operations.filter(({ workflow_id }) =>
        workflow_id === workflow.workflow_id)
        .flatMap(({ source_unit_ids }) => source_unit_ids)
        .filter((id) => {
          const order = unitOrder.get(id) ?? Number.MAX_SAFE_INTEGER;
          return order > start && order < end;
        }))];
    })(),
  ] as const));
  const workflowText = new Map(workflows.map((workflow) => [
    workflow.workflow_id,
    workflowEvidence.get(workflow.workflow_id)!
      .map((id) => unitText.get(id) ?? "").join(" "),
  ] as const));
  const workflowPurpose = new Map(workflows.map((workflow) => [
    workflow.workflow_id,
    (() => {
      const purposes = classifications.get(workflow.source_unit_ids[0]!)?.purpose_ids ?? [];
      if (purposes.includes("ces.section.reporting-audit")) return "ces.section.reporting-audit";
      if (purposes.includes("ces.section.workflows")) return "ces.section.workflows";
      if (purposes.includes("ces.section.states-lifecycle")) return "ces.section.states-lifecycle";
      if (purposes.includes("ces.section.data")) return "ces.section.data";
      return "ces.section.unknown";
    })(),
  ] as const));
  const workflowStateTokens = new Map(workflows.map((workflow) => {
    const frequency = new Map<string, number>();
    for (const stateOperation of operations.filter((candidate) =>
      candidate.workflow_id === workflow.workflow_id
      && candidate.operation_kind === "state")) {
      const record = recordById.get(stateOperation.semantic_record_ids[0]!);
      if (!record) continue;
      for (const token of semanticTokens(record.statement)) {
        frequency.set(token, (frequency.get(token) ?? 0) + 1);
      }
    }
    return [workflow.workflow_id, new Set([...frequency]
      .filter(([, count]) => count >= 1).map(([token]) => token))] as const;
  }));
  const workflowTextTokens = new Map(workflows.map((workflow) => [
    workflow.workflow_id,
    semanticTokens(workflowText.get(workflow.workflow_id) ?? ""),
  ] as const));
  const workflowOrder = new Map(workflows.map((workflow) => [
    workflow.workflow_id,
    unitOrder.get(workflow.source_unit_ids[0]!) ?? Number.MAX_SAFE_INTEGER,
  ] as const));
  const allWorkflowLabelTokens = new Set(workflows.flatMap((workflow) =>
    [...semanticTokens(workflow.label)]));
  const tokenFrequency = new Map<string, number>();
  for (const [workflowId, tokens] of workflowTextTokens) {
    if (workflowPurpose.get(workflowId) === "ces.section.reporting-audit") continue;
    for (const token of tokens) {
      tokenFrequency.set(token, (tokenFrequency.get(token) ?? 0) + 1);
    }
  }
  for (const target of workflows) {
    const targetTokens = workflowTextTokens.get(target.workflow_id)!;
    for (const source of workflows) {
      if (source.workflow_id === target.workflow_id) continue;
      const labelTokens = semanticTokens(source.label);
      const matchedLabels = [...labelTokens].filter((token) => targetTokens.has(token));
      const distinctiveLabel = matchedLabels.some((token) =>
        (tokenFrequency.get(token) ?? Number.MAX_SAFE_INTEGER) <= 4);
      const matchedStateTokens = workflowPurpose.get(source.workflow_id)
        === "ces.section.states-lifecycle"
        ? [...workflowStateTokens.get(source.workflow_id)!].filter((token) =>
          !allWorkflowLabelTokens.has(token) && targetTokens.has(token)
          && (tokenFrequency.get(token) ?? Number.MAX_SAFE_INTEGER) <= 2)
        : [];
      const purpose = workflowPurpose.get(target.workflow_id);
      const targetPurposes =
        classifications.get(target.source_unit_ids[0]!)?.purpose_ids ?? [];
      let kind: string;
      if (purpose === "ces.section.reporting-audit"
        && matchedLabels.length >= 1 && distinctiveLabel) {
        kind = "ces.relationship.provides-data-to";
      } else if (purpose === "ces.section.states-lifecycle"
        && matchedLabels.length >= 1 && distinctiveLabel) {
        kind = "ces.relationship.contributes-to";
      } else if (purpose === "ces.section.workflows"
        && !targetPurposes.includes("ces.section.data")
        && matchedStateTokens.length > 0
        && workflowOrder.get(target.workflow_id)! > workflowOrder.get(source.workflow_id)!) {
        kind = "ces.relationship.enables";
      } else {
        continue;
      }
      addOverviewRelationship(
        source.workflow_id, target.workflow_id, kind,
        workflowEvidence.get(target.workflow_id)!,
      );
    }
  }
  const contextualWorkflowUnits = new Set(input.canonicalExtraction.sectionClassifications
    .filter(({ disposition, purpose_ids }) =>
      disposition !== "structural" && purpose_ids.includes("ces.section.workflows"))
    .map(({ source_unit_id }) => source_unit_id));
  const workflowCandidateIds = new Set(inventory.candidates
    .filter(({ provisional_kind }) => provisional_kind === "ces.kind.workflow")
    .map(({ candidate_id }) => candidate_id));
  const contextualFlowSequences: { source_unit_id: string; workflow_ids: string[] }[] = [];
  for (const sourceUnitId of contextualWorkflowUnits) {
    const sourceText = unitText.get(sourceUnitId) ?? "";
    const orderedAreas = operations.filter(({ source_unit_ids, label }) =>
      source_unit_ids.includes(sourceUnitId) && sourceText.includes(label))
      .filter((operation) => operation.semantic_record_ids.some((id) =>
        recordById.get(id)?.candidate_ids.some((candidateId) =>
          workflowCandidateIds.has(candidateId))))
      .map((operation) => {
        const operationTokens = semanticTokens(operation.label);
        const ranked = workflows.map((workflow) => {
          const vocabulary = workflowTextTokens.get(workflow.workflow_id)!;
          const overlap = [...operationTokens].filter((token) =>
            vocabulary.has(token)).length;
          const headingOverlap = [...operationTokens].filter((token) =>
            semanticTokens(workflow.label).has(token)).length;
          return { workflow_id: workflow.workflow_id, overlap, headingOverlap,
            reporting: workflowPurpose.get(workflow.workflow_id)
              === "ces.section.reporting-audit",
            similarity: jaccard(operationTokens, vocabulary) };
        }).filter(({ overlap, headingOverlap, reporting }) =>
          overlap > 0 && (!reporting || headingOverlap > 0))
          .sort((left, right) => right.overlap - left.overlap
            || right.similarity - left.similarity
            || compareText(left.workflow_id, right.workflow_id));
        return {
          workflow_id: ranked[0]?.workflow_id,
          position: sourceText.indexOf(operation.label),
        };
      }).filter((item): item is { workflow_id: string; position: number } =>
        item.workflow_id !== undefined && item.position >= 0)
      .sort((left, right) => left.position - right.position);
    const sequence = orderedAreas.filter((item, index) =>
      index === 0 || item.workflow_id !== orderedAreas[index - 1]!.workflow_id);
    contextualFlowSequences.push({
      source_unit_id: sourceUnitId,
      workflow_ids: sequence.map(({ workflow_id }) => workflow_id),
    });
    const reportingIds = sequence
      .map(({ workflow_id }) => workflow_id)
      .filter((workflowId) =>
        workflowPurpose.get(workflowId) === "ces.section.reporting-audit"
        && [...semanticTokens(workflows.find(({ workflow_id }) =>
          workflow_id === workflowId)!.label)].some((token) =>
          ["dashboard", "laporan", "report", "ringkasan", "summary"].includes(token)));
    for (const reportingId of reportingIds) {
      for (const { workflow_id: sourceId } of sequence) {
        if (sourceId === reportingId
          || workflowPurpose.get(sourceId) === "ces.section.reporting-audit") continue;
        addOverviewRelationship(
          sourceId, reportingId, "ces.relationship.provides-data-to", [sourceUnitId],
        );
      }
    }
    const incoming = new Map<string, string[]>();
    for (const relationship of overviewRelationshipMap.values()) {
      if (relationship.kind !== "ces.relationship.contributes-to") continue;
      const values = incoming.get(relationship.to_id) ?? [];
      values.push(relationship.from_id);
      incoming.set(relationship.to_id, values);
    }
    for (const sources of incoming.values()) {
      if (sources.length < 2) continue;
      const indexes = sources.map((id) =>
        sequence.findIndex(({ workflow_id }) => workflow_id === id))
        .filter((index) => index >= 0).sort((left, right) => left - right);
      if (indexes.length < 2 || indexes.at(-1)! - indexes[0]! !== indexes.length - 1) {
        continue;
      }
      const parent = sequence[indexes[0]! - 1];
      if (!parent) continue;
      for (const sourceId of sources) {
        addOverviewRelationship(
          parent.workflow_id, sourceId, "ces.relationship.enables", [sourceUnitId],
        );
      }
      const predecessor = sequence[indexes[0]! - 2];
      if (predecessor) {
        addOverviewRelationship(
          predecessor.workflow_id, parent.workflow_id,
          "ces.relationship.precedes", [sourceUnitId],
        );
      }
    }
  }
  const overviewReportingIds = workflows
    .filter((workflow) =>
      workflowPurpose.get(workflow.workflow_id) === "ces.section.reporting-audit"
      && [...semanticTokens(workflow.label)].some((token) =>
        ["dashboard", "laporan", "report", "ringkasan", "summary"].includes(token)))
    .map(({ workflow_id }) => workflow_id);
  for (const reportingId of overviewReportingIds) {
    const providers = new Set([...overviewRelationshipMap.values()]
      .filter(({ to_id, kind }) =>
        to_id === reportingId && kind === "ces.relationship.provides-data-to")
      .map(({ from_id }) => from_id));
    let changed = true;
    while (changed) {
      changed = false;
      for (const relationship of overviewRelationshipMap.values()) {
        if (!["ces.relationship.precedes", "ces.relationship.enables",
          "ces.relationship.contributes-to"].includes(relationship.kind)) continue;
        if (providers.has(relationship.to_id) && !providers.has(relationship.from_id)) {
          providers.add(relationship.from_id);
          changed = true;
        }
      }
    }
    for (const providerId of providers) {
      addOverviewRelationship(
        providerId, reportingId, "ces.relationship.provides-data-to",
        workflowEvidence.get(reportingId) ?? [],
      );
    }
  }
  const overviewRelationships = [...overviewRelationshipMap.values()]
    .sort((left, right) => compareText(left.id, right.id));
  const { workflowAssignments, crossCuttingAssignments, assignmentDiagnostics } = buildAtlasAssignments({
    projectId, proposalRevision: 1, records, workflows, operations,
  });
  const modelSupport = assessAtlasModelSupport({
    proposalRevision: 1,
    records,
    workflowEdges,
    overviewRelationshipCount: overviewRelationships.length,
  });
  const workflowNodes = groups.map((group) => {
    const representative = group.candidates[0]!;
    return {
    id: nodeIds.get(representative.candidate_id)!,
    label: representative.statement,
    semantic_record_ids: [recordIds.get(representative.candidate_id)!],
    source_unit_ids: [...new Set(group.candidates.flatMap(({ source_unit_ids }) =>
      source_unit_ids))].sort(compareText),
  }});
  const groundedRelationships = [
    ...buildGroundedAtlasRelationships({ projectId, records, workflowNodes }),
    ...overviewRelationships,
  ];
  const relationshipHints = groundedRelationships.map((edge) => ({
    hint_id: `${edge.id}.hint`,
    from_id: edge.from_id,
    to_id: edge.to_id,
    relationship_kind: edge.kind,
    source_unit_ids: edge.source_unit_ids,
    rationale: "Lexical and shared-evidence signals suggest this relationship.",
    confidence: 0.6,
    publishable: false as const,
  }));
  const {
    candidates: relationshipCandidates,
    diagnostics: relationshipTargetDiagnostics,
  } = buildAtlasRelationshipCandidates({
    projectId,
    proposalRevision: 1,
    edges: groundedRelationships,
  });
  const byUnit = new Map<string, string[]>();
  const classificationByUnit = new Map(input.canonicalExtraction.sectionClassifications
    .map((classification) => [classification.source_unit_id, classification] as const));
  for (const candidate of inventory.candidates) {
    for (const sourceUnitId of candidate.source_unit_ids) {
      const linked = byUnit.get(sourceUnitId) ?? [];
      linked.push(candidate.candidate_id);
      byUnit.set(sourceUnitId, linked);
    }
  }
  const normativeSourceUnitIds = units
    .filter((unit) => classificationByUnit.get(unit.id)?.disposition === "normative")
    .map(({ id }) => id);
  const atomicClaims = createAtomicClaims({
    source_revision_id: inventory.source_revision_id,
    source_units: units,
    claims: decomposeAtomicClaims({
      source_units: units,
      normative_source_unit_ids: normativeSourceUnitIds,
    }),
  });
  const claimsPerUnit = new Map<string, number>();
  for (const claim of atomicClaims.claims) {
    claimsPerUnit.set(claim.source_unit_id, (claimsPerUnit.get(claim.source_unit_id) ?? 0) + 1);
  }
  const atomicClaimCoverage = calculateAtomicClaimCoverage({
    atomic_claims: atomicClaims,
    candidate_ids: inventory.candidates.map(({ candidate_id }) => candidate_id),
    record_ids: records.map(({ id }) => id),
    entries: atomicClaims.claims.map((claim) => {
      const sourceCandidates = inventory.candidates.filter(({ source_unit_ids }) =>
        source_unit_ids.includes(claim.source_unit_id));
      const normalizedClaim = normalizeClaimMatchText(claim.statement);
      const matchingCandidates = (claimsPerUnit.get(claim.source_unit_id) === 1
        ? sourceCandidates
        : sourceCandidates.filter(({ statement }) => {
          const normalizedCandidate = normalizeClaimMatchText(statement);
          return normalizedCandidate.includes(normalizedClaim)
            || normalizedClaim.includes(normalizedCandidate);
        }));
      const candidateIds = matchingCandidates.map(({ candidate_id }) => candidate_id)
        .sort(compareText);
      const canonicalRecordIds = [...new Set(candidateIds
        .map((candidateId) => recordIds.get(candidateId)!))].sort(compareText);
      if (claim.review_required) {
        return {
          claim_id: claim.claim_id,
          disposition: "human_review_required" as const,
          candidate_ids: candidateIds,
          record_ids: canonicalRecordIds,
          reason: "Deterministic decomposition found a potentially compound claim boundary.",
        };
      }
      return candidateIds.length > 0 ? {
        claim_id: claim.claim_id,
        disposition: "represented" as const,
        candidate_ids: candidateIds,
        record_ids: canonicalRecordIds,
      } : {
        claim_id: claim.claim_id,
        disposition: "uncovered" as const,
        candidate_ids: [],
        record_ids: [],
        reason: "No candidate is textually attributable to this atomic claim.",
      };
    }),
  });
  const atomicClaimRetryScope = createAtomicClaimRetryScope({
    report: atomicClaimCoverage,
    attempt: 1,
    prior_candidate_ids: inventory.candidates.map(({ candidate_id }) => candidate_id),
  });
  const coverage = calculatePipelineCoverage({
    source_revision_id: inventory.source_revision_id,
    semantic_kind_registry_id: registry.id,
    source_unit_ids: units.map(({ id }) => id),
    candidate_sources: Object.fromEntries(inventory.candidates.map((candidate) => [
      candidate.candidate_id, candidate.source_unit_ids,
    ])),
    normalized_record_ids: [...new Set(recordIds.values())],
    workflow_node_ids: [...new Set(nodeIds.values())],
    graph_node_ids: [...new Set(nodeIds.values())],
    source_coverage: units.map((unit) => {
      const candidateIds = byUnit.get(unit.id) ?? [];
      const classification = classificationByUnit.get(unit.id);
      const normative = classification?.disposition === "normative";
      const covered = candidateIds.length > 0;
      return {
        source_unit_id: unit.id,
        normative,
        current_stage: !normative ? "non_normative" as const
          : covered ? "projected" as const : "unmapped" as const,
        candidate_ids: candidateIds,
        normalized_record_ids: [...new Set(candidateIds.map((id) => recordIds.get(id)!))],
        workflow_node_ids: [...new Set(candidateIds.map((id) => nodeIds.get(id)!))],
        graph_node_ids: [...new Set(candidateIds.map((id) => nodeIds.get(id)!))],
        ...(!normative ? { reason: "Mechanical heading unit retained as context." } : {}),
        stage_history: [{
          stage: !normative ? "non_normative" as const
            : covered ? "projected" as const : "unmapped" as const,
          status: covered || !normative ? "included" as const : "lost" as const,
        }],
      };
    }),
    record_coverage: records.map((record) => ({
      record_id: record.id,
      semantic_kind_id: record.semantic_kind_id,
      candidate_ids: record.candidate_ids,
      source_unit_ids: record.source_unit_ids,
    })),
  });
  const findings = createCompletenessCriticReport({
    coverage,
    findings: coverage.source_coverage
      .filter(({ normative, current_stage }) => normative && current_stage === "unmapped")
      .map((unit) => ({
        finding_type: "uncovered_normative_source" as const,
        pipeline_stage: "unmapped" as const,
        source_unit_ids: [unit.source_unit_id],
        candidate_ids: [],
        record_ids: [],
        semantic_kind_ids: [],
        severity: "blocking" as const,
        statement: "Normative source unit has no canonical candidate.",
        recommended_action: "targeted_retry" as const,
        resolution_history: [],
      })),
  });
  const model = createProposedProjectModel({
    project_id: projectId,
    proposal_revision: 1,
    source_revision_id: inventory.source_revision_id,
    kind_registry: registry,
    candidate_inventory: inventory,
    records,
    model_support: modelSupport,
    workflows,
    operations,
    workflow_edges: workflowEdges,
    workflow_assignments: workflowAssignments,
    cross_cutting_assignments: crossCuttingAssignments,
    workflow_nodes: workflowNodes,
    relationship_hints: relationshipHints,
    relationship_candidates: relationshipCandidates,
    relationships: [],
    source_documents: input.canonicalExtraction.sourceArtifacts.map(
      ({ document_revision }) => ({
        document_id: document_revision.document_id,
        document_version: document_revision.revision_hash,
        content_hash: document_revision.content_hash,
      })),
    source_coverage: coverage,
    extraction_findings: findings,
    compatibility_projections: records.map(({ id, semantic_kind_id }) => ({
      record_id: id,
      classification: semantic_kind_id === "ces.kind.capability"
        ? "lossless" as const : "lossy" as const,
      ...(semantic_kind_id === "ces.kind.capability" ? {} : {
        reason: "Legacy review projection cannot represent the full canonical semantic kind.",
      }),
    })),
    approval_blockers: findings.findings
      .filter(({ severity }) => severity === "blocking")
      .map(({ id }) => id),
  });
  const graph = projectProposedWorkflowGraph(model);
  const focusedProjections = createFocusedAtlasProjections({ model, page_size: 25 });
  const integratedProjection = createIntegratedSemanticGraphProjection({ model });
  const proposedWorkflowArtifacts = createProposedWorkflowArtifacts(focusedProjections.workflow_details);
  const identityReport = createRecordIdentityReport({
    project_id: projectId,
    proposal_revision: 1,
    identities: records.map(({ identity }) => identity),
  });
  const terminologyProposals = records
    .filter(({ semantic_kind_id }) => semantic_kind_id === "ces.kind.terminology")
    .map((record) => createTerminologyProposal({
      source_terms: [{
        language: record.multilingual.original_language.detected_language,
        value: record.multilingual.original_statement,
      }],
      canonical_concept: `${projectId}.concept.term.${record.identity.semantic_fingerprint.slice(7, 19)}`,
      source_unit_ids: record.source_unit_ids,
    }));
  const expandedEligibility = calculateExpandedApprovalEligibility({
    model,
    atomic_claim_coverage: atomicClaimCoverage,
    terminology_proposals: terminologyProposals,
  });
  return {
    "source-units.json": collectionCanonicalJson(units),
    "atomic-claims.json": collectionCanonicalJson(atomicClaims),
    "claim-coverage.json": collectionCanonicalJson(atomicClaimCoverage),
    "record-identity-report.json": collectionCanonicalJson(identityReport),
    "proposed-model-support-assessment.json": collectionCanonicalJson(modelSupport),
    "workflows.json": collectionCanonicalJson(workflows),
    "operations.json": collectionCanonicalJson(operations),
    "workflow-edges.json": collectionCanonicalJson(workflowEdges),
    "workflow-assignments.json": collectionCanonicalJson(workflowAssignments),
    "workflow-assignment-diagnostics.json": canonicalJson(assignmentDiagnostics),
    "workflow-topology-diagnostics.json": canonicalJson({
      schema_version: "1.0.0",
      source_order_edge_count: 0,
      contextual_flow_sequences: contextualFlowSequences,
      overview_relationship_count: overviewRelationships.length,
    }),
    "cross-cutting-assignments.json": collectionCanonicalJson(crossCuttingAssignments),
    "candidate-relationship-hints.json": collectionCanonicalJson(relationshipHints),
    "relationship-candidates.json": collectionCanonicalJson(relationshipCandidates),
    "relationship-target-diagnostics.json": canonicalJson(relationshipTargetDiagnostics),
    "reviewer-augmentations.json": collectionCanonicalJson([]),
    "approval-eligibility.json": collectionCanonicalJson(expandedEligibility),
    "terminology-proposals.json": collectionCanonicalJson(terminologyProposals),
    "translation-equivalence-proposals.json": collectionCanonicalJson([]),
    ...(atomicClaimRetryScope ? {
      "claim-retry-scope.json": collectionCanonicalJson(atomicClaimRetryScope),
    } : {}),
    "source-coverage.json": collectionCanonicalJson(coverage),
    "extraction-findings.json": collectionCanonicalJson(findings),
    "proposed-project-model.json": collectionCanonicalJson(model),
    "proposed-project-overview-graph.json": collectionCanonicalJson(
      focusedProjections.project_overview,
    ),
    "proposed-project-overview-graph.mmd": renderProjectOverviewMermaid(
      focusedProjections.project_overview,
    ),
    "proposed-integrated-semantic-graph-index.json": collectionCanonicalJson(
      integratedProjection.index,
    ),
    "proposed-integrated-semantic-graph/summary.json": collectionCanonicalJson(
      integratedProjection.summary,
    ),
    ...Object.fromEntries(integratedProjection.layers.map((layer) => [
      integratedProjection.index.layers.find(({ layer: name }) => name === layer.layer)!.artifact,
      collectionCanonicalJson(layer),
    ])),
    "proposed-model-projection-index.json": collectionCanonicalJson(
      integratedProjection.model_projection_index,
    ),
    ...Object.fromEntries(integratedProjection.model_projections.map((projection) => [
      projection.artifact, collectionCanonicalJson(projection),
    ])),
    "proposed-workflow-detail-graphs.json": collectionCanonicalJson(
      focusedProjections.workflow_details,
    ),
    ...proposedWorkflowArtifacts,
    "proposed-rules-controls-index.json": collectionCanonicalJson(
      focusedProjections.rules_controls_index,
    ),
    ...Object.fromEntries(focusedProjections.rules_controls_slices.map((slice) => [
      slice.artifact,
      collectionCanonicalJson(slice),
    ])),
    "proposed-traceability-graph.json": collectionCanonicalJson(
      focusedProjections.traceability,
    ),
    "proposed-approval-exceptions.json": collectionCanonicalJson(
      focusedProjections.approval_exceptions,
    ),
    "proposed-relationship-review.json": collectionCanonicalJson(
      focusedProjections.relationship_review,
    ),
    "proposed-system-intent-graph.json": renderWorkflowGraphJson(graph),
    "proposed-system-intent-graph.md": renderWorkflowGraphMarkdown(graph),
    "proposed-system-intent-graph.mmd": renderWorkflowGraphMermaid(graph),
  };
}

export function buildProposedAtlasArtifacts(input: {
  readonly analysis: z.infer<typeof AtlasProviderResultSchema>;
  readonly documents: readonly { document_id: string; path: string; content: string }[];
  readonly projectIntent: z.infer<typeof ProjectIntentSchema>;
  readonly sourceHashes: readonly { document_id: string; content_hash: string }[];
  readonly promptContractVersion: string;
  readonly provider: { readonly provider: string; readonly model: string };
}): Record<string, string> {
  const projectId = stableId(input.projectIntent.project.id);
  const sourceRevisionId = `${projectId}.rev.${hashCanonical(input.sourceHashes).slice(7, 19)}`;
  const registry = createSemanticKindRegistry();
  const requirements = input.analysis.candidate_requirements;
  const rules = input.analysis.candidate_business_rules;
  const legacyCandidates = [...requirements, ...rules];
  const sourceArtifacts = input.documents.map((document) => buildSourceArtifacts({
    document_id: stableId(document.document_id),
    path: document.path,
    content: document.content,
    paragraph_mode: document.path.toLowerCase().endsWith(".pdf") ? "line" : "contiguous",
  }));
  const units = sourceArtifacts.flatMap(({ source_units }) => source_units);
  const artifactsByDocument = new Map(input.documents.map((document, index) => [
    document.document_id,
    sourceArtifacts[index]!,
  ]));
  const candidateIds = new Map(legacyCandidates.map((candidate) => [
    candidate.candidate_id,
    `${projectId}.candidate.${stableId(candidate.candidate_id)}`,
  ]));
  const nodeIds = new Map(legacyCandidates.map((candidate) => [
    candidate.candidate_id,
    `${projectId}.${"title" in candidate ? "workflow" : "rule"}.${stableId(candidate.candidate_id)}`,
  ]));
  const sourceUnitIds = new Map(legacyCandidates.map((candidate) => {
    const artifacts = artifactsByDocument.get(candidate.source.document_id);
    const overlapping = artifacts?.source_units.filter((unit) =>
      candidate.source.line_start !== undefined
      && candidate.source.line_end !== undefined
      && unit.location.line_start <= candidate.source.line_end
      && unit.location.line_end >= candidate.source.line_start) ?? [];
    const sectionMatches = overlapping.length === 0 && candidate.source.section
      ? artifacts?.source_units.filter((unit) =>
        unit.section_path.includes(candidate.source.section!)) ?? []
      : [];
    const selected = overlapping.length > 0 ? overlapping
      : sectionMatches.length > 0 ? sectionMatches
        : artifacts?.source_units.slice(0, 1) ?? [];
    return [candidate.candidate_id, selected.map(({ id }) => id)] as const;
  }));
  const kindFor = (candidate: typeof legacyCandidates[number]): string => {
    if ("title" in candidate) return "ces.kind.workflow";
    return ({
      authorization: "ces.kind.role-permission",
      validation: "ces.kind.validation-constraint",
      uniqueness: "ces.kind.uniqueness-constraint",
      financial: "ces.kind.business-rule",
      lifecycle: "ces.kind.lifecycle-rule",
      state_transition: "ces.kind.state-transition",
      consistency: "ces.kind.business-rule",
    } as Record<string, string>)[candidate.type] ?? "ces.kind.business-rule";
  };
  const statementFor = (candidate: typeof legacyCandidates[number]): string =>
    "title" in candidate ? candidate.title : candidate.statement;
  const sourceLineage = new Map(units.map((unit) => [unit.id, unit.content_hash] as const));
  const recordIdentities = new Map(legacyCandidates.map((candidate) => {
    const identity = createCanonicalRecordIdentity({
      project_id: projectId,
      proposal_revision: 1,
      semantic_kind_id: kindFor(candidate),
      canonical_semantic_key: statementFor(candidate),
      stable_source_lineage_keys: sourceUnitIds.get(candidate.candidate_id)!
        .map((id) => sourceLineage.get(id)!),
    });
    return [candidate.candidate_id, identity] as const;
  }));
  const recordIds = new Map([...recordIdentities].map(([candidateId, identity]) =>
    [candidateId, identity.record_id] as const));
  const inventoryCandidates = legacyCandidates.map((candidate) => ({
    contract_version: "1.0.0" as const,
    candidate_id: candidateIds.get(candidate.candidate_id)!,
    statement: statementFor(candidate),
    provisional_kind: kindFor(candidate),
    source_unit_ids: sourceUnitIds.get(candidate.candidate_id)!,
    confidence: candidate.inference.confidence,
    extraction_role: "atlas.section-extractor",
    classification_status: "classified" as const,
    evidence_status: "source_anchored" as const,
    payload_hash: hashCanonical(candidate),
    provider_metadata: {
      provider_id: stableId(input.provider.provider),
      model_id: input.provider.model,
      contract_version: input.promptContractVersion,
    },
  }));
  const inventory = createAtlasCandidateInventory({
    source_revision_id: sourceRevisionId,
    lexicon_revision_id: `${projectId}.lexicon.default`,
    semantic_schema_version: "1.0.0",
    semantic_kind_registry_id: registry.id,
    semantic_kind_registry_hash: registry.content_hash,
    prompt_contract_version: input.promptContractVersion,
    allowed_source_unit_ids: units.map(({ id }) => id),
    candidates: inventoryCandidates,
  });
  const issueCodes = (candidateId: string) => {
    const codes = new Set<string>();
    if (input.analysis.uncertainties.some(({ affected_requirement_ids }) =>
      affected_requirement_ids.includes(candidateId))) codes.add("source-ambiguity");
    if (input.analysis.conflicts.some(({ source_requirement_ids }) =>
      source_requirement_ids.includes(candidateId))) codes.add("source-conflict");
    return codes;
  };
  const records = legacyCandidates.map((candidate) => {
    const derived = candidate.inference.origin === "inferred";
    const issues = issueCodes(candidate.candidate_id);
    if (derived) issues.add("derived-interpretation-requires-review");
    return {
      id: recordIds.get(candidate.candidate_id)!,
      identity: recordIdentities.get(candidate.candidate_id)!,
      candidate_ids: [candidateIds.get(candidate.candidate_id)!],
      semantic_kind_id: kindFor(candidate),
      statement: statementFor(candidate),
      multilingual: createMultilingualStatement({
        original_statement: statementFor(candidate),
      }),
      source_unit_ids: sourceUnitIds.get(candidate.candidate_id)!,
      classification_status: "classified" as const,
      origin: derived ? "derived" as const : "explicit" as const,
      review_status: "pending" as const,
      details: [{
        key: "legacy-candidate-id",
        value: candidate.candidate_id,
      }],
      issues: [...issues].sort(compareText).map((code) => ({
        code,
        severity: code === "source-conflict" ? "blocking" as const : "review_required" as const,
      })),
    };
  });
  const operationRecords = records.filter(({ semantic_kind_id }) =>
    ["ces.kind.workflow", "ces.kind.operational-procedure", "ces.kind.state-transition",
      "ces.kind.state-definition"].includes(semantic_kind_id));
  const workflowIdByRecord = new Map(records
    .filter(({ semantic_kind_id }) => semantic_kind_id === "ces.kind.workflow")
    .map((record) => [record.id, `${projectId}.workflow.${record.id.split(".").at(-1)!}`] as const));
  const operationIdByRecord = new Map(operationRecords.map((record) =>
    [record.id, `${projectId}.operation.${record.id.split(".").at(-1)!}`] as const));
  const initialWorkflows = records
    .filter(({ semantic_kind_id }) => semantic_kind_id === "ces.kind.workflow")
    .map((record) => ({
      workflow_id: workflowIdByRecord.get(record.id)!,
      label: record.statement,
      summary: record.statement,
      operation_ids: [operationIdByRecord.get(record.id)!],
      source_unit_ids: record.source_unit_ids,
      governance: governanceEnvelope({
        id: `${projectId}.governance.workflow.${record.id.split(".").at(-1)!}`,
        record,
        proposalRevision: 1,
      }),
    }));
  const initialOperations = operationRecords.map((record) => ({
    operation_id: operationIdByRecord.get(record.id)!,
    ...(workflowIdByRecord.has(record.id)
      ? { workflow_id: workflowIdByRecord.get(record.id)! }
      : {}),
    label: record.statement,
    operation_kind: record.semantic_kind_id === "ces.kind.state-definition"
      ? "state" as const : "action" as const,
    semantic_record_ids: [record.id],
    source_unit_ids: record.source_unit_ids,
    governance: governanceEnvelope({
      id: `${projectId}.governance.operation.${record.id.split(".").at(-1)!}`,
      record,
      proposalRevision: 1,
    }),
  }));
  const { workflows, operations, workflowEdges } = assembleAtlasWorkflowTopology({
    projectId,
    proposalRevision: 1,
    records,
    workflows: initialWorkflows,
    operations: initialOperations,
  });
  const { workflowAssignments, crossCuttingAssignments, assignmentDiagnostics } = buildAtlasAssignments({
    projectId, proposalRevision: 1, records, workflows, operations,
  });
  const modelSupport = assessAtlasModelSupport({
    proposalRevision: 1,
    records,
    workflowEdges,
  });
  const workflowNodes = legacyCandidates.map((candidate) => ({
    id: nodeIds.get(candidate.candidate_id)!,
    label: statementFor(candidate),
    semantic_record_ids: [recordIds.get(candidate.candidate_id)!],
    source_unit_ids: sourceUnitIds.get(candidate.candidate_id)!,
  }));
  const requirementByReference = new Map(requirements.flatMap((candidate) => [
    [candidate.proposed_logical_id, candidate] as const,
    [candidate.candidate_id, candidate] as const,
  ]));
  const groundedRelationships = rules.flatMap((rule) =>
    rule.source_requirement_ids.flatMap((logicalId) => {
      const requirement = requirementByReference.get(logicalId);
      if (!requirement) return [];
      return [{
        id: `${projectId}.relationship.${stableId(rule.candidate_id)}.${stableId(requirement.candidate_id)}`,
        from_id: nodeIds.get(rule.candidate_id)!,
        to_id: nodeIds.get(requirement.candidate_id)!,
        kind: "ces.relationship.constrains",
        source_unit_ids: sourceUnitIds.get(rule.candidate_id)!,
      }];
    }));
  const coverage = calculatePipelineCoverage({
    source_revision_id: sourceRevisionId,
    semantic_kind_registry_id: registry.id,
    source_unit_ids: units.map(({ id }) => id),
    candidate_sources: Object.fromEntries(legacyCandidates.map((candidate) => [
      candidateIds.get(candidate.candidate_id)!,
      sourceUnitIds.get(candidate.candidate_id)!,
    ])),
    normalized_record_ids: [...recordIds.values()],
    workflow_node_ids: [...nodeIds.values()],
    graph_node_ids: [...nodeIds.values()],
    source_coverage: units.map((unit) => {
      const linked = legacyCandidates.filter((candidate) =>
        sourceUnitIds.get(candidate.candidate_id)!.includes(unit.id));
      const normative = unit.kind !== "heading";
      const covered = linked.length > 0;
      return {
        source_unit_id: unit.id,
        normative,
        current_stage: !normative ? "non_normative" as const
          : covered ? "projected" as const : "unmapped" as const,
        candidate_ids: linked.map((candidate) => candidateIds.get(candidate.candidate_id)!),
        normalized_record_ids: linked.map((candidate) => recordIds.get(candidate.candidate_id)!),
        workflow_node_ids: linked.map((candidate) => nodeIds.get(candidate.candidate_id)!),
        graph_node_ids: linked.map((candidate) => nodeIds.get(candidate.candidate_id)!),
        ...(!normative ? { reason: "Mechanical heading unit; content retained as context." } : {}),
        stage_history: [{
          stage: !normative ? "non_normative" as const
            : covered ? "projected" as const : "unmapped" as const,
          status: covered || !normative ? "included" as const : "lost" as const,
        }],
      };
    }),
    record_coverage: legacyCandidates.map((candidate) => ({
      record_id: recordIds.get(candidate.candidate_id)!,
      semantic_kind_id: kindFor(candidate),
      candidate_ids: [candidateIds.get(candidate.candidate_id)!],
      source_unit_ids: sourceUnitIds.get(candidate.candidate_id)!,
    })),
  });
  const uncoveredUnits = coverage.source_coverage.filter(({ normative, current_stage }) =>
    normative && current_stage === "unmapped");
  const findings = createCompletenessCriticReport({
    coverage,
    findings: uncoveredUnits.map((unit) => ({
      finding_type: "uncovered_normative_source" as const,
      pipeline_stage: "unmapped" as const,
      source_unit_ids: [unit.source_unit_id],
      candidate_ids: [],
      record_ids: [],
      semantic_kind_ids: [],
      severity: "blocking" as const,
      statement: "Normative source unit has no extracted candidate.",
      recommended_action: "targeted_retry" as const,
      resolution_history: [],
    })),
  });
  const blockers = [
    ...input.analysis.uncertainties.map(({ id }) => `uncertainty-${stableId(id)}`),
    ...input.analysis.conflicts.map(({ id }) => `conflict-${stableId(id)}`),
    ...input.analysis.clarification_questions.filter(({ blocking }) => blocking)
      .map(({ id }) => `question-${stableId(id)}`),
  ];
  const {
    candidates: relationshipCandidates,
    diagnostics: relationshipTargetDiagnostics,
  } = buildAtlasRelationshipCandidates({
    projectId,
    proposalRevision: 1,
    edges: groundedRelationships,
  });
  const model = createProposedProjectModel({
    project_id: projectId,
    proposal_revision: 1,
    source_revision_id: sourceRevisionId,
    kind_registry: registry,
    candidate_inventory: inventory,
    records,
    model_support: modelSupport,
    workflows,
    operations,
    workflow_edges: workflowEdges,
    workflow_assignments: workflowAssignments,
    cross_cutting_assignments: crossCuttingAssignments,
    workflow_nodes: workflowNodes,
    relationship_hints: groundedRelationships.map((edge) => ({
      hint_id: `${edge.id}.hint`,
      from_id: edge.from_id,
      to_id: edge.to_id,
      relationship_kind: edge.kind,
      source_unit_ids: edge.source_unit_ids,
      rationale: "Legacy source references suggest this relationship.",
      confidence: 0.7,
      publishable: false as const,
    })),
    relationship_candidates: relationshipCandidates,
    relationships: [],
    source_documents: sourceArtifacts.map(({ document_revision }) => ({
      document_id: document_revision.document_id,
      document_version: document_revision.revision_hash,
      content_hash: document_revision.content_hash,
    })),
    source_coverage: coverage,
    extraction_findings: findings,
    compatibility_projections: records.map(({ id }) => ({
      record_id: id,
      classification: "lossless" as const,
    })),
    approval_blockers: blockers,
  });
  const graph = projectProposedWorkflowGraph(model);
  const focusedProjections = createFocusedAtlasProjections({ model, page_size: 25 });
  const integratedProjection = createIntegratedSemanticGraphProjection({ model });
  const proposedWorkflowArtifacts = createProposedWorkflowArtifacts(focusedProjections.workflow_details);
  const identityReport = createRecordIdentityReport({
    project_id: projectId,
    proposal_revision: 1,
    identities: records.map(({ identity }) => identity),
  });
  const terminologyProposals = records
    .filter(({ semantic_kind_id }) => semantic_kind_id === "ces.kind.terminology")
    .map((record) => createTerminologyProposal({
      source_terms: [{
        language: record.multilingual.original_language.detected_language,
        value: record.multilingual.original_statement,
      }],
      canonical_concept: `${projectId}.concept.term.${record.identity.semantic_fingerprint.slice(7, 19)}`,
      source_unit_ids: record.source_unit_ids,
    }));
  const expandedEligibility = calculateExpandedApprovalEligibility({
    model,
    terminology_proposals: terminologyProposals,
  });
  return {
    "source-units.json": collectionCanonicalJson(units),
    "record-identity-report.json": collectionCanonicalJson(identityReport),
    "proposed-model-support-assessment.json": collectionCanonicalJson(modelSupport),
    "workflows.json": collectionCanonicalJson(workflows),
    "operations.json": collectionCanonicalJson(operations),
    "workflow-edges.json": collectionCanonicalJson(workflowEdges),
    "workflow-assignments.json": collectionCanonicalJson(workflowAssignments),
    "workflow-assignment-diagnostics.json": canonicalJson(assignmentDiagnostics),
    "cross-cutting-assignments.json": collectionCanonicalJson(crossCuttingAssignments),
    "candidate-relationship-hints.json": collectionCanonicalJson(
      model.relationship_hints,
    ),
    "relationship-candidates.json": collectionCanonicalJson(
      model.relationship_candidates,
    ),
    "relationship-target-diagnostics.json": canonicalJson(relationshipTargetDiagnostics),
    "reviewer-augmentations.json": collectionCanonicalJson([]),
    "approval-eligibility.json": collectionCanonicalJson(expandedEligibility),
    "terminology-proposals.json": collectionCanonicalJson(terminologyProposals),
    "translation-equivalence-proposals.json": collectionCanonicalJson([]),
    "source-coverage.json": collectionCanonicalJson(coverage),
    "extraction-findings.json": collectionCanonicalJson(findings),
    "proposed-project-model.json": collectionCanonicalJson(model),
    "proposed-project-overview-graph.json": collectionCanonicalJson(
      focusedProjections.project_overview,
    ),
    "proposed-project-overview-graph.mmd": renderProjectOverviewMermaid(
      focusedProjections.project_overview,
    ),
    "proposed-integrated-semantic-graph-index.json": collectionCanonicalJson(
      integratedProjection.index,
    ),
    "proposed-integrated-semantic-graph/summary.json": collectionCanonicalJson(
      integratedProjection.summary,
    ),
    ...Object.fromEntries(integratedProjection.layers.map((layer) => [
      integratedProjection.index.layers.find(({ layer: name }) => name === layer.layer)!.artifact,
      collectionCanonicalJson(layer),
    ])),
    "proposed-model-projection-index.json": collectionCanonicalJson(
      integratedProjection.model_projection_index,
    ),
    ...Object.fromEntries(integratedProjection.model_projections.map((projection) => [
      projection.artifact, collectionCanonicalJson(projection),
    ])),
    "proposed-workflow-detail-graphs.json": collectionCanonicalJson(
      focusedProjections.workflow_details,
    ),
    ...proposedWorkflowArtifacts,
    "proposed-rules-controls-index.json": collectionCanonicalJson(
      focusedProjections.rules_controls_index,
    ),
    ...Object.fromEntries(focusedProjections.rules_controls_slices.map((slice) => [
      slice.artifact,
      collectionCanonicalJson(slice),
    ])),
    "proposed-traceability-graph.json": collectionCanonicalJson(
      focusedProjections.traceability,
    ),
    "proposed-approval-exceptions.json": collectionCanonicalJson(
      focusedProjections.approval_exceptions,
    ),
    "proposed-relationship-review.json": collectionCanonicalJson(
      focusedProjections.relationship_review,
    ),
    "proposed-system-intent-graph.json": renderWorkflowGraphJson(graph),
    "proposed-system-intent-graph.md": renderWorkflowGraphMarkdown(graph),
    "proposed-system-intent-graph.mmd": renderWorkflowGraphMermaid(graph),
  };
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
  const apiKey = process.env.CES_ATLAS_API_KEY
    ?? process.env.AGENTS_BRIDGE_API_KEY;
  return new HttpAtlasProvider({
    endpoint,
    provider,
    model,
    ...(apiKey ? { apiKey } : {}),
  });
}

function rejectAtlasSecretArguments(options: Readonly<Record<string, string>>): void {
  for (const name of ["api-key", "token", "secret"]) {
    if (options[name]) {
      throw new CliInputError(
        `--${name} is forbidden; use CES_ATLAS_API_KEY or the local AGENTS_BRIDGE_API_KEY fallback`,
      );
    }
  }
}

async function retainedPendingArtifacts(
  outputDirectory: string,
): Promise<Record<string, string>> {
  const retained: Record<string, string> = {};
  for (const path of [
    "approval-eligibility.json",
    "source-index.json",
    "candidate-analysis.json",
    "candidate-relationship-hints.json",
    "clarification-questions.json",
    "review-input.json",
    "proposed-project-model.json",
    "proposed-project-overview-graph.json",
    "proposed-project-overview-graph.mmd",
    "proposed-workflow-detail-graphs.json",
    "proposed-workflow-index.json",
    "proposed-rules-controls-index.json",
    "proposed-traceability-graph.json",
    "proposed-approval-exceptions.json",
    "proposed-relationship-review.json",
    "proposed-system-intent-graph.json",
    "proposed-system-intent-graph.md",
    "proposed-system-intent-graph.mmd",
    "source-units.json",
    "atomic-claims.json",
    "claim-coverage.json",
    "claim-retry-scope.json",
    "record-identity-report.json",
    "relationship-candidates.json",
    "relationship-target-diagnostics.json",
    "reviewer-augmentations.json",
    "terminology-proposals.json",
    "translation-equivalence-proposals.json",
    "workflows.json",
    "operations.json",
    "workflow-edges.json",
    "workflow-assignment-diagnostics.json",
    "workflow-assignments.json",
    "cross-cutting-assignments.json",
    "source-coverage.json",
    "extraction-findings.json",
    "pdf-ingestion.json",
    "section-purpose-registry.json",
    "section-classifications.json",
    "document-structure.json",
    "candidate-inventory.json",
    "candidate-merge-report.json",
    "extractor-ledger.json",
    "legacy-projection-losses.json",
  ]) {
    const content = await readOptionalText(resolve(outputDirectory, path));
    if (content !== undefined) retained[path] = content;
  }
  const rulesIndex = retained["proposed-rules-controls-index.json"];
  if (rulesIndex) {
    const parsed = z.object({
      artifacts: z.array(z.object({ artifact: z.string().min(1) }).passthrough()),
    }).passthrough().parse(JSON.parse(rulesIndex));
    for (const { artifact } of parsed.artifacts) {
      const content = await readOptionalText(resolve(outputDirectory, artifact));
      if (content !== undefined) retained[artifact] = content;
    }
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

function normalizeClaimMatchText(value: string): string {
  return value.toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function governanceEnvelope(input: {
  readonly id: string;
  readonly record: {
    readonly origin: "explicit" | "derived" | "human_added";
    readonly source_unit_ids: readonly string[];
    readonly issues: readonly { readonly code: string; readonly severity: string }[];
  };
  readonly proposalRevision: number;
}) {
  const blockers = input.record.issues
    .filter(({ severity }) => severity !== "warning")
    .map(({ code }) => code)
    .sort(compareText);
  return {
    id: input.id,
    origin: input.record.origin,
    evidence_source_unit_ids: [...input.record.source_unit_ids],
    rationale: input.record.origin === "explicit"
      ? "Workflow structure is directly grounded in the canonical semantic record."
      : "Workflow structure is a derived interpretation requiring review.",
    confidence: input.record.origin === "explicit" ? 1 : 0.75,
    review_status: "pending" as const,
    bulk_approval_eligible: input.record.origin === "explicit" && blockers.length === 0,
    blockers,
    proposal_revision: input.proposalRevision,
  };
}

function buildAtlasAssignments(input: {
  readonly projectId: string;
  readonly proposalRevision: number;
  readonly records: readonly {
    readonly id: string;
    readonly semantic_kind_id: string;
    readonly statement: string;
    readonly source_unit_ids: readonly string[];
    readonly origin: "explicit" | "derived" | "human_added";
    readonly issues: readonly { readonly code: string; readonly severity: string }[];
  }[];
  readonly workflows: readonly {
    readonly workflow_id: string;
    readonly label: string;
    readonly semantic_role?: "business_workflow" | "shared_data" | "context_provider"
      | "state_workflow" | "reporting_audit";
    readonly source_unit_ids: readonly string[];
  }[];
  readonly operations: readonly {
    readonly operation_id: string;
    readonly workflow_id?: string;
    readonly label?: string;
    readonly source_unit_ids?: readonly string[];
    readonly semantic_record_ids: readonly string[];
  }[];
}) {
  const crossCuttingKindArea: Record<string, string> = {
    "ces.kind.role-permission": "authorization",
    "ces.kind.security-sensitive-restriction": "security",
    "ces.kind.lifecycle-rule": "retention",
    "ces.kind.uniqueness-constraint": "data-integrity",
  };
  const directWorkflowAssignments = input.records.flatMap((record) => {
    if (crossCuttingKindArea[record.semantic_kind_id]) return [];
    const directOperations = input.operations.filter(({ semantic_record_ids }) =>
      semantic_record_ids.includes(record.id));
    const directWorkflowIds = new Set(directOperations.flatMap(({ workflow_id }) =>
      workflow_id ? [workflow_id] : []));
    const candidates = input.workflows.map((workflow) => {
      const evidence = workflow.source_unit_ids.filter((id) =>
        record.source_unit_ids.includes(id));
      const lexicalScore = jaccard(
        semanticTokens(record.statement),
        semanticTokens(workflow.label),
      );
      return {
        workflow,
        evidence,
        lexicalScore,
        score: evidence.length * 10 + lexicalScore,
      };
    }).filter(({ evidence, lexicalScore }) => evidence.length > 0 || lexicalScore >= 0.15)
      .sort((left, right) => right.score - left.score
        || compareText(left.workflow.workflow_id, right.workflow.workflow_id));
    const strongest = candidates[0];
    const selectedCandidates = directWorkflowIds.size > 0
      ? candidates.filter(({ workflow }) => directWorkflowIds.has(workflow.workflow_id))
      : strongest
        ? candidates.filter(({ score, lexicalScore, evidence }) =>
          score === strongest.score
          && (evidence.length > 0 || lexicalScore >= 0.25))
        : [];
    const selected = selectedCandidates.length === input.workflows.length
      && input.workflows.length > 1
      ? []
      : selectedCandidates.slice(0, 3);
    return selected.map(({ workflow, score, evidence }) => {
        const operation = input.operations.find((item) =>
          item.workflow_id === workflow.workflow_id
          && item.semantic_record_ids.includes(record.id));
        const direct = operation !== undefined;
        const suffix = hashCanonical({
          record_id: record.id,
          workflow_id: workflow.workflow_id,
          operation_id: operation?.operation_id ?? null,
        }).slice(7, 19);
        const governance = governanceEnvelope({
          id: `${input.projectId}.governance.assignment.${suffix}`,
          record: {
            ...record,
            origin: direct ? record.origin : "derived",
          },
          proposalRevision: input.proposalRevision,
        });
        return {
          assignment_id: `${input.projectId}.assignment.${suffix}`,
          record_id: record.id,
          workflow_id: workflow.workflow_id,
          ...(operation ? { operation_id: operation.operation_id } : {}),
          applicability: direct ? "primary" as const : "supporting" as const,
          assignment_role: "membership" as const,
          governance: direct ? {
            ...governance,
            rationale: "The canonical operation directly references this semantic record.",
          } : {
            ...governance,
            rationale: evidence.length > 0
              ? "Shared source evidence and the strongest semantic match support this workflow assignment."
              : "A strong semantic-label match supports this workflow assignment without relying on document order.",
            confidence: Math.min(0.95, 0.5 + score / 20),
            bulk_approval_eligible: false,
            blockers: [...new Set([...governance.blockers, "derived-assignment"])].sort(compareText),
          },
        };
      });
  });
  const sharedConsumerAssignments = input.workflows
    .filter(({ semantic_role }) => semantic_role === "shared_data")
    .flatMap((provider) => {
      const providerTokens = semanticTokens(provider.label);
      const providerOperations = input.operations.filter(({ workflow_id }) =>
        workflow_id === provider.workflow_id);
      const representative = providerOperations
        .map((operation) => ({
          operation,
          score: jaccard(
            providerTokens,
            semanticTokens(input.records.find(({ id }) =>
              operation.semantic_record_ids.includes(id))?.statement ?? ""),
          ),
        }))
        .sort((left, right) => right.score - left.score
          || compareText(left.operation.operation_id, right.operation.operation_id))[0]?.operation;
      const recordId = representative?.semantic_record_ids[0];
      const record = input.records.find(({ id }) => id === recordId);
      if (!record) return [];
      return input.workflows.flatMap((consumer) => {
        if (consumer.workflow_id === provider.workflow_id
          || ["shared_data", "context_provider"].includes(consumer.semantic_role ?? "")) return [];
        const consumerOperations = input.operations.filter(({ workflow_id }) =>
          workflow_id === consumer.workflow_id);
        const consumerTokens = semanticTokens(consumerOperations
          .map(({ label }) => label ?? "").join(" "));
        const matched = [...providerTokens].filter((token) =>
          consumerTokens.has(token));
        if (providerTokens.size === 0 || matched.length / providerTokens.size < 0.5) return [];
        const assignmentRole = "shared_input" as const;
        const core = {
          record_id: record.id,
          workflow_id: consumer.workflow_id,
          assignment_role: assignmentRole,
        };
        const suffix = hashCanonical(core).slice(7, 19);
        const evidence = [...new Set([
          ...record.source_unit_ids,
          ...consumerOperations.flatMap(({ source_unit_ids }) => source_unit_ids ?? []),
        ])].sort(compareText);
        return [{
          assignment_id: `${input.projectId}.assignment.${suffix}`,
          ...core,
          applicability: "supporting" as const,
          governance: {
            id: `${input.projectId}.governance.assignment.${suffix}`,
            origin: "derived" as const,
            evidence_source_unit_ids: evidence,
            rationale: "Source-grounded consumer operations reference the shared semantic concept.",
            confidence: Math.min(0.95, 0.65 + matched.length / providerTokens.size * 0.25),
            review_status: "pending" as const,
            bulk_approval_eligible: false,
            blockers: ["derived-assignment"],
            proposal_revision: input.proposalRevision,
          },
        }];
      });
    });
  const workflowAssignments = [...new Map([
    ...directWorkflowAssignments,
    ...sharedConsumerAssignments,
  ].map((assignment) => [assignment.assignment_id, assignment] as const)).values()]
    .sort((left, right) => compareText(left.assignment_id, right.assignment_id));
  const crossCuttingAssignments = input.records.flatMap((record) => {
    const controlArea = crossCuttingKindArea[record.semantic_kind_id];
    if (!controlArea) return [];
    const suffix = hashCanonical({
      record_id: record.id,
      control_area: controlArea,
    }).slice(7, 19);
    return [{
      assignment_id: `${input.projectId}.cross-cutting.${suffix}`,
      record_id: record.id,
      control_area: controlArea,
      governance: governanceEnvelope({
        id: `${input.projectId}.governance.cross-cutting.${suffix}`,
        record,
        proposalRevision: input.proposalRevision,
      }),
    }];
  }).sort((left, right) => compareText(left.assignment_id, right.assignment_id));
  const tupleCounts = Map.groupBy(workflowAssignments, (assignment) =>
    `${assignment.workflow_id}:${assignment.record_id}:${"operation_id" in assignment
      ? assignment.operation_id ?? "" : ""}`);
  const recordAssignmentCounts = Map.groupBy(workflowAssignments, ({ record_id }) => record_id);
  const assignmentDiagnostics = {
    schema_version: "1.1.0",
    assignment_count: workflowAssignments.length,
    cross_cutting_count: crossCuttingAssignments.length,
    duplicate_tuple_count: [...tupleCounts.values()].filter((items) => items.length > 1).length,
    low_confidence_count: workflowAssignments.filter(({ governance }) =>
      governance.confidence < 0.75).length,
    unresolved_count: input.records.filter((record) =>
      !crossCuttingKindArea[record.semantic_kind_id]
      && !workflowAssignments.some(({ record_id }) => record_id === record.id)).length,
    overly_broad_count: [...recordAssignmentCounts.values()]
      .filter((assignments) => assignments
        .filter(({ assignment_role }) => assignment_role === "membership").length > 3).length,
    shared_input_count: workflowAssignments.filter(({ assignment_role }) =>
      assignment_role === "shared_input").length,
    context_input_count: 0,
    assignments_per_workflow: Object.fromEntries(input.workflows.map((workflow) => [
      workflow.workflow_id,
      workflowAssignments.filter(({ workflow_id }) =>
        workflow_id === workflow.workflow_id).length,
    ])),
    assignments_per_operation: Object.fromEntries(input.operations.map((operation) => [
      operation.operation_id,
      workflowAssignments.filter((assignment) =>
        "operation_id" in assignment
        && assignment.operation_id === operation.operation_id).length,
    ])),
  };
  return { workflowAssignments, crossCuttingAssignments, assignmentDiagnostics };
}

function createProposedWorkflowArtifacts(details: readonly {
  readonly workflow_id: string;
  readonly operations: readonly {
    readonly operation_id: string;
    readonly label: string;
    readonly operation_kind: string;
    readonly semantic_record_ids: readonly string[];
  }[];
  readonly edges: readonly {
    readonly edge_id: string;
    readonly from_operation_id: string;
    readonly to_operation_id: string;
    readonly edge_kind: string;
  }[];
}[]): Record<string, string> {
  const entries = details.map((detail) => {
    const directory = `proposed-workflows/${stableId(detail.workflow_id)}`;
    return {
      workflow_id: detail.workflow_id,
      flow_json: `${directory}/flow.json`,
      flow_mermaid: `${directory}/flow.mmd`,
      detail,
    };
  });
  return {
    "proposed-workflow-index.json": canonicalJson({
      schema_version: "1.0.0",
      authoritative: false,
      workflows: entries.map(({ workflow_id, flow_json, flow_mermaid }) => ({
        workflow_id,
        flow_json,
        flow_mermaid,
      })),
    }),
    ...Object.fromEntries(entries.flatMap(({ flow_json, flow_mermaid, detail }) => [
      [flow_json, canonicalJson(detail)],
      [flow_mermaid, renderFocusedWorkflowMermaid(detail)],
    ])),
  };
}

function stableId(value: string): string {
  const normalized = value.trim().toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/gu, "-")
    .replaceAll(/^[^a-z]+|[^a-z0-9]+$/gu, "");
  return normalized || `item-${hashCanonical(value).slice(7, 19)}`;
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
