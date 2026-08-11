import { describe, expect, it } from "vitest";
import {
  GovernedSourceGlossarySchema,
  migrateSourceGlossaryV1ToGovernedV1_1,
  SourceGlossarySchema,
  validateSourceGlossaryTransition,
} from "./index.js";

const hash = (character: string): string => `sha256:${character.repeat(64)}`;
const family = {
  family_id: "example.standard",
  canonical_name: "Example Standard",
  publisher: "Example Publisher",
  lifecycle: "active" as const,
};
const release = {
  release_id: "example.standard.2025",
  family_id: family.family_id,
  edition: "2025",
  release_label: "Example Standard:2025",
  lifecycle: "published" as const,
  publication: { published_on: "2025-02-01", authoritative_uri: "https://example.test/2025" },
  retrieval: { retrieved_at: "2026-08-11T10:00:00+00:00",
    retrieval_kind: "source_content" as const,
    retrieved_from: "https://example.test/2025", content_hash: hash("a") },
  last_checked_at: "2026-08-11T11:00:00+00:00",
};
const glossary = {
  schema_version: "1.0.0" as const,
  families: [family],
  releases: [release],
  supersessions: [],
};

describe("CES Policy source glossary contract", () => {
  it("validates generic source families and immutable release provenance", () => {
    expect(SourceGlossarySchema.parse(glossary)).toEqual(glossary);
  });

  it("cannot confuse source-content hashes with metadata-observation hashes", () => {
    const metadataRetrieval = {
      retrieval_kind: "metadata_observation",
      observed_at: "2026-08-11T10:00:00+00:00",
      observed_from: "https://example.test/2025",
      verified_metadata: "Example Standard 2025",
      observation_hash: hash("b"),
    };
    expect(SourceGlossarySchema.parse({ ...glossary,
      releases: [{ ...release, retrieval: metadataRetrieval }] }).releases[0]?.retrieval)
      .toEqual(metadataRetrieval);
    expect(() => SourceGlossarySchema.parse({ ...glossary, releases: [{ ...release,
      retrieval: { ...metadataRetrieval, content_hash: hash("c") } }] })).toThrow();
  });

  it("rejects duplicate releases and broken family membership", () => {
    expect(() => SourceGlossarySchema.parse({ ...glossary, releases: [release, release] }))
      .toThrow(/unique/u);
    expect(() => SourceGlossarySchema.parse({ ...glossary,
      releases: [{ ...release, family_id: "missing.family" }] })).toThrow(/unknown family/u);
  });

  it("keeps published releases and stable families immutable", () => {
    expect(() => validateSourceGlossaryTransition(glossary, { ...glossary,
      releases: [{ ...release, release_label: "Changed" }] })).toThrow(/immutable/u);
    expect(() => validateSourceGlossaryTransition(glossary, { ...glossary,
      families: [{ ...family, canonical_name: "Renamed" }] })).toThrow(/immutable/u);
    expect(() => validateSourceGlossaryTransition(glossary, { ...glossary, releases: [] }))
      .toThrow(/immutable/u);
  });

  it("allows one-way family retirement without changing its stable identity", () => {
    const retired = { ...glossary, families: [{ ...family, lifecycle: "retired" as const }] };
    expect(validateSourceGlossaryTransition(glossary, retired).families[0]?.lifecycle)
      .toBe("retired");
    expect(() => validateSourceGlossaryTransition(retired, glossary)).toThrow(/reactivated/u);
  });

  it("adds a newer release without changing the published predecessor", () => {
    const successor = { ...release, release_id: "example.standard.2026", edition: "2026",
      release_label: "Example Standard:2026", publication: { ...release.publication,
        published_on: "2026-02-01", authoritative_uri: "https://example.test/2026" },
      retrieval: { ...release.retrieval, retrieved_from: "https://example.test/2026",
        content_hash: hash("b") } };
    const next = { ...glossary, releases: [release, successor], supersessions: [{
      predecessor_release_id: release.release_id,
      successor_release_id: successor.release_id,
      recorded_at: "2026-08-11T12:00:00+00:00",
    }] };
    expect(validateSourceGlossaryTransition(glossary, next).releases).toHaveLength(2);
    expect(next.releases[0]).toEqual(release);
  });

  it("rejects cross-family and cyclic supersession", () => {
    const otherFamily = { ...family, family_id: "other.standard",
      canonical_name: "Other Standard" };
    const otherRelease = { ...release, release_id: "other.standard.2025",
      family_id: otherFamily.family_id };
    expect(() => SourceGlossarySchema.parse({ ...glossary,
      families: [family, otherFamily], releases: [release, otherRelease], supersessions: [{
        predecessor_release_id: release.release_id,
        successor_release_id: otherRelease.release_id,
        recorded_at: "2026-08-11T12:00:00+00:00",
      }] })).toThrow(/within one source family/u);
    expect(() => SourceGlossarySchema.parse({ ...glossary, supersessions: [{
      predecessor_release_id: release.release_id,
      successor_release_id: release.release_id,
      recorded_at: "2026-08-11T12:00:00+00:00",
    }] })).toThrow(/supersede itself/u);
  });

  it("migrates v1 without mutating it and records complete release governance", () => {
    const before = JSON.stringify(glossary);
    const governed = migrateSourceGlossaryV1ToGovernedV1_1(glossary,
      "ces-policies.source-glossary.v1-1", [{
        release_id: release.release_id,
        family_id: family.family_id,
        role: "example_role",
        source_class: "CORE",
        corpus_activation: "ACTIVE",
        processing: {
          machine_processing: "AUTHORIZED",
          structured_extraction: "AUTHORIZED",
          ai_assisted_analysis: "AUTHORIZED",
        },
        rights: {
          classification: "Example terms",
          evidence_uris: ["https://example.test/terms"],
          attribution: "required",
          third_party_content: "separate_review_or_exclude",
          geographic_condition: "Review any jurisdiction-specific restriction",
          additional_conditions: [],
        },
        decision: {
          revision_id: "pol-000-r01",
          decided_at: "2026-08-11T12:00:00+00:00",
          rationale: "Approved machine corpus source",
        },
      }]);
    expect(governed.schema_version).toBe("1.1.0");
    expect(governed.source_glossary).toEqual(glossary);
    expect(JSON.stringify(glossary)).toBe(before);
  });

  it("fails closed for missing governance and invalid class authorization", () => {
    expect(() => migrateSourceGlossaryV1ToGovernedV1_1(glossary,
      "ces-policies.source-glossary.v1-1", [])).toThrow(/no governance decision/u);
    const invalidReference = {
      schema_version: "1.1.0",
      predecessor_schema_version: "1.0.0",
      baseline_id: "ces-policies.source-glossary.v1-1",
      source_glossary: glossary,
      governance: [{
        release_id: release.release_id, family_id: family.family_id,
        role: "alignment_target", source_class: "REFERENCE_ONLY",
        corpus_activation: "BLOCKED",
        processing: { machine_processing: "AUTHORIZED",
          structured_extraction: "REFERENCE_ONLY", ai_assisted_analysis: "REFERENCE_ONLY" },
        rights: { classification: "Reference terms",
          evidence_uris: ["https://example.test/terms"], attribution: "required",
          third_party_content: "separate_review_or_exclude",
          geographic_condition: "Review applicable rights", additional_conditions: [] },
        decision: { revision_id: "pol-000-r01",
          decided_at: "2026-08-11T12:00:00+00:00", rationale: "Reference only" },
      }],
    };
    expect(() => GovernedSourceGlossarySchema.parse(invalidReference))
      .toThrow(/cannot be active or authorized/u);
  });
});
