import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { contentHash, createFinalPolicyTaxonomyApprovalCandidate,
  createFinalPolicyTaxonomyReviewHandoff } from "./final-approval.js";

const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const AcceptedFinalGatePrerequisiteSchema = z.object({
  schema_version: z.literal("1.0.0"), publication_id: z.enum([
    "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
    "ces-agents-bridge.agb-014.accepted-v1"]), publication_status: z.literal("accepted"),
  terminal_outcome: z.literal("ACCEPTED"), evidence_id: z.enum([
    "CES-GF-POL-008-V01-H01", "CES-GF-AGB-014-H01"]), evidence_path: z.string().min(1),
  evidence_content_hash: Hash, reviewed_commit: z.string().regex(/^[0-9a-f]{40}$/u),
  artifact_hash: Hash, final_pol_008_approval: z.literal(false),
}).strict().superRefine((value, context) => {
  const coverage = value.publication_id.startsWith("ces-policies.safara-bootstrap");
  if (coverage !== (value.evidence_id === "CES-GF-POL-008-V01-H01")) context.addIssue({
    code: "custom", message: "Publication and evidence identities do not match" });
  const expectedCommit = coverage ? "94b50d84fb2fa693d1dc78d58353ea0585755626" :
    "d19166fcf718bb9d16c15e975f4367c60db344b3";
  const expectedArtifact = coverage ? "3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3" :
    "6aaa37d5708972dd0e59bc17b1f7f53dba52fdd7b37169ac5859c248b244c9c8";
  if (value.reviewed_commit !== expectedCommit || value.artifact_hash !== expectedArtifact) context.addIssue({
    code: "custom", message: "Publication differs from the governed accepted artifact" });
});

export async function loadFinalPolicyTaxonomyGate(input: { repository_root: string;
  coverage_publication_path?: string; agents_bridge_publication_path?: string;
  prerequisite_lock_path?: string }) {
  const lock = z.object({ schema_version: z.literal("1.0.0"),
    coverage_publication_sha256: Hash, agents_bridge_publication_sha256: Hash }).strict().parse(
    JSON.parse(await readFile(resolve(input.repository_root, input.prerequisite_lock_path ??
      "packages/policy-taxonomy/governance/prerequisite-publications.lock.json"), "utf8")));
  const coverage = await loadPublication(input.repository_root, input.coverage_publication_path ??
    "packages/policy-taxonomy/governance/coverage-v4-acceptance.json");
  const bridge = await loadPublication(input.repository_root, input.agents_bridge_publication_path ??
    "packages/policy-taxonomy/governance/agb-014-acceptance.json");
  if (coverage.publication_hash !== lock.coverage_publication_sha256 ||
      bridge.publication_hash !== lock.agents_bridge_publication_sha256)
    throw new Error("Acceptance publication content differs from governed lock");
  if (coverage.publication.publication_id !== "ces-policies.safara-bootstrap.coverage-v4.accepted-v1" ||
      bridge.publication.publication_id !== "ces-agents-bridge.agb-014.accepted-v1")
    throw new Error("Required final-gate acceptance publication is absent");
  const candidate = createFinalPolicyTaxonomyApprovalCandidate({
    coverage_v4: { ...resolved(coverage),
      publication_id: "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
      evidence_id: "CES-GF-POL-008-V01-H01" },
    agents_bridge_replay: { ...resolved(bridge),
      publication_id: "ces-agents-bridge.agb-014.accepted-v1",
      evidence_id: "CES-GF-AGB-014-H01" } });
  return { candidate, handoff: createFinalPolicyTaxonomyReviewHandoff(candidate) };
}

async function loadPublication(repositoryRoot: string, relativePath: string) {
  let publicationBytes: Buffer;
  try { publicationBytes = await readFile(resolve(repositoryRoot, relativePath)); }
  catch { throw new Error(`Acceptance publication is absent: ${relativePath}`); }
  const publication = AcceptedFinalGatePrerequisiteSchema.parse(JSON.parse(publicationBytes.toString("utf8")));
  let evidenceBytes: Buffer;
  try { evidenceBytes = await readFile(resolve(repositoryRoot, publication.evidence_path)); }
  catch { throw new Error(`Accepted evidence is absent: ${publication.evidence_path}`); }
  if (contentHash(evidenceBytes) !== publication.evidence_content_hash)
    throw new Error(`Accepted evidence content differs: ${publication.evidence_path}`);
  return { publication, publication_hash: contentHash(publicationBytes) };
}
function resolved(value: Awaited<ReturnType<typeof loadPublication>>) { return {
  publication_id: value.publication.publication_id, evidence_id: value.publication.evidence_id,
  evidence_path: value.publication.evidence_path, terminal_outcome: value.publication.terminal_outcome,
  reviewed_commit: value.publication.reviewed_commit, artifact_hash: value.publication.artifact_hash,
  publication_content_hash: value.publication_hash,
  evidence_content_hash: value.publication.evidence_content_hash, resolution_status: "resolved" as const };
}
