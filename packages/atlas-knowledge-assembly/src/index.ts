import { createHash } from "node:crypto";
import { GraphSelectionOutputSchema } from "@company/ces-atlas-graph-selection";
import { AtlasDocumentSchema, AtlasKnowledgeBundleSchema } from
  "@company/ces-atlas-knowledge-contracts";
import { SemanticFactExtractionOutputSchema } from "@company/ces-atlas-semantic-facts";
import { z } from "zod";

const InputSchema = z.object({
  project_id: z.string().min(1),
  revision: z.number().int().positive(),
  documents: z.array(AtlasDocumentSchema).min(1),
  extraction: SemanticFactExtractionOutputSchema,
  selection: GraphSelectionOutputSchema,
}).strict();

export function assembleAtlasKnowledge(inputValue: unknown) {
  const input = InputSchema.parse(inputValue);
  if (input.project_id !== input.extraction.project_id ||
      input.project_id !== input.selection.project_id) {
    throw new Error("Atlas assembly inputs must describe the same project");
  }
  const facts = new Map(input.extraction.facts.map((fact) => [fact.fact_id, fact]));
  const evidence = new Map(input.extraction.evidence.map((item) =>
    [item.evidence_id, item]));
  const moduleFacts = input.extraction.facts.filter(({ kind }) => kind === "module")
    .sort((left, right) => sourceOrder(left, evidence).localeCompare(sourceOrder(right, evidence))
      || left.fact_id.localeCompare(right.fact_id));
  const groupedModules = new Map<string, Fact[]>();
  for (const module of moduleFacts) {
    const key = conceptKey(module.exact_statement);
    const group = groupedModules.get(key) ?? [];
    group.push(module); groupedModules.set(key, group);
  }
  const modules = [...groupedModules.values()].map((group) => ({ ...group[0]!,
    evidence_ids: unique(group.flatMap(({ evidence_ids }) => evidence_ids)) }));
  if (modules.length === 0) throw new Error("Main Workflow requires at least one evidenced module");
  const rootId = `${input.project_id}.knowledge.main-workflow`;
  const moduleItems = modules.map((fact) => ({ fact,
    knowledgeId: `${input.project_id}.knowledge.module.${short(fact.fact_id)}` }));
  const moduleByLabel = new Map<string, typeof moduleItems[number]>();
  for (const item of moduleItems) {
    for (const label of [item.fact.exact_statement,
      ...item.fact.terms.map(({ exact_text }) => exact_text)]) {
      moduleByLabel.set(conceptKey(label), item);
    }
  }
  const assessmentsByModule = new Map(moduleItems.map((item) => [item.knowledgeId,
    input.selection.assessments.filter(({ scope_id, scope_kind }) =>
      scope_kind === "module" && scope_id.endsWith(`.${short(item.fact.fact_id)}`))
      .filter(({ support_status }) => support_status === "supported")]));
  const visualizations = moduleItems.flatMap((item) =>
    (assessmentsByModule.get(item.knowledgeId) ?? []).map((assessment) => {
      const knowledgeId = `${item.knowledgeId}.visualization.${assessment.graph_type_id.split(".").at(-1)}`;
      const supporting = assessment.supporting_fact_ids.map((id) => facts.get(id))
        .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));
      return {
        knowledge_id: knowledgeId, parent_id: item.knowledgeId, child_ids: [],
        kind: "visualization" as const, display_name: graphName(assessment.graph_type_id),
        evidence_ids: unique(supporting.flatMap(({ evidence_ids }) => evidence_ids)),
        support_status: assessment.support_status === "supported" ? "supported" as const
          : "review_required" as const,
        permanently_visible: false,
        visualization: buildGraph(assessment.graph_type_id, supporting),
      };
    }));
  const moduleNodes = moduleItems.map((item) => ({
    knowledge_id: item.knowledgeId, parent_id: rootId,
    child_ids: visualizations.filter(({ parent_id }) => parent_id === item.knowledgeId)
      .map(({ knowledge_id }) => knowledge_id),
    canonical_concept_id: conceptId(input.project_id, item.fact.exact_statement),
    kind: "module" as const, display_name: item.fact.exact_statement,
    source_label: item.fact.exact_statement, evidence_ids: item.fact.evidence_ids,
    support_status: "supported" as const,
  }));
  const rootGraphNodes = moduleItems.map((item) => graphNode(input.project_id,
    item.fact.exact_statement, item.fact.kind, item.fact.evidence_ids, item.knowledgeId));
  const rootNodeByKnowledge = new Map(rootGraphNodes.map((node) => [node.knowledge_id, node]));
  const rootEdges = input.extraction.facts.filter(({ kind }) =>
    kind === "dependency" || kind === "activity_order").flatMap((fact) => {
      const endpoints = orderedEndpointTerms(fact).map(({ exact_text }) =>
        resolveModule(exact_text, moduleByLabel)).filter(Boolean);
      if (endpoints.length < 2) return [];
      const from = rootNodeByKnowledge.get(endpoints[0]!.knowledgeId);
      const to = rootNodeByKnowledge.get(endpoints[1]!.knowledgeId);
      if (!from || !to || from.graph_node_id === to.graph_node_id) return [];
      return [edge(fact, from.graph_node_id, to.graph_node_id)];
    });
  const businessWorkflowSupported = input.selection.assessments.some(({ scope_kind,
    graph_type_id, support_status }) => scope_kind === "project"
      && graph_type_id === "atlas.graph.business-workflow" && support_status === "supported");
  const rootGraphType = businessWorkflowSupported ? "atlas.graph.business-workflow"
    : rootEdges.length ? "atlas.graph.dependency-graph" : "atlas.graph.project-map";
  const root = {
    knowledge_id: rootId, parent_id: null, kind: "visualization" as const,
    child_ids: moduleNodes.map(({ knowledge_id }) => knowledge_id),
    display_name: "Main Workflow",
    evidence_ids: unique(moduleItems.flatMap(({ fact }) => fact.evidence_ids)),
    support_status: rootEdges.length ? "supported" as const : "partial" as const,
    permanently_visible: true,
    visualization: { graph_type_id: rootGraphType,
      nodes: rootGraphNodes, edges: rootEdges,
      ordering_status: rootEdges.length ? "partial" as const : "not_applicable" as const,
      renderer_capabilities: capabilities() },
  };
  return AtlasKnowledgeBundleSchema.parse({ schema_version: "2.0.0",
    project_id: input.project_id, revision: input.revision,
    authority: { lifecycle: "proposed", authority: "non_authoritative" },
    root_knowledge_id: rootId, documents: input.documents,
    evidence: input.extraction.evidence,
    knowledge_nodes: [root, ...moduleNodes, ...visualizations] });
}

