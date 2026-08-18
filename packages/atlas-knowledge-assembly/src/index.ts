import { createHash } from "node:crypto";
import { GraphSelectionOutputSchema } from "@company/ces-atlas-graph-selection";
import { AtlasDocumentSchema, AtlasKnowledgeBundleSchema, AtlasProjectContextSchema,
  type AtlasContributionRole, type AtlasKnowledgeBundle, type AtlasProjectContext } from
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
  const semanticConcepts = buildSemanticConcepts(input.project_id, input.extraction.facts,
    moduleItems, moduleByLabel);
  const semanticRelationships = buildSemanticRelationships(input.project_id,
    input.extraction.facts, semanticConcepts);
  const semanticById = new Map(semanticConcepts.map((concept) => [concept.concept_id, concept]));
  const conceptKnowledgeId = (id: string) => `${input.project_id}.knowledge.concept.${short(id)}`;
  const knowledgeIdForConcept = (id: string) => moduleItems.find((item) =>
    conceptId(input.project_id, item.fact.exact_statement) === id)?.knowledgeId ?? conceptKnowledgeId(id);
  const assessmentsByModule = new Map(moduleItems.map((item) => [item.knowledgeId,
    input.selection.assessments.filter(({ scope_id, scope_kind }) =>
      scope_kind === "module" && scope_id.endsWith(`.${short(item.fact.fact_id)}`))
      .filter(({ support_status }) => support_status === "supported")]));
  const visualizations = moduleItems.flatMap((item) =>
    (assessmentsByModule.get(item.knowledgeId) ?? []).flatMap((assessment) => {
      const knowledgeId = `${item.knowledgeId}.visualization.${assessment.graph_type_id.split(".").at(-1)}`;
      const supporting = assessment.supporting_fact_ids.map((id) => facts.get(id))
        .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));
      const visualization = buildGraph(assessment.graph_type_id, supporting,
        semanticConcepts, semanticRelationships.resolved, knowledgeIdForConcept);
      if (!projectionSupported(assessment.graph_type_id, visualization)) return [];
      return [{
        knowledge_id: knowledgeId, parent_id: item.knowledgeId, child_ids: [],
        representation_ids: [],
        kind: "visualization" as const, display_name: graphName(assessment.graph_type_id),
        evidence_ids: unique(supporting.flatMap(({ evidence_ids }) => evidence_ids)),
        support_status: assessment.support_status === "supported" ? "supported" as const
          : "review_required" as const,
        permanently_visible: false,
        visualization,
      }];
    }));
  const moduleNodes = moduleItems.map((item) => ({
    knowledge_id: item.knowledgeId, parent_id: rootId,
    child_ids: semanticConcepts.filter(({ parent_concept_id }) =>
      parent_concept_id === conceptId(input.project_id, item.fact.exact_statement))
      .map(({ concept_id }) => conceptKnowledgeId(concept_id)),
    representation_ids: visualizations.filter(({ parent_id }) => parent_id === item.knowledgeId)
      .map(({ knowledge_id }) => knowledge_id),
    canonical_concept_id: conceptId(input.project_id, item.fact.exact_statement),
    kind: "module" as const, display_name: item.fact.exact_statement,
    source_label: item.fact.exact_statement, evidence_ids: item.fact.evidence_ids,
    support_status: "supported" as const,
  }));
  const conceptNodes = semanticConcepts.filter(({ semantic_kind }) => semantic_kind !== "module")
    .map((concept) => {
      const parent = semanticById.get(concept.parent_concept_id!);
      const parentModule = moduleItems.find((item) =>
        conceptId(input.project_id, item.fact.exact_statement) === concept.parent_concept_id);
      return { knowledge_id: conceptKnowledgeId(concept.concept_id),
        parent_id: parentModule?.knowledgeId ?? (parent ? conceptKnowledgeId(parent.concept_id) : null),
        child_ids: concept.child_concept_ids.map(conceptKnowledgeId), representation_ids: [],
        canonical_concept_id: concept.concept_id, kind: "concept" as const,
        display_name: concept.source_label, source_label: concept.source_label,
        semantic_kind: concept.semantic_kind, evidence_ids: concept.evidence_ids,
        confidence: concept.confidence, review_status: concept.review_status,
        decomposition_status: concept.decomposition_status, support_status: "supported" as const };
    });
  const rootGraphNodes = moduleItems.map((item) => graphNode(input.project_id,
    item.fact.exact_statement, item.fact.kind, item.fact.evidence_ids, item.knowledgeId));
  const rootNodeByKnowledge = new Map(rootGraphNodes.map((node) => [node.knowledge_id, node]));
  const moduleKnowledgeByConcept = new Map(moduleItems.map((item) =>
    [conceptId(input.project_id, item.fact.exact_statement), item.knowledgeId]));
  const rootEdges = semanticRelationships.resolved.flatMap((relationship) => {
    if (!["dependency", "activity_order"].includes(relationship.relationship_kind)) return [];
    const from = rootNodeByKnowledge.get(moduleKnowledgeByConcept.get(relationship.from_concept_id));
    const to = rootNodeByKnowledge.get(moduleKnowledgeByConcept.get(relationship.to_concept_id));
    return from && to ? [semanticEdge(relationship, from.graph_node_id, to.graph_node_id)] : [];
  });
  const businessWorkflowSupported = input.selection.assessments.some(({ scope_kind,
    graph_type_id, support_status }) => scope_kind === "project"
      && graph_type_id === "atlas.graph.business-workflow" && support_status === "supported");
  const rootGraphType = businessWorkflowSupported ? "atlas.graph.business-workflow"
    : rootEdges.length ? "atlas.graph.dependency-graph" : "atlas.graph.project-map";
  const root = {
    knowledge_id: rootId, parent_id: null, kind: "visualization" as const,
    child_ids: moduleNodes.map(({ knowledge_id }) => knowledge_id),
    representation_ids: [],
    display_name: "Main Workflow",
    evidence_ids: unique([...moduleItems.flatMap(({ fact }) => fact.evidence_ids),
      ...rootEdges.flatMap(({ evidence_ids }) => evidence_ids)]),
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
    semantic_model: { concepts: semanticConcepts,
      relationships: semanticRelationships.resolved,
      unresolved_relationships: semanticRelationships.unresolved },
    knowledge_nodes: [root, ...moduleNodes, ...conceptNodes, ...visualizations] });
}

