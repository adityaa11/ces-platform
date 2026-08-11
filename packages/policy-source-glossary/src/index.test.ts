import { describe, expect, it } from "vitest";
import { SourceGlossarySchema, validateSourceGlossaryTransition } from "./index.js";

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
});
