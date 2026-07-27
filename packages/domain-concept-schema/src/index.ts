import { createHash } from "node:crypto";
import { z } from "zod";

export const DOMAIN_CONCEPT_SCHEMA_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);
const ConceptKind = z.enum([
  "actor", "entity", "field", "state", "action", "event", "calculation", "report",
]);

export const DomainConceptSchema = z.object({
  schema_version: z.literal(DOMAIN_CONCEPT_SCHEMA_VERSION),
  id: Id,
  project_id: Id,
  kind: ConceptKind,
  canonical_label: Text,
  aliases: z.array(Text),
  description: Text.optional(),
  source_unit_ids: z.array(Id).min(1),
  status: z.enum(["candidate", "confirmed", "superseded"]),
  superseded_by: Id.optional(),
}).strict().superRefine((value, context) => {
  if ((value.status === "superseded") !== (value.superseded_by !== undefined)) {
    context.addIssue({ code: "custom", message: "Only superseded concepts require superseded_by" });
  }
});

export const ConceptRelationshipSchema = z.object({
  from_concept_id: Id,
  to_concept_id: Id,
  kind: z.enum(["parent", "related", "field_of", "state_of", "acts_on", "produces"]),
  source_unit_ids: z.array(Id).min(1),
}).strict();

export const ConceptProposalSchema = z.object({
  id: Id,
  project_id: Id,
  source_revision_id: Id,
  kind: ConceptKind,
  label: Text,
  aliases: z.array(Text).default([]),
  description: Text.optional(),
  source_unit_ids: z.array(Id).min(1),
  proposed_relationships: z.array(ConceptRelationshipSchema).default([]),
}).strict();

export const ConceptReviewDecisionSchema = z.object({
  proposal_id: Id,
  source_revision_id: Id,
  decision: z.enum(["confirm", "reject", "merge"]),
  reviewer: Text,
  merge_into_concept_id: Id.optional(),
  reason: Text.optional(),
}).strict().superRefine((value, context) => {
  if ((value.decision === "merge") !== (value.merge_into_concept_id !== undefined)) {
    context.addIssue({ code: "custom", message: "Merge decisions require merge_into_concept_id" });
  }
});

export const ProjectLexiconSchema = z.object({
  schema_version: z.literal(DOMAIN_CONCEPT_SCHEMA_VERSION),
  id: Id,
  project_id: Id,
  source_revision_id: Id,
  parent_revision_id: Id.optional(),
  status: z.enum(["candidate", "reviewed"]),
  concepts: z.array(DomainConceptSchema),
  relationships: z.array(ConceptRelationshipSchema),
  content_hash: Hash,
}).strict();

export type ConceptProposal = z.input<typeof ConceptProposalSchema>;
export type ConceptReviewDecision = z.input<typeof ConceptReviewDecisionSchema>;
export type ProjectLexicon = z.infer<typeof ProjectLexiconSchema>;

export function normalizeProposalQueue(
  proposals: readonly ConceptProposal[],
): readonly z.infer<typeof ConceptProposalSchema>[] {
  const parsed = proposals.map((proposal) => ConceptProposalSchema.parse(proposal));
  const identities = new Set<string>();
  for (const proposal of parsed) {
    const identity = `${proposal.project_id}\0${proposal.source_revision_id}\0${proposal.id}`;
    if (identities.has(identity)) throw new Error(`Duplicate concept proposal: ${proposal.id}`);
    identities.add(identity);
  }
  return deepFreeze(parsed.sort((left, right) => compare(left.id, right.id)));
}

export function createCandidateLexicon(input: {
  readonly project_id: string;
  readonly source_revision_id: string;
  readonly proposals: readonly ConceptProposal[];
}): ProjectLexicon {
  const projectId = Id.parse(input.project_id);
  const sourceRevisionId = Id.parse(input.source_revision_id);
  const proposals = normalizeProposalQueue(input.proposals);
  if (proposals.some((proposal) =>
    proposal.project_id !== projectId || proposal.source_revision_id !== sourceRevisionId)) {
    throw new Error("Proposal revision or project mismatch");
  }
  const concepts = proposals.map((proposal) => DomainConceptSchema.parse({
    schema_version: DOMAIN_CONCEPT_SCHEMA_VERSION,
    id: conceptId(projectId, proposal.kind, proposal.label),
    project_id: projectId,
    kind: proposal.kind,
    canonical_label: proposal.label,
    aliases: normalizeLabels(proposal.aliases),
    ...(proposal.description ? { description: proposal.description } : {}),
    source_unit_ids: uniqueSorted(proposal.source_unit_ids),
    status: "candidate",
  }));
  assertNoIdentityConflicts(concepts);
  return buildLexicon({
    project_id: projectId,
    source_revision_id: sourceRevisionId,
    status: "candidate",
    concepts,
    relationships: [],
  });
}

