import { createHash } from "node:crypto";
import {
  RequirementPackageSchema,
  type RequirementPackage,
} from "@company/ces-requirement-schema";
import { z } from "zod";

export const REQUIREMENT_COLLECTION_SCHEMA_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const RequirementCollectionEntrySchema = z
  .object({
    logical_id: NonEmptyString,
    revision_hash: Sha256Schema,
    path: NonEmptyString,
  })
  .strict();

export const RequirementCollectionApprovalSchema = z
  .object({
    status: z.literal("approved"),
    approved_by: NonEmptyString,
    review_decision_hash: Sha256Schema,
  })
  .strict();

export const RequirementCollectionSchema = z
  .object({
    schema_version: z.literal(REQUIREMENT_COLLECTION_SCHEMA_VERSION),
    collection: z
      .object({
        id: NonEmptyString,
        revision_hash: Sha256Schema,
      })
      .strict(),
    approval: RequirementCollectionApprovalSchema,
    requirements: z.array(RequirementCollectionEntrySchema).min(1),
  })
  .strict()
  .superRefine(({ requirements }, context) => {
    for (const field of ["logical_id", "path"] as const) {
      const values = requirements.map((entry) => entry[field]);
      const duplicates = values.filter(
        (value, index) => values.indexOf(value) !== index,
      );
      for (const duplicate of [...new Set(duplicates)].sort()) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Requirement Collection ${field}: ${duplicate}`,
        });
      }
    }
  });

export type RequirementCollection = z.infer<typeof RequirementCollectionSchema>;
export type RequirementCollectionEntry = z.infer<
  typeof RequirementCollectionEntrySchema
>;

interface CollectionHashInput {
  readonly schema_version: typeof REQUIREMENT_COLLECTION_SCHEMA_VERSION;
  readonly collection: { readonly id: string };
  readonly approval: z.infer<typeof RequirementCollectionApprovalSchema>;
  readonly requirements: readonly RequirementCollectionEntry[];
}

export function parseRequirementCollection(value: unknown): RequirementCollection {
  const parsed = RequirementCollectionSchema.parse(value);
  const normalized = {
    ...parsed,
    requirements: normalizeEntries(parsed.requirements),
  };
  assertCollectionRevision(normalized);
  return normalized;
}

export function requirementRevisionHash(requirement: RequirementPackage): string {
  return sha256(RequirementPackageSchema.parse(requirement));
}

export function collectionRevisionHash(value: CollectionHashInput): string {
  return sha256({
    ...value,
    requirements: normalizeEntries(value.requirements),
  });
}

export function createRequirementCollection(
  value: CollectionHashInput,
): RequirementCollection {
  const requirements = normalizeEntries(value.requirements);
  return parseRequirementCollection({
    ...value,
    collection: {
      ...value.collection,
      revision_hash: collectionRevisionHash({ ...value, requirements }),
    },
    requirements,
  });
}

export function assertCollectionRevision(collection: RequirementCollection): void {
  const expected = collectionRevisionHash({
    schema_version: collection.schema_version,
    collection: { id: collection.collection.id },
    approval: collection.approval,
    requirements: collection.requirements,
  });
  if (collection.collection.revision_hash !== expected) {
    throw new Error(
      `Requirement Collection revision mismatch: expected ${expected}`,
    );
  }
}

export function assertCollectionPackages(
  collection: RequirementCollection,
  packages: Readonly<Record<string, RequirementPackage>>,
): void {
  for (const entry of collection.requirements) {
    const requirement = packages[entry.logical_id];
    if (!requirement) {
      throw new Error(`Missing Requirement Package ${entry.logical_id}`);
    }
    if (requirement.requirement.id !== entry.logical_id) {
      throw new Error(`Requirement Package logical ID mismatch for ${entry.logical_id}`);
    }
    if (requirementRevisionHash(requirement) !== entry.revision_hash) {
      throw new Error(`Requirement Package revision mismatch for ${entry.logical_id}`);
    }
  }
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function normalizeEntries(
  entries: readonly RequirementCollectionEntry[],
): RequirementCollectionEntry[] {
  return [...entries]
    .map((entry) => RequirementCollectionEntrySchema.parse(entry))
    .sort((left, right) => compareText(left.logical_id, right.logical_id));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
