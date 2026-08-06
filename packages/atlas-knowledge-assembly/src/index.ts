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
  const modules = input.extraction.facts.filter(({ kind }) => kind === "module");
  if (modules.length === 0) throw new Error("Main Workflow requires at least one evidenced module");
  const rootId = `${input.project_id}.knowledge.main-workflow`;
  const moduleItems = modules.map((fact) => ({ fact,
    knowledgeId: `${input.project_id}.knowledge.module.${short(fact.fact_id)}` }));
  const moduleByLabel = new Map(moduleItems.map((item) =>
    [item.fact.exact_statement.toLocaleLowerCase(), item]));
  const assessmentsByModule = new Map(moduleItems.map((item) => [item.knowledgeId,
    input.selection.assessments.filter(({ scope_id, scope_kind }) =>
      scope_kind === "module" && scope_id.endsWith(`.${short(item.fact.fact_id)}`))]));
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
  const rootEdges = input.extraction.facts.filter(({ kind }) =>
    kind === "dependency" || kind === "activity_order").flatMap((fact) => {
      const endpoints = fact.terms.map(({ exact_text }) =>
        moduleByLabel.get(exact_text.toLocaleLowerCase())).filter(Boolean);
      if (endpoints.length < 2) return [];
      return [edge(fact, rootGraphNodes.find(({ knowledge_id }) =>
        knowledge_id === endpoints[0]!.knowledgeId)!.graph_node_id,
      rootGraphNodes.find(({ knowledge_id }) =>
        knowledge_id === endpoints[1]!.knowledgeId)!.graph_node_id)];
    });
  const root = {
    knowledge_id: rootId, parent_id: null, kind: "visualization" as const,
    child_ids: moduleNodes.map(({ knowledge_id }) => knowledge_id),
    display_name: "Main Workflow",
    evidence_ids: unique(moduleItems.flatMap(({ fact }) => fact.evidence_ids)),
    support_status: rootEdges.length ? "supported" as const : "partial" as const,
    permanently_visible: true,
    visualization: { graph_type_id: "atlas.graph.business-workflow",
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
  const nodeByLabel = new Map(nodes.map((node) => [node.label, node]));
  const edges = facts.flatMap((fact) => fact.terms.length >= 2 ? [edge(fact,
    nodeByLabel.get(fact.terms[0]!.exact_text)!.graph_node_id,
    nodeByLabel.get(fact.terms[1]!.exact_text)!.graph_node_id)] : []);
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
  return `${project}.concept.${digest(label.toLocaleLowerCase()).slice(0, 16)}`;
}
function graphName(id: string) { return id.split(".").at(-1)!.split("-")
  .map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "); }
function short(id: string) { return id.split(".").at(-1)!; }
function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function unique<T>(values: T[]): T[] { return [...new Set(values)].sort(); }
