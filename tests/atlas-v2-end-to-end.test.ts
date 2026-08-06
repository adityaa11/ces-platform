import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { atlasProposalHash, atlasReviewSubjects } from
  "../packages/atlas-knowledge-review/src/index.js";
import { finalizeSemanticFacts } from "../packages/atlas-semantic-facts/src/index.js";
import { sourceContentHash } from "../packages/document-ingestion/src/index.js";
import { buildSourceArtifacts } from "../packages/source-unit-schema/src/index.js";
import { runCli } from "../apps/cli/src/index.js";
import { readKnowledgeNode, readKnowledgeOverview } from
  "../apps/atlas-workflow-ui/lib/knowledge-v2.js";
import { describe, expect, it } from "vitest";

type Fixture = { case_id: string; source: string; expected_root_modules: string[];
  facts: Array<{ kind: string; quote: string; relation?: string; terms: [string, string][] }> };
const fixtureRoot = resolve("tests/fixtures/atlas-v2");
const fixtures = (JSON.parse(await readFile(resolve(fixtureRoot,
  "qualification-cases.json"), "utf8")) as { cases: Fixture[] }).cases;
const io = { stdout: () => undefined, stderr: () => undefined };

describe("Atlas V2 end-to-end qualification", () => {
  it.each(fixtures)("qualifies $case_id through publication, navigation, and approval",
    async (fixture) => {
      const temporary = await mkdtemp(resolve(tmpdir(), "atlas-v2-e2e-"));
      try {
        const prepared = await prepareFixture(fixture, temporary);
        const artifactRoot = resolve(temporary, "generated");
        const output = resolve(artifactRoot, fixture.case_id);
        const args = ["atlas", "run", "--prd", prepared.sourcePath,
          "--project-intent", prepared.intentPath, "--provider-result", prepared.providerPath,
          "--output", output];
        expect(await runCli(args, io)).toBe(7);
        const firstKnowledge = await readFile(resolve(output, "atlas-knowledge.json"), "utf8");
        const firstManifest = await readFile(resolve(output, "run-manifest.json"), "utf8");
        expect(await runCli(args, io)).toBe(7);
        expect(await readFile(resolve(output, "atlas-knowledge.json"), "utf8"))
          .toBe(firstKnowledge);
        expect(await readFile(resolve(output, "run-manifest.json"), "utf8"))
          .toBe(firstManifest);

        const overview = await readKnowledgeOverview({ root: artifactRoot,
          projectId: fixture.case_id, revision: 1 });
        expect(overview.children.map(({ display_name }) => display_name))
          .toEqual(fixture.expected_root_modules);
        const child = overview.children[0]!;
        const detail = await readKnowledgeNode({ root: artifactRoot,
          projectId: fixture.case_id, revision: 1, knowledgeId: child.knowledge_id });
        expect(detail.breadcrumb.map(({ display_name }) => display_name))
          .toEqual(["Main Workflow", child.display_name]);

        const proposal = JSON.parse(firstKnowledge);
        const proposalHash = atlasProposalHash(proposal);
        const decisionsPath = resolve(temporary, "decisions.json");
        await writeFile(decisionsPath, JSON.stringify({ schema_version: "2.0.0",
          proposal_hash: proposalHash, decisions: atlasReviewSubjects(proposal)
            .map((subjectId, index) => ({ decision_id: `${fixture.case_id}.decision.${index + 1}`,
              proposal_hash: proposalHash, proposal_revision: 1, subject_id: subjectId,
              decision: "accepted", reviewer_id: "qualification.reviewer",
              decided_at: "2026-08-07T00:00:00.000Z" })) }));
        const approvalErrors: string[] = [];
        const approvalStatus = await runCli(["atlas", "approve", "--output", output,
          "--decisions", decisionsPath], { stdout: () => undefined,
          stderr: (text) => approvalErrors.push(text) });
        expect(approvalStatus, approvalErrors.join("\n")).toBe(0);
        const approved = JSON.parse(await readFile(resolve(output,
          "atlas-approved-knowledge.json"), "utf8"));
        expect(approved.evidence).toEqual(proposal.evidence);
        expect(approved.knowledge_nodes).toEqual(proposal.knowledge_nodes);
        expect(approved.authority.lifecycle).toBe("approved");
      } finally { await rm(temporary, { recursive: true, force: true }); }
    });

  it("rejects a provider result that does not satisfy the V2 fact contract", async () => {
    const temporary = await mkdtemp(resolve(tmpdir(), "atlas-v2-invalid-"));
    try {
      const prepared = await prepareFixture(fixtures[0]!, temporary);
      await writeFile(prepared.providerPath, JSON.stringify({ schema_version: "2.0.0",
        facts: [{ invented: true }] }));
      expect(await runCli(["atlas", "run", "--prd", prepared.sourcePath,
        "--project-intent", prepared.intentPath, "--provider-result", prepared.providerPath,
        "--output", resolve(temporary, "output")], io)).toBe(2);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  });
});

async function prepareFixture(fixture: Fixture, directory: string) {
  const source = await readFile(resolve(fixtureRoot, fixture.source), "utf8");
  const sourcePath = resolve(directory, fixture.source);
  await writeFile(sourcePath, source);
  const projectId = fixture.case_id;
  const documentId = `${projectId}.document.prd`;
  const artifacts = buildSourceArtifacts({ document_id: documentId,
    path: `qualification/${basename(fixture.source)}`, content: source });
  const facts = fixture.facts.map((fact, index) => {
    const unit = artifacts.source_units.find(({ kind, text }) =>
      fact.kind === "module" && kind === "heading" && text === fact.quote)
      ?? artifacts.source_units.find(({ exact_text }) => exact_text === fact.quote)
      ?? artifacts.source_units.find(({ exact_text }) => exact_text.includes(fact.quote));
    if (!unit) throw new Error(`Missing fixture quote: ${fact.quote}`);
    return { candidate_id: `${projectId}.candidate.${index + 1}`, kind: fact.kind,
      exact_statement: fact.quote, source_unit_ids: [unit.id],
      terms: fact.terms.map(([role_id, exact_text]) => ({ role_id, exact_text })),
      ...(fact.relation ? { relation_kind: fact.relation } : {}), confidence: 1 };
  });
  const extractionInput = { schema_version: "2.0.0" as const, project_id: projectId,
    documents: [{ document_id: documentId,
      document_revision_id: artifacts.document_revision.id, revision: 1,
      content_hash: sourceContentHash(source), media_type: "text/markdown",
      original_name: basename(fixture.source) }], source_units: artifacts.source_units };
  const output = finalizeSemanticFacts(extractionInput, { schema_version: "2.0.0", facts });
  const providerPath = resolve(directory, "provider.json");
  await writeFile(providerPath, JSON.stringify(output));
  const intentPath = resolve(directory, "intent.json");
  await writeFile(intentPath, JSON.stringify({ schema_version: "1.0.0",
    project: { id: projectId, lifecycle: "greenfield",
      application_type: "transactional_web_application", business_domain: "qualification" },
    delivery: { team_size: 2, expected_delivery_months: 2,
      deployment_preference: "managed_cloud" }, constraints: { expected_users: 10,
      data_sensitivity: "internal", multi_tenant: false },
    skills: { preferred_languages: ["typescript"], preferred_databases: ["postgresql"] } }));
  return { sourcePath, intentPath, providerPath, extractionInput, facts };
}
