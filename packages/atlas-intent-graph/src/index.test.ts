import { describe, expect, it } from "vitest";
import {
  candidateRevisionHash,
  compileAtlasReview,
} from "@company/ces-atlas-review";
import type {
  CandidateBusinessRule,
  CandidateRequirement,
  ReviewDecision,
} from "@company/ces-greenfield-contracts";
import {
  AtlasGraphValidationError,
  buildIntentGraph,
  compileAtlasCoreHandoff,
  renderIntentGraphJson,
  renderIntentGraphMarkdown,
  renderIntentGraphMermaid,
} from "./index.js";

const sourceHash = `sha256:${"a".repeat(64)}`;
const inference = {
  origin: "explicit",
  confidence: 1,
  agent: {
    provider: "fixture",
    model: "deterministic",
    prompt_contract_version: "1.0.0",
  },
  review: { status: "candidate" },
} as const;
const createProject: CandidateRequirement = {
  schema_version: "1.0.0",
  candidate_id: "CANDIDATE-001",
  proposed_logical_id: "REQ-PROJECT-001",
  title: "Replace a profile picture",
  actor: { type: "authenticated_user" },
  operation: {
    action: "replace",
    resource: "profile_picture",
    target_scope: "own_resource",
  },
  source: {
    document_id: "PRD",
    path: "docs/prd.md",
    section: "Projects",
    content_hash: sourceHash,
  },
  inference,
};
const viewProject: CandidateRequirement = {
  ...createProject,
  candidate_id: "CANDIDATE-002",
  proposed_logical_id: "REQ-PROJECT-002",
  title: "View a project",
  actor: { type: "company_member" },
  operation: {
    action: "view",
    resource: "project",
    target_scope: "own_company",
  },
};
const rule: CandidateBusinessRule = {
  schema_version: "1.0.0",
  candidate_id: "CANDIDATE-RULE-001",
  proposed_logical_id: "RULE-PROJECT-SCOPE",
  type: "authorization",
  statement: "Members view only projects in their company",
  source_requirement_ids: ["REQ-PROJECT-002"],
  source: createProject.source,
  inference,
};

function decision(
  candidate: CandidateRequirement | CandidateBusinessRule,
): ReviewDecision {
  return {
    schema_version: "1.0.0",
    candidate_id: candidate.candidate_id,
    candidate_revision_hash: candidateRevisionHash(candidate),
    source_revision_hash: candidate.source.content_hash,
    decision: "approved",
    decided_by: "product_owner",
  };
}

function approvedReview() {
  return compileAtlasReview({
    collection_id: "COLLECTION-PROJECT",
    analysis: {
      schema_version: "1.0.0",
      candidate_requirements: [viewProject, createProject],
      candidate_business_rules: [rule],
      uncertainties: [],
      conflicts: [],
      clarification_questions: [],
    },
    decisions: [decision(rule), decision(createProject), decision(viewProject)],
  });
}

