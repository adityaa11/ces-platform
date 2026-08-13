import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CES_POLICY_APPROVED_CONTRACT_V1, publishFinalPolicyContract } from "./final-publication.js";
import { CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1 } from "./representative-registry.js";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("POL-009 final authority publication", () => {
  it("publishes the exact reviewed candidate registry with accepted external authority", () => {
    const publication = CES_POLICY_APPROVED_CONTRACT_V1;
    expect(publication.artifact).toEqual(CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1);
    expect(publication.artifact.lifecycle).toBe("candidate");
    expect(publication.authority).toMatchObject({ terminal_outcome: "ACCEPTED",
      final_pol_009_approval: true, pol_010_authorized: true,
      reviewed_candidate_commit: "93e6c8c5fcebb41cc0f7765635bc150905f732b4" });
    const reviewBytes = readFileSync(resolve(import.meta.dirname, "../../..",
      publication.authority.reviewer_evidence_path));
    expect(createHash("sha256").update(reviewBytes).digest("hex"))
      .toBe(publication.authority.reviewer_evidence_sha256);
  });

  it("rejects changed registry semantics, invented authority, and stale publication hashes", () => {
    const semantic: any = clone(CES_POLICY_APPROVED_CONTRACT_V1);
    semantic.artifact.concerns[0].definition = "Changed after review";
    expect(() => publishFinalPolicyContract(semantic)).toThrow();
    const authority: any = clone(CES_POLICY_APPROVED_CONTRACT_V1);
    authority.authority.pol_010_authorized = false;
    expect(() => publishFinalPolicyContract(authority)).toThrow();
    const staleHash: any = clone(CES_POLICY_APPROVED_CONTRACT_V1);
    staleHash.publication_hash = "a".repeat(64);
    expect(() => publishFinalPolicyContract(staleHash)).toThrow(/publication hash/u);
  });
});
