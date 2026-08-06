import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
