import { describe, expect, it } from "vitest";
import { parseRequirementPackage } from "@company/ces-requirement-schema";
import {
  assertCollectionPackages,
  assertCollectionRevision,
  canonicalJson,
  createRequirementCollection,
  parseRequirementCollection,
  requirementRevisionHash,
} from "./index.js";

const approval = {
  status: "approved",
  approved_by: "project_owner",
  review_decision_hash: `sha256:${"a".repeat(64)}`,
} as const;

const requirement = parseRequirementPackage({
  schema_version: "1.0.0",
  requirement: { id: "REQ-PROJECT-001", title: "Create a company project" },
  actor: { type: "company_administrator" },
  operation: { action: "create", resource: "project", target_scope: "own_company" },
  business_rules: [],
});

describe("RequirementCollectionSchema", () => {
  it("normalizes package order and derives a deterministic revision", () => {
    const first = createRequirementCollection({
      schema_version: "1.0.0",
      collection: { id: "COLLECTION-PROJECT" },
      approval,
      requirements: [
        { logical_id: "REQ-TASK-001", revision_hash: `sha256:${"b".repeat(64)}`, path: "requirement-packages/REQ-TASK-001.json" },
        { logical_id: "REQ-PROJECT-001", revision_hash: requirementRevisionHash(requirement), path: "requirement-packages/REQ-PROJECT-001.json" },
      ],
    });
    const reversed = createRequirementCollection({
      schema_version: "1.0.0",
      collection: { id: "COLLECTION-PROJECT" },
      approval,
      requirements: [...first.requirements].reverse(),
    });

    expect(canonicalJson(first)).toBe(canonicalJson(reversed));
    expect(first.requirements.map(({ logical_id }) => logical_id)).toEqual([
      "REQ-PROJECT-001",
      "REQ-TASK-001",
    ]);
    expect(() => assertCollectionRevision(first)).not.toThrow();
  });

  it("keeps logical identity stable while content revisions change", () => {
    const changed = parseRequirementPackage({
      ...requirement,
      requirement: { ...requirement.requirement, title: "Create a project" },
    });

    expect(changed.requirement.id).toBe(requirement.requirement.id);
    expect(requirementRevisionHash(changed)).not.toBe(
      requirementRevisionHash(requirement),
    );
  });

  it("rejects duplicate logical IDs and unknown fields", () => {
    const hash = requirementRevisionHash(requirement);
    const value = {
      schema_version: "1.0.0",
      collection: { id: "COLLECTION-PROJECT", revision_hash: `sha256:${"c".repeat(64)}` },
      approval,
      requirements: [
        { logical_id: "REQ-PROJECT-001", revision_hash: hash, path: "one.json" },
        { logical_id: "REQ-PROJECT-001", revision_hash: hash, path: "two.json" },
      ],
    };
    expect(() => parseRequirementCollection(value)).toThrow(
      "Duplicate Requirement Collection logical_id",
    );
    expect(() => parseRequirementCollection({ ...value, extra: true })).toThrow();
  });

  it("validates referenced package logical IDs and revisions", () => {
    const collection = createRequirementCollection({
      schema_version: "1.0.0",
      collection: { id: "COLLECTION-PROJECT" },
      approval,
      requirements: [{
        logical_id: requirement.requirement.id,
        revision_hash: requirementRevisionHash(requirement),
        path: "requirement-packages/REQ-PROJECT-001.json",
      }],
    });

    expect(() => assertCollectionPackages(collection, {
      "REQ-PROJECT-001": requirement,
    })).not.toThrow();
    expect(() => assertCollectionPackages(collection, {})).toThrow(
      "Missing Requirement Package REQ-PROJECT-001",
    );
  });

  it("rejects a collection whose pinned revision does not match its content", () => {
    const collection = createRequirementCollection({
      schema_version: "1.0.0",
      collection: { id: "COLLECTION-PROJECT" },
      approval,
      requirements: [{
        logical_id: requirement.requirement.id,
        revision_hash: requirementRevisionHash(requirement),
        path: "requirement-packages/REQ-PROJECT-001.json",
      }],
    });

    expect(() => parseRequirementCollection({
      ...collection,
      collection: {
        ...collection.collection,
        revision_hash: `sha256:${"f".repeat(64)}`,
      },
    })).toThrow("Requirement Collection revision mismatch");
  });
});
