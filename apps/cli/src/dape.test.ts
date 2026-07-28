import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { calculateCoverage } from "@company/ces-atlas-coverage";
import { createSemanticCollection } from "@company/ces-semantic-record-schema";
import { describe, expect, it } from "vitest";
import { runCli } from "./index.js";

const sha = (value: string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;
const unit = "safara.unit.00001.01234567";
const concept = "safara.concept.entity.payment.01234567";
const sourceRevision = "safara.rev.0123456789ab";
const lexiconRevision = "safara.lexicon.0123456789ab";

function publicationBundle() {
  const common = {
    schema_version: "1.0.0" as const,
    project_id: "safara",
    source_revision_id: sourceRevision,
    lexicon_revision_id: lexiconRevision,
    title: "Payment semantics",
    statement: "Only accepted payments reduce the balance.",
    source_unit_ids: [unit],
    concept_ids: [concept],
    origin: "explicit" as const,
    review_state: "candidate" as const,
  };
  const semantic = createSemanticCollection({
    project_id: "safara",
    source_revision_id: sourceRevision,
    lexicon_revision_id: lexiconRevision,
    source_unit_ids: [unit],
    concept_ids: [concept],
    records: [{
      ...common,
      id: "safara.semantic.accepted-payment",
      kind: "business_rule",
      constraint: "Pending and rejected payments do not reduce balance.",
    }, {
      ...common,
      id: "safara.semantic.balance",
      kind: "calculation",
      output_concept_id: concept,
      formula: "invoice - accepted payments",
      input_concept_ids: [concept],
    }],
  });
  const coverage = calculateCoverage({
    source_revision_id: sourceRevision,
    semantic_collection_id: semantic.id,
    source_unit_ids: [unit],
    candidate_ids: semantic.records.map(({ id }) => id),
    entries: [{
      source_unit_id: unit, normative: true, disposition: "covered",
      candidate_ids: semantic.records.map(({ id }) => id),
    }],
    candidate_evidence: semantic.records.map(({ id }) => ({
      candidate_id: id, source_unit_ids: [unit],
      supported: true, distortion_detected: false,
    })),
  });
  return {
    schema_version: "1.0.0",
    project_id: "safara",
    source_revision_id: sourceRevision,
    source_content_hash: sha("source"),
    lexicon_revision_id: lexiconRevision,
    lexicon_content_hash: sha("lexicon"),
    concepts: [{
      id: concept, kind: "entity", canonical_label: "Payment",
      aliases: ["Pembayaran"], source_unit_ids: [unit],
    }],
    semantic_collection: semantic,
    coverage_report: coverage,
    review: {
      status: "reviewed",
      source_revision_id: sourceRevision,
      lexicon_revision_id: lexiconRevision,
      semantic_revision_id: semantic.id,
      decision_hash: sha("review"),
      approved_by: ["product-owner"],
      approved_at: "2026-07-28T00:00:00+07:00",
      reviewed_payloads: {
        "safara.semantic.accepted-payment": {
          constraint: "Pending and rejected payments do not reduce balance.",
        },
        "safara.semantic.balance": {
          output_concept_id: concept,
          formula: "invoice - accepted payments",
          input_concept_ids: [concept],
        },
      },
    },
    projection_consumers: ["legacy-core"],
  };
}

describe("DAPE-008 canonical CLI publication", () => {
  it("publishes atomically and reruns byte-identically with projection gaps", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-dape-publish-"));
    try {
      const input = join(directory, "publication.json");
      const output = join(directory, "output");
      await writeFile(input, JSON.stringify(publicationBundle()));
      const args = ["atlas", "approve", "--output", output, "--publication-input", input];
      expect(await runCli(args, quiet())).toBe(0);
      const first = await snapshot(output);
      expect(await runCli(args, quiet())).toBe(0);
      expect(await snapshot(output)).toEqual(first);
      const manifest = JSON.parse(await readFile(join(output, "run-manifest.json"), "utf8"));
      expect(manifest).toMatchObject({
        status: "completed",
        pipeline: "dynamic-atlas-p0",
        projection_statuses: { "legacy-core": "partial" },
      });
      const model = JSON.parse(
        await readFile(join(output, "approved-project-model.json"), "utf8"),
      );
      expect(model.records.map(({ id }: { id: string }) => id)).toEqual([
        "safara.semantic.accepted-payment", "safara.semantic.balance",
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not replace prior output when publication is blocked", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-dape-blocked-"));
    try {
      const input = join(directory, "publication.json");
      const output = join(directory, "output");
      const bundle = publicationBundle();
      await writeFile(input, JSON.stringify(bundle));
      const args = ["atlas", "approve", "--output", output, "--publication-input", input];
      expect(await runCli(args, quiet())).toBe(0);
      const before = await snapshot(output);
      await writeFile(input, JSON.stringify({
        ...bundle,
        review: { ...bundle.review, status: "review_required" },
      }));
      expect(await runCli(args, quiet())).toBe(2);
      expect(await snapshot(output)).toEqual(before);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function quiet() {
  return { stdout: (_text: string) => undefined, stderr: (_text: string) => undefined };
}
async function snapshot(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function walk(directory: string, prefix = ""): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(join(directory, entry.name), relative);
      else result[relative] = await readFile(join(directory, entry.name), "utf8");
    }
  }
  await walk(root);
  return result;
}
