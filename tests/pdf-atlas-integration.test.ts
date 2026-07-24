import { describe, expect, it } from "vitest";
import { FixtureAtlasProvider } from "../packages/agent-provider-sdk/src/index.js";
import { analyzeAtlasCandidates } from "../packages/atlas-extraction/src/index.js";
import {
  candidateRevisionHash,
  compileAtlasReview,
} from "../packages/atlas-review/src/index.js";
import { ingestPdfDocument } from "../packages/pdf-ingestion/src/index.js";
import type { ProjectIntent } from "../packages/greenfield-contracts/src/index.js";
import { createPdf } from "../packages/pdf-ingestion/src/test-fixtures.js";

const projectIntent: ProjectIntent = {
  schema_version: "1.0.0",
  project: {
    id: "pdf-project",
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

describe("PDF to Atlas candidate extraction", () => {
  it("feeds normalized PDF text and page provenance into ATLAS-001", async () => {
    const ingested = await ingestPdfDocument({
      document_id: "PRD-PDF",
      path: "docs/product-prd.pdf",
      bytes: createPdf(["Administrators create projects."]),
    });
    const page = ingested.pages[0]!;
    const provider = new FixtureAtlasProvider({
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
          document_id: ingested.normalized_document.document_id,
          path: ingested.normalized_document.path,
          line_start: page.line_start,
          line_end: page.line_end,
          page_start: page.page_number,
          page_end: page.page_number,
          page_revision_hashes: [page.page_revision_hash],
          extraction: {
            method: "native_text",
            parser: ingested.parser.id,
            parser_version: ingested.parser.version,
          },
          content_hash: ingested.normalized_document.content_hash,
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
      }],
    });

    const result = await analyzeAtlasCandidates({
      documents: [{
        document_id: ingested.normalized_document.document_id,
        path: ingested.normalized_document.path,
        content: ingested.normalized_document.content,
      }],
      projectIntent,
      provider,
      promptContractVersion: "1.0.0",
    });

    expect(result.analysis.candidate_requirements[0]?.source).toMatchObject({
      page_start: 1,
      page_end: 1,
      page_revision_hashes: [page.page_revision_hash],
      extraction: {
        method: "native_text",
        parser: "mozilla-pdfjs",
      },
    });
    const extractedCandidate = result.analysis.candidate_requirements[0]!;
    const reviewed = compileAtlasReview({
      collection_id: "COLLECTION-PDF",
      analysis: result.analysis,
      decisions: [{
        schema_version: "1.0.0",
        candidate_id: extractedCandidate.candidate_id,
        candidate_revision_hash: candidateRevisionHash(extractedCandidate),
        source_revision_hash: extractedCandidate.source.content_hash,
        decision: "approved",
        decided_by: "product_owner",
      }],
    });
    expect(reviewed.packages["REQ-PROJECT-001"]?.source).toMatchObject({
      page_start: 1,
      page_end: 1,
      page_revision_hashes: [page.page_revision_hash],
      extraction: {
        method: "native_text",
        parser: "mozilla-pdfjs",
      },
    });
  });
});
