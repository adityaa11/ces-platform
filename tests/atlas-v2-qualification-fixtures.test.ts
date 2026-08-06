import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { selectAtlasGraphTypes } from "../packages/atlas-graph-selection/src/index.js";
import { finalizeSemanticFacts } from "../packages/atlas-semantic-facts/src/index.js";
import { sourceContentHash } from "../packages/document-ingestion/src/index.js";
import { buildSourceArtifacts } from "../packages/source-unit-schema/src/index.js";
import { describe, expect, it } from "vitest";

type FactFixture = { kind: string; quote: string; relation?: string;
  terms: [string, string][] };
type CaseFixture = { case_id: string; source: string; expected_root_modules: string[];
  expected_graph_types: string[]; forbidden_graph_types?: string[]; facts: FactFixture[] };
const root = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = resolve(root, "fixtures/atlas-v2");
const manifest = JSON.parse(readFileSync(resolve(fixtureRoot,
  "qualification-cases.json"), "utf8")) as {
    schema_version: string; relationship_language: string; cases: CaseFixture[];
  };

describe("Atlas V2 qualification fixtures", () => {
  it("defines source-derived golden, generic workflow, and non-workflow cases", () => {
    expect(manifest.schema_version).toBe("2.0.0");
    expect(manifest.relationship_language).toBe("en");
    expect(manifest.cases.map(({ case_id }) => case_id)).toEqual([
      "safara-golden", "warehouse-workflow", "library-structure",
    ]);
    for (const fixture of manifest.cases) {
      const source = readFileSync(resolve(fixtureRoot, fixture.source), "utf8");
      for (const fact of fixture.facts) {
        expect(source, `${fixture.case_id}: ${fact.quote}`).toContain(fact.quote);
        for (const [, term] of fact.terms) expect(fact.quote).toContain(term);
      }
      expect(new Set(fixture.facts.filter(({ kind }) => kind === "module")
        .map(({ quote }) => quote))).toEqual(new Set(fixture.expected_root_modules));
    }
  });

  it.each(manifest.cases)("selects the expected structures for $case_id", (fixture) => {
    const source = readFileSync(resolve(fixtureRoot, fixture.source), "utf8");
    const projectId = fixture.case_id;
    const documentId = `${projectId}.document.prd`;
    const artifacts = buildSourceArtifacts({ document_id: documentId,
      path: `qualification/${basename(fixture.source)}`, content: source });
    const candidates = fixture.facts.map((fact, index) => {
      const unit = artifacts.source_units.find(({ kind, text }) =>
        fact.kind === "module" && kind === "heading" && text === fact.quote)
        ?? artifacts.source_units.find(({ exact_text }) => exact_text === fact.quote)
        ?? artifacts.source_units.find(({ exact_text }) => exact_text.includes(fact.quote));
      if (!unit) throw new Error(`No source unit for ${fact.quote}`);
      return { candidate_id: `${projectId}.candidate.${index + 1}`, kind: fact.kind,
        exact_statement: fact.quote, source_unit_ids: [unit.id],
        terms: fact.terms.map(([role_id, exact_text]) => ({ role_id, exact_text })),
        ...(fact.relation ? { relation_kind: fact.relation } : {}), confidence: 1 };
    });
    const extraction = finalizeSemanticFacts({ schema_version: "2.0.0",
      project_id: projectId, documents: [{ document_id: documentId,
        document_revision_id: artifacts.document_revision.id, revision: 1,
        content_hash: sourceContentHash(source), media_type: "text/markdown",
        original_name: basename(fixture.source) }], source_units: artifacts.source_units },
    { schema_version: "2.0.0", facts: candidates });
    const selected = selectAtlasGraphTypes(extraction).assessments
      .filter(({ support_status }) => support_status === "supported")
      .map(({ graph_type_id }) => graph_type_id);
    for (const expected of fixture.expected_graph_types) expect(selected).toContain(expected);
    for (const forbidden of fixture.forbidden_graph_types ?? [])
      expect(selected).not.toContain(forbidden);
  });

  it("keeps fixture labels out of production source", () => {
    const labels = manifest.cases.flatMap(({ expected_root_modules }) => expected_root_modules);
    const files = ["apps", "packages"].flatMap((directory) => sourceFiles(resolve(directory)));
    const offenders = files.filter((file) => labels.some((label) =>
      readFileSync(file, "utf8").includes(label)));
    expect(offenders).toEqual([]);
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["dist", ".next", "node_modules"].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path)
      : entry.isFile() && /\.(?:ts|tsx|js|mjs|cjs)$/u.test(path)
        && !/(?:\.test\.|test-fixtures)/u.test(path) ? [path] : [];
  });
}
