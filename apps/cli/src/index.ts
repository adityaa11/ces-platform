#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assembleAtlasKnowledge } from "@company/ces-atlas-knowledge-assembly";
import { selectAtlasGraphTypes } from "@company/ces-atlas-graph-selection";
import { AtlasKnowledgeBundleSchema } from "@company/ces-atlas-knowledge-contracts";
import { approveAtlasKnowledge, atlasProposalHash, AtlasReviewDecisionSchema } from
  "@company/ces-atlas-knowledge-review";
import {
  SemanticFactExtractionOutputSchema,
  SemanticFactIntermediateSchema,
  finalizeSemanticFacts,
  type SemanticFactExtractionInput,
} from "@company/ces-atlas-semantic-facts";
import { sourceContentHash } from "@company/ces-document-ingestion";
import { ProjectIntentSchema } from "@company/ces-greenfield-contracts";
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
  parseProjectText,
  splitProjectContext,
} from "@company/ces-project-schema";
import { parseRequirementText } from "@company/ces-requirement-schema";
import { canonicalJson as collectionCanonicalJson } from "@company/ces-requirement-collection-schema";
import { buildSourceArtifacts, sourceSpansFromPdfPages } from "@company/ces-source-unit-schema";
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
  ces atlas approve --output <directory> --decisions <atlas-v2-decisions.json>
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
  8  Atlas extraction incomplete (diagnostics are written; no proposal is published)
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
  if (subcommand === "run") return runAtlasV2(options, io);
  if (subcommand === "approve") return approveAtlasV2(options, io);
  if (subcommand === "inspect") {
    io.stdout(await readFile(resolve(requireOption(options, "output"), "run-manifest.json"), "utf8"));
    return 0;
  }
  throw new CliInputError(`Unknown Atlas command: ${subcommand}`);
}

const AtlasV2DecisionFileSchema = z.object({
  schema_version: z.literal("2.0.0"),
  proposal_hash: z.string().regex(/^sha256:[0-9a-f]{64}$/u),
  decisions: z.array(AtlasReviewDecisionSchema).min(1),
}).strict();

async function approveAtlasV2(options: Readonly<Record<string, string>>, io: CliIo): Promise<number> {
  const outputDirectory = requireOption(options, "output");
  const proposal = AtlasKnowledgeBundleSchema.parse(
    await readJsonValue(resolve(outputDirectory, "atlas-knowledge.json")),
  );
  const decisionFile = AtlasV2DecisionFileSchema.parse(
    await readJsonValue(requireOption(options, "decisions")),
  );
  if (decisionFile.proposal_hash !== atlasProposalHash(proposal)) {
    throw new CliInputError("Atlas approval decisions reference a stale proposal");
  }
  const result = approveAtlasKnowledge({ proposal, decisions: decisionFile.decisions });
  const retained = await Promise.all([
    "atlas-knowledge.json", "atlas-evidence.json", "atlas-diagnostics.json",
    "source-manifest.json", "run-manifest.json",
  ].map(async (name) => [name, await readFile(resolve(outputDirectory, name), "utf8")] as const));
  await publishAtlasArtifacts(outputDirectory, {
    ...Object.fromEntries(retained),
    "atlas-approved-knowledge.json": collectionCanonicalJson(result.approved_bundle),
    "atlas-approval-audit.json": collectionCanonicalJson({ schema_version: "2.0.0",
      proposal_hash: result.proposal_hash, decisions: result.audit_history }),
  });
  io.stdout(`Approved Atlas V2 knowledge bundle written to ${outputDirectory}\n`);
  return 0;
}


