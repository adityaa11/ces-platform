import { createHash } from "node:crypto";
import {
  AtlasUncertaintySchema,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
import type { AtlasReviewOutput } from "@company/ces-atlas-review";
import {
  RequirementLinkSchema,
  type RequirementLink,
} from "@company/ces-greenfield-contracts";
import { compilePolicyManifest } from "@company/ces-policy-engine";
import type { PolicyManifest } from "@company/ces-policy-manifest";
import {
  ProjectAssuranceContextSchema,
} from "@company/ces-project-schema";
import { ProposedProjectModelSchema } from "@company/ces-proposed-project-model";
import {
  assertCollectionPackages,
  canonicalJson,
  requirementRevisionHash,
} from "@company/ces-requirement-collection-schema";
import type { RequirementPackage } from "@company/ces-requirement-schema";
import { z } from "zod";

export const ATLAS_INTENT_GRAPH_VERSION = "1.0.0" as const;
export const ATLAS_WORKFLOW_GRAPH_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const StableId = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);

const ReviewStateSchema = z.enum([
  "pending", "approved", "rejected", "correction_requested", "ambiguous",
  "unsupported", "conflict", "source_missing",
]);

export const WorkflowGraphProjectionInputSchema = z.object({
  project_id: StableId,
  model_revision: z.number().int().positive(),
  model_hash: Sha256Schema,
  lifecycle: z.enum(["proposed", "review_in_progress", "approved", "superseded"]),
  authoritative: z.boolean(),
  downstream_execution_allowed: z.boolean(),
  nodes: z.array(z.object({
    id: StableId,
    kind_id: StableId,
    label: NonEmptyString,
    semantic_record_ids: z.array(StableId),
    source_unit_ids: z.array(StableId).min(1),
    item_review_states: z.array(ReviewStateSchema),
    issue_codes: z.array(StableId),
  }).strict()),
  relationships: z.array(z.object({
    id: StableId, from_id: StableId, to_id: StableId, kind_id: StableId,
    source_unit_ids: z.array(StableId).min(1),
  }).strict()),
  source_documents: z.array(z.object({
    document_id: StableId, document_version: NonEmptyString, content_hash: Sha256Schema,
  }).strict()),
  finding_ids: z.array(StableId),
}).strict().superRefine((value, context) => {
  const approved = value.lifecycle === "approved";
  if (approved !== value.authoritative || approved !== value.downstream_execution_allowed) {
    context.addIssue({ code: "custom", message: "Graph lifecycle authority mismatch" });
  }
});

export const WorkflowGraphSchema = z.object({
  schema_version: z.literal(ATLAS_WORKFLOW_GRAPH_VERSION),
  project_id: StableId,
  model_revision: z.number().int().positive(),
  model_hash: Sha256Schema,
  model_lifecycle: z.enum(["proposed", "review_in_progress", "approved", "superseded"]),
  graph_purpose: z.enum(["extraction_approval", "approved_baseline"]),
  authoritative: z.boolean(),
  approval_required: z.boolean(),
  downstream_execution_allowed: z.boolean(),
  banner: NonEmptyString,
  nodes: z.array(z.object({
    id: StableId, kind_id: StableId, label: NonEmptyString,
    semantic_record_ids: z.array(StableId), source_unit_ids: z.array(StableId).min(1),
    review_status: z.enum(["pending", "approved", "exception"]),
    issue_codes: z.array(StableId),
  }).strict()),
  edges: z.array(z.object({
    id: StableId, source_id: StableId, target_id: StableId, kind_id: StableId,
    source_unit_ids: z.array(StableId).min(1),
  }).strict()),
  documents: z.array(z.object({
    document_id: StableId, document_version: NonEmptyString, content_hash: Sha256Schema,
  }).strict()),
  finding_ids: z.array(StableId),
  approval_summary: z.object({
    total_nodes: z.number().int().nonnegative(),
    approved_nodes: z.number().int().nonnegative(),
    pending_nodes: z.number().int().nonnegative(),
    exception_nodes: z.number().int().nonnegative(),
  }).strict(),
  content_hash: Sha256Schema,
}).strict();

