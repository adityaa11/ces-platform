import { describe, expect, it } from "vitest";
import {
  getPolicyRelevantRequirement,
  parseRequirementPackage,
  parseRequirementText,
  type RequirementPackage,
} from "./index.js";

const baseRequirement = {
  schema_version: "1.0.0",
  requirement: {
    id: "REQ-USER-014",
    title: "Replace profile picture",
  },
  actor: { type: "authenticated_user" },
  operation: {
    action: "replace",
    resource: "profile_picture",
    target_scope: "own_resource",
  },
  business_rules: [
    {
      id: "BR-USER-031",
      type: "authorization",
      statement: "A user may replace only their own profile picture.",
    },
  ],
} as const;

const source = {
  document_id: "PRD-USER-MANAGEMENT",
  document_version: "2.0",
  section: "4.3.2",
  change_request_id: "CR-104",
  parent_requirement_ids: ["REQ-USER-001"],
} as const;

describe("RequirementPackageSchema", () => {
  it("accepts a manually authored requirement without source metadata", () => {
    const result = parseRequirementPackage(baseRequirement);

    expect(result.source).toBeUndefined();
  });

  it.each([
    ["document_id", source.document_id],
    ["document_version", source.document_version],
    ["section", source.section],
    ["change_request_id", source.change_request_id],
    ["parent_requirement_ids", source.parent_requirement_ids],
  ] as const)("preserves source field %s", (field, expected) => {
    const result = parseRequirementPackage({ ...baseRequirement, source });

    expect(result.source?.[field]).toEqual(expected);
  });

  it("normalizes equivalent YAML and JSON to identical objects", () => {
    const value = { ...baseRequirement, source };
    const json = JSON.stringify(value);
    const yaml = `
schema_version: 1.0.0
requirement:
  id: REQ-USER-014
  title: Replace profile picture
source:
  document_id: PRD-USER-MANAGEMENT
  document_version: "2.0"
  section: 4.3.2
  change_request_id: CR-104
  parent_requirement_ids:
    - REQ-USER-001
actor:
  type: authenticated_user
operation:
  action: replace
  resource: profile_picture
  target_scope: own_resource
business_rules:
  - id: BR-USER-031
    type: authorization
    statement: A user may replace only their own profile picture.
`;

    expect(parseRequirementText(yaml, "yaml")).toEqual(
      parseRequirementText(json, "json"),
    );
  });

  it("keeps source metadata outside policy-relevant requirement facts", () => {
    const withoutSource = parseRequirementPackage(baseRequirement);
    const withSource = parseRequirementPackage({ ...baseRequirement, source });

    expect(getPolicyRelevantRequirement(withSource)).toEqual(
      getPolicyRelevantRequirement(withoutSource),
    );
  });

  it("rejects schema-version mismatches", () => {
    expect(() =>
      parseRequirementPackage({ ...baseRequirement, schema_version: "2.0.0" }),
    ).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() =>
      parseRequirementPackage({
        ...baseRequirement,
        implementation_framework: "example_framework",
      }),
    ).toThrow();
  });

  it("produces the public RequirementPackage type", () => {
    const result: RequirementPackage = parseRequirementPackage(baseRequirement);

    expect(result.requirement.id).toBe("REQ-USER-014");
  });
});