async function runAtlasV2(
  options: Readonly<Record<string, string>>,
  io: CliIo,
): Promise<number> {
  rejectAtlasSecretArguments(options);
  const prdPath = requireOption(options, "prd");
  const outputDirectory = requireOption(options, "output");
  const intent = ProjectIntentSchema.parse(
    await readJsonValue(requireOption(options, "project-intent")),
  );
  const projectId = stableId(intent.project.id);
  const documentId = stableId(options["document-id"] ?? `${projectId}.document.prd`);
  const inputPath = relative(".", resolve(prdPath)).replaceAll("\\", "/");
  const workspacePath = inputPath.startsWith("../")
    ? `external/${basename(prdPath)}` : inputPath;
  let content: string;
  let mediaType: string;
  let originalHash: string;
  let pageCount: number | undefined;
  let sourceSpans: ReturnType<typeof sourceSpansFromPdfPages> | undefined;
  if (extname(prdPath).toLowerCase() === ".pdf") {
    const pdf = await ingestPdfDocument({ document_id: documentId, path: workspacePath,
      bytes: await readFile(prdPath) });
    content = pdf.normalized_document.content;
    mediaType = "application/pdf";
    originalHash = pdf.original.content_hash;
    pageCount = pdf.pages.length;
    sourceSpans = sourceSpansFromPdfPages(pdf.pages);
  } else if (extname(prdPath).toLowerCase() === ".md") {
    content = await readFile(prdPath, "utf8");
    mediaType = "text/markdown";
    originalHash = sourceContentHash(content);
  } else {
    throw new CliInputError("Atlas PRD input must use .md or .pdf");
  }
  const source = buildSourceArtifacts({ document_id: documentId, path: workspacePath,
    content, paragraph_mode: mediaType === "application/pdf" ? "pdf_structural" : "contiguous",
    original_content_hash: originalHash, ...(sourceSpans ? { source_spans: sourceSpans } : {}) });
  const extractionInput = {
    schema_version: "2.0.0" as const, project_id: projectId,
    documents: [{ document_id: documentId,
      document_revision_id: source.document_revision.id, revision: 1,
      content_hash: originalHash, media_type: mediaType, original_name: basename(prdPath) }],
    source_units: [...source.source_units],
  };
  const extractionRun = await obtainAtlasV2Facts(options, extractionInput);
  const extraction = extractionRun.extraction;
  const selection = selectAtlasGraphTypes(extraction);
  const documents = [{ document_id: documentId, revision: 1, content_hash: originalHash,
    media_type: mediaType, original_name: basename(prdPath),
    ...(pageCount ? { page_count: pageCount } : {}) }];
  const preflight = assessAtlasCoverage({ extraction, selection,
    scopes: extractionRun.scopes });
  if (preflight.status !== "awaiting_human_review") {
    await publishIncompleteAtlasRun({ outputDirectory, projectId, originalHash,
      documents, documentRevision: source.document_revision, extraction,
      scopes: extractionRun.scopes, selection, coverage: preflight });
    io.stderr(`Atlas V2 extraction is incomplete; diagnostics written to ${outputDirectory}\n`);
    return 8;
  }
  const bundle = assembleAtlasKnowledge({ project_id: projectId, revision: 1,
    documents, extraction, selection });
  const coverage = assessAtlasCoverage({ extraction, selection,
    scopes: extractionRun.scopes, bundle });
  if (coverage.status !== "awaiting_human_review") {
    await publishIncompleteAtlasRun({ outputDirectory, projectId, originalHash,
      documents, documentRevision: source.document_revision, extraction,
      scopes: extractionRun.scopes, selection, coverage });
    io.stderr(`Atlas V2 extraction is incomplete; diagnostics written to ${outputDirectory}\n`);
    return 8;
  }
  const semanticHash = hashCanonical(bundle);
  const manifestBase = { schema_version: "2.0.0", pipeline: "atlas-v2",
    status: "awaiting_human_review", project_id: projectId, revision: 1,
    knowledge_bundle_hash: semanticHash, source_content_hash: originalHash };
  await publishAtlasArtifacts(outputDirectory, {
    "atlas-knowledge.json": collectionCanonicalJson(bundle),
    "atlas-evidence.json": collectionCanonicalJson({ schema_version: "2.0.0",
      project_id: projectId, revision: 1, evidence: extraction.evidence }),
    "atlas-diagnostics.json": collectionCanonicalJson({ schema_version: "2.0.0",
      project_id: projectId, extraction_scopes: extractionRun.scopes,
      coverage, graph_assessments: selection.assessments }),
    "source-manifest.json": collectionCanonicalJson({ schema_version: "2.0.0",
      project_id: projectId, documents: bundle.documents,
      document_revision: source.document_revision }),
    "run-manifest.json": collectionCanonicalJson({ ...manifestBase,
      run_revision_hash: hashCanonical(manifestBase) }),
  });
  io.stdout(`Atlas V2 knowledge bundle written to ${outputDirectory}\n`);
  return 7;
}