export function assembleAtlasProjectContext(input: {
  bundle: unknown;
  predecessor?: AtlasProjectContext;
  contribution_roles?: Array<{ increment_id: string; destination_kind: "knowledge" | "relationship";
    destination_id: string; role: AtlasContributionRole }>;
}): AtlasProjectContext {
  const bundle = AtlasKnowledgeBundleSchema.parse(input.bundle);
  const predecessor = input.predecessor
    ? AtlasProjectContextSchema.parse(input.predecessor) : undefined;
  if (predecessor && predecessor.project_id !== bundle.project_id) {
    throw new Error("Atlas project context predecessor belongs to another project");
  }
  if (predecessor && predecessor.displayed_revision >= bundle.revision) {
    throw new Error("Atlas successor revision must advance its predecessor");
  }
  const previousIncrements = predecessor?.increments ?? [];
  const previousByDocument = new Set(previousIncrements.map(({ document_id, document_revision }) =>
    `${document_id}\u0000${document_revision}`));
  const additions = bundle.documents.filter(({ document_id, revision }) =>
    !previousByDocument.has(`${document_id}\u0000${revision}`)).map((document, index) => ({
      increment_id: `${document.document_id}.increment.${document.revision}`,
      sequence: previousIncrements.length + index + 1,
      document_id: document.document_id,
      document_revision: document.revision,
      content_hash: document.content_hash,
      title: document.original_name,
    }));
  const increments = [...previousIncrements, ...additions];
  if (!increments.length) throw new Error("Atlas project context requires a PRD increment");
  const incrementByDocument = new Map(increments.map((increment) =>
    [`${increment.document_id}\u0000${increment.document_revision}`, increment.increment_id]));
  const evidence = new Map(bundle.evidence.map((item) => [item.evidence_id, item]));
  const roleOverrides = new Map((input.contribution_roles ?? []).map((item) =>
    [`${item.increment_id}\u0000${item.destination_kind}\u0000${item.destination_id}`, item.role]));
  const previousIncrementIds = new Set(previousIncrements.map(({ increment_id }) => increment_id));
  const previousDestinations = new Set((predecessor?.contributions ?? []).map((item) =>
    `${item.destination_kind}\u0000${item.destination_id}`));
  const contributions = [
    ...bundle.knowledge_nodes.flatMap((node) => contributionRecords(bundle, incrementByDocument,
      evidence, roleOverrides, previousIncrementIds, previousDestinations,
      "knowledge", node.knowledge_id, node.evidence_ids)),
    ...bundle.semantic_model.relationships.flatMap((relationship) => contributionRecords(bundle,
      incrementByDocument, evidence, roleOverrides, previousIncrementIds, previousDestinations,
      "relationship", relationship.relationship_id,
      relationship.evidence_ids)),
  ];
  const predecessorRevisions = predecessor?.revisions.map((revision) =>
    revision.lifecycle === "approved" ? { ...revision, lifecycle: "superseded" as const } : revision) ?? [];
  return AtlasProjectContextSchema.parse({
    schema_version: "1.0.0", project_id: bundle.project_id,
    displayed_revision: bundle.revision, authority: bundle.authority,
    revisions: [...predecessorRevisions, {
      revision: bundle.revision,
      predecessor_revision: predecessor?.displayed_revision ?? null,
      lifecycle: bundle.authority.lifecycle,
      included_increment_ids: increments.map(({ increment_id }) => increment_id),
      knowledge_bundle_hash: projectDigest(canonicalJson(bundle)),
    }],
    increments,
    contributions,
  });
}

