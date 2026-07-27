import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { ingestPdfDocument } from "@company/ces-pdf-ingestion";
import { calculateCoverage } from "@company/ces-atlas-coverage";
import { runCli } from "./index.js";

describe("DAPE-008 staged Atlas commands", () => {
  it("supports analyze, coverage, questions, and graph without changing legacy commands", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-staged-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const output = join(directory, "generated");
      expect(await runCli([
        "atlas", "analyze",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], capture().io)).toBe(7);
      const questionsIo = capture();
      expect(await runCli(["atlas", "questions", "--output", output], questionsIo.io)).toBe(0);
      expect(JSON.parse(questionsIo.stdout.join(""))).toEqual([]);

      const unit = "safara.unit.00001.01234567";
      const report = calculateCoverage({
        source_revision_id: "safara.rev.0123456789ab",
        semantic_collection_id: "safara.semantics.0123456789ab",
        source_unit_ids: [unit],
        candidate_ids: [],
        entries: [{
          source_unit_id: unit, normative: false, disposition: "context_only",
          candidate_ids: [], reason: "Heading",
        }],
        candidate_evidence: [],
      });
      await writeFile(join(output, "coverage-report.json"), JSON.stringify(report));
      const coverageIo = capture();
      expect(await runCli(["atlas", "coverage", "--output", output], coverageIo.io)).toBe(0);
      expect(JSON.parse(coverageIo.stdout.join(""))).toEqual(report);

      await writeFile(join(output, "system-intent-graph.json"), "{\"graph\":\"json\"}\n");
      await writeFile(join(output, "system-intent-graph.md"), "# Graph\n");
      await writeFile(join(output, "system-intent-graph.mmd"), "graph TD\n");
      const graphIo = capture();
      expect(await runCli([
        "atlas", "graph", "--output", output, "--format", "mermaid",
      ], graphIo.io)).toBe(0);
      expect(graphIo.stdout.join("")).toBe("graph TD\n");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("maps incomplete and unsupported coverage to distinct exits", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-status-"));
    try {
      const unit = "safara.unit.00001.01234567";
      const candidate = "safara.semantic.rule";
      const make = (supported: boolean, disposition: "covered" | "uncovered") =>
        calculateCoverage({
          source_revision_id: "safara.rev.0123456789ab",
          semantic_collection_id: "safara.semantics.0123456789ab",
          source_unit_ids: [unit],
          candidate_ids: [candidate],
          entries: [{
            source_unit_id: unit, normative: true, disposition,
            candidate_ids: disposition === "covered" ? [candidate] : [],
          }],
          candidate_evidence: [{
            candidate_id: candidate, source_unit_ids: [unit], supported,
            distortion_detected: false,
            ...(!supported ? { diagnostic: "Unsupported claim" } : {}),
          }],
        });
      await writeFile(join(directory, "coverage-report.json"),
        JSON.stringify(make(true, "uncovered")));
      expect(await runCli(["atlas", "coverage", "--output", directory], capture().io)).toBe(8);
      await writeFile(join(directory, "coverage-report.json"),
        JSON.stringify(make(false, "covered")));
      expect(await runCli(["atlas", "coverage", "--output", directory], capture().io)).toBe(9);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

const content = "# Projects\nAdministrators create projects.";

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    },
  };
}

describe("Atlas CLI pipeline", () => {
  it("pauses for review, resumes, and emits deterministic approved artifacts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-cli-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const output = join(directory, "generated");
      const firstIo = capture();
      expect(await runCli([
        "atlas", "run",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], firstIo.io)).toBe(7);
      expect(firstIo.stderr).toEqual([]);
      expect(await fileNames(output)).toEqual([
        "candidate-analysis.json",
        "clarification-questions.json",
        "review-input.json",
        "run-manifest.json",
        "source-index.json",
      ]);
      expect(await json(join(output, "run-manifest.json"))).toMatchObject({
        status: "awaiting_human_review",
        provider: { provider: "fixture", model: "deterministic-fixture" },
      });

      const reviewInput = await json(join(output, "review-input.json")) as {
        candidates: Array<{
          candidate_id: string;
          candidate_revision_hash: string;
          source_revision_hash: string;
        }>;
      };
      const decisions = join(directory, "decisions.json");
      await writeFile(decisions, JSON.stringify({
        schema_version: "1.0.0",
        decisions: reviewInput.candidates.map((candidate) => ({
          schema_version: "1.0.0",
          ...candidate,
          decision: "approved",
          decided_by: "product_owner",
        })),
      }));
      const resumeArgs = [
        "atlas", "resume",
        "--output", output,
        "--decisions", decisions,
        "--assurance", setup.assurance,
        "--baseline-version", "1.0.0",
      ];
      expect(await runCli(resumeArgs, capture().io)).toBe(0);
      expect(await fileNames(output)).toEqual([
        "candidate-analysis.json",
        "clarification-questions.json",
        "core-handoff/REQ-PROJECT-001.policy-manifest.json",
        "core-handoff/summary.json",
        "requirement-collection.json",
        "requirement-packages/REQ-PROJECT-001.json",
        "review-input.json",
        "review-report.json",
        "run-manifest.json",
        "source-index.json",
        "system-intent-graph.json",
        "system-intent-graph.md",
        "system-intent-graph.mmd",
      ]);
      expect(await json(join(output, "run-manifest.json"))).toMatchObject({
        status: "completed",
        prompt_contract_version: "1.0.0",
        provider: { provider: "fixture", model: "deterministic-fixture" },
      });
      const firstSnapshot = await snapshot(output);
      expect(await runCli(resumeArgs, capture().io)).toBe(0);
      expect(await snapshot(output)).toEqual(firstSnapshot);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects stale decisions without replacing the last valid output", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-stale-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const output = join(directory, "generated");
      await runCli([
        "atlas", "run",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], capture().io);
      const before = await snapshot(output);
      const decisions = join(directory, "stale-decisions.json");
      await writeFile(decisions, JSON.stringify({
        schema_version: "1.0.0",
        decisions: [{
          schema_version: "1.0.0",
          candidate_id: "CANDIDATE-001",
          candidate_revision_hash: `sha256:${"f".repeat(64)}`,
          source_revision_hash: sha256(content),
          decision: "approved",
          decided_by: "product_owner",
        }],
      }));
      const io = capture();
      expect(await runCli([
        "atlas", "resume",
        "--output", output,
        "--decisions", decisions,
        "--assurance", setup.assurance,
        "--baseline-version", "1.0.0",
      ], io.io)).toBe(2);
      expect(io.stderr.join("")).toContain("candidate revision changed");
      expect(await snapshot(output)).toEqual(before);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("never replaces existing output when extraction fails and rejects secret arguments", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-atomic-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const output = join(directory, "generated");
      await writeFile(setup.provider, JSON.stringify({ schema_version: "1.0.0", invalid: true }));
      await mkdir(output);
      await writeFile(join(output, "marker.txt"), "previous");
      const io = capture();
      expect(await runCli([
        "atlas", "run",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
        "--api-key", "must-not-be-accepted",
      ], io.io)).toBe(2);
      expect(io.stderr.join("")).toContain("CES_ATLAS_API_KEY");
      await expect(readFile(join(output, "marker.txt"), "utf8")).resolves.toBe("previous");
      expect(await runCli([
        "atlas", "run",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], capture().io)).toBe(2);
      await expect(readFile(join(output, "marker.txt"), "utf8")).resolves.toBe("previous");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("inspects a redacted run manifest", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-inspect-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const output = join(directory, "generated");
      await runCli([
        "atlas", "run",
        "--prd", setup.prd,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], capture().io);
      const io = capture();
      expect(await runCli(["atlas", "inspect", "--output", output], io.io)).toBe(0);
      expect(io.stdout.join("")).toContain("\"status\": \"awaiting_human_review\"");
      expect(io.stdout.join("")).not.toContain("authorization");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("accepts a native-text PDF and emits page-provenance artifacts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-atlas-pdf-cli-"));
    try {
      const setup = await writeAtlasInputs(directory);
      const pdf = join(directory, "prd.pdf");
      const bytes = createPdf("Administrators create projects.");
      await writeFile(pdf, bytes);
      const ingested = await ingestPdfDocument({
        document_id: "PRD-MAIN",
        path: "external/prd.pdf",
        bytes,
      });
      const page = ingested.pages[0]!;
      const providerValue = await json(setup.provider) as {
        candidate_requirements: Array<Record<string, unknown>>;
      };
      providerValue.candidate_requirements[0] = {
        ...providerValue.candidate_requirements[0],
        source: {
          document_id: "PRD-MAIN",
          path: "external/prd.pdf.md",
          line_start: page.line_start,
          line_end: page.line_end,
          page_start: 1,
          page_end: 1,
          page_revision_hashes: [page.page_revision_hash],
          extraction: {
            method: "native_text",
            parser: ingested.parser.id,
            parser_version: ingested.parser.version,
          },
          content_hash: ingested.normalized_document.content_hash,
        },
      };
      await writeFile(setup.provider, JSON.stringify(providerValue));
      const output = join(directory, "generated");
      const io = capture();
      const exitCode = await runCli([
        "atlas", "run",
        "--prd", pdf,
        "--project-intent", setup.intent,
        "--provider-result", setup.provider,
        "--output", output,
      ], io.io);
      expect({ exitCode, stderr: io.stderr }).toEqual({ exitCode: 7, stderr: [] });
      expect(await json(join(output, "pdf-ingestion.json"))).toMatchObject({
        pages: [expect.objectContaining({
          page_number: 1,
          extraction_method: "native_text",
        })],
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

async function writeAtlasInputs(directory: string) {
  const prd = join(directory, "prd.md");
  const intent = join(directory, "project-intent.json");
  const provider = join(directory, "provider-result.json");
  const assurance = join(directory, "assurance.json");
  await writeFile(prd, content);
  await writeFile(intent, JSON.stringify({
    schema_version: "1.0.0",
    project: {
      id: "project",
      lifecycle: "greenfield",
      application_type: "transactional_web_application",
      business_domain: "project_management",
    },
    delivery: {
      team_size: 2,
      expected_delivery_months: 3,
      deployment_preference: "managed_cloud",
    },
    constraints: {
      expected_users: 100,
      data_sensitivity: "internal",
      multi_tenant: false,
    },
    skills: {
      preferred_languages: ["typescript"],
      preferred_databases: ["postgresql"],
    },
  }));
  await writeFile(provider, JSON.stringify({
    schema_version: "1.0.0",
    candidate_requirements: [{
      schema_version: "1.0.0",
      candidate_id: "CANDIDATE-001",
      proposed_logical_id: "REQ-PROJECT-001",
      title: "Create a project",
      actor: { type: "company_administrator" },
      operation: {
        action: "create",
        resource: "project",
        target_scope: "own_company",
      },
      source: {
        document_id: "PRD-MAIN",
        path: "external/prd.md",
        line_start: 2,
        line_end: 2,
        content_hash: sha256(content),
      },
      inference: {
        origin: "explicit",
        confidence: 1,
        agent: {
          provider: "untrusted",
          model: "untrusted",
          prompt_contract_version: "untrusted",
        },
        review: { status: "needs_confirmation" },
      },
    }],
  }));
  await writeFile(assurance, JSON.stringify({
    exposure: "private_network",
    criticality: "standard",
    tenancy: "single_tenant",
    data_classes: ["internal"],
    delivery_semantics: "synchronous",
  }));
  return { prd, intent, provider, assurance };
}

async function fileNames(directory: string, prefix = ""): Promise<string[]> {
  const names: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) names.push(...await fileNames(join(directory, entry.name), path));
    else names.push(path);
  }
  return names.sort();
}

async function snapshot(directory: string): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(
    (await fileNames(directory)).map(async (path) => [
      path,
      await readFile(join(directory, ...path.split("/")), "utf8"),
    ] as const),
  ));
}

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function createPdf(text: string): Uint8Array {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.7\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = new TextEncoder().encode(body).byteLength;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = new TextEncoder().encode(body).byteLength;
  body += "xref\n0 6\n0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
