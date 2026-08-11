import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SourceGlossarySchema } from "./index.js";
import {
  CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
  CES_POLICY_CORE_SOURCE_SEEDS_V1,
  CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1,
  CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1,
  validateCoreSourceSeedsV1,
} from "./core-sources.js";

describe("CES Policies v1 core source seeds", () => {
  it("seeds exactly the four frozen families and one governed release each", () => {
    expect(validateCoreSourceSeedsV1()).toHaveLength(4);
    expect(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.families.map(({ family_id }) => family_id))
      .toEqual(["iso.iec-27001", "iso.iec-27002", "owasp.asvs", "owasp.wstg"]);
    expect(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases).toHaveLength(4);
  });

  it("is deterministic and idempotent", () => {
    const first = SourceGlossarySchema.parse(CES_POLICY_CORE_SOURCE_GLOSSARY_V1);
    const second = SourceGlossarySchema.parse(CES_POLICY_CORE_SOURCE_GLOSSARY_V1);
    expect(second).toEqual(first);
  });

  it("hashes the exact normalized metadata observation", () => {
    for (const seed of CES_POLICY_CORE_SOURCE_SEEDS_V1) {
      expect(seed.release.retrieval.retrieval_kind).toBe("metadata_observation");
      const digest = createHash("sha256")
        .update(seed.release.retrieval.verified_metadata, "utf8").digest("hex");
      expect(seed.release.retrieval.observation_hash).toBe(`sha256:${digest}`);
    }
  });

  it("rejects conflicting release identity reuse", () => {
    const duplicate = { ...CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      releases: [CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases[0],
        { ...CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases[1],
          release_id: CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases[0]!.release_id }] };
    expect(() => SourceGlossarySchema.parse(duplicate)).toThrow(/unique/u);
  });

  it("blocks ISO content extraction while allowing licensed OWASP processing", () => {
    const iso = CES_POLICY_CORE_SOURCE_SEEDS_V1.filter(({ family }) =>
      family.family_id.startsWith("iso."));
    const owasp = CES_POLICY_CORE_SOURCE_SEEDS_V1.filter(({ family }) =>
      family.family_id.startsWith("owasp."));
    expect(iso.every(({ source_content_access }) =>
      source_content_access.machine_use === "prohibited_without_written_permission")).toBe(true);
    expect(owasp.every(({ source_content_access }) =>
      source_content_access.machine_use === "permitted_with_license_compliance")).toBe(true);
  });

  it("preserves the historical four-source baseline in the governed successor", () => {
    expect(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.families).toHaveLength(4);
    expect(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases).toHaveLength(4);
    expect(CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1.families.slice(0, 4))
      .toEqual(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.families);
    expect(CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1.releases.slice(0, 4))
      .toEqual(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases);
    expect(CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1.predecessor_baseline_id)
      .toBe("ces-policies.source-glossary.v1");
  });

  it("publishes the exact six classified v1.1 source records", () => {
    const governed = CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1;
    expect(governed.source_glossary.releases).toHaveLength(6);
    for (const releaseValue of governed.source_glossary.releases) {
      expect(releaseValue.retrieval.retrieval_kind).toBe("metadata_observation");
      if (releaseValue.retrieval.retrieval_kind !== "metadata_observation") continue;
      const digest = createHash("sha256")
        .update(releaseValue.retrieval.verified_metadata, "utf8").digest("hex");
      expect(releaseValue.retrieval.observation_hash).toBe(`sha256:${digest}`);
    }
    expect(governed.governance.map(({ family_id, source_class }) =>
      [family_id, source_class])).toEqual([
      ["iso.iec-27001", "REFERENCE_ONLY"],
      ["iso.iec-27002", "REFERENCE_ONLY"],
      ["owasp.asvs", "CORE"],
      ["owasp.wstg", "CORE"],
      ["nist.csf", "CORE"],
      ["nist.sp-800-53", "EVALUATION_SOURCE"],
    ]);
  });

  it("keeps ISO blocked and NIST bounded by accepted rights conditions", () => {
    const governance = CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1.governance;
    const iso = governance.filter(({ family_id }) => family_id.startsWith("iso."));
    const nist = governance.filter(({ family_id }) => family_id.startsWith("nist."));
    expect(iso.every(({ corpus_activation, processing }) =>
      corpus_activation === "BLOCKED" &&
      Object.values(processing).every((state) => state === "REFERENCE_ONLY"))).toBe(true);
    expect(nist.every(({ rights }) =>
      rights.attribution === "required" &&
      rights.third_party_content === "separate_review_or_exclude" &&
      rights.geographic_condition.includes("foreign-rights") &&
      rights.additional_conditions.some((condition) => condition.includes("endorsement"))))
      .toBe(true);
  });
});