export function projectWorkflowGraph(
  inputValue: z.input<typeof WorkflowGraphProjectionInputSchema>,
): z.infer<typeof WorkflowGraphSchema> {
  const input = WorkflowGraphProjectionInputSchema.parse(inputValue);
  const nodes = input.nodes.map((node) => {
    const exceptions = new Set([
      "rejected", "correction_requested", "ambiguous", "unsupported", "conflict", "source_missing",
    ]);
    const reviewStatus = node.item_review_states.length > 0
      && node.item_review_states.every((state) => state === "approved")
      ? "approved" as const
      : node.item_review_states.some((state) => exceptions.has(state))
        || node.issue_codes.length > 0
        || node.kind_id === "ces.graph.unknown"
        ? "exception" as const : "pending" as const;
    return {
      id: node.id, kind_id: node.kind_id, label: node.label,
      semantic_record_ids: [...node.semantic_record_ids].sort(compareText),
      source_unit_ids: [...node.source_unit_ids].sort(compareText),
      review_status: reviewStatus,
      issue_codes: [...node.issue_codes].sort(compareText),
    };
  }).sort((a, b) => compareText(a.id, b.id));
  const nodeIds = new Set(nodes.map(({ id }) => id));
  const edges = input.relationships.map((edge) => {
    if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) {
      throw new Error(`Dangling workflow relationship: ${edge.id}`);
    }
    return {
      id: edge.id, source_id: edge.from_id, target_id: edge.to_id,
      kind_id: edge.kind_id, source_unit_ids: [...edge.source_unit_ids].sort(compareText),
    };
  }).sort((a, b) => compareText(a.id, b.id));
  const approved = input.lifecycle === "approved";
  const core = {
    schema_version: ATLAS_WORKFLOW_GRAPH_VERSION,
    project_id: input.project_id,
    model_revision: input.model_revision,
    model_hash: input.model_hash,
    model_lifecycle: input.lifecycle,
    graph_purpose: approved ? "approved_baseline" as const : "extraction_approval" as const,
    authoritative: input.authoritative,
    approval_required: !approved,
    downstream_execution_allowed: input.downstream_execution_allowed,
    banner: approved ? "APPROVED BASELINE" : "PROPOSED -- NOT YET APPROVED",
    nodes, edges,
    documents: [...input.source_documents].sort((a, b) =>
      compareText(a.document_id, b.document_id)),
    finding_ids: [...input.finding_ids].sort(compareText),
    approval_summary: {
      total_nodes: nodes.length,
      approved_nodes: nodes.filter(({ review_status }) => review_status === "approved").length,
      pending_nodes: nodes.filter(({ review_status }) => review_status === "pending").length,
      exception_nodes: nodes.filter(({ review_status }) => review_status === "exception").length,
    },
  };
  return WorkflowGraphSchema.parse({ ...core, content_hash: workflowHash(core) });
}

export function projectProposedWorkflowGraph(
  modelValue: z.input<typeof ProposedProjectModelSchema>,
): z.infer<typeof WorkflowGraphSchema> {
  const model = ProposedProjectModelSchema.parse(modelValue);
  const records = new Map(model.records.map((record) => [record.id, record]));
  return projectWorkflowGraph({
    project_id: model.project_id,
    model_revision: model.proposal_revision,
    model_hash: model.content_hash,
    lifecycle: model.lifecycle,
    authoritative: model.authoritative,
    downstream_execution_allowed: model.downstream_execution_allowed,
    nodes: model.workflow_nodes.map((node) => {
      const contained = node.semantic_record_ids.map((id) => records.get(id)!);
      return {
        id: node.id,
        kind_id: contained.some(({ semantic_kind_id }) =>
          semantic_kind_id === "ces.kind.unknown")
          ? "ces.graph.unknown" : "ces.graph.workflow-step",
        label: node.label,
        semantic_record_ids: node.semantic_record_ids,
        source_unit_ids: node.source_unit_ids,
        item_review_states: contained.map(({ review_status }) => review_status),
        issue_codes: contained.flatMap(({ issues }) => issues.map(({ code }) => code)),
      };
    }),
    relationships: model.relationships.map((edge) => ({
      id: edge.id, from_id: edge.from_id, to_id: edge.to_id,
      kind_id: edge.kind, source_unit_ids: edge.source_unit_ids,
    })),
    source_documents: model.source_documents,
    finding_ids: model.extraction_findings.findings.map(({ id }) => id),
  });
}

export const GraphNodeSchema = z.object({
  id: NonEmptyString,
  kind: z.enum(["source", "requirement", "business_rule", "uncertainty", "capability"]),
  label: NonEmptyString,
  revision_hash: Sha256Schema,
  provenance: z.array(NonEmptyString).default([]),
}).strict();

export const GraphEdgeSchema = z.object({
  id: NonEmptyString,
  source_id: NonEmptyString,
  target_id: NonEmptyString,
  relationship: z.enum([
    "affects", "conflicts_with", "constrains", "depends_on", "duplicates",
    "implements", "refines", "supersedes", "verified_by",
    "derived_from", "has_rule", "has_uncertainty", "resolves_to",
  ]),
  reason: NonEmptyString,
  provenance: NonEmptyString,
}).strict().refine(({ source_id, target_id }) => source_id !== target_id, {
  message: "A graph edge cannot target itself",
});