export function approveAtlasProjectContext(contextValue: unknown,
  approvedBundleValue: unknown): AtlasProjectContext {
  const context = AtlasProjectContextSchema.parse(contextValue);
  const bundle = AtlasKnowledgeBundleSchema.parse(approvedBundleValue);
  if (bundle.authority.lifecycle !== "approved" || bundle.project_id !== context.project_id
      || bundle.revision !== context.displayed_revision) {
    throw new Error("Approved Atlas context must match the approved knowledge revision");
  }
  return AtlasProjectContextSchema.parse({ ...context, authority: bundle.authority,
    revisions: context.revisions.map((revision) => revision.revision === bundle.revision
      ? { ...revision, lifecycle: "approved" } : revision) });
}

function contributionRecords(bundle: AtlasKnowledgeBundle,
  incrementByDocument: Map<string, string>, evidence: Map<string, AtlasKnowledgeBundle["evidence"][number]>,
  roleOverrides: Map<string, AtlasContributionRole>, previousIncrementIds: Set<string>,
  previousDestinations: Set<string>,
  destinationKind: "knowledge" | "relationship", destinationId: string, evidenceIds: string[]) {
  const groups = new Map<string, string[]>();
  for (const evidenceId of evidenceIds) {
    const location = evidence.get(evidenceId)?.location;
    if (!location) continue;
    const incrementId = incrementByDocument.get(`${location.document_id}\u0000${location.document_revision}`);
    if (!incrementId) throw new Error(`Evidence ${evidenceId} has no PRD increment`);
    const group = groups.get(incrementId) ?? []; group.push(evidenceId); groups.set(incrementId, group);
  }
  return [...groups].map(([incrementId, ids]) => {
    const override = roleOverrides.get(`${incrementId}\u0000${destinationKind}\u0000${destinationId}`);
    if (!previousIncrementIds.has(incrementId)
        && previousDestinations.has(`${destinationKind}\u0000${destinationId}`) && !override) {
      throw new Error(`Existing Atlas destination ${destinationId} requires an explicit contribution role`);
    }
    return { contribution_id: `${bundle.project_id}.contribution.${projectDigest(
      `${incrementId}\u0000${destinationKind}\u0000${destinationId}`).slice(7, 23)}`,
      increment_id: incrementId, destination_kind: destinationKind,
      destination_id: destinationId, role: override ?? "established" as const,
      evidence_ids: unique(ids) };
  });
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, child) => child !== null && typeof child === "object"
    && !Array.isArray(child) ? Object.fromEntries(Object.entries(child)
      .sort(([left], [right]) => left.localeCompare(right))) : child);
}
function projectDigest(value: string) { return `sha256:${digest(value)}`; }