type Fact = z.infer<typeof SemanticFactExtractionOutputSchema>["facts"][number];
function buildGraph(graphType: string, facts: Fact[]) {
  const termEntries = facts.flatMap((fact) => fact.terms.map((term) => ({ fact, term })));
  const labels = unique(termEntries.map(({ term }) => term.exact_text));
  const source = labels.length ? labels.map((label) => ({ label,
    evidence: unique(termEntries.filter(({ term }) => term.exact_text === label)
      .flatMap(({ fact }) => fact.evidence_ids)), kind: "atlas.semantic.concept" }))
    : facts.map((fact) => ({ label: fact.exact_statement, evidence: fact.evidence_ids,
      kind: `atlas.semantic.${fact.kind.replaceAll("_", "-")}` }));
  const nodes = source.map((item) => graphNode("atlas", item.label, item.kind, item.evidence));
  const nodeByLabel = new Map(nodes.map((node) => [conceptKey(node.label), node]));
  const edges = facts.flatMap((fact) => {
    const endpoints = orderedEndpointTerms(fact).map(({ exact_text }) =>
      nodeByLabel.get(conceptKey(exact_text))).filter(Boolean);
    return endpoints.length >= 2 && endpoints[0]!.graph_node_id !== endpoints[1]!.graph_node_id
      ? [edge(fact, endpoints[0]!.graph_node_id, endpoints[1]!.graph_node_id)] : [];
  });
  return { graph_type_id: graphType, nodes, edges,
    ordering_status: edges.length ? "established" as const : "not_applicable" as const,
    renderer_capabilities: capabilities() };
}
function graphNode(project: string, label: string, kind: string, evidence: string[], knowledgeId?: string) {
  const identity = digest(label.toLocaleLowerCase()).slice(0, 16);
  return { graph_node_id: `${project}.graph-node.${identity}`,
    canonical_concept_id: conceptId(project, label), ...(knowledgeId ? { knowledge_id: knowledgeId } : {}),
    semantic_kind_id: kind, label, label_origin: "original_document" as const,
    evidence_ids: unique(evidence) };
}
function edge(fact: Fact, from: string, to: string) {
  const relationship = fact.relation_kind ?? fact.kind;
  return { graph_edge_id: `atlas.graph-edge.${short(fact.fact_id)}`, from_graph_node_id: from,
    to_graph_node_id: to, relationship_kind: relationship.replaceAll("-", "_"),
    display_label: relationship.replaceAll("_", " "), evidence_ids: fact.evidence_ids,
    confidence: fact.confidence };
}
function capabilities() { return { interactive_required: true,
  capabilities: ["pan", "zoom", "select", "focus_relationships", "accessible_summary"] as const }; }
function conceptId(project: string, label: string) {
  return `${project}.concept.${digest(conceptKey(label)).slice(0, 16)}`;
}
function conceptKey(value: string) { return value.normalize("NFKC").toLocaleLowerCase()
  .replace(/^\s*\d{1,3}[.)-]\s*/u, "").replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim().replace(/\s+/gu, " "); }
function orderedEndpointTerms(fact: Fact) {
  const source = fact.terms.find(({ role_id }) => /^(?:source|from|actor|entity_source)$/u.test(role_id));
  const target = fact.terms.find(({ role_id }) => /^(?:target|to|outcome|entity_target)$/u.test(role_id));
  return source && target ? [source, target] : fact.terms.slice(0, 2);
}
function resolveModule(label: string, modules: Map<string, { fact: Fact; knowledgeId: string }>) {
  const key = conceptKey(label);
  const exact = modules.get(key);
  if (exact) return exact;
  const matches = [...modules.entries()].filter(([candidate]) =>
    candidate.includes(key) || key.includes(candidate)).map(([, item]) => item);
  return matches.length === 1 ? matches[0] : undefined;
}
function graphName(id: string) { return id.split(".").at(-1)!.split("-")
  .map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "); }
function short(id: string) { return id.split(".").at(-1)!; }
function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function unique<T>(values: T[]): T[] { return [...new Set(values)].sort(); }
function sourceOrder(fact: Fact, evidence: Map<string, { location: {
  document_id: string; document_revision: number; page_number: number; source_unit_id: string } }>) {
  return fact.evidence_ids.map((id) => evidence.get(id)).filter(Boolean)
    .map((item) => `${item!.location.document_id}\u0000${String(item!.location.document_revision)
      .padStart(10, "0")}\u0000${String(item!.location.page_number).padStart(10, "0")}\u0000${item!.location.source_unit_id}`)
    .sort()[0] ?? fact.fact_id;
}