export const IntentGraphSchema = z.object({
  schema_version: z.literal(ATLAS_INTENT_GRAPH_VERSION),
  graph: z.object({
    id: NonEmptyString,
    revision_hash: Sha256Schema,
    requirement_collection_id: NonEmptyString,
    requirement_collection_revision_hash: Sha256Schema,
  }).strict(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
}).strict();

export interface AtlasCoreHandoff {
  readonly manifests: Readonly<Record<string, PolicyManifest>>;
  readonly capabilities: Readonly<Record<string, readonly string[]>>;
}

export type IntentGraph = z.infer<typeof IntentGraphSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export interface GraphDiagnostic {
  readonly code:
    | "duplicate_node"
    | "duplicate_edge"
    | "dangling_edge"
    | "cyclic_relationship"
    | "conflicting_relationship";
  readonly message: string;
  readonly ids: readonly string[];
}

export class AtlasGraphValidationError extends Error {
  public readonly diagnostics: readonly GraphDiagnostic[];

  public constructor(diagnostics: readonly GraphDiagnostic[]) {
    super(`Invalid Atlas intent graph: ${diagnostics.map(({ code }) => code).join(", ")}`);
    this.name = "AtlasGraphValidationError";
    this.diagnostics = diagnostics;
  }
}

export function compileAtlasCoreHandoff(
  review: AtlasReviewOutput,
  assuranceValue: unknown,
  cesBaselineVersion: string,
): AtlasCoreHandoff {
  assertCollectionPackages(review.collection, review.packages);
  const assurance = ProjectAssuranceContextSchema.parse(assuranceValue);
  const manifests = Object.fromEntries(
    Object.entries(review.packages)
      .sort(([left], [right]) => compareText(left, right))
      .map(([logicalId, requirement]) => [
        logicalId,
        compilePolicyManifest({
          requirement,
          assurance,
          ces_baseline_version: NonEmptyString.parse(cesBaselineVersion),
        }).manifest,
      ]),
  );
  return {
    manifests,
    capabilities: Object.fromEntries(
      Object.entries(manifests).map(([logicalId, manifest]) => [
        logicalId,
        manifest.resolved_capabilities.map(({ id }) => id).sort(compareText),
      ]),
    ),
  };
}

export function buildIntentGraph(input: {
  readonly graph_id: string;
  readonly review: AtlasReviewOutput;
  readonly links?: readonly RequirementLink[];
  readonly uncertainties?: AtlasProviderResult["uncertainties"];
  readonly core_handoff?: AtlasCoreHandoff;
}): IntentGraph {
  assertCollectionPackages(input.review.collection, input.review.packages);
  const graphId = NonEmptyString.parse(input.graph_id);
  const links = [...(input.links ?? [])].map((link) => RequirementLinkSchema.parse(link));
  const uncertainties = [...(input.uncertainties ?? [])]
    .map((item) => AtlasUncertaintySchema.parse(item));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const [logicalId, requirement] of Object.entries(input.review.packages)) {
    addRequirementNodes(requirement, nodes, edges);
    for (const uncertainty of uncertainties.filter(({ affected_requirement_ids }) =>
      affected_requirement_ids.includes(logicalId))) {
      const uncertaintyId = `uncertainty:${uncertainty.id}`;
      nodes.push(GraphNodeSchema.parse({
        id: uncertaintyId,
        kind: "uncertainty",
        label: `${uncertainty.field}: ${uncertainty.reason}`,
        revision_hash: sha256(uncertainty),
        provenance: [logicalId],
      }));
      edges.push(systemEdge(
        logicalId,
        uncertaintyId,
        "has_uncertainty",
        `Requirement is affected by ${uncertainty.severity} uncertainty`,
        uncertainty.id,
      ));
    }
  }

  for (const link of links) {
    edges.push(GraphEdgeSchema.parse({
      id: edgeId(link.source_id, link.target_id, link.relationship),
      ...link,
      provenance: `approved-link:${sha256(link)}`,
    }));
  }

  for (const [requirementId, capabilities] of Object.entries(
    input.core_handoff?.capabilities ?? {},
  )) {
    for (const capability of capabilities) {
      const capabilityId = `capability:${capability}`;
      nodes.push(GraphNodeSchema.parse({
        id: capabilityId,
        kind: "capability",
        label: capability,
        revision_hash: sha256({ capability }),
        provenance: [`core-resolution:${requirementId}`],
      }));
      edges.push(systemEdge(
        requirementId,
        capabilityId,
        "resolves_to",
        "Existing core resolved this capability",
        `core-resolution:${requirementId}`,
      ));
    }
  }

  const normalizedNodes = normalizeNodes(nodes);
  const normalizedEdges = normalizeEdges(edges);
  validateGraph(normalizedNodes, normalizedEdges);
  const base = {
    schema_version: ATLAS_INTENT_GRAPH_VERSION,
    graph: {
      id: graphId,
      requirement_collection_id: input.review.collection.collection.id,
      requirement_collection_revision_hash:
        input.review.collection.collection.revision_hash,
    },
    nodes: normalizedNodes,
    edges: normalizedEdges,
  } as const;
  return IntentGraphSchema.parse({
    ...base,
    graph: { ...base.graph, revision_hash: sha256(base) },
  });
}