interface ExtractionScopeDiagnostic {
  readonly scope_id: string;
  readonly kind: "document" | "section" | "cross_section";
  readonly section_path: readonly string[];
  readonly source_unit_ids: readonly string[];
  readonly attempts: number;
  readonly disposition: "facts_extracted" | "context_only" | "unsupported" | "failed";
  readonly fact_count: number;
  readonly rejection_code?: string;
}

async function obtainAtlasV2Facts(options: Readonly<Record<string, string>>,
  input: SemanticFactExtractionInput): Promise<{ extraction: ReturnType<typeof finalizeSemanticFacts>;
    scopes: readonly ExtractionScopeDiagnostic[] }> {
  if (options["provider-result"]) {
    const value = await readJsonValue(options["provider-result"]);
    const output = SemanticFactExtractionOutputSchema.safeParse(value);
    const extraction = output.success ? output.data
      : finalizeSemanticFacts(input, SemanticFactIntermediateSchema.parse(value));
    return { extraction, scopes: [{ scope_id: `${input.project_id}.scope.document`,
      kind: "document", section_path: [],
      source_unit_ids: input.source_units.map(({ id }) => id), attempts: 1,
      disposition: extraction.facts.length ? "facts_extracted" : "unsupported",
      fact_count: extraction.facts.length }] };
  }
  const scopes = buildExtractionScopes(input);
  const outputs: ReturnType<typeof finalizeSemanticFacts>[] = [];
  const diagnostics: ExtractionScopeDiagnostic[] = [];
  for (const scope of scopes) {
    let attempts = 0;
    let lastFailure: { code: string; message: string } | undefined;
    while (attempts < 2) {
      attempts += 1;
      try {
        const extraction = await requestAtlasScope(options, { ...input,
          source_units: scope.source_units });
        outputs.push(extraction);
        diagnostics.push({ scope_id: scope.scope_id, kind: scope.kind,
          section_path: scope.section_path,
          source_unit_ids: scope.source_units.map(({ id }) => id), attempts,
          disposition: extraction.facts.length ? "facts_extracted"
            : scope.kind === "document" ? "context_only" : "unsupported",
          fact_count: extraction.facts.length });
        lastFailure = undefined;
        break;
      } catch (caught) {
        lastFailure = atlasProviderFailure(caught);
        if (!lastFailure.code.startsWith("HTTP_422") && !lastFailure.code.startsWith("HTTP_502")) break;
      }
    }
    if (lastFailure) diagnostics.push({ scope_id: scope.scope_id, kind: scope.kind,
      section_path: scope.section_path, source_unit_ids: scope.source_units.map(({ id }) => id),
      attempts, disposition: "failed", fact_count: 0, rejection_code: lastFailure.code });
  }
  return { extraction: mergeAtlasExtractions(input.project_id, outputs), scopes: diagnostics };
}

interface AtlasCoverage {
  readonly status: "awaiting_human_review" | "incomplete" | "failed";
  readonly pages_covered: number;
  readonly scope_count: number;
  readonly fact_count: number;
  readonly module_count: number;
  readonly relationship_count: number;
  readonly assessment_count: number;
  readonly issues: readonly { code: string; subject_id: string }[];
}

