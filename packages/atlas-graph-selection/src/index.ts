import { SemanticFactExtractionOutputSchema, SemanticFactSchema } from
  "@company/ces-atlas-semantic-facts";
import { z } from "zod";

export const ATLAS_GRAPH_SELECTION_VERSION = "2.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
export const BuiltInGraphKindSchema = z.enum([
  "atlas.graph.business-workflow", "atlas.graph.workflow", "atlas.graph.state-machine",
  "atlas.graph.decision-tree", "atlas.graph.entity-lifecycle",
  "atlas.graph.dependency-graph", "atlas.graph.audit-flow",
  "atlas.graph.entity-relationship",
]);

export const GraphSupportAssessmentSchema = z.object({
  assessment_id: Id,
  scope_id: Id,
  scope_kind: z.enum(["project", "module"]),
  graph_type_id: BuiltInGraphKindSchema,
  support_status: z.enum(["supported", "review_required"]),
  score: z.number().min(0).max(1),
  supporting_fact_ids: z.array(Id).min(1),
  rationale: z.string().min(1),
  missing_prerequisites: z.array(z.string().min(1)),
}).strict();

export const GraphSelectionOutputSchema = z.object({
  schema_version: z.literal(ATLAS_GRAPH_SELECTION_VERSION),
  project_id: Id,
  assessments: z.array(GraphSupportAssessmentSchema),
}).strict();

type Fact = z.infer<typeof SemanticFactSchema>;
type Rule = {
  graph: z.infer<typeof BuiltInGraphKindSchema>;
  scope: "project" | "module";
  required: Array<{ any: Fact["kind"][]; label: string }>;
};
const rules: Rule[] = [
  { graph: "atlas.graph.business-workflow", scope: "project",
    required: [{ any: ["activity_order"], label: "an explicit activity sequence" }] },
  { graph: "atlas.graph.workflow", scope: "module",
    required: [{ any: ["activity_order"], label: "an explicit activity sequence" }] },
  { graph: "atlas.graph.state-machine", scope: "module",
    required: [{ any: ["state_transition"], label: "an explicit state transition" }] },
  { graph: "atlas.graph.decision-tree", scope: "module", required: [
    { any: ["decision"], label: "an explicit decision relating a condition and outcome" },
  ] },
  { graph: "atlas.graph.entity-lifecycle", scope: "module", required: [
    { any: ["entity"], label: "an entity" },
    { any: ["event", "state_transition"], label: "a lifecycle event or transition" },
  ] },
  { graph: "atlas.graph.dependency-graph", scope: "module",
    required: [{ any: ["dependency"], label: "an explicit dependency" }] },
  { graph: "atlas.graph.audit-flow", scope: "module",
    required: [{ any: ["audit_action"], label: "an audit action with origin and destination" }] },
  { graph: "atlas.graph.entity-relationship", scope: "module",
    required: [{ any: ["entity_relationship"], label: "an explicit entity relationship" }] },
];

export function selectAtlasGraphTypes(factsValue: unknown):
z.infer<typeof GraphSelectionOutputSchema> {
  const extraction = SemanticFactExtractionOutputSchema.parse(factsValue);
  const modules = extraction.facts.filter(({ kind }) => kind === "module");
  const scopes = [
    { id: `${extraction.project_id}.scope.project`, kind: "project" as const,
      facts: extraction.facts },
    ...modules.map((module) => ({ id: `${extraction.project_id}.scope.${suffix(module.fact_id)}`,
      kind: "module" as const, facts: extraction.facts.filter((fact) =>
        fact.fact_id === module.fact_id || belongsToModule(fact, module, modules)) })),
  ];
  const assessments = scopes.flatMap((scope) => rules.flatMap((rule) => {
    if (rule.scope !== scope.kind) return [];
    const matches = rule.required.map(({ any }) => scope.facts.filter(({ kind }) =>
      any.includes(kind)));
    const supportedCount = matches.filter((items) => items.length > 0).length;
    if (supportedCount === 0) return [];
    const complete = supportedCount === rule.required.length;
    const supporting = [...new Set(matches.flatMap((items) =>
      items.map(({ fact_id }) => fact_id)))].sort();
    const missing = rule.required.filter((_, index) => matches[index]?.length === 0)
      .map(({ label }) => label);
    return [GraphSupportAssessmentSchema.parse({
      assessment_id: `${scope.id}.assessment.${rule.graph.split(".").at(-1)}`,
      scope_id: scope.id, scope_kind: scope.kind, graph_type_id: rule.graph,
      support_status: complete ? "supported" : "review_required",
      score: supportedCount / rule.required.length,
      supporting_fact_ids: supporting,
      rationale: complete
        ? `Source facts satisfy ${rule.required.map(({ label }) => label).join(" and ")}.`
        : `Source facts partially support this graph; missing ${missing.join(" and ")}.`,
      missing_prerequisites: missing,
    })];
  })).sort((left, right) => left.assessment_id.localeCompare(right.assessment_id));
  return GraphSelectionOutputSchema.parse({ schema_version: ATLAS_GRAPH_SELECTION_VERSION,
    project_id: extraction.project_id, assessments });
}

const RelationshipKinds = new Set<Fact["kind"]>(["activity_order", "state_transition",
  "decision", "entity_relationship", "dependency", "event", "audit_action"]);
function belongsToModule(fact: Fact, module: Fact, modules: Fact[]): boolean {
  const labels = [module.exact_statement, ...module.terms.map(({ exact_text }) => exact_text)];
  const keys = new Set(labels.map(conceptKey));
  if (fact.parent_source_label && keys.has(conceptKey(fact.parent_source_label))) return true;
  const moduleKeys = new Map(modules.flatMap((candidate) =>
    [candidate.exact_statement, ...candidate.terms.map(({ exact_text }) => exact_text)]
      .map((label) => [conceptKey(label), candidate.fact_id] as const)));
  const contextOwners = new Set(fact.context_paths.flatMap((path) => path.split(" > ")
    .flatMap((segment) => { const owner = moduleKeys.get(conceptKey(segment));
      return owner ? [owner] : []; })));
  if (contextOwners.size > 0) return contextOwners.size === 1 && contextOwners.has(module.fact_id);
  if (RelationshipKinds.has(fact.kind)) return false;
  return fact.terms.some(({ exact_text }) => keys.has(conceptKey(exact_text)));
}
function conceptKey(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/^\s*\d{1,3}[.)-]\s*/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/gu, " ");
}
function suffix(id: string): string { return id.split(".").at(-1) ?? id; }
