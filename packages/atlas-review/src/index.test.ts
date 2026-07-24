import { describe, expect, it } from "vitest";
import type {
  CandidateBusinessRule,
  CandidateRequirement,
  ReviewDecision,
} from "@company/ces-greenfield-contracts";
import { assertCollectionPackages, canonicalJson } from "@company/ces-requirement-collection-schema";
import { parseRequirementPackage } from "@company/ces-requirement-schema";
import {
  candidateRevisionHash,
  compileAtlasReview,
  targetedClarificationQuestions,
} from "./index.js";

const sourceHash = `sha256:${"a".repeat(64)}`;
const inference = {
  origin: "inferred",
  confidence: 0.8,
  agent: {
    provider: "fixture",
    model: "deterministic",
    prompt_contract_version: "1.0.0",
  },
  review: { status: "needs_confirmation" },
} as const;
const requirement: CandidateRequirement = {
  schema_version: "1.0.0",
  candidate_id: "CANDIDATE-REQ-001",
  proposed_logical_id: "REQ-PROJECT-001",
  title: "Create a project",
  actor: { type: "company_administrator" },
  operation: {
    action: "create",
    resource: "project",
    target_scope: "own_company",
  },
  source: {
    document_id: "PRD",
    path: "docs/prd.md",
    section: "Projects",
    line_start: 1,
    line_end: 2,
    content_hash: sourceHash,
  },
  inference,
};
const rule: CandidateBusinessRule = {
  schema_version: "1.0.0",
  candidate_id: "CANDIDATE-RULE-001",
  proposed_logical_id: "RULE-PROJECT-OWNER",
  type: "authorization",
  statement: "Only company administrators create projects",
  source_requirement_ids: ["REQ-PROJECT-001"],
  source: requirement.source,
  inference,
};
const analysis = {
  schema_version: "1.0.0",
  candidate_requirements: [requirement],
  candidate_business_rules: [rule],
  uncertainties: [],
  conflicts: [],
  clarification_questions: [],
} as const;

function decision(
  candidate: CandidateRequirement | CandidateBusinessRule,
  value: ReviewDecision["decision"] = "approved",
): ReviewDecision {
  return {
    schema_version: "1.0.0",
    candidate_id: candidate.candidate_id,
    candidate_revision_hash: candidateRevisionHash(candidate),
    source_revision_hash: candidate.source.content_hash,
    decision: value,
    decided_by: "product_owner",
  };
}

