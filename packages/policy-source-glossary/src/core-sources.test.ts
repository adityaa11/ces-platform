import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SourceGlossarySchema } from "./index.js";
import {
  CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
  CES_POLICY_CORE_SOURCE_SEEDS_V1,
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
});
