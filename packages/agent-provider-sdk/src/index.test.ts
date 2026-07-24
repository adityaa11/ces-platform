import { describe, expect, it } from "vitest";
import {
  FixtureAtlasProvider,
  HttpAtlasProvider,
  runAtlasProvider,
  type AtlasProviderRequest,
} from "./index.js";

const hash = `sha256:${"a".repeat(64)}`;
const request: AtlasProviderRequest = {
  schema_version: "1.0.0",
  prompt_contract_version: "1.0.0",
  source_documents: [{
    document_id: "PRD-MAIN",
    path: "docs/prd.md",
    content_hash: hash,
    content: "# Project",
  }],
  project_intent: {
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
  },
};

const result = {
  schema_version: "1.0.0",
  candidate_requirements: [{
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
      line_start: 1,
      line_end: 1,
      content_hash: hash,
    },
    inference: {
      origin: "inferred",
      confidence: 0.9,
      agent: {
        provider: "untrusted-value",
        model: "untrusted-value",
        prompt_contract_version: "untrusted-value",
      },
      review: { status: "needs_confirmation" },
    },
  }],
};

describe("agent provider SDK", () => {
  it("validates and stamps deterministic fixture output", async () => {
    const provider = new FixtureAtlasProvider(result);
    const first = await runAtlasProvider(provider, request);
    const second = await runAtlasProvider(provider, request);

    expect(first).toEqual(second);
    expect(first.candidate_requirements[0]?.inference.agent).toEqual({
      provider: "fixture",
      model: "deterministic-fixture",
      prompt_contract_version: "1.0.0",
    });
  });

  it("rejects invalid provider output before returning it", async () => {
    await expect(runAtlasProvider(
      new FixtureAtlasProvider({ schema_version: "1.0.0", invalid: true }),
      request,
    )).rejects.toThrow();
  });

  it("rejects provider attempts to approve their own candidates", async () => {
    const approved = {
      ...result,
      candidate_requirements: [{
        ...result.candidate_requirements[0],
        inference: {
          ...result.candidate_requirements[0]!.inference,
          review: { status: "approved" },
        },
      }],
    };
    await expect(runAtlasProvider(
      new FixtureAtlasProvider(approved),
      request,
    )).rejects.toThrow("cannot return approved review state");
  });

  it("uses a configured HTTPS provider without exposing its key in the body", async () => {
    let observedBody = "";
    let observedAuthorization = "";
    const provider = new HttpAtlasProvider({
      endpoint: "https://provider.example/analyze",
      apiKey: "secret",
      provider: "configured-http",
      model: "analysis-model",
      transport: async (_endpoint, init) => {
        observedBody = init.body;
        observedAuthorization = init.headers.authorization ?? "";
        return { status: 200, body: result };
      },
    });

    const analyzed = await runAtlasProvider(provider, request);
    expect(observedAuthorization).toBe("Bearer secret");
    expect(observedBody).not.toContain("secret");
    expect(analyzed.candidate_requirements[0]?.inference.agent.provider)
      .toBe("configured-http");
  });

  it("requires HTTPS and reports non-success responses", async () => {
    expect(() => new HttpAtlasProvider({
      endpoint: "http://provider.example/analyze",
      provider: "configured-http",
      model: "analysis-model",
    })).toThrow("must use HTTPS");

    const provider = new HttpAtlasProvider({
      endpoint: "https://provider.example/analyze",
      provider: "configured-http",
      model: "analysis-model",
      transport: async () => ({ status: 503, body: {} }),
    });
    await expect(runAtlasProvider(provider, request)).rejects.toThrow(
      "status 503",
    );
  });
});