function assessAtlasCoverage(input: {
  extraction: ReturnType<typeof finalizeSemanticFacts>;
  selection: ReturnType<typeof selectAtlasGraphTypes>;
  scopes: readonly ExtractionScopeDiagnostic[];
  bundle?: z.infer<typeof AtlasKnowledgeBundleSchema>;
}): AtlasCoverage {
  const modules = input.extraction.facts.filter(({ kind }) => kind === "module");
  const relationships = input.extraction.facts.filter(({ kind }) =>
    kind === "dependency" || kind === "activity_order");
  const issues: { code: string; subject_id: string }[] = [];
  for (const scope of input.scopes.filter(({ disposition }) => disposition === "failed")) {
    issues.push({ code: "extraction_scope_failed", subject_id: scope.scope_id });
  }
  if (!input.scopes.length) issues.push({ code: "extraction_scopes_missing", subject_id: "run" });
  if (!input.extraction.facts.length) issues.push({ code: "semantic_facts_missing", subject_id: "run" });
  if (!modules.length) issues.push({ code: "modules_missing", subject_id: "project" });
  for (const module of modules.filter(({ context_paths }) => context_paths.length === 0)) {
    issues.push({ code: "unscoped_module", subject_id: module.fact_id });
  }
  if (!input.selection.assessments.length) {
    issues.push({ code: "graph_assessments_missing", subject_id: "project" });
  } else if (!input.selection.assessments.some(({ support_status }) => support_status === "supported")) {
    issues.push({ code: "supported_graph_missing", subject_id: "project" });
  }
  if (input.bundle) {
    const root = input.bundle.knowledge_nodes.find(({ knowledge_id }) =>
      knowledge_id === input.bundle!.root_knowledge_id);
    if (root?.kind === "visualization" && root.visualization.graph_type_id
      === "atlas.graph.business-workflow") {
      if (!root.visualization.edges.length) {
        issues.push({ code: "workflow_relationships_missing", subject_id: root.knowledge_id });
      }
      const connected = new Set(root.visualization.edges.flatMap(({ from_graph_node_id,
        to_graph_node_id }) => [from_graph_node_id, to_graph_node_id]));
      for (const node of root.visualization.nodes.filter(({ graph_node_id }) =>
        !connected.has(graph_node_id))) {
        issues.push({ code: "isolated_workflow_module", subject_id: node.knowledge_id ?? node.graph_node_id });
      }
    }
    for (const node of input.bundle.knowledge_nodes.filter((item) =>
      item.parent_id !== null && item.evidence_ids.length === 0)) {
      issues.push({ code: "knowledge_evidence_missing", subject_id: node.knowledge_id });
    }
  }
  return { status: input.scopes.some(({ disposition }) => disposition === "failed")
    ? "failed" : issues.length ? "incomplete" : "awaiting_human_review",
    pages_covered: new Set(input.extraction.evidence.map(({ location }) =>
      `${location.document_id}:${location.document_revision}:${location.page_number}`)).size,
    scope_count: input.scopes.length, fact_count: input.extraction.facts.length,
    module_count: modules.length, relationship_count: relationships.length,
    assessment_count: input.selection.assessments.length,
    issues: issues.sort((a, b) => a.code.localeCompare(b.code)
      || a.subject_id.localeCompare(b.subject_id)) };
}

async function publishIncompleteAtlasRun(input: {
  outputDirectory: string; projectId: string; originalHash: string;
  documents: unknown[]; documentRevision: unknown;
  extraction: ReturnType<typeof finalizeSemanticFacts>;
  scopes: readonly ExtractionScopeDiagnostic[];
  selection: ReturnType<typeof selectAtlasGraphTypes>;
  coverage: AtlasCoverage;
}): Promise<void> {
  const manifest = { schema_version: "2.0.0", pipeline: "atlas-v2",
    status: input.coverage.status, project_id: input.projectId, revision: 1,
    source_content_hash: input.originalHash, coverage: input.coverage };
  await publishAtlasArtifacts(input.outputDirectory, {
    "atlas-diagnostics.json": collectionCanonicalJson({ schema_version: "2.0.0",
      project_id: input.projectId, extraction_scopes: input.scopes,
      coverage: input.coverage, graph_assessments: input.selection.assessments }),
    "atlas-extraction.json": collectionCanonicalJson(input.extraction),
    "source-manifest.json": collectionCanonicalJson({ schema_version: "2.0.0",
      project_id: input.projectId, documents: input.documents,
      document_revision: input.documentRevision }),
    "run-manifest.json": collectionCanonicalJson({ ...manifest,
      run_revision_hash: hashCanonical(manifest) }),
  });
}

