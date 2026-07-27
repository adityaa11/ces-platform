import { describe, expect, it } from "vitest";
import { normalizeAtlasExtraction } from "../../index.js";

const hashA = `sha256:${"a".repeat(64)}`;
const hashB = `sha256:${"b".repeat(64)}`;
const request = {
  schema_version: "1.0.0",
  prompt_contract_version: "1.0.0",
  source_documents: [
    { document_id: "DOC-A", path: "a.md", content_hash: hashA, content: "one\ntwo\nthree" },
    { document_id: "DOC-B", path: "b.md", content_hash: hashB, content: "one\ntwo" },
  ],
  project_intent: {
    schema_version: "1.0.0",
    project: {
      id: "example",
      lifecycle: "greenfield",
      application_type: "transactional_web_application",
      business_domain: "testing",
    },
    delivery: {
      team_size: 2,
      expected_delivery_months: 3,
      deployment_preference: "managed_cloud",
    },
    constraints: {
      expected_users: 10,
      data_sensitivity: "internal",
      multi_tenant: false,
    },
    skills: { preferred_languages: [], preferred_databases: [] },
  },
} as const;

const requirementA = {
  temporary_id: "TMP-REQ-9",
  proposed_logical_id: "REQ-B",
  title: "  View   project ",
  actor: { type: "authenticated_user" },
  operation: { action: "view", resource: "project" },
  source: { document_id: "DOC-B", line_start: 1, line_end: 1 },
  inference: { origin: "explicit", confidence: 0.9, review_status: "candidate" },
} as const;
const requirementB = {
  temporary_id: "TMP-REQ-2",
  proposed_logical_id: "REQ-A",
  title: "Create project",
  actor: { type: "project_manager" },
  operation: { action: "create", resource: "project" },
  source: { document_id: "DOC-A", line_start: 2, line_end: 2 },
  inference: { origin: "inferred", confidence: 0.8, review_status: "needs_confirmation" },
} as const;

function extraction(reverse: boolean): any {
  const requirements = structuredClone(
    reverse ? [requirementA, requirementB] : [requirementB, requirementA],
  );
  return {
    candidate_requirements: requirements,
    candidate_business_rules: [{
      temporary_id: "TMP-BR-1",
      proposed_logical_id: "BR-1",
      type: "authorization",
      statement: "Only project managers create projects",
      source_requirement_ids: ["TMP-REQ-2"],
      source: { document_id: "DOC-A", line_start: 2 },
      inference: { origin: "inferred", confidence: 0.7, review_status: "needs_confirmation" },
    }],
    uncertainties: [{
      temporary_id: "TMP-UNC-1",
      severity: "high",
      field: "scope",
      reason: "Scope is missing",
      affected_requirement_ids: ["TMP-REQ-9"],
    }],
    conflicts: [{
      temporary_id: "TMP-CONFLICT-1",
      severity: "medium",
      statement: "Candidate requirements conflict",
      source_requirement_ids: ["TMP-REQ-9", "TMP-REQ-2"],
    }],
    clarification_questions: [{
      temporary_id: "TMP-QUESTION-1",
      question: "Which scope applies?",
      affected_requirement_ids: ["TMP-REQ-9"],
      blocking: true,
    }],
  };
}

describe("Atlas canonical normalization", () => {
  it("produces identical trusted output independent of model array order and IDs", () => {
    const first = normalizeAtlasExtraction(extraction(false), request, {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    const second = normalizeAtlasExtraction(extraction(true), request, {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    expect(second).toEqual(first);
    expect(first.candidate_requirements.map(({ candidate_id }) => candidate_id))
      .toEqual(["REQ-CAND-001", "REQ-CAND-002"]);
    expect(first.candidate_requirements[0]?.source).toMatchObject({
      document_id: "DOC-A",
      path: "a.md",
      content_hash: hashA,
    });
    expect(first.candidate_requirements[0]?.inference.agent).toEqual({
      provider: "gemini",
      model: "gemini-2.5-flash",
      prompt_contract_version: "1.0.0",
    });
    expect(first.candidate_business_rules[0]?.source_requirement_ids)
      .toEqual(["REQ-CAND-001"]);
    expect(first.conflicts[0]?.source_requirement_ids)
      .toEqual(["REQ-CAND-001", "REQ-CAND-002"]);

    const renamed = extraction(true);
    renamed.candidate_requirements[0].temporary_id = "TMP-REQ-20";
    renamed.uncertainties[0].affected_requirement_ids = ["TMP-REQ-20"];
    renamed.conflicts[0].source_requirement_ids = ["TMP-REQ-20", "TMP-REQ-2"];
    renamed.clarification_questions[0].affected_requirement_ids = ["TMP-REQ-20"];
    renamed.candidate_requirements[1].temporary_id = "TMP-REQ-10";
    renamed.candidate_business_rules[0].source_requirement_ids = ["TMP-REQ-10"];
    renamed.conflicts[0].source_requirement_ids[1] = "TMP-REQ-10";
    expect(normalizeAtlasExtraction(renamed, request, {
      provider: "gemini",
      model: "gemini-2.5-flash",
    })).toEqual(first);
  });

  it("sorts absent locations last and normalizes semantic text", () => {
    const value = extraction(false);
    value.candidate_requirements[0] = {
      ...requirementB,
      source: { document_id: "DOC-A" },
    };
    value.candidate_requirements.push({
      ...requirementB,
      temporary_id: "TMP-REQ-3",
      title: "Archive project",
      operation: { action: "archive", resource: "project" },
      source: { document_id: "DOC-A", line_start: 1, line_end: 1 },
    });
    const result = normalizeAtlasExtraction(value, request, {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    expect(result.candidate_requirements.map(({ title }) => title))
      .toEqual(["Archive project", "Create project", "View project"]);
  });

  it("rejects unknown sources, out-of-bounds lines, dangling references, and duplicates", () => {
    const unknown = extraction(false);
    unknown.candidate_requirements[0] = {
      ...requirementB,
      source: { document_id: "UNKNOWN", line_start: 1 },
    };
    expect(() => normalizeAtlasExtraction(unknown, request, {
      provider: "gemini", model: "gemini-2.5-flash",
    })).toThrow("Unknown Atlas source");

    const outside = extraction(false);
    outside.candidate_requirements[0] = {
      ...requirementB,
      source: { document_id: "DOC-A", line_start: 4 },
    };
    expect(() => normalizeAtlasExtraction(outside, request, {
      provider: "gemini", model: "gemini-2.5-flash",
    })).toThrow("exceeds document");

    const dangling = extraction(false);
    dangling.candidate_business_rules[0]!.source_requirement_ids = ["TMP-REQ-404"];
    expect(() => normalizeAtlasExtraction(dangling, request, {
      provider: "gemini", model: "gemini-2.5-flash",
    })).toThrow("Dangling Atlas requirement reference");

    const duplicate = extraction(false);
    duplicate.candidate_requirements.push({ ...requirementB, temporary_id: "TMP-REQ-3" });
    expect(() => normalizeAtlasExtraction(duplicate, request, {
      provider: "gemini", model: "gemini-2.5-flash",
    })).toThrow("Duplicate semantic");
  });
});
