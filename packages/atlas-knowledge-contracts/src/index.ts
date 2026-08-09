import { z } from "zod";

export const ATLAS_KNOWLEDGE_CONTRACT_VERSION = "2.0.0" as const;

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const ExactText = z.string().min(1);
const Confidence = z.number().min(0).max(1);

export const AtlasSemanticKindSchema = z.enum([
  "business_capability", "module", "concept", "actor", "entity", "input",
  "action", "precondition", "state", "rule", "decision", "condition",
  "outcome", "validation", "permission", "event", "dependency",
]);

export const AtlasDecompositionStatusSchema = z.enum([
  "decomposable", "atomic", "context_only", "unsupported", "review_required",
  "extraction_failed",
]);

export const AtlasSemanticConceptSchema = z.object({
  concept_id: Id,
  parent_concept_id: Id.nullable(),
  child_concept_ids: z.array(Id),
  semantic_kind: AtlasSemanticKindSchema,
  source_label: ExactText,
  evidence_ids: z.array(Id).min(1),
  confidence: Confidence,
  review_status: z.enum(["unreviewed", "accepted", "rejected"]),
  decomposition_status: AtlasDecompositionStatusSchema,
}).strict();

export const AtlasSemanticRelationshipSchema = z.object({
  relationship_id: Id,
  from_concept_id: Id,
  to_concept_id: Id,
  relationship_kind: Id,
  display_label: z.string().regex(/^[a-z][a-z0-9]*(?:[ -][a-z0-9]+)*$/u),
  evidence_ids: z.array(Id).min(1),
  confidence: Confidence,
  review_status: z.enum(["unreviewed", "accepted", "rejected"]),
}).strict();

export const AtlasUnresolvedSemanticRelationshipSchema = z.object({
  candidate_id: Id,
  relationship_kind: Id,
  endpoint_labels: z.array(ExactText),
  evidence_ids: z.array(Id).min(1),
  confidence: Confidence,
  review_status: z.literal("review_required"),
  reason: z.enum(["missing_endpoint", "ambiguous_endpoint"]),
}).strict();