async function requestAtlasScope(options: Readonly<Record<string, string>>,
  input: SemanticFactExtractionInput): Promise<ReturnType<typeof finalizeSemanticFacts>> {
  const configured = new URL(requireOption(options, "provider-endpoint"));
  configured.pathname = "/v1/agents/atlas.semantic-fact-extractor/execute";
  configured.search = "";
  const credential = process.env.CES_ATLAS_API_KEY ?? process.env.AGENTS_BRIDGE_API_KEY;
  const response = await fetch(configured, { method: "POST", headers: {
    "content-type": "application/json", ...(credential
      ? { authorization: `Bearer ${credential}` } : {}) },
    body: JSON.stringify({ agent_version: "2.0.0", input }) });
  if (!response.ok) throw new Error(`HTTP_${response.status}:${safeProviderError(await response.text())}`);
  return SemanticFactExtractionOutputSchema.parse(await response.json());
}

function buildExtractionScopes(input: SemanticFactExtractionInput): readonly {
  scope_id: string; kind: ExtractionScopeDiagnostic["kind"]; section_path: readonly string[];
  source_units: SemanticFactExtractionInput["source_units"] }[] {
  const bySection = new Map<string, SemanticFactExtractionInput["source_units"][number][]>();
  for (const unit of input.source_units) {
    const key = unit.section_path[0] ?? "";
    const values = bySection.get(key) ?? [];
    values.push(unit); bySection.set(key, values);
  }
  const scopes: {
    scope_id: string; kind: ExtractionScopeDiagnostic["kind"]; section_path: readonly string[];
    source_units: SemanticFactExtractionInput["source_units"];
  }[] = [...bySection.entries()].map(([section, source_units], index) => ({
    scope_id: `${input.project_id}.scope.${section ? "section" : "document"}.${String(index + 1).padStart(3, "0")}`,
    kind: section ? "section" as const : "document" as const,
    section_path: section ? [section] : [], source_units,
  }));
  const crossCandidates = input.source_units.filter((unit) => unit.kind !== "caption");
  const size = 24;
  for (let offset = 0; offset < crossCandidates.length; offset += size) {
    const source_units = crossCandidates.slice(offset, offset + size);
    if (new Set(source_units.flatMap(({ section_path }) => section_path.slice(0, 1))).size < 2) continue;
    scopes.push({ scope_id: `${input.project_id}.scope.cross.${String(offset / size + 1).padStart(3, "0")}`,
      kind: "cross_section", section_path: [], source_units });
  }
  return scopes;
}

function mergeAtlasExtractions(projectId: string,
  outputs: readonly ReturnType<typeof finalizeSemanticFacts>[]): ReturnType<typeof finalizeSemanticFacts> {
  const facts = new Map(outputs.flatMap(({ facts }) => facts).map((fact) => [fact.fact_id, fact]));
  const evidence = new Map(outputs.flatMap((output) => output.evidence)
    .map((item) => [item.evidence_id, item]));
  return SemanticFactExtractionOutputSchema.parse({ schema_version: "2.0.0", project_id: projectId,
    facts: [...facts.values()].sort((a, b) => a.fact_id.localeCompare(b.fact_id)),
    evidence: [...evidence.values()].sort((a, b) => a.evidence_id.localeCompare(b.evidence_id)) });
}

function safeProviderError(body: string): string {
  try {
    const value = JSON.parse(body) as { error?: { code?: unknown } };
    return typeof value.error?.code === "string" ? value.error.code : "provider_error";
  } catch { return "provider_error"; }
}

function atlasProviderFailure(caught: unknown): { code: string; message: string } {
  const message = caught instanceof Error ? caught.message : "provider_error";
  return { code: /^HTTP_\d+:[a-z0-9_-]+$/iu.test(message) ? message : "INVALID_RESPONSE",
    message: "The bounded extraction scope failed validation." };
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
