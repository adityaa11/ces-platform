import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("en-US")
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const relation = (value) => {
  const normalized = value.split(".").at(-1).replaceAll("-", "_");
  return normalized === "branch" ? "branches_to" : normalized;
};

export async function qualifyHard027({ oraclePath, outputPath }) {
  const oracle = JSON.parse(await readFile(oraclePath, "utf8"));
  const output = JSON.parse(await readFile(outputPath, "utf8"));
  const goldenMain = oracle.main_workflow;
  const overview = output.overview ?? output;
  const outputNodes = (overview.nodes ?? []).map((entry) => entry.node ?? entry);
  const outputEdges = overview.edges ?? [];
  const conceptByLabel = new Map(goldenMain.nodes.flatMap((node) =>
    node.accepted_source_labels.map((label) => [normalize(label), node.concept])));
  const conceptByOutputId = new Map(outputNodes.flatMap((node) => {
    const concept = conceptByLabel.get(normalize(node.label ?? ""));
    const id = node.projection_node_id ?? node.node_id;
    return concept && id ? [[id, concept]] : [];
  }));
  const foundConcepts = new Set(conceptByOutputId.values());
  const actualEdges = new Set(outputEdges.map((edge) => {
    const from = conceptByOutputId.get(edge.from_projection_node_id ?? edge.from_node_id);
    const to = conceptByOutputId.get(edge.to_projection_node_id ?? edge.to_node_id);
    return from && to ? `${from}|${relation(edge.relationship_kind)}|${to}` : "";
  }).filter(Boolean));
  const expectedEdges = goldenMain.relationships.map(({ from, kind, to }) => `${from}|${kind}|${to}`);
  const duplicateLabels = outputNodes.map((node) => normalize(node.label ?? ""))
    .filter((label, index, labels) => label && labels.indexOf(label) !== index);
  const missingEvidence = outputNodes.filter((node) =>
    !Array.isArray(node.evidence_ids) || node.evidence_ids.length === 0)
    .map((node) => node.canonical_concept_id ?? node.node_id);
  const outputKnowledge = output.knowledge_nodes ?? output.knowledge?.nodes ?? [];
  const outputKnowledgeById = new Map(outputKnowledge.map((node) => [
    node.knowledge_id, node,
  ]));
  const missingKnowledgeNodes = oracle.knowledge_nodes
    .map(({ knowledge_id }) => knowledge_id)
    .filter((id) => !outputKnowledgeById.has(id));
  const hierarchyMismatches = oracle.knowledge_nodes.flatMap((expected) => {
    const actual = outputKnowledgeById.get(expected.knowledge_id);
    if (!actual) return [];
    const sameChildren = JSON.stringify(actual.children ?? []) === JSON.stringify(expected.children);
    return actual.parent_id === expected.parent_id && actual.kind === expected.kind && sameChildren
      ? [] : [expected.knowledge_id];
  });
  const result = {
    qualification: "ATLAS-HARD-027",
    passed: false,
    node_count: outputNodes.length,
    edge_count: outputEdges.length,
    missing_concepts: goldenMain.nodes.map(({ concept }) => concept)
      .filter((concept) => !foundConcepts.has(concept)),
    missing_relationships: expectedEdges.filter((edge) => !actualEdges.has(edge)),
    duplicate_normalized_labels: [...new Set(duplicateLabels)],
    nodes_without_evidence: missingEvidence,
    missing_knowledge_nodes: missingKnowledgeNodes,
    hierarchy_mismatches: hierarchyMismatches,
    renderer_locked_by_oracle: oracle.renderer_policy.locked_renderer !== null,
  };
  result.passed = result.missing_concepts.length === 0
    && result.missing_relationships.length === 0
    && result.duplicate_normalized_labels.length === 0
    && result.nodes_without_evidence.length === 0
    && result.missing_knowledge_nodes.length === 0
    && result.hierarchy_mismatches.length === 0
    && result.renderer_locked_by_oracle === false;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const values = Object.fromEntries(process.argv.slice(2).map((value, index, args) =>
    value.startsWith("--") ? [value.slice(2), args[index + 1]] : []).filter(Boolean));
  if (!values.oracle || !values.output) throw new Error("Use --oracle <file> --output <overview-or-workspace.json>");
  const result = await qualifyHard027({ oraclePath: values.oracle, outputPath: values.output });
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (values.report) await writeFile(values.report, rendered, "utf8");
  process.stdout.write(rendered);
  process.exitCode = result.passed ? 0 : 2;
}
