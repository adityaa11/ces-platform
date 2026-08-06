import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const fixture = (path: string) => join("tests", "fixtures", path);

describe("ATLAS-HARD-027 qualification fixtures", () => {
  it("freezes the renderer-neutral recursive Safara knowledge explorer", async () => {
    const oracle = JSON.parse(await readFile(
      fixture("safara/golden-main-workflow.json"), "utf8",
    )) as {
      schema_version: string;
      renderer_policy: { interactive_required: boolean; locked_renderer: string | null;
        semantic_membership_owned_by_renderer: boolean };
      main_workflow: { maximum_instances_per_project: number; permanently_visible: boolean;
        nodes: { concept: string; kind: string; accepted_source_labels: string[] }[];
        relationships: { from: string; to: string; kind: string }[] };
      knowledge_nodes: { knowledge_id: string; parent_id: string | null; kind: string;
        graph_type_id?: string; renderer_requirement?: string; children: string[] }[];
      required_breadcrumbs: string[][];
      navigation_invariants: { main_workflow_always_visible: boolean;
        selection_never_replaces_main_workflow: boolean; recursive_children: boolean;
        maximum_semantic_depth: number | null; cycle_free: boolean;
        frontend_may_infer_children: boolean; frontend_may_infer_topology: boolean };
    };
    expect(oracle.schema_version).toBe("2.0.0");
    expect(oracle.renderer_policy).toEqual({ interactive_required: true,
      locked_renderer: null, semantic_membership_owned_by_renderer: false });
    const concepts = new Set(oracle.main_workflow.nodes.map(({ concept }) => concept));
    expect(concepts.size).toBe(9);
    expect(oracle.main_workflow.maximum_instances_per_project).toBe(1);
    expect(oracle.main_workflow.permanently_visible).toBe(true);
    expect(oracle.main_workflow.nodes.every(({ kind }) => kind === "module")).toBe(true);
    expect(oracle.main_workflow.nodes.every(({ accepted_source_labels }) =>
      accepted_source_labels.length > 0)).toBe(true);
    const normalizedLabels = oracle.main_workflow.nodes.flatMap(({ concept, accepted_source_labels }) =>
      accepted_source_labels.map((label) => ({
        concept,
        label: label.normalize("NFKC").toLocaleLowerCase("en-US")
          .replace(/[^\p{L}\p{N}]+/gu, " ").trim(),
      })));
    expect(new Set(normalizedLabels.map(({ label }) => label)).size)
      .toBe(normalizedLabels.length);
    expect(oracle.main_workflow.relationships.every(({ from, to }) =>
      concepts.has(from) && concepts.has(to))).toBe(true);
    expect(oracle.main_workflow.relationships.filter(({ kind }) => kind === "summarized_in"))
      .toHaveLength(7);
    expect(oracle.main_workflow.relationships.filter(({ kind }) => kind === "records_into"))
      .toHaveLength(7);
    expect(oracle.main_workflow.relationships).toEqual(expect.arrayContaining([
      { from: "package_departure", to: "pilgrim_registration", kind: "creates" },
      { from: "pilgrim_data", to: "pilgrim_registration", kind: "registers_into" },
      { from: "pilgrim_registration", to: "billing_payment", kind: "generates" },
      { from: "pilgrim_registration", to: "pilgrim_documents", kind: "requires" },
      { from: "travel_readiness", to: "departure_manifest", kind: "qualifies" },
    ]));

    const knowledge = new Map(oracle.knowledge_nodes.map((node) => [node.knowledge_id, node]));
    expect(knowledge.size).toBe(oracle.knowledge_nodes.length);
    expect(knowledge.get("main_workflow")?.parent_id).toBeNull();
    for (const node of oracle.knowledge_nodes) {
      if (node.parent_id) expect(knowledge.has(node.parent_id)).toBe(true);
      for (const childId of node.children) {
        expect(knowledge.get(childId)?.parent_id).toBe(node.knowledge_id);
      }
      if (node.kind === "visualization") {
        expect(node.graph_type_id).toMatch(/^atlas\.graph\./u);
        if (node.knowledge_id !== "main_workflow") expect(node.renderer_requirement).toBe("interactive");
      }
    }
    const visit = (id: string, ancestors = new Set<string>()): void => {
      expect(ancestors.has(id)).toBe(false);
      const next = new Set(ancestors).add(id);
      for (const child of knowledge.get(id)?.children ?? []) visit(child, next);
    };
    visit("main_workflow");
    expect(oracle.required_breadcrumbs).toContainEqual([
      "main_workflow", "travel_readiness", "blocking_conditions",
      "visa_validation", "visa_business_rules",
    ]);
    expect(oracle.navigation_invariants).toEqual({
      main_workflow_always_visible: true,
      selection_never_replaces_main_workflow: true,
      recursive_children: true,
      maximum_semantic_depth: null,
      cycle_free: true,
      frontend_may_infer_children: false,
      frontend_may_infer_topology: false,
    });
  });

  it("freezes a structurally different non-travel oracle", async () => {
    const expected = JSON.parse(await readFile(
      fixture("non-travel/expected-semantic-areas.json"), "utf8",
    )) as {
      required_concepts: string[];
      forbidden_fixture_concepts: string[];
      expected_supported_model_kinds: string[];
      expected_unsupported_model_kinds: string[];
      required_semantic_roles: string[];
      required_relationship_kinds: string[];
    };
    expect(expected.required_concepts).toContain("invoice_verification");
    expect(expected.forbidden_fixture_concepts).toContain("pilgrim_registration");
    expect(expected.expected_supported_model_kinds).toContain("decision_model");
    expect(expected.expected_unsupported_model_kinds).toContain("sequence_interaction");
    expect(expected.required_semantic_roles).toContain("shared_data");
    expect(expected.required_relationship_kinds).toContain("provides_data_to");
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
      "Siap", "Terhambat",
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