function addRequirementNodes(
  requirement: RequirementPackage,
  nodes: GraphNode[],
  edges: GraphEdge[],
): void {
  const logicalId = requirement.requirement.id;
  const sourceId = `source:${requirement.source?.document_id ?? "unknown"}`;
  nodes.push(GraphNodeSchema.parse({
    id: logicalId,
    kind: "requirement",
    label: requirement.requirement.title,
    revision_hash: requirementRevisionHash(requirement),
    provenance: requirement.source?.document_id ? [sourceId] : [],
  }));
  if (requirement.source?.document_id && requirement.source.document_version) {
    nodes.push(GraphNodeSchema.parse({
      id: sourceId,
      kind: "source",
      label: requirement.source.document_id,
      revision_hash: requirement.source.document_version,
      provenance: requirement.source.section ? [requirement.source.section] : [],
    }));
    edges.push(systemEdge(
      logicalId,
      sourceId,
      "derived_from",
      "Approved requirement retains its source document revision",
      requirement.source.document_id,
    ));
  }
  for (const rule of requirement.business_rules) {
    const ruleId = `rule:${rule.id}`;
    nodes.push(GraphNodeSchema.parse({
      id: ruleId,
      kind: "business_rule",
      label: rule.statement,
      revision_hash: sha256(rule),
      provenance: [logicalId],
    }));
    edges.push(systemEdge(
      logicalId,
      ruleId,
      "has_rule",
      `Approved requirement is constrained by ${rule.type} rule`,
      rule.id,
    ));
  }
}

function validateGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): void {
  const diagnostics: GraphDiagnostic[] = [];
  addDuplicateDiagnostics(nodes.map(({ id }) => id), "duplicate_node", diagnostics);
  addDuplicateDiagnostics(edges.map(({ id }) => id), "duplicate_edge", diagnostics);
  const nodeIds = new Set(nodes.map(({ id }) => id));
  for (const edge of edges) {
    const missing = [edge.source_id, edge.target_id].filter((id) => !nodeIds.has(id));
    if (missing.length > 0) diagnostics.push({
      code: "dangling_edge",
      message: `Edge ${edge.id} references missing nodes`,
      ids: [edge.id, ...missing],
    });
  }
  const pairRelationships = new Map<string, Set<string>>();
  for (const edge of edges) {
    const pair = `${edge.source_id}\u0000${edge.target_id}`;
    const relationships = pairRelationships.get(pair) ?? new Set<string>();
    relationships.add(edge.relationship);
    pairRelationships.set(pair, relationships);
  }
  for (const [pair, relationships] of pairRelationships) {
    if (relationships.has("conflicts_with") && relationships.size > 1) {
      diagnostics.push({
        code: "conflicting_relationship",
        message: "A relationship cannot both conflict and assert another relation",
        ids: pair.split("\u0000"),
      });
    }
  }
  const cycle = findCycle(edges.filter(({ relationship }) =>
    ["depends_on", "implements", "refines", "supersedes"].includes(relationship)));
  if (cycle) diagnostics.push({
    code: "cyclic_relationship",
    message: "Directed requirement relationships must be acyclic",
    ids: cycle,
  });
  if (diagnostics.length > 0) {
    throw new AtlasGraphValidationError(
      diagnostics.sort((left, right) => compareText(left.code, right.code)),
    );
  }
}

