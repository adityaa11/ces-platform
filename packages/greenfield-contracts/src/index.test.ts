import { parseRequirementPackage } from "@company/ces-requirement-schema";
import { describe, expect, it } from "vitest";
import {
  CandidateRequirementSchema,
  ProjectIntentSchema,
  RequirementLinkSchema,
  ReviewDecisionSchema,
  SourceReferenceSchema,
} from "./index.js";

const hash = `sha256:${"a".repeat(64)}`;
const source = {
  document_id: "PRD-MAIN",
  path: "docs/prd.md",
  section: "Project management",
  line_start: 10,
  line_end: 12,
  content_hash: hash,
} as const;
const inference = {
  origin: "inferred",
  confidence: 0.9,
  agent: {
    provider: "fixture",
    model: "deterministic-fixture",
    prompt_contract_version: "1.0.0",
  },
  review: { status: "needs_confirmation" },
} as const;

describe("greenfield contracts", () => {
  it("validates a provenance-preserving candidate requirement", () => {
    const candidate = CandidateRequirementSchema.parse({
      schema_version: "1.0.0",
      candidate_id: "CANDIDATE-001",
      proposed_logical_id: "REQ-PROJECT-001",
      title: "Create a company project",
      actor: { type: "company_administrator" },
      operation: {
        action: "create",
        resource: "project",
        target_scope: "own_company",
      },
      source,
      inference,
    });

    expect(candidate.source.content_hash).toBe(hash);
    expect(() => parseRequirementPackage(candidate)).toThrow();
  });

  it("rejects invalid source ranges and unknown fields", () => {
    expect(() => SourceReferenceSchema.parse({
      ...source,
      line_start: 20,
      line_end: 10,
    })).toThrow("line_end must not precede line_start");
    expect(() => SourceReferenceSchema.parse({ ...source, url: "framework" })).toThrow();
  });

  it("requires correction fields only for corrected decisions", () => {
    const base = {
      schema_version: "1.0.0",
      candidate_id: "CANDIDATE-001",
      candidate_revision_hash: hash,
      source_revision_hash: hash,
      decided_by: "project_owner",
    } as const;
    expect(() => ReviewDecisionSchema.parse({
      ...base,
      decision: "approved",
      correction: { title: "Changed" },
    })).toThrow();
    expect(ReviewDecisionSchema.parse({
      ...base,
      decision: "corrected",
      correction: { title: "Changed" },
    }).decision).toBe("corrected");
  });

  it("validates project intent and rejects implementation-specific additions", () => {
    const intent = {
      schema_version: "1.0.0",
      project: {
        id: "project-management",
        lifecycle: "greenfield",
        application_type: "transactional_web_application",
        business_domain: "project_management",
      },
      delivery: {
        team_size: 2,
        expected_delivery_months: 3,
        deployment_preference: "managed_cloud",
      },
      constraints: {
        expected_users: 1000,
        data_sensitivity: "internal",
        multi_tenant: true,
      },
      skills: {
        preferred_languages: ["typescript"],
        preferred_databases: ["postgresql"],
      },
    } as const;
    expect(ProjectIntentSchema.parse(intent).project.lifecycle).toBe("greenfield");
    expect(() => ProjectIntentSchema.parse({ ...intent, framework: "laravel" })).toThrow();
  });

  it("rejects self-referential requirement links", () => {
    expect(() => RequirementLinkSchema.parse({
      source_id: "REQ-001",
      target_id: "REQ-001",
      relationship: "depends_on",
      reason: "Invalid cycle",
    })).toThrow("cannot target itself");
  });
});
