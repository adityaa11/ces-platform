import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CES_POLICY_APPROVED_TAXONOMY_V1_3, publishFinalPolicyTaxonomy } from "./final-publication.js";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("POL-008 final authority publication", () => {
  it("publishes exact candidate semantics as approved taxonomy 1.3.0", () => {
    const publication = CES_POLICY_APPROVED_TAXONOMY_V1_3;
    expect(publication.artifact).toMatchObject({ taxonomy_revision: "1.3.0",
      predecessor_revision: "1.2.0", lifecycle: "approved" });
    expect(publication.artifact.policies).toHaveLength(6);
    expect(publication.artifact.policies.every(({ lifecycle, approval }) => lifecycle === "approved" &&
      approval.status === "approved" && approval.reviewer_evidence_id === "CES-GF-POL-008-H01")).toBe(true);
    expect(publication.authority).toMatchObject({ terminal_outcome: "ACCEPTED",
      final_pol_008_approval: true, pol_009_authorized: true });
    const reviewBytes = readFileSync(resolve(import.meta.dirname, "../../..",
      publication.authority.reviewer_evidence_path));
    expect(createHash("sha256").update(reviewBytes).digest("hex"))
      .toBe(publication.authority.reviewer_evidence_sha256);
  });
  it("rejects altered semantics, invented provenance, or lost authority binding", () => {
    const semantic: any = clone(CES_POLICY_APPROVED_TAXONOMY_V1_3);
    semantic.artifact.policies[0].obligation = "Changed after review";
    expect(() => publishFinalPolicyTaxonomy(semantic)).toThrow();
    const provenance: any = clone(CES_POLICY_APPROVED_TAXONOMY_V1_3);
    provenance.artifact.policies[0].approval.reviewer_evidence_id = "invented";
    expect(() => publishFinalPolicyTaxonomy(provenance)).toThrow();
    const authority: any = clone(CES_POLICY_APPROVED_TAXONOMY_V1_3);
    authority.authority.final_pol_008_approval = false;
    expect(() => publishFinalPolicyTaxonomy(authority)).toThrow();
  });
});
