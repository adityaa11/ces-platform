import { FixtureAtlasProvider } from "@company/ces-agent-provider-sdk";
import { sourceContentHash } from "@company/ces-document-ingestion";
import type { ProjectIntent } from "@company/ces-greenfield-contracts";
import { describe, expect, it } from "vitest";
import { analyzeAtlasCandidates } from "./index.js";

const content = "# Project management\nAdministrators create projects.";
const hash = sourceContentHash(content);
const projectIntent: ProjectIntent = {
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
};
const candidate = {
  schema_version: "1.0.0",
  candidate_id: "CANDIDATE-001",
  proposed_logical_id: "REQ-PROJECT-001",
  title: "Create a project",
  actor: { type: "company_administrator" },
  operation: {
    action: "create",
    resource: "project",
    target_scope: "own_company",
  },
  source: {
    document_id: "PRD-MAIN",
    path: "docs/prd.md",
    line_start: 2,
    line_end: 2,
    content_hash: hash,
  },
  inference: {
    origin: "explicit",
    confidence: 1,
    agent: {
      provider: "fixture",
      model: "fixture",
      prompt_contract_version: "1.0.0",
    },
    review: { status: "needs_confirmation" },
  },
} as const;

describe("Atlas candidate extraction", () => {
  it("produces deterministic analysis with source and provider provenance", async () => {
    const provider = new FixtureAtlasProvider({
      schema_version: "1.0.0",
      candidate_requirements: [candidate],
    });
    const input = {
      documents: [{
        document_id: "PRD-MAIN",
        path: "docs/prd.md",
        content,
      }],
      projectIntent,
      provider,
      promptContractVersion: "1.0.0",
    } as const;
    const first = await analyzeAtlasCandidates(input);
    const second = await analyzeAtlasCandidates(input);

    expect(first).toEqual(second);
    expect(first.source_index.documents[0]?.content_hash).toBe(hash);
    expect(first.extraction_report.provider).toBe("fixture");
    expect(first.analysis.candidate_requirements[0]?.inference.review.status)
      .toBe("needs_confirmation");
  });

  it("rejects unknown and mismatched source provenance", async () => {
    const unknown = {
      ...candidate,
      source: { ...candidate.source, document_id: "PRD-UNKNOWN" },
    };
    await expect(analyzeAtlasCandidates({
      documents: [{ document_id: "PRD-MAIN", path: "docs/prd.md", content }],
      projectIntent,
      provider: new FixtureAtlasProvider({
        schema_version: "1.0.0",
        candidate_requirements: [unknown],
      }),
      promptContractVersion: "1.0.0",
    })).rejects.toThrow("unknown document");

    const mismatched = {
      ...candidate,
      source: { ...candidate.source, content_hash: `sha256:${"f".repeat(64)}` },
    };
    await expect(analyzeAtlasCandidates({
      documents: [{ document_id: "PRD-MAIN", path: "docs/prd.md", content }],
      projectIntent,
      provider: new FixtureAtlasProvider({
        schema_version: "1.0.0",
        candidate_requirements: [mismatched],
      }),
      promptContractVersion: "1.0.0",
    })).rejects.toThrow("source identity mismatch");
  });

  it("rejects duplicate proposed logical identities", async () => {
    await expect(analyzeAtlasCandidates({
      documents: [{ document_id: "PRD-MAIN", path: "docs/prd.md", content }],
      projectIntent,
      provider: new FixtureAtlasProvider({
        schema_version: "1.0.0",
        candidate_requirements: [
          candidate,
          { ...candidate, candidate_id: "CANDIDATE-002" },
        ],
      }),
      promptContractVersion: "1.0.0",
    })).rejects.toThrow("Duplicate Atlas proposed requirement logical ID");
  });
});
