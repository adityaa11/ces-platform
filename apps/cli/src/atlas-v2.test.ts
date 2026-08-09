import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { atlasProposalHash, atlasReviewSubjects } from "@company/ces-atlas-knowledge-review";
import { describe, expect, it } from "vitest";
import { runCli } from "./index.js";

describe("Atlas V2 CLI", () => {
  it("publishes one deterministic recursive bundle without v1 artifacts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlas-v2-"));
    try {
      const prd = join(directory, "sample.md");
      const intent = join(directory, "intent.json");
      const provider = join(directory, "facts.json");
      const output = join(directory, "output");
      await writeFile(prd, "# Ordering\n\nOrder proceeds to Payment.\n\n# Payment\n", "utf8");
      await writeFile(intent, JSON.stringify({ schema_version: "1.0.0",
        project: { id: "sample", lifecycle: "greenfield",
          application_type: "transactional_web_application", business_domain: "commerce" },
        delivery: { team_size: 2, expected_delivery_months: 2,
          deployment_preference: "managed_cloud" },
        constraints: { expected_users: 10, data_sensitivity: "internal", multi_tenant: false },
        skills: { preferred_languages: ["typescript"], preferred_databases: ["postgresql"] } }),
      );
      const evidence = (id: string, text: string) => ({ evidence_id: `sample.evidence.${id}`,
        exact_text: text, language: "en", location: { document_id: "sample.document.prd",
          document_revision: 1, source_unit_id: `sample.unit.${id}`, page_number: 1,
          page_number_base: 1, text_span: { start: 0, end: text.length },
          coordinates: { coordinate_status: "unavailable", bounding_boxes: [],
            reason: "source_has_no_coordinates" } }, extraction_method: "structured_text",
        extraction_confidence: 1, review_status: "unreviewed" });
      const fact = (id: string, kind: string, statement: string, terms: unknown[] = []) => ({
        fact_id: `sample.fact.${id}`, kind, exact_statement: statement,
        source_unit_ids: [`sample.unit.${id}`], terms, confidence: 1,
        evidence_ids: [`sample.evidence.${id}`], context_paths: [statement],
        equivalence_status: "not_proposed" });
      const statements = ["Order", "Payment", "Order proceeds to Payment"];
      await writeFile(provider, JSON.stringify({ schema_version: "2.0.0", project_id: "sample",
        facts: [fact("order", "module", statements[0]!),
          fact("payment", "module", statements[1]!),
          { ...fact("sequence", "activity_order", statements[2]!, [
            { role_id: "source", exact_text: "Order" },
            { role_id: "target", exact_text: "Payment" }]), relation_kind: "enables" }],
        evidence: [evidence("order", statements[0]!), evidence("payment", statements[1]!),
          evidence("sequence", statements[2]!)] }), "utf8");
      const args = ["atlas", "run", "--prd", prd, "--project-intent", intent,
        "--provider-result", provider, "--output", output];
      expect(await runCli(args, { stdout: () => undefined, stderr: () => undefined })).toBe(7);
      const first = await readFile(join(output, "run-manifest.json"), "utf8");
      expect((await readdir(output)).sort()).toEqual(["atlas-diagnostics.json",
        "atlas-evidence.json", "atlas-knowledge.json", "run-manifest.json",
        "source-manifest.json"]);
      expect(await runCli(args, { stdout: () => undefined, stderr: () => undefined })).toBe(7);
      expect(await readFile(join(output, "run-manifest.json"), "utf8")).toBe(first);
      const proposal = JSON.parse(await readFile(join(output, "atlas-knowledge.json"), "utf8"));
      const diagnostics = JSON.parse(await readFile(join(output, "atlas-diagnostics.json"), "utf8"));
      expect(diagnostics.extraction_scopes).toEqual([expect.objectContaining({
        scope_id: "sample.scope.document", attempts: 1,
        disposition: "facts_extracted", fact_count: 3,
      })]);
      const proposalHash = atlasProposalHash(proposal);
      const decisions = join(directory, "decisions.json");
      await writeFile(decisions, JSON.stringify({ schema_version: "2.0.0",
        proposal_hash: proposalHash,
        decisions: atlasReviewSubjects(proposal).map((subjectId, index) => ({
          decision_id: `sample.decision.${index + 1}`,
          proposal_hash: proposalHash, proposal_revision: proposal.revision,
          subject_id: subjectId, decision: "accepted", reviewer_id: "sample.reviewer",
          decided_at: "2026-08-07T00:00:00.000Z",
        })) }), "utf8");
      expect(await runCli(["atlas", "approve", "--output", output, "--decisions", decisions],
        { stdout: () => undefined, stderr: () => undefined })).toBe(0);
      expect((await readdir(output)).sort()).toEqual(["atlas-approval-audit.json",
        "atlas-approved-knowledge.json", "atlas-diagnostics.json", "atlas-evidence.json",
        "atlas-knowledge.json", "run-manifest.json", "source-manifest.json"]);
      expect(JSON.parse(await readFile(join(output, "atlas-approved-knowledge.json"), "utf8"))
        .authority.lifecycle).toBe("approved");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it("withholds an introduction-only proposal and publishes incomplete diagnostics", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlas-v2-incomplete-"));
    try {
      const prd = join(directory, "sample.md");
      const intent = join(directory, "intent.json");
      const provider = join(directory, "facts.json");
      const output = join(directory, "output");
      await writeFile(prd, "We need an internal application.\n", "utf8");
      await writeFile(intent, JSON.stringify({ schema_version: "1.0.0",
        project: { id: "sample", lifecycle: "greenfield",
          application_type: "transactional_web_application", business_domain: "commerce" },
        delivery: { team_size: 2, expected_delivery_months: 2,
          deployment_preference: "managed_cloud" },
        constraints: { expected_users: 10, data_sensitivity: "internal", multi_tenant: false },
        skills: { preferred_languages: ["typescript"], preferred_databases: ["postgresql"] } }),
      );
      await writeFile(provider, JSON.stringify({ schema_version: "2.0.0", project_id: "sample",
        facts: [{ fact_id: "sample.fact.intro", kind: "module",
          exact_statement: "We need an internal application.",
          source_unit_ids: ["sample.unit.intro"], terms: [], confidence: 1,
          evidence_ids: ["sample.evidence.intro"], context_paths: [],
          equivalence_status: "not_proposed" }], evidence: [{
          evidence_id: "sample.evidence.intro", exact_text: "We need an internal application.",
          language: "en", location: { document_id: "sample.document.prd", document_revision: 1,
            source_unit_id: "sample.unit.intro", page_number: 1, page_number_base: 1,
            text_span: { start: 0, end: 32 }, coordinates: { coordinate_status: "unavailable",
              bounding_boxes: [], reason: "source_has_no_coordinates" } },
          extraction_method: "structured_text", extraction_confidence: 1,
          review_status: "unreviewed" }] }), "utf8");
      const code = await runCli(["atlas", "run", "--prd", prd, "--project-intent", intent,
        "--provider-result", provider, "--output", output],
      { stdout: () => undefined, stderr: () => undefined });
      expect(code).toBe(8);
      expect((await readdir(output)).sort()).toEqual(["atlas-diagnostics.json",
        "atlas-extraction.json", "run-manifest.json", "source-manifest.json"]);
      const diagnostics = JSON.parse(await readFile(join(output, "atlas-diagnostics.json"), "utf8"));
      expect(diagnostics.coverage.status).toBe("incomplete");
      expect(diagnostics.coverage.issues).toContainEqual(expect.objectContaining({
        code: "unscoped_module",
      }));
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
