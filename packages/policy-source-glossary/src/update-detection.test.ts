import { describe, expect, it } from "vitest";
import {
  CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
  CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1,
} from "./core-sources.js";
import {
  CORE_SOURCE_UPDATE_ADAPTER_DESCRIPTORS,
  createCoreSourceUpdateAdapters,
  createGovernedSourceUpdateAdapters,
  detectGovernedSourceUpdate,
  detectSourceUpdate,
  GOVERNED_SOURCE_UPDATE_ADAPTER_DESCRIPTORS,
  reviewSourceUpdateCandidate,
} from "./update-detection.js";

const current = CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases.find(({ family_id }) =>
  family_id === "owasp.asvs")!;
const base = {
  family_id: current.family_id,
  current_release_id: current.release_id,
  checked_at: "2026-08-11T13:00:00+00:00",
  evidence_uris: ["https://github.com/OWASP/ASVS/releases"],
};
const update = {
  ...base,
  status: "update_detected" as const,
  observed_release: {
    release_id: "owasp.asvs.5-0-1",
    edition: "5.0.1",
    release_label: "OWASP ASVS 5.0.1",
    published_on: "2026-08-01",
    authoritative_uri: "https://github.com/OWASP/ASVS/releases/tag/v5.0.1",
  },
};

describe("source update detection", () => {
  it("registers exactly one common-contract adapter per frozen family", async () => {
    const adapters = createCoreSourceUpdateAdapters(async (descriptor, release) => ({
      family_id: descriptor.family_id, current_release_id: release.release_id,
      checked_at: base.checked_at, evidence_uris: [descriptor.check_uri], status: "unchanged",
    }));
    expect(adapters.map(({ descriptor }) => descriptor.family_id))
      .toEqual(CORE_SOURCE_UPDATE_ADAPTER_DESCRIPTORS.map(({ family_id }) => family_id));
    expect((await adapters.find(({ descriptor }) =>
      descriptor.family_id === current.family_id)!.check(current)).status).toBe("unchanged");
  });

  it("does not create candidates for unchanged, ambiguous, or failed checks", () => {
    expect(detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      { ...base, status: "unchanged" }).outcome).toBe("unchanged");
    expect(detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      { ...base, status: "ambiguous", reason: "Release label was not parseable" }).outcome)
      .toBe("ambiguous");
    expect(detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      { ...base, status: "failed", error: { code: "source_unavailable",
        message: "Source unavailable", retryable: true } }).outcome).toBe("failed");
  });

  it("creates one deterministic candidate without mutating the glossary", () => {
    const before = JSON.stringify(CES_POLICY_CORE_SOURCE_GLOSSARY_V1);
    const first = detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1, update);
    expect(first.outcome).toBe("candidate");
    if (first.outcome !== "candidate") throw new Error("Expected update candidate");
    const second = detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1, update,
      [first.candidate]);
    expect(second.outcome).toBe("candidate");
    if (second.outcome !== "candidate") throw new Error("Expected update candidate");
    expect(second.candidate).toEqual(first.candidate);
    expect(JSON.stringify(CES_POLICY_CORE_SOURCE_GLOSSARY_V1)).toBe(before);
  });

  it("records human disposition without activating a release", () => {
    const result = detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1, update);
    if (result.outcome !== "candidate") throw new Error("Expected update candidate");
    const reviewed = reviewSourceUpdateCandidate(result.candidate, {
      decision: "accepted", decided_by: "reviewer.1",
      decided_at: "2026-08-11T14:00:00+00:00", rationale: "Begin impact analysis",
    });
    expect(reviewed.status).toBe("accepted");
    expect(reviewed.impact_analysis.status).toBe("not_assessed");
    expect(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases.some(({ release_id }) =>
      release_id === update.observed_release.release_id)).toBe(false);
    expect(() => reviewSourceUpdateCandidate(reviewed, reviewed.review!)).toThrow(/already/u);
  });

  it("fails closed for malformed or mismatched adapter output", async () => {
    const [adapter] = createCoreSourceUpdateAdapters(async () => ({ ...base,
      family_id: "wrong.family", status: "unchanged" }));
    await expect(adapter!.check(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases[0]))
      .rejects.toThrow();
    expect(() => detectSourceUpdate(CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
      { ...base, current_release_id: "missing.release", status: "unchanged" }))
      .toThrow(/invalid current release/u);
  });

  it("registers all six governed families without changing v1 adapters", () => {
    const adapters = createGovernedSourceUpdateAdapters(async (descriptor, release) => ({
      family_id: descriptor.family_id, current_release_id: release.release_id,
      checked_at: base.checked_at, evidence_uris: [descriptor.check_uri], status: "unchanged",
    }));
    expect(CORE_SOURCE_UPDATE_ADAPTER_DESCRIPTORS).toHaveLength(4);
    expect(adapters.map(({ descriptor }) => descriptor.family_id))
      .toEqual(GOVERNED_SOURCE_UPDATE_ADAPTER_DESCRIPTORS.map(({ family_id }) => family_id));
  });

  it("carries reference-only governance without granting update authority", () => {
    const glossary = CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1;
    const iso = glossary.source_glossary.releases.find(({ family_id }) =>
      family_id === "iso.iec-27001")!;
    const before = JSON.stringify(glossary);
    const result = detectGovernedSourceUpdate(glossary, {
      family_id: iso.family_id,
      current_release_id: iso.release_id,
      checked_at: base.checked_at,
      evidence_uris: ["https://www.iso.org/standard/27001"],
      status: "update_detected",
      observed_release: {
        release_id: "iso.iec-27001.future-candidate",
        edition: "Future candidate",
        release_label: "Unverified future ISO/IEC 27001 candidate",
        published_on: "2026-08-01",
        authoritative_uri: "https://www.iso.org/standard/27001",
      },
    });
    expect(result.outcome).toBe("governed_candidate");
    if (result.outcome !== "governed_candidate") throw new Error("Expected governed candidate");
    expect(result.candidate.governance_snapshot).toMatchObject({
      source_class: "REFERENCE_ONLY", corpus_activation: "BLOCKED",
    });
    expect(result.candidate.authority_effect).toBe("NONE");
    expect(JSON.stringify(glossary)).toBe(before);
  });
});