describe("Atlas system-intent graph", () => {
  it("emits deterministic JSON, Markdown, and Mermaid without changing approval artifacts", () => {
    const review = approvedReview();
    const before = JSON.stringify(review);
    const links = [{
      source_id: "REQ-PROJECT-002",
      target_id: "REQ-PROJECT-001",
      relationship: "depends_on",
      reason: "A project must exist before it can be viewed",
    }] as const;
    const first = buildIntentGraph({
      graph_id: "GRAPH-PROJECT",
      review,
      links,
      uncertainties: [{
        id: "UNCERTAINTY-LOW-001",
        severity: "low",
        field: "project.description",
        reason: "Maximum length is not specified",
        affected_requirement_ids: ["REQ-PROJECT-001"],
      }],
    });
    const second = buildIntentGraph({
      graph_id: "GRAPH-PROJECT",
      review,
      links: [...links].reverse(),
      uncertainties: [{
        id: "UNCERTAINTY-LOW-001",
        severity: "low",
        field: "project.description",
        reason: "Maximum length is not specified",
        affected_requirement_ids: ["REQ-PROJECT-001"],
      }],
    });

    expect(renderIntentGraphJson(first)).toBe(renderIntentGraphJson(second));
    expect(renderIntentGraphMarkdown(first)).toContain("## Relationships");
    expect(renderIntentGraphMermaid(first)).toContain("flowchart TD");
    expect(first.nodes.find(({ id }) => id === "REQ-PROJECT-001")?.revision_hash)
      .toBe(review.collection.requirements[0]?.revision_hash);
    expect(JSON.stringify(review)).toBe(before);
  });

  it("hands unchanged approved packages to core and traces resolved capabilities", () => {
    const review = approvedReview();
    const before = JSON.stringify(review.packages);
    const handoff = compileAtlasCoreHandoff(review, {
      exposure: "private_network",
      criticality: "standard",
      tenancy: "single_tenant",
      data_classes: ["internal"],
      delivery_semantics: "synchronous",
    }, "1.0.0");
    const graph = buildIntentGraph({
      graph_id: "GRAPH-PROJECT",
      review,
      core_handoff: handoff,
    });

    expect(handoff.manifests["REQ-PROJECT-001"]?.requirement_id)
      .toBe("REQ-PROJECT-001");
    expect(graph.edges.filter(({ relationship }) => relationship === "resolves_to").length)
      .toBeGreaterThan(0);
    expect(JSON.stringify(review.packages)).toBe(before);
  });

  it("returns structured diagnostics for dangling and cyclic relationships", () => {
    const review = approvedReview();
    try {
      buildIntentGraph({
        graph_id: "GRAPH-PROJECT",
        review,
        links: [{
          source_id: "REQ-PROJECT-001",
          target_id: "REQ-MISSING",
          relationship: "depends_on",
          reason: "Fixture dangling edge",
        }],
      });
      throw new Error("Expected graph validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AtlasGraphValidationError);
      expect((error as AtlasGraphValidationError).diagnostics)
        .toContainEqual(expect.objectContaining({ code: "dangling_edge" }));
    }

    expect(() => buildIntentGraph({
      graph_id: "GRAPH-PROJECT",
      review,
      links: [
        {
          source_id: "REQ-PROJECT-001",
          target_id: "REQ-PROJECT-002",
          relationship: "depends_on",
          reason: "First half of fixture cycle",
        },
        {
          source_id: "REQ-PROJECT-002",
          target_id: "REQ-PROJECT-001",
          relationship: "depends_on",
          reason: "Second half of fixture cycle",
        },
      ],
    })).toThrow(AtlasGraphValidationError);
  });

  it("detects conflicting relationship declarations", () => {
    const review = approvedReview();
    try {
      buildIntentGraph({
        graph_id: "GRAPH-PROJECT",
        review,
        links: [
          {
            source_id: "REQ-PROJECT-001",
            target_id: "REQ-PROJECT-002",
            relationship: "depends_on",
            reason: "Declared dependency",
          },
          {
            source_id: "REQ-PROJECT-001",
            target_id: "REQ-PROJECT-002",
            relationship: "conflicts_with",
            reason: "Contradictory declaration",
          },
        ],
      });
      throw new Error("Expected graph validation to fail");
    } catch (error) {
      expect((error as AtlasGraphValidationError).diagnostics)
        .toContainEqual(expect.objectContaining({ code: "conflicting_relationship" }));
    }
  });

  it("detects duplicate approved relationship identities", () => {
    const review = approvedReview();
    const duplicate = {
      source_id: "REQ-PROJECT-002",
      target_id: "REQ-PROJECT-001",
      relationship: "depends_on",
      reason: "A profile must exist before it can be viewed",
    } as const;
    try {
      buildIntentGraph({
        graph_id: "GRAPH-PROJECT",
        review,
        links: [duplicate, duplicate],
      });
      throw new Error("Expected graph validation to fail");
    } catch (error) {
      expect((error as AtlasGraphValidationError).diagnostics)
        .toContainEqual(expect.objectContaining({ code: "duplicate_edge" }));
    }
  });
});
