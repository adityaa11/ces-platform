import { z } from "zod";

export const POLICY_SOURCE_GLOSSARY_VERSION = "1.0.0" as const;
export const GOVERNED_POLICY_SOURCE_GLOSSARY_VERSION = "1.1.0" as const;

const IdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const NonEmptyStringSchema = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const SourceFamilySchema = z.object({
  family_id: IdSchema,
  canonical_name: NonEmptyStringSchema,
  publisher: NonEmptyStringSchema,
  lifecycle: z.enum(["active", "retired"]),
}).strict();

const SourceContentRetrievalSchema = z.object({
  retrieval_kind: z.literal("source_content"),
  retrieved_at: z.iso.datetime({ offset: true }),
  retrieved_from: z.url(),
  content_hash: Sha256Schema,
}).strict();

const MetadataObservationSchema = z.object({
  retrieval_kind: z.literal("metadata_observation"),
  observed_at: z.iso.datetime({ offset: true }),
  observed_from: z.url(),
  verified_metadata: NonEmptyStringSchema,
  observation_hash: Sha256Schema,
}).strict();

export const SourceReleaseProvenanceSchema = z.discriminatedUnion("retrieval_kind", [
  SourceContentRetrievalSchema,
  MetadataObservationSchema,
]);

export const SourceReleaseSchema = z.object({
  release_id: IdSchema,
  family_id: IdSchema,
  edition: NonEmptyStringSchema,
  release_label: NonEmptyStringSchema,
  lifecycle: z.enum(["draft", "published", "withdrawn"]),
  publication: z.object({
    published_on: z.iso.date(),
    authoritative_uri: z.url(),
  }).strict(),
  retrieval: SourceReleaseProvenanceSchema,
  last_checked_at: z.iso.datetime({ offset: true }),
}).strict();

export const SourceReleaseSupersessionSchema = z.object({
  predecessor_release_id: IdSchema,
  successor_release_id: IdSchema,
  recorded_at: z.iso.datetime({ offset: true }),
}).strict().refine(
  ({ predecessor_release_id, successor_release_id }) =>
    predecessor_release_id !== successor_release_id,
  { message: "A source release cannot supersede itself" },
);

export const SourceGlossarySchema = z.object({
  schema_version: z.literal(POLICY_SOURCE_GLOSSARY_VERSION),
  families: z.array(SourceFamilySchema),
  releases: z.array(SourceReleaseSchema),
  supersessions: z.array(SourceReleaseSupersessionSchema).default([]),
}).strict().superRefine((glossary, context) => {
  const issue = (message: string): void => context.addIssue({ code: "custom", message });
  const families = new Map(glossary.families.map((family) => [family.family_id, family]));
  const releases = new Map(glossary.releases.map((release) => [release.release_id, release]));

  if (families.size !== glossary.families.length) issue("Source family IDs must be unique");
  if (releases.size !== glossary.releases.length) issue("Source release IDs must be unique");

  const familyNames = new Set(glossary.families.map(({ canonical_name }) =>
    canonical_name.toLocaleLowerCase("en-US")));
  if (familyNames.size !== glossary.families.length) {
    issue("Source family canonical names must be unique");
  }

  const editions = new Set<string>();
  for (const release of glossary.releases) {
    if (!families.has(release.family_id)) {
      issue(`Source release ${release.release_id} has an unknown family`);
    }
    const editionKey = `${release.family_id}\u0000${release.edition.toLocaleLowerCase("en-US")}`;
    if (editions.has(editionKey)) {
      issue(`Source family ${release.family_id} has a duplicate edition`);
    }
    editions.add(editionKey);
    const provenanceTime = release.retrieval.retrieval_kind === "source_content"
      ? release.retrieval.retrieved_at
      : release.retrieval.observed_at;
    if (Date.parse(release.last_checked_at) < Date.parse(provenanceTime)) {
      issue(`Source release ${release.release_id} was checked before its provenance was recorded`);
    }
  }

  const successorByPredecessor = new Map<string, string>();
  for (const supersession of glossary.supersessions) {
    const predecessor = releases.get(supersession.predecessor_release_id);
    const successor = releases.get(supersession.successor_release_id);
    if (!predecessor || !successor) {
      issue("Source supersession references an unknown release");
      continue;
    }
    if (predecessor.family_id !== successor.family_id) {
      issue("Source supersession must remain within one source family");
    }
    if (successorByPredecessor.has(predecessor.release_id)) {
      issue(`Source release ${predecessor.release_id} has multiple direct successors`);
    }
    successorByPredecessor.set(predecessor.release_id, successor.release_id);
  }

  for (const releaseId of releases.keys()) {
    const visited = new Set<string>();
    let current: string | undefined = releaseId;
    while (current !== undefined) {
      if (visited.has(current)) {
        issue(`Source supersession contains a cycle at ${current}`);
        break;
      }
      visited.add(current);
      current = successorByPredecessor.get(current);
    }
  }
});

export const GovernedSourceClassSchema = z.enum([
  "CORE",
  "EVALUATION_SOURCE",
  "REFERENCE_ONLY",
]);

export const SourceProcessingAuthorizationSchema = z.enum([
  "AUTHORIZED",
  "PENDING",
  "PROHIBITED",
  "REFERENCE_ONLY",
]);

const SourceProcessingGovernanceSchema = z.object({
  machine_processing: SourceProcessingAuthorizationSchema,
  structured_extraction: SourceProcessingAuthorizationSchema,
  ai_assisted_analysis: SourceProcessingAuthorizationSchema,
}).strict();