describe("Atlas human review", () => {
  it("compiles approved candidates into deterministic existing core contracts", () => {
    const input = {
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [decision(requirement), decision(rule)],
      clarification_answers: [],
    };
    const first = compileAtlasReview(input);
    const reversed = compileAtlasReview({
      ...input,
      decisions: [...input.decisions].reverse(),
    });

    expect(canonicalJson(first)).toBe(canonicalJson(reversed));
    expect(parseRequirementPackage(first.packages["REQ-PROJECT-001"]))
      .toEqual(first.packages["REQ-PROJECT-001"]);
    expect(first.packages["REQ-PROJECT-001"]?.business_rules).toEqual([{
      id: "RULE-PROJECT-OWNER",
      type: "authorization",
      statement: "Only company administrators create projects",
    }]);
    expect(() => assertCollectionPackages(first.collection, first.packages)).not.toThrow();
  });

  it("fails closed when a candidate or source revision changed", () => {
    const valid = decision(requirement);
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [
        { ...valid, candidate_revision_hash: `sha256:${"b".repeat(64)}` },
        decision(rule),
      ],
    })).toThrow("candidate revision changed");
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [
        { ...valid, source_revision_hash: `sha256:${"b".repeat(64)}` },
        decision(rule),
      ],
    })).toThrow("source revision changed");
  });

  it("requires human answers for blocking clarification questions", () => {
    const blocked = {
      ...analysis,
      uncertainties: [{
        id: "UNCERTAINTY-001",
        severity: "blocking",
        field: "operation.target_scope",
        reason: "Scope is not explicit",
        affected_requirement_ids: ["REQ-PROJECT-001"],
      }],
      clarification_questions: [{
        id: "QUESTION-001",
        question: "Is project creation limited to the actor's company?",
        affected_requirement_ids: ["REQ-PROJECT-001"],
        blocking: true,
      }],
    } as const;
    const input = {
      collection_id: "COLLECTION-PROJECT",
      analysis: blocked,
      decisions: [decision(requirement), decision(rule)],
    };
    expect(() => compileAtlasReview(input)).toThrow("Unresolved blocking clarification");
    expect(() => compileAtlasReview({
      ...input,
      clarification_answers: [{
        question_id: "QUESTION-001",
        answer: "Yes, only the actor's company",
        answered_by: "product_owner",
        source_revision_hash: sourceHash,
      }],
    })).not.toThrow();
  });

  it("synthesizes targeted questions for uncovered high-impact facts", () => {
    const uncertain = {
      ...analysis,
      uncertainties: [{
        id: "UNCERTAINTY-001",
        severity: "blocking",
        field: "operation.target_scope",
        reason: "Scope is not explicit",
        affected_requirement_ids: ["REQ-PROJECT-001"],
      }],
    } as const;
    expect(targetedClarificationQuestions(uncertain)).toEqual([{
      id: "QUESTION-UNCERTAINTY-001",
      question: "Clarify operation.target_scope: Scope is not explicit",
      affected_requirement_ids: ["REQ-PROJECT-001"],
      blocking: true,
    }]);
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis: uncertain,
      decisions: [decision(requirement), decision(rule)],
    })).toThrow("QUESTION-UNCERTAINTY-001");
  });

  it("supports reject, defer, supersede, and human correction transitions", () => {
    const extraRequirements: CandidateRequirement[] = [
      { ...requirement, candidate_id: "CANDIDATE-REQ-REJECTED", proposed_logical_id: "REQ-REJECTED" },
      { ...requirement, candidate_id: "CANDIDATE-REQ-DEFERRED", proposed_logical_id: "REQ-DEFERRED" },
      { ...requirement, candidate_id: "CANDIDATE-REQ-SUPERSEDED", proposed_logical_id: "REQ-SUPERSEDED" },
    ];
    const result = compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis: {
        ...analysis,
        candidate_requirements: [requirement, ...extraRequirements],
      },
      decisions: [
        {
          ...decision(requirement),
          decision: "corrected",
          correction: { title: "Create a company project" },
        },
        decision(rule),
        decision(extraRequirements[0]!, "rejected"),
        decision(extraRequirements[1]!, "deferred"),
        decision(extraRequirements[2]!, "superseded"),
      ],
    });

    expect(result.packages["REQ-PROJECT-001"]?.requirement.title)
      .toBe("Create a company project");
    expect(result.review_report.rejected_candidate_ids).toEqual([
      "CANDIDATE-REQ-REJECTED",
      "CANDIDATE-REQ-SUPERSEDED",
    ]);
    expect(result.review_report.deferred_candidate_ids)
      .toEqual(["CANDIDATE-REQ-DEFERRED"]);
  });

  it("rejects missing human decisions and unapproved rule dependencies", () => {
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [decision(requirement)],
    })).toThrow("Candidates require human review");
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [decision(requirement, "rejected"), decision(rule)],
    })).toThrow("empty Requirement Collection");
  });

  it("does not allow corrections to rewrite immutable provenance", () => {
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis,
      decisions: [{
        ...decision(requirement),
        decision: "corrected",
        correction: {
          source: { ...requirement.source, content_hash: `sha256:${"f".repeat(64)}` },
        },
      }, decision(rule)],
    })).toThrow("cannot change immutable candidate provenance");
  });

  it("rejects provider-side approval and clarification answers bound elsewhere", () => {
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis: {
        ...analysis,
        candidate_requirements: [{
          ...requirement,
          inference: {
            ...requirement.inference,
            review: { status: "approved" },
          },
        }],
      },
      decisions: [decision(requirement), decision(rule)],
    })).toThrow("non-human approved review state");

    const otherHash = `sha256:${"e".repeat(64)}`;
    const other = {
      ...requirement,
      candidate_id: "CANDIDATE-REQ-OTHER",
      proposed_logical_id: "REQ-OTHER",
      source: { ...requirement.source, document_id: "OTHER", content_hash: otherHash },
    };
    expect(() => compileAtlasReview({
      collection_id: "COLLECTION-PROJECT",
      analysis: {
        ...analysis,
        candidate_requirements: [requirement, other],
        clarification_questions: [{
          id: "QUESTION-001",
          question: "Confirm the project scope",
          affected_requirement_ids: ["REQ-PROJECT-001"],
          blocking: true,
        }],
      },
      decisions: [decision(requirement), decision(other), decision(rule)],
      clarification_answers: [{
        question_id: "QUESTION-001",
        answer: "Confirmed",
        answered_by: "product_owner",
        source_revision_hash: otherHash,
      }],
    })).toThrow("source revision changed");
  });
});