export function applyConceptReviews(input: {
  readonly lexicon: ProjectLexicon;
  readonly decisions: readonly ConceptReviewDecision[];
}): ProjectLexicon {
  const lexicon = ProjectLexiconSchema.parse(input.lexicon);
  if (lexicon.status !== "candidate") throw new Error("Only candidate lexicons can be reviewed");
  const decisions = input.decisions.map((decision) => ConceptReviewDecisionSchema.parse(decision))
    .sort((left, right) => compare(left.proposal_id, right.proposal_id));
  if (decisions.some(({ source_revision_id }) =>
    source_revision_id !== lexicon.source_revision_id)) {
    throw new Error("Stale concept review decision");
  }
  const proposalConcept = new Map(lexicon.concepts.map((concept) => [
    proposalId(concept.kind, concept.canonical_label), concept,
  ]));
  const decisionIds = new Set(decisions.map(({ proposal_id }) => proposal_id));
  if (decisionIds.size !== decisions.length) throw new Error("Duplicate review decision");
  const concepts = lexicon.concepts.map((concept) => {
    const decision = decisions.find(({ proposal_id }) =>
      proposal_id === proposalId(concept.kind, concept.canonical_label));
    if (!decision) throw new Error(`Missing review decision for ${concept.id}`);
    if (decision.decision === "reject") return undefined;
    if (decision.decision === "merge") {
      if (!lexicon.concepts.some(({ id }) => id === decision.merge_into_concept_id)) {
        throw new Error(`Unknown merge target: ${decision.merge_into_concept_id}`);
      }
      return DomainConceptSchema.parse({
        ...concept, status: "superseded", superseded_by: decision.merge_into_concept_id,
      });
    }
    return DomainConceptSchema.parse({ ...concept, status: "confirmed" });
  }).filter((concept): concept is z.infer<typeof DomainConceptSchema> => concept !== undefined);
  if (decisions.some(({ proposal_id }) => !proposalConcept.has(proposal_id))) {
    throw new Error("Decision references an unknown proposal");
  }
  return buildLexicon({
    project_id: lexicon.project_id,
    source_revision_id: lexicon.source_revision_id,
    parent_revision_id: lexicon.id,
    status: "reviewed",
    concepts,
    relationships: lexicon.relationships,
  });
}

export function proposalId(
  kind: z.infer<typeof ConceptKind>,
  label: string,
): string {
  return `proposal.${kind}.${slug(label)}.${digest(label).slice(0, 8)}`;
}

function conceptId(projectId: string, kind: string, label: string): string {
  return `${projectId}.concept.${kind}.${slug(label)}.${digest(label).slice(0, 8)}`;
}

function buildLexicon(input: {
  project_id: string;
  source_revision_id: string;
  parent_revision_id?: string;
  status: "candidate" | "reviewed";
  concepts: readonly z.infer<typeof DomainConceptSchema>[];
  relationships: readonly z.infer<typeof ConceptRelationshipSchema>[];
}): ProjectLexicon {
  const core = {
    schema_version: DOMAIN_CONCEPT_SCHEMA_VERSION,
    project_id: input.project_id,
    source_revision_id: input.source_revision_id,
    ...(input.parent_revision_id ? { parent_revision_id: input.parent_revision_id } : {}),
    status: input.status,
    concepts: [...input.concepts].sort((a, b) => compare(a.id, b.id)),
    relationships: [...input.relationships].sort((a, b) =>
      compare(`${a.from_concept_id}.${a.kind}.${a.to_concept_id}`,
        `${b.from_concept_id}.${b.kind}.${b.to_concept_id}`)),
  };
  const contentHash = hashJson(core);
  return deepFreeze(ProjectLexiconSchema.parse({
    ...core,
    id: `${input.project_id}.lexicon.${contentHash.slice(7, 19)}`,
    content_hash: contentHash,
  }));
}

function assertNoIdentityConflicts(
  concepts: readonly z.infer<typeof DomainConceptSchema>[],
): void {
  const labels = new Map<string, string>();
  for (const concept of concepts) {
    for (const label of [concept.canonical_label, ...concept.aliases]) {
      const key = label.toLocaleLowerCase("id-ID");
      const prior = labels.get(key);
      if (prior && prior !== concept.id) throw new Error(`Conflicting concept label: ${label}`);
      labels.set(key, concept.id);
    }
  }
}

function normalizeLabels(labels: readonly string[]): string[] {
  return uniqueSorted(labels.map((label) => Text.parse(label)));
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compare);
}

function slug(value: string): string {
  const result = value.normalize("NFKD").toLocaleLowerCase("id-ID")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/gu, "");
  return result || "concept";
}

function digest(value: string): string {
  return createHash("sha256").update(value.normalize("NFC").toLocaleLowerCase("id-ID"))
    .digest("hex");
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")}`;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort()
      .map((key) => [key, canonical(record[key])]));
  }
  return value;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