export const SourceReleaseGovernanceSchema = z.object({
  release_id: IdSchema,
  family_id: IdSchema,
  role: IdSchema,
  source_class: GovernedSourceClassSchema,
  corpus_activation: z.enum(["ACTIVE", "BLOCKED"]),
  processing: SourceProcessingGovernanceSchema,
  rights: z.object({
    classification: NonEmptyStringSchema,
    evidence_uris: z.array(z.url()).min(1),
    attribution: z.enum(["required", "recommended", "not_required"]),
    third_party_content: z.enum(["separate_review_or_exclude", "not_identified"]),
    geographic_condition: NonEmptyStringSchema,
    additional_conditions: z.array(NonEmptyStringSchema),
  }).strict(),
  decision: z.object({
    revision_id: IdSchema,
    decided_at: z.iso.datetime({ offset: true }),
    rationale: NonEmptyStringSchema,
  }).strict(),
}).strict().superRefine((governance, context) => {
  const states = Object.values(governance.processing);
  if (governance.source_class === "REFERENCE_ONLY") {
    if (governance.corpus_activation !== "BLOCKED" ||
        states.some((state) => state === "AUTHORIZED")) {
      context.addIssue({ code: "custom",
        message: "REFERENCE_ONLY sources cannot be active or authorized" });
    }
  } else if (governance.corpus_activation === "ACTIVE" &&
      states.some((state) => state !== "AUTHORIZED")) {
    context.addIssue({ code: "custom",
      message: "Active machine corpus sources require authorization for every operation" });
  }
});

export const GovernedSourceGlossarySchema = z.object({
  schema_version: z.literal(GOVERNED_POLICY_SOURCE_GLOSSARY_VERSION),
  predecessor_schema_version: z.literal(POLICY_SOURCE_GLOSSARY_VERSION),
  baseline_id: IdSchema,
  source_glossary: SourceGlossarySchema,
  governance: z.array(SourceReleaseGovernanceSchema),
}).strict().superRefine((value, context) => {
  const releases = new Map(value.source_glossary.releases.map((release) =>
    [release.release_id, release]));
  const governedIds = new Set<string>();
  for (const governance of value.governance) {
    if (governedIds.has(governance.release_id)) {
      context.addIssue({ code: "custom",
        message: `Source release ${governance.release_id} has duplicate governance` });
      continue;
    }
    governedIds.add(governance.release_id);
    const release = releases.get(governance.release_id);
    if (!release || release.family_id !== governance.family_id) {
      context.addIssue({ code: "custom",
        message: `Governance for ${governance.release_id} does not match a source release` });
    }
  }
  for (const releaseId of releases.keys()) {
    if (!governedIds.has(releaseId)) {
      context.addIssue({ code: "custom",
        message: `Source release ${releaseId} has no governance decision` });
    }
  }
});

export function migrateSourceGlossaryV1ToGovernedV1_1(
  sourceGlossaryValue: unknown,
  baselineId: string,
  governanceValue: unknown,
) {
  const sourceGlossary = SourceGlossarySchema.parse(sourceGlossaryValue);
  return GovernedSourceGlossarySchema.parse({
    schema_version: GOVERNED_POLICY_SOURCE_GLOSSARY_VERSION,
    predecessor_schema_version: POLICY_SOURCE_GLOSSARY_VERSION,
    baseline_id: baselineId,
    source_glossary: sourceGlossary,
    governance: governanceValue,
  });
}

function stableValue(value: unknown): string {
  return JSON.stringify(value);
}

export function validateSourceGlossaryTransition(previousValue: unknown, nextValue: unknown) {
  const previous = SourceGlossarySchema.parse(previousValue);
  const next = SourceGlossarySchema.parse(nextValue);
  const nextFamilies = new Map(next.families.map((family) => [family.family_id, family]));
  const nextReleases = new Map(next.releases.map((release) => [release.release_id, release]));

  for (const family of previous.families) {
    const nextFamily = nextFamilies.get(family.family_id);
    if (!nextFamily || nextFamily.canonical_name !== family.canonical_name ||
        nextFamily.publisher !== family.publisher) {
      throw new Error(`Existing source family ${family.family_id} identity is immutable`);
    }
    if (family.lifecycle === "retired" && nextFamily.lifecycle !== "retired") {
      throw new Error(`Retired source family ${family.family_id} cannot be reactivated`);
    }
  }
  for (const release of previous.releases) {
    if (release.lifecycle !== "published") continue;
    const nextRelease = nextReleases.get(release.release_id);
    if (!nextRelease || stableValue(nextRelease) !== stableValue(release)) {
      throw new Error(`Published source release ${release.release_id} is immutable`);
    }
  }
  return next;
}

export type SourceFamily = z.infer<typeof SourceFamilySchema>;
export type SourceRelease = z.infer<typeof SourceReleaseSchema>;
export type SourceReleaseProvenance = z.infer<typeof SourceReleaseProvenanceSchema>;
export type SourceReleaseSupersession = z.infer<typeof SourceReleaseSupersessionSchema>;
export type SourceGlossary = z.infer<typeof SourceGlossarySchema>;
export type GovernedSourceClass = z.infer<typeof GovernedSourceClassSchema>;
export type SourceProcessingAuthorization =
  z.infer<typeof SourceProcessingAuthorizationSchema>;
export type SourceReleaseGovernance = z.infer<typeof SourceReleaseGovernanceSchema>;
export type GovernedSourceGlossary = z.infer<typeof GovernedSourceGlossarySchema>;
