import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const fixture = (path: string) => join("tests", "fixtures", path);

describe("ATLAS-HARD-027 qualification fixtures", () => {
  it("freezes one connected, internally consistent Safara semantic oracle", async () => {
    const oracle = JSON.parse(await readFile(
      fixture("safara/golden-main-workflow.json"), "utf8",
    )) as {
      nodes: { concept: string; accepted_source_labels: string[] }[];
      relationships: { from: string; to: string; kind: string }[];
    };
    const concepts = new Set(oracle.nodes.map(({ concept }) => concept));
    expect(concepts.size).toBe(oracle.nodes.length);
    expect(oracle.nodes.every(({ accepted_source_labels }) =>
      accepted_source_labels.length > 0)).toBe(true);
    expect(oracle.relationships.every(({ from, to }) =>
      concepts.has(from) && concepts.has(to))).toBe(true);
    expect(oracle.relationships.filter(({ kind }) =>
      kind === "provides_data_to")).toHaveLength(6);
    expect(oracle.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        from: "pilgrim_registration", to: "payment_review",
        kind: "enables",
      }),
      expect.objectContaining({
        from: "pilgrim_registration", to: "document_review",
        kind: "enables",
      }),
      expect.objectContaining({
        from: "travel_readiness", to: "readiness_decision",
        kind: "evaluated_by",
      }),
      expect.objectContaining({
        from: "readiness_decision", to: "blocked",
        kind: "branches_to", condition: "No",
      }),
      expect.objectContaining({
        from: "readiness_decision", to: "ready",
        kind: "branches_to", condition: "Yes",
      }),
      expect.objectContaining({
        from: "ready", to: "manifest_finalization",
        kind: "enables",
      }),
    ]));
    expect(oracle.nodes.flatMap(({ accepted_source_labels }) =>
      accepted_source_labels)).not.toEqual(expect.arrayContaining([
        "Payment Review", "Document Review", "Travel Readiness",
        "Manifest Finalization",
      ]));
  });

  it("freezes a structurally different non-travel oracle", async () => {
    const expected = JSON.parse(await readFile(
      fixture("non-travel/expected-semantic-areas.json"), "utf8",
    )) as {
      required_concepts: string[];
      forbidden_fixture_concepts: string[];
      expected_supported_model_kinds: string[];
      expected_unsupported_model_kinds: string[];
    };
    expect(expected.required_concepts).toContain("invoice_verification");
    expect(expected.forbidden_fixture_concepts).toContain("pilgrim_registration");
    expect(expected.expected_supported_model_kinds).toContain("decision_model");
    expect(expected.expected_unsupported_model_kinds).toContain("sequence_interaction");
  });

  it("keeps Safara fixture constants out of executable Atlas core", async () => {
    const roots = [
      join("apps", "cli", "src"),
      join("packages", "atlas-intent-graph", "src"),
      join("packages", "proposed-project-model", "src"),
    ];
    const forbidden = [
      "Pendaftaran Jemaah", "Kesiapan Keberangkatan",
      "Finalisasi Manifest", "Safara_Buyer", "pilgrim_registration",
    ];
    const violations: string[] = [];
    for (const root of roots) {
      for (const path of await sourceFiles(root)) {
        if (path.endsWith(".test.ts")) continue;
        const source = await readFile(path, "utf8");
        for (const term of forbidden) {
          if (source.includes(term)) violations.push(`${path}: ${term}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return extname(entry.name) === ".ts" ? [path] : [];
  }));
  return nested.flat();
}