function findCycle(edges: readonly GraphEdge[]): string[] | undefined {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    graph.set(edge.source_id, [...(graph.get(edge.source_id) ?? []), edge.target_id]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(node: string, path: readonly string[]): string[] | undefined {
    if (visiting.has(node)) return [...path.slice(path.indexOf(node)), node];
    if (visited.has(node)) return undefined;
    visiting.add(node);
    for (const target of (graph.get(node) ?? []).sort(compareText)) {
      const cycle = visit(target, [...path, node]);
      if (cycle) return cycle;
    }
    visiting.delete(node);
    visited.add(node);
    return undefined;
  }
  for (const node of [...graph.keys()].sort(compareText)) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return undefined;
}

export function renderIntentGraphJson(graph: IntentGraph): string {
  return canonicalJson(IntentGraphSchema.parse(graph));
}

export function renderIntentGraphMarkdown(graphValue: IntentGraph): string {
  const graph = IntentGraphSchema.parse(graphValue);
  const lines = [
    "# " + graph.graph.id + " System Intent",
    "",
    `Collection: \`${graph.graph.requirement_collection_id}\``,
    `Graph revision: \`${graph.graph.revision_hash}\``,
    "",
    "## Nodes",
    "",
    "| ID | Kind | Label | Revision |",
    "|---|---|---|---|",
    ...graph.nodes.map((node) =>
      `| \`${escapeTable(node.id)}\` | ${node.kind} | ${escapeTable(node.label)} | \`${node.revision_hash}\` |`),
    "",
    "## Relationships",
    "",
    "| Source | Relationship | Target | Reason | Provenance |",
    "|---|---|---|---|---|",
    ...graph.edges.map((edge) =>
      `| \`${escapeTable(edge.source_id)}\` | ${edge.relationship} | \`${escapeTable(edge.target_id)}\` | ${escapeTable(edge.reason)} | ${escapeTable(edge.provenance)} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function renderIntentGraphMermaid(graphValue: IntentGraph): string {
  const graph = IntentGraphSchema.parse(graphValue);
  const aliases = new Map(graph.nodes.map((node, index) => [node.id, `N${index + 1}`]));
  const lines = [
    "flowchart TD",
    ...graph.nodes.map((node) =>
      `  ${aliases.get(node.id)}["${escapeMermaid(node.label)}"]`),
    ...graph.edges.map((edge) =>
      `  ${aliases.get(edge.source_id)} -->|${escapeMermaid(edge.relationship)}| ${aliases.get(edge.target_id)}`),
  ];
  return `${lines.join("\n")}\n`;
}

function systemEdge(
  sourceId: string,
  targetId: string,
  relationship: GraphEdge["relationship"],
  reason: string,
  provenance: string,
): GraphEdge {
  return GraphEdgeSchema.parse({
    id: edgeId(sourceId, targetId, relationship),
    source_id: sourceId,
    target_id: targetId,
    relationship,
    reason,
    provenance,
  });
}

function edgeId(sourceId: string, targetId: string, relationship: string): string {
  return `edge:${sha256({ source_id: sourceId, target_id: targetId, relationship }).slice(7, 23)}`;
}

function normalizeNodes(nodes: readonly GraphNode[]): GraphNode[] {
  const unique: GraphNode[] = [];
  for (const value of nodes) {
    const node = GraphNodeSchema.parse(value);
    const existingIndex = unique.findIndex(({ id }) => id === node.id);
    if (existingIndex < 0) {
      unique.push(node);
      continue;
    }
    const existing = unique[existingIndex]!;
    const { provenance: existingProvenance, ...existingIdentity } = existing;
    const { provenance: nodeProvenance, ...nodeIdentity } = node;
    if (canonicalJson(existingIdentity) === canonicalJson(nodeIdentity)) {
      unique[existingIndex] = {
        ...existing,
        provenance: [...new Set([...existingProvenance, ...nodeProvenance])].sort(compareText),
      };
    } else {
      unique.push(node);
    }
  }
  return unique
    .sort((left, right) => compareText(left.id, right.id));
}

function normalizeEdges(edges: readonly GraphEdge[]): GraphEdge[] {
  return [...edges]
    .map((edge) => GraphEdgeSchema.parse(edge))
    .sort((left, right) => compareText(left.id, right.id));
}

function addDuplicateDiagnostics(
  ids: readonly string[],
  code: "duplicate_node" | "duplicate_edge",
  diagnostics: GraphDiagnostic[],
): void {
  for (const id of [...new Set(ids.filter((value, index) => ids.indexOf(value) !== index))].sort(compareText)) {
    diagnostics.push({ code, message: `Duplicate graph identity ${id}`, ids: [id] });
  }
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeMermaid(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", " ");
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function workflowHash(value: unknown): string {
  const canonicalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonicalize);
    if (item !== null && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return Object.fromEntries(Object.keys(record).sort()
        .map((key) => [key, canonicalize(record[key])]));
    }
    return item;
  };
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}
