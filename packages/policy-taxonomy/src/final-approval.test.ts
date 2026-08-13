import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FinalPolicyTaxonomyReviewHandoffSchema } from "./final-approval.js";
import { loadFinalPolicyTaxonomyGate } from "./final-approval-loader.js";

const root = resolve(import.meta.dirname, "../../..");
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

describe("POL-008 final approval build-time gate", () => {
  it("resolves durable publications and actual evidence into a non-authoritative candidate", async () => {
    const { candidate, handoff } = await loadFinalPolicyTaxonomyGate({ repository_root: root });
    expect(candidate.taxonomy.policies).toHaveLength(6);
    expect(candidate.taxonomy_revision).toBe("1.2.0");
    expect(candidate.proposed_successor_revision).toBe("1.3.0");
    expect(candidate.gate_evidence.coverage_v4.resolution_status).toBe("resolved");
    expect(candidate.taxonomy.policies.every(({ lifecycle, approval }) =>
      lifecycle === "candidate" && approval.status === "proposed")).toBe(true);
    expect(handoff.authority).toEqual({ publishes_successor: false, final_pol_008_approval: false,
      pol_009_authorized: false, requires_separate_closure_commit: true });
  });

  it("rejects missing or modified evidence bytes", async () => {
    const fixture = await fixtureRoot();
    await writeFile(join(fixture, "evidence/coverage.md"), "modified", "utf8");
    await expect(loadFinalPolicyTaxonomyGate({ repository_root: fixture,
      coverage_publication_path: "publications/coverage.json",
      agents_bridge_publication_path: "publications/bridge.json",
      prerequisite_lock_path: "publications/lock.json" })).rejects.toThrow(/content differs/u);
    const missing = await fixtureRoot();
    await writeFile(join(missing, "publications/coverage.json"), JSON.stringify({
      ...(await json(join(missing, "publications/coverage.json"))), evidence_path: "evidence/missing.md" }), "utf8");
    await expect(loadFinalPolicyTaxonomyGate({ repository_root: missing,
      coverage_publication_path: "publications/coverage.json",
      agents_bridge_publication_path: "publications/bridge.json",
      prerequisite_lock_path: "publications/lock.json" })).rejects.toThrow(/evidence is absent/u);
  });

  it("rejects missing, modified, or unregistered publication artifacts", async () => {
    const missing = await fixtureRoot();
    await expect(loadFinalPolicyTaxonomyGate({ repository_root: missing,
      coverage_publication_path: "publications/missing.json",
      agents_bridge_publication_path: "publications/bridge.json",
      prerequisite_lock_path: "publications/lock.json" })).rejects.toThrow(/publication is absent/u);
    const modified = await fixtureRoot(); const path = join(modified, "publications/coverage.json");
    await writeFile(path, JSON.stringify({ ...(await json(path)), reviewed_commit: "a".repeat(40) }), "utf8");
    await expect(loadFinalPolicyTaxonomyGate({ repository_root: modified,
      coverage_publication_path: "publications/coverage.json",
      agents_bridge_publication_path: "publications/bridge.json",
      prerequisite_lock_path: "publications/lock.json" })).rejects.toThrow();
    const invented = await fixtureRoot(); const inventedPath = join(invented, "publications/coverage.json");
    await writeFile(inventedPath, JSON.stringify({ ...(await json(inventedPath)),
      publication_id: "internally-consistent.fake" }), "utf8");
    await expect(loadFinalPolicyTaxonomyGate({ repository_root: invented,
      coverage_publication_path: "publications/coverage.json",
      agents_bridge_publication_path: "publications/bridge.json",
      prerequisite_lock_path: "publications/lock.json" })).rejects.toThrow();
  });

  it("freezes semantic questions even after handoff rehashing", async () => {
    const { handoff } = await loadFinalPolicyTaxonomyGate({ repository_root: root });
    const changed: any = clone(handoff); changed.review_questions[0] = "Approve everything?";
    const { handoff_hash: _ignored, ...body } = changed;
    expect(() => FinalPolicyTaxonomyReviewHandoffSchema.parse({ ...body,
      handoff_hash: digest(body) })).toThrow();
  });
});

async function fixtureRoot() {
  const target = await mkdtemp(join(tmpdir(), "ces-pol008-gate-"));
  await mkdir(join(target, "publications"), { recursive: true }); await mkdir(join(target, "evidence"));
  const coverage: any = await json(resolve(root, "packages/policy-taxonomy/governance/coverage-v4-acceptance.json"));
  const bridge: any = await json(resolve(root, "packages/policy-taxonomy/governance/agb-014-acceptance.json"));
  coverage.evidence_path = "evidence/coverage.md"; bridge.evidence_path = "evidence/bridge.md";
  const coverageEvidence = await readFile(resolve(root, "project's goal/feedback/CES_POLICIES_REVIEW_94b50d8.md"));
  const bridgeEvidence = await readFile(resolve(root, "project's goal/feedback/CES_AGENTS_BRIDGE_FINAL_CLOSURE_REVIEW_d19166f.md"));
  coverage.evidence_content_hash = createHash("sha256").update(coverageEvidence).digest("hex");
  bridge.evidence_content_hash = createHash("sha256").update(bridgeEvidence).digest("hex");
  const coverageBytes = JSON.stringify(coverage); const bridgeBytes = JSON.stringify(bridge);
  await writeFile(join(target, "publications/coverage.json"), coverageBytes, "utf8");
  await writeFile(join(target, "publications/bridge.json"), bridgeBytes, "utf8");
  await writeFile(join(target, "publications/lock.json"), JSON.stringify({ schema_version: "1.0.0",
    coverage_publication_sha256: createHash("sha256").update(coverageBytes).digest("hex"),
    agents_bridge_publication_sha256: createHash("sha256").update(bridgeBytes).digest("hex") }), "utf8");
  await writeFile(join(target, coverage.evidence_path), coverageEvidence);
  await writeFile(join(target, bridge.evidence_path), bridgeEvidence);
  return target;
}
async function json(path: string) { return JSON.parse(await readFile(path, "utf8")); }