export const AtlasSemanticModelSchema = z.object({
  concepts: z.array(AtlasSemanticConceptSchema),
  relationships: z.array(AtlasSemanticRelationshipSchema),
  unresolved_relationships: z.array(AtlasUnresolvedSemanticRelationshipSchema).default([]),
}).strict().superRefine((model, context) => {
  const concepts = new Map(model.concepts.map((concept) => [concept.concept_id, concept]));
  const issue = (message: string): void => context.addIssue({ code: "custom", message });
  if (concepts.size !== model.concepts.length) issue("Semantic concept IDs must be unique");
  for (const concept of model.concepts) {
    if (new Set(concept.child_concept_ids).size !== concept.child_concept_ids.length) {
      issue(`Semantic concept ${concept.concept_id} has duplicate children`);
    }
    if (concept.parent_concept_id && !concepts.has(concept.parent_concept_id)) {
      issue(`Semantic concept ${concept.concept_id} has an unknown parent`);
    }
    if (concept.parent_concept_id &&
        !concepts.get(concept.parent_concept_id)?.child_concept_ids.includes(concept.concept_id)) {
      issue(`Semantic parent does not link to ${concept.concept_id}`);
    }
    for (const child of concept.child_concept_ids) {
      if (concepts.get(child)?.parent_concept_id !== concept.concept_id) {
        issue(`Semantic child ${child} does not link back to ${concept.concept_id}`);
      }
    }
  }
  for (const relationship of model.relationships) {
    if (!concepts.has(relationship.from_concept_id) || !concepts.has(relationship.to_concept_id)) {
      issue(`Semantic relationship ${relationship.relationship_id} has an unknown endpoint`);
    }
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { issue(`Semantic hierarchy contains a cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const child of concepts.get(id)?.child_concept_ids ?? []) visit(child);
    visiting.delete(id); visited.add(id);
  };
  const roots = model.concepts.filter(({ parent_concept_id }) => !parent_concept_id);
  for (const concept of roots) {
    visit(concept.concept_id);
  }
  for (const concept of model.concepts) visit(concept.concept_id);
  if (model.concepts.length && roots.length === 0) issue("Semantic model requires a root concept");
  if (visited.size !== concepts.size) issue("Every semantic concept must be reachable from a root concept");
});

export const AtlasNormalizedBoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
  coordinate_space: z.literal("normalized_page"),
  origin: z.literal("top_left"),
}).strict().superRefine((box, context) => {
  if (box.x + box.width > 1 || box.y + box.height > 1) {
    context.addIssue({ code: "custom", message: "PDF bounding box exceeds its page" });
  }
});

const AvailableCoordinatesSchema = z.object({
  coordinate_status: z.literal("available"),
  bounding_boxes: z.array(AtlasNormalizedBoundingBoxSchema).min(1),
}).strict();
const UnavailableCoordinatesSchema = z.object({
  coordinate_status: z.literal("unavailable"),
  bounding_boxes: z.tuple([]),
  reason: z.enum(["source_has_no_coordinates", "ocr_coordinates_unreliable",
    "unsupported_source_format"]),
}).strict();

export const AtlasEvidenceLocationSchema = z.object({
  document_id: Id,
  document_revision: z.number().int().positive(),
  source_unit_id: Id,
  page_number: z.number().int().positive(),
  page_number_base: z.literal(1),
  text_span: z.object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
  }).strict().refine(({ start, end }) => end > start),
  coordinates: z.discriminatedUnion("coordinate_status", [
    AvailableCoordinatesSchema, UnavailableCoordinatesSchema,
  ]),
}).strict();

export const AtlasEvidenceSchema = z.object({
  evidence_id: Id,
  exact_text: ExactText,
  language: z.string().min(2),
  location: AtlasEvidenceLocationSchema,
  extraction_method: z.enum(["text_layer", "ocr", "structured_text"]),
  extraction_confidence: Confidence,
  review_status: z.enum(["unreviewed", "accepted", "rejected"]),
}).strict();

export const AtlasDocumentSchema = z.object({
  document_id: Id,
  revision: z.number().int().positive(),
  content_hash: Hash,
  media_type: z.string().min(1),
  original_name: ExactText,
  page_count: z.number().int().positive().optional(),
}).strict();

export const AtlasGraphNodeSchema = z.object({
  graph_node_id: Id,
  canonical_concept_id: Id,
  knowledge_id: Id.optional(),
  semantic_kind_id: Id,
  label: ExactText,
  label_origin: z.literal("original_document"),
  evidence_ids: z.array(Id).min(1),
}).strict();

export const AtlasGraphEdgeSchema = z.object({
  graph_edge_id: Id,
  from_graph_node_id: Id,
  to_graph_node_id: Id,
  relationship_kind: z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u),
  display_label: z.string().regex(/^[a-z][a-z0-9]*(?:[ -][a-z0-9]+)*$/u),
  evidence_ids: z.array(Id).min(1),
  confidence: Confidence,
}).strict();

export const AtlasVisualizationSchema = z.object({
  graph_type_id: Id,
  nodes: z.array(AtlasGraphNodeSchema),
  edges: z.array(AtlasGraphEdgeSchema),
  ordering_status: z.enum(["established", "partial", "not_applicable"]),
  renderer_capabilities: z.object({
    interactive_required: z.boolean(),
    capabilities: z.array(z.enum(["pan", "zoom", "select", "focus_relationships",
      "accessible_summary"])),
  }).strict(),
}).strict();

const KnowledgeBaseSchema = z.object({
  knowledge_id: Id,
  parent_id: Id.nullable(),
  child_ids: z.array(Id),
  canonical_concept_id: Id.optional(),
  display_name: ExactText,
  evidence_ids: z.array(Id),
  support_status: z.enum(["supported", "partial", "review_required"]),
  representation_ids: z.array(Id).default([]),
}).strict();

export const AtlasModuleKnowledgeSchema = KnowledgeBaseSchema.extend({
  kind: z.literal("module"),
  canonical_concept_id: Id,
  source_label: ExactText,
}).strict();
export const AtlasConceptKnowledgeSchema = KnowledgeBaseSchema.extend({
  kind: z.literal("concept"),
  canonical_concept_id: Id,
  semantic_kind: AtlasSemanticKindSchema,
  source_label: ExactText,
  confidence: Confidence,
  review_status: z.enum(["unreviewed", "accepted", "rejected"]),
  decomposition_status: AtlasDecompositionStatusSchema,
}).strict();
export const AtlasVisualizationKnowledgeSchema = KnowledgeBaseSchema.extend({
  kind: z.literal("visualization"),
  visualization: AtlasVisualizationSchema,
  permanently_visible: z.boolean().default(false),
}).strict();
export const AtlasContentKnowledgeSchema = KnowledgeBaseSchema.extend({
  kind: z.literal("content"),
  content_type_id: Id,
  content: z.record(z.string(), z.unknown()),
}).strict();

export const AtlasKnowledgeNodeSchema = z.discriminatedUnion("kind", [
  AtlasModuleKnowledgeSchema,
  AtlasConceptKnowledgeSchema,
  AtlasVisualizationKnowledgeSchema,
  AtlasContentKnowledgeSchema,
]);

export const AtlasKnowledgeAuthoritySchema = z.discriminatedUnion("lifecycle", [
  z.object({ lifecycle: z.literal("proposed"), authority: z.literal("non_authoritative") }).strict(),
  z.object({ lifecycle: z.literal("approved"), authority: z.literal("authoritative"),
    approval_decision_ids: z.array(Id).min(1) }).strict(),
]);

export const AtlasKnowledgeBundleSchema = z.object({
  schema_version: z.literal(ATLAS_KNOWLEDGE_CONTRACT_VERSION),
  project_id: Id,
  revision: z.number().int().positive(),
  authority: AtlasKnowledgeAuthoritySchema,
  root_knowledge_id: Id,
  documents: z.array(AtlasDocumentSchema).min(1),
  evidence: z.array(AtlasEvidenceSchema),
  semantic_model: AtlasSemanticModelSchema,
  knowledge_nodes: z.array(AtlasKnowledgeNodeSchema).min(1),
}).strict().superRefine((bundle, context) => {
  const issue = (message: string): void => context.addIssue({ code: "custom", message });
  const nodes = new Map(bundle.knowledge_nodes.map((node) => [node.knowledge_id, node]));
  const evidence = new Set(bundle.evidence.map(({ evidence_id }) => evidence_id));
  const documents = new Map(bundle.documents.map((document) =>
    [document.document_id, document]));
  if (nodes.size !== bundle.knowledge_nodes.length) issue("Knowledge IDs must be unique");
  if (evidence.size !== bundle.evidence.length) issue("Evidence IDs must be unique");
  const root = nodes.get(bundle.root_knowledge_id);
  if (!root || root.parent_id !== null || root.kind !== "visualization"
    || !root.permanently_visible) issue("Root must be the permanent Main Workflow");
  if (bundle.knowledge_nodes.filter(({ parent_id }) => parent_id === null).length !== 1) {
    issue("Knowledge hierarchy requires exactly one root");
  }
  for (const item of bundle.evidence) {
    const document = documents.get(item.location.document_id);
    if (!document || document.revision !== item.location.document_revision) {
      issue(`Evidence ${item.evidence_id} references an unknown document revision`);
    }
  }
  for (const node of bundle.knowledge_nodes) {
    if (new Set(node.child_ids).size !== node.child_ids.length) {
      issue(`Knowledge node ${node.knowledge_id} has duplicate children`);
    }
    if (node.parent_id !== null && !nodes.has(node.parent_id)) {
      issue(`Knowledge node ${node.knowledge_id} has an unknown parent`);
    }
    for (const childId of node.child_ids) {
      if (nodes.get(childId)?.parent_id !== node.knowledge_id) {
        issue(`Knowledge child ${childId} does not link back to ${node.knowledge_id}`);
      }
    }
    for (const evidenceId of node.evidence_ids) {
      if (!evidence.has(evidenceId)) issue(`Knowledge node references unknown evidence ${evidenceId}`);
    }
    for (const representationId of node.representation_ids) {
      const representation = nodes.get(representationId);
      if (representation?.kind !== "visualization" || representation.parent_id !== node.knowledge_id) {
        issue(`Knowledge representation ${representationId} does not link back to ${node.knowledge_id}`);
      }
    }
    if (node.child_ids.some((id) => nodes.get(id)?.kind === "visualization")) {
      issue(`Knowledge node ${node.knowledge_id} uses a graph as a semantic child`);
    }
    if (node.kind === "visualization") {
      const graphNodes = new Set(node.visualization.nodes.map(({ graph_node_id }) => graph_node_id));
      if (graphNodes.size !== node.visualization.nodes.length) {
        issue(`Visualization ${node.knowledge_id} has duplicate graph nodes`);
      }
      for (const graphNode of node.visualization.nodes) {
        for (const evidenceId of graphNode.evidence_ids) {
          if (!evidence.has(evidenceId)) issue(`Graph node references unknown evidence ${evidenceId}`);
        }
      }
      for (const edge of node.visualization.edges) {
        if (!graphNodes.has(edge.from_graph_node_id) || !graphNodes.has(edge.to_graph_node_id)) {
          issue(`Visualization ${node.knowledge_id} has an edge with an unknown endpoint`);
        }
        for (const evidenceId of edge.evidence_ids) {
          if (!evidence.has(evidenceId)) issue(`Graph edge references unknown evidence ${evidenceId}`);
        }
      }
    }
  }
  if (root?.kind === "visualization") {
    const directModules = new Set(root.child_ids.filter((id) => nodes.get(id)?.kind === "module"));
    if (directModules.size !== root.child_ids.length) issue("Main Workflow children must be modules only");
    const mapped = new Set(root.visualization.nodes.flatMap(({ knowledge_id }) =>
      knowledge_id ? [knowledge_id] : []));
    if (mapped.size !== directModules.size || [...directModules].some((id) => !mapped.has(id))) {
      issue("Main Workflow graph must map every direct module exactly once");
    }
  }
  for (const concept of bundle.semantic_model.concepts) {
    for (const evidenceId of concept.evidence_ids) {
      if (!evidence.has(evidenceId)) issue(`Semantic concept references unknown evidence ${evidenceId}`);
    }
  }
  for (const relationship of bundle.semantic_model.relationships) {
    for (const evidenceId of relationship.evidence_ids) {
      if (!evidence.has(evidenceId)) issue(`Semantic relationship references unknown evidence ${evidenceId}`);
    }
  }
  for (const relationship of bundle.semantic_model.unresolved_relationships) {
    for (const evidenceId of relationship.evidence_ids) {
      if (!evidence.has(evidenceId)) issue(`Unresolved relationship references unknown evidence ${evidenceId}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) { issue(`Knowledge hierarchy contains a cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    const node = nodes.get(id);
    for (const child of [...node?.child_ids ?? [], ...node?.representation_ids ?? []]) visit(child);
    visiting.delete(id);
    visited.add(id);
  };
  visit(bundle.root_knowledge_id);
  if (visited.size !== nodes.size) issue("Every knowledge node must be reachable from the root");
});

export function knowledgeBreadcrumb(bundleValue: unknown, knowledgeId: string): string[] {
  const bundle = AtlasKnowledgeBundleSchema.parse(bundleValue);
  const nodes = new Map(bundle.knowledge_nodes.map((node) => [node.knowledge_id, node]));
  if (!nodes.has(knowledgeId)) throw new Error(`Unknown knowledge node: ${knowledgeId}`);
  const result: string[] = [];
  let current: string | null = knowledgeId;
  while (current !== null) {
    result.unshift(current);
    current = nodes.get(current)?.parent_id ?? null;
  }
  return result;
}

export type AtlasKnowledgeBundle = z.infer<typeof AtlasKnowledgeBundleSchema>;
export type AtlasKnowledgeNode = z.infer<typeof AtlasKnowledgeNodeSchema>;
export type AtlasEvidence = z.infer<typeof AtlasEvidenceSchema>;
export type AtlasSemanticConcept = z.infer<typeof AtlasSemanticConceptSchema>;
export type AtlasSemanticRelationship = z.infer<typeof AtlasSemanticRelationshipSchema>;
export type AtlasUnresolvedSemanticRelationship = z.infer<typeof AtlasUnresolvedSemanticRelationshipSchema>;
export type AtlasSemanticModel = z.infer<typeof AtlasSemanticModelSchema>;