type Fact = z.infer<typeof SemanticFactExtractionOutputSchema>["facts"][number];
type ModuleItem = { fact: Fact; knowledgeId: string };
function buildSemanticRelationships(project: string, facts: Fact[], concepts: Array<{
  concept_id: string; source_label: string }>) {
  const relationKinds = new Set<Fact["kind"]>(["activity_order", "state_transition",
    "entity_relationship", "dependency", "audit_action", "decision", "event"]);
  const byLabel = new Map<string, string[]>();
  for (const concept of concepts) {
    const key = conceptKey(concept.source_label); const ids = byLabel.get(key) ?? [];
    ids.push(concept.concept_id); byLabel.set(key, ids);
  }
  const resolved = []; const unresolved = [];
  for (const fact of facts.filter(({ kind }) => relationKinds.has(kind))) {
    const terms = orderedEndpointTerms(fact); const endpointLabels = terms.map(({ exact_text }) => exact_text);
    const matches = endpointLabels.map((label) => byLabel.get(conceptKey(label)) ?? []);
    const relationshipKind = normalizedRelationshipKind(fact.kind);
    const displayLabel = normalizedRelationshipKind(fact.relation_kind ?? fact.kind)
      .split(".").at(-1)!.replaceAll("_", " ");
    if (matches.length < 2 || matches.some(({ length }) => length === 0)) {
      unresolved.push({ candidate_id: `${project}.relationship-candidate.${short(fact.fact_id)}`,
        relationship_kind: relationshipKind, endpoint_labels: endpointLabels,
        evidence_ids: fact.evidence_ids, confidence: fact.confidence,
        review_status: "review_required" as const, reason: "missing_endpoint" as const });
      continue;
    }
    if (matches.some(({ length }) => length > 1)) {
      unresolved.push({ candidate_id: `${project}.relationship-candidate.${short(fact.fact_id)}`,
        relationship_kind: relationshipKind, endpoint_labels: endpointLabels,
        evidence_ids: fact.evidence_ids, confidence: fact.confidence,
        review_status: "review_required" as const, reason: "ambiguous_endpoint" as const });
      continue;
    }
    const from = matches[0]![0]!; const to = matches[1]![0]!;
    if (from === to) continue;
    const identity = `${from}\u0000${relationshipKind}\u0000${to}`;
    resolved.push({ relationship_id: `${project}.relationship.${digest(identity).slice(0, 16)}`,
      from_concept_id: from, to_concept_id: to, relationship_kind: relationshipKind,
      display_label: displayLabel,
      evidence_ids: fact.evidence_ids, confidence: fact.confidence,
      review_status: "unreviewed" as const });
  }
  return { resolved: deduplicateSemanticRelationships(resolved), unresolved };
}
function deduplicateSemanticRelationships<T extends { relationship_id: string; from_concept_id: string;
  to_concept_id: string; relationship_kind: string; evidence_ids: string[]; confidence: number }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) { const key = `${item.from_concept_id}\u0000${item.relationship_kind}\u0000${item.to_concept_id}`;
    const group = groups.get(key) ?? []; group.push(item); groups.set(key, group); }
  return [...groups.values()].map((group) => ({ ...group[0]!,
    evidence_ids: unique(group.flatMap(({ evidence_ids }) => evidence_ids)),
    confidence: Math.max(...group.map(({ confidence }) => confidence)) }));
}
function normalizedRelationshipKind(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^a-z0-9._-]+/gu, "_")
    .replace(/_+/gu, "_").replace(/^_|_$/gu, "") || "relationship";
}
function buildSemanticConcepts(project: string, facts: Fact[], modules: ModuleItem[],
  moduleByLabel: Map<string, ModuleItem>) {
  type Draft = { label: string; kind: ReturnType<typeof semanticKind>; evidence: string[];
    confidence: number; status: Fact["decomposition_status"]; parentLabel?: string;
    owner?: ModuleItem };
  const drafts: Draft[] = modules.map(({ fact }) => ({ label: fact.exact_statement,
    kind: "module", evidence: fact.evidence_ids, confidence: fact.confidence,
    status: fact.decomposition_status }));
  for (const fact of facts.filter(({ kind }) => kind !== "module")) {
    const owner = resolveOwningModule(fact, modules, moduleByLabel);
    const entries = fact.terms.length ? fact.terms.map((term) => ({ label: term.exact_text,
      kind: semanticKind(fact.kind, term.role_id) }))
      : [{ label: fact.exact_statement, kind: semanticKind(fact.kind) }];
    for (const entry of entries) {
      if (moduleByLabel.has(conceptKey(entry.label))) continue;
      drafts.push({ ...entry, evidence: fact.evidence_ids, confidence: fact.confidence,
        status: fact.decomposition_status,
        ...(fact.parent_source_label ? { parentLabel: fact.parent_source_label } : {}),
        ...(owner ? { owner } : {}) });
    }
  }
  const grouped = new Map<string, Draft[]>();
  for (const draft of drafts) {
    const key = conceptKey(draft.label); const group = grouped.get(key) ?? [];
    group.push(draft); grouped.set(key, group);
  }
  const merged = [...grouped.values()].map((group) => ({ ...group[0]!,
    evidence: unique(group.flatMap(({ evidence }) => evidence)),
    confidence: Math.max(...group.map(({ confidence }) => confidence)) }));
  const idByLabel = new Map(merged.map(({ label }) => [conceptKey(label), conceptId(project, label)]));
  const concepts = merged.filter((draft) => draft.kind === "module" || draft.owner
    || (draft.parentLabel && idByLabel.has(conceptKey(draft.parentLabel)))).map((draft) => {
    const id = conceptId(project, draft.label);
    const explicitParent = draft.parentLabel ? idByLabel.get(conceptKey(draft.parentLabel)) : undefined;
    const moduleParent = draft.owner ? conceptId(project, draft.owner.fact.exact_statement) : undefined;
    const parent = draft.kind === "module" ? null
      : explicitParent && explicitParent !== id ? explicitParent : moduleParent ?? null;
    return { concept_id: id, parent_concept_id: parent, child_concept_ids: [] as string[],
      semantic_kind: draft.kind, source_label: draft.label, evidence_ids: draft.evidence,
      confidence: draft.confidence, review_status: "unreviewed" as const,
      decomposition_status: draft.status === "context_only" ? "context_only" as const
        : draft.status === "review_required" ? "review_required" as const
        : draft.status === "unsupported" ? "unsupported" as const
        : draft.status === "decomposable" ? "decomposable" as const : "atomic" as const };
  });
  const byId = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  for (const concept of concepts) {
    if (concept.parent_concept_id) byId.get(concept.parent_concept_id)?.child_concept_ids.push(concept.concept_id);
  }
  for (const concept of concepts) concept.child_concept_ids.sort();
  return concepts;
}
function resolveOwningModule(fact: Fact, modules: ModuleItem[], moduleByLabel: Map<string, ModuleItem>) {
  for (const path of fact.context_paths) {
    for (const segment of path.split(" > ")) {
      const module = moduleByLabel.get(conceptKey(segment)); if (module) return module;
    }
  }
  const matches = unique(fact.terms.flatMap(({ exact_text }) => {
    const module = resolveModule(exact_text, moduleByLabel); return module ? [module.knowledgeId] : [];
  }));
  return matches.length === 1 ? modules.find(({ knowledgeId }) => knowledgeId === matches[0]) : undefined;
}
function semanticKind(kind: Fact["kind"], role = ""):
"business_capability" | "module" | "concept" | "actor" | "entity" | "input" | "action" |
"precondition" | "state" | "rule" | "decision" | "condition" | "outcome" | "validation" |
"permission" | "event" | "dependency" {
  if (/actor|user|role/u.test(role) || kind === "actor") return "actor";
  if (/input/u.test(role)) return "input";
  if (/condition|precondition/u.test(role) || kind === "condition") return "condition";
  if (/outcome|result/u.test(role) || kind === "outcome") return "outcome";
  if (/state/u.test(role) || kind === "state" || kind === "state_transition") return "state";
  if (/entity/u.test(role) || kind === "entity" || kind === "entity_relationship") return "entity";
  if (kind === "activity" || kind === "activity_order" || /activity|action|source|target/u.test(role)) return "action";
  if (kind === "business_rule") return "rule"; if (kind === "decision") return "decision";
  if (kind === "validation") return "validation"; if (kind === "permission") return "permission";
  if (kind === "event") return "event"; if (kind === "dependency") return "dependency";
  return "concept";
}
function buildGraph(graphType: string, facts: Fact[], concepts: Array<{ concept_id: string;
  semantic_kind: string; source_label: string; evidence_ids: string[] }>, relationships: Array<{
  relationship_id: string; from_concept_id: string; to_concept_id: string;
  relationship_kind: string; display_label: string; evidence_ids: string[]; confidence: number }>,
  knowledgeIdForConcept: (id: string) => string) {
  const evidence = new Set(facts.flatMap(({ evidence_ids }) => evidence_ids));
  const selectedRelationships = relationships.filter((relationship) =>
    relationshipKindsForGraph(graphType).includes(relationship.relationship_kind)
    && relationship.evidence_ids.some((id) => evidence.has(id)));
  const relatedIds = new Set(selectedRelationships.flatMap(({ from_concept_id, to_concept_id }) =>
    [from_concept_id, to_concept_id]));
  const selected = concepts.filter((concept) => relatedIds.has(concept.concept_id)
    || concept.evidence_ids.some((id) => evidence.has(id)) && concept.semantic_kind !== "module");
  const nodes = selected.map((concept) => ({ graph_node_id: `atlas.graph-node.${short(concept.concept_id)}`,
    canonical_concept_id: concept.concept_id, knowledge_id: knowledgeIdForConcept(concept.concept_id),
    semantic_kind_id: `atlas.semantic.${concept.semantic_kind.replaceAll("_", "-")}`,
    label: concept.source_label, label_origin: "original_document" as const,
    evidence_ids: concept.evidence_ids }));
  const nodeByConcept = new Map(nodes.map((node) => [node.canonical_concept_id, node]));
  const edges = selectedRelationships.flatMap((relationship) => {
    const from = nodeByConcept.get(relationship.from_concept_id);
    const to = nodeByConcept.get(relationship.to_concept_id);
    return from && to ? [semanticEdge(relationship, from.graph_node_id, to.graph_node_id)] : [];
  });
  return { graph_type_id: graphType, nodes, edges,
    ordering_status: edges.length ? "established" as const : "not_applicable" as const,
    renderer_capabilities: capabilities() };
}
function projectionSupported(graphType: string, graph: ReturnType<typeof buildGraph>) {
  if (!graph.nodes.length) return false;
  return ["atlas.graph.workflow", "atlas.graph.state-machine", "atlas.graph.decision-tree",
    "atlas.graph.entity-lifecycle", "atlas.graph.dependency-graph", "atlas.graph.audit-flow",
    "atlas.graph.entity-relationship"].includes(graphType) ? graph.edges.length > 0 : true;
}
function relationshipKindsForGraph(graphType: string): string[] {
  const kinds: Record<string, string[]> = {
    "atlas.graph.workflow": ["activity_order"],
    "atlas.graph.state-machine": ["state_transition"],
    "atlas.graph.decision-tree": ["decision"],
    "atlas.graph.entity-lifecycle": ["state_transition", "event"],
    "atlas.graph.dependency-graph": ["dependency"],
    "atlas.graph.audit-flow": ["audit_action"],
    "atlas.graph.entity-relationship": ["entity_relationship"],
  };
  return kinds[graphType] ?? [];
}
function semanticEdge(relationship: { relationship_id: string; relationship_kind: string;
  display_label: string; evidence_ids: string[]; confidence: number }, from: string, to: string) {
  return { graph_edge_id: `atlas.graph-edge.${short(relationship.relationship_id)}`,
    from_graph_node_id: from, to_graph_node_id: to,
    relationship_kind: relationship.relationship_kind.replaceAll("-", "_"),
    display_label: relationship.display_label, evidence_ids: relationship.evidence_ids,
    confidence: relationship.confidence };
}
function graphNode(project: string, label: string, kind: string, evidence: string[], knowledgeId?: string) {
  const identity = digest(label.toLocaleLowerCase()).slice(0, 16);
  return { graph_node_id: `${project}.graph-node.${identity}`,
    canonical_concept_id: conceptId(project, label), ...(knowledgeId ? { knowledge_id: knowledgeId } : {}),
    semantic_kind_id: kind, label, label_origin: "original_document" as const,
    evidence_ids: unique(evidence) };
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
