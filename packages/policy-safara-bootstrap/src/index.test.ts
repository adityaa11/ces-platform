import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadManualSafaraDemandFacts } from
  "@company/ces-policy-manual-demand-adapter";
import { evaluateSafaraBootstrapCoverage } from "./index.js";
import { evaluateSafaraBootstrapCoverageV2 } from "./index.js";
import { evaluateSafaraBootstrapCoverageV3 } from "./index.js";
import { evaluateSafaraBootstrapCoverageV4 } from "./index.js";
import { publishAcceptedSafaraBootstrapCoverageV4 } from "./index.js";

const root = resolve(import.meta.dirname, "../../..");
const fixture = resolve(root, "fixtures/policies/safara-v1.1-cycle-01");

function demandFacts() {
  const inventoryBytes = readFileSync(resolve(fixture, "manual-facts.json"));
  return loadManualSafaraDemandFacts({
    sourceManifest: JSON.parse(readFileSync(resolve(fixture, "source-manifest.json"), "utf8")),
    inventory: JSON.parse(inventoryBytes.toString("utf8")),
    inventoryBytes,
    reviewRecord: JSON.parse(readFileSync(resolve(fixture,
      "human-review-record.json"), "utf8")),
    sourcePdfBytes: readFileSync(resolve(root, "docs/prd/Safara_Buyer_Business_PRD.pdf")),
  });
}

describe("POL-008-V01 Safara bootstrap coverage", () => {
  it("accounts for every accepted demand fact exactly once and deterministically", () => {
    const first = evaluateSafaraBootstrapCoverage(demandFacts());
    const second = evaluateSafaraBootstrapCoverage(demandFacts());
    expect(first).toEqual(second);
    expect(first.entries).toHaveLength(111);
    expect(new Set(first.entries.map(({ demand_fact_id }) => demand_fact_id)).size).toBe(111);
    expect(first.result_hash).toHaveLength(64);
    expect(first.entries.every(({ manual_provenance }) =>
      manual_provenance.kind === "manual_golden_fixture" &&
      manual_provenance.page >= 1 && manual_provenance.page <= 7 &&
      manual_provenance.exact_text.length > 0)).toBe(true);
  });

  it("keeps all Policy support explicitly candidate-only", () => {
    const result = evaluateSafaraBootstrapCoverage(demandFacts());
    expect(result.candidate_is_authoritative).toBe(false);
    const awareness = result.entries.filter(({ disposition }) =>
      disposition === "AWARENESS_EMITTED");
    expect(awareness.length).toBeGreaterThan(0);
    expect(awareness.every(({ policy_support }) => policy_support.length === 1 &&
      policy_support[0]?.support_status === "candidate_only" &&
      policy_support[0].source_lineage.length > 0)).toBe(true);
    expect(awareness.flatMap(({ policy_support }) => policy_support)
      .flatMap(({ source_lineage }) => source_lineage)
      .every(({ raw_concept_id, source_release_id, source_locator }) =>
        raw_concept_id.length > 0 && source_release_id.length > 0 &&
        source_locator.length > 0)).toBe(true);
  });

  it("routes workflow canonicalization and individual sensitive-data extraction gaps", () => {
    const entries = new Map(evaluateSafaraBootstrapCoverage(demandFacts()).entries
      .map((entry) => [entry.demand_fact_id, entry]));
    expect(entries.get("safara.manual.fact.0016")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "CANONICALIZATION_GAP",
      raw_support_ids: ["raw.asvs.v2-3-1"],
    });
    expect(entries.get("safara.manual.fact.0027")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "EXTRACTION_GAP",
      raw_support_ids: [], source_support_candidates: [
        { source_release_id: "owasp.asvs.5-0-0", source_locator: "v5.0.0-V14.2.6" }],
    });
    for (const id of ["safara.manual.fact.0024", "safara.manual.fact.0035",
      "safara.manual.fact.0045"]) expect(entries.get(id)).toMatchObject({
        disposition: "SOURCE_OR_POLICY_GAP", gap_route: "EXTRACTION_GAP",
        source_support_candidates: [{ source_locator: "v5.0.0-V14.1.1" }],
      });
    expect(JSON.stringify([...entries.values()])).not.toContain("raw.asvs.v14-2-1");
    for (const id of ["safara.manual.fact.0002", "safara.manual.fact.0036",
      "safara.manual.fact.0044", "safara.manual.fact.0061",
      "safara.manual.fact.0062", "safara.manual.fact.0063",
      "safara.manual.fact.0064", "safara.manual.fact.0065",
      "safara.manual.fact.0098"]) expect(entries.get(id)?.disposition)
        .toBe("NO_SECURITY_AWARENESS_REQUIRED");
  });

  it("uses only the five governed dispositions and explicit non-emitting rationale", () => {
    const result = evaluateSafaraBootstrapCoverage(demandFacts());
    expect(new Set(result.entries.map(({ disposition }) => disposition))).toEqual(new Set([
      "AWARENESS_EMITTED", "NO_SECURITY_AWARENESS_REQUIRED",
      "OUTSIDE_SOFTWARE_SCOPE", "SOURCE_OR_POLICY_GAP",
    ]));
    expect(result.entries.every(({ rationale }) => rationale.length > 0)).toBe(true);
    expect(result.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP")
      .every(({ gap_route }) => gap_route !== null)).toBe(true);
  });

  it("rejects incomplete demand input", () => {
    expect(() => evaluateSafaraBootstrapCoverage(demandFacts().slice(1))).toThrow(/111/u);
  });

  it("fails closed when an accepted slot has no explicit classification", () => {
    const facts = [...demandFacts()];
    facts[0] = { ...facts[0]!, demand_fact_id: "safara.manual.fact.0112" };
    expect(() => evaluateSafaraBootstrapCoverage(facts)).toThrow(/classification partition/u);
  });
});

describe("POL-008-V01 Safara bootstrap coverage v2", () => {
  it("pins accepted raw v1.2 and canonical v1.3 without rewriting v1", () => {
    const v1 = evaluateSafaraBootstrapCoverage(demandFacts());
    const v2 = evaluateSafaraBootstrapCoverageV2(demandFacts());
    expect(v1.result_hash)
      .toBe("0fa60c21a449dd43f1c24dcf5a3fcd5a5037982333d627378aeb721dd953945e");
    expect(v2).toMatchObject({ result_id: "ces-policies.safara-bootstrap.coverage-v2",
      predecessor_result_id: v1.result_id,
      raw_corpus_id: "ces-policies.raw-vocabulary.representative-v1-2",
      raw_publication_status: "accepted", canonical_vocabulary_revision: "1.3.0",
      candidate_taxonomy_revision: "1.0.0", candidate_is_authoritative: false });
  });

  it("advances every former gap to its new earliest incomplete layer", () => {
    const entries = new Map(evaluateSafaraBootstrapCoverageV2(demandFacts()).entries
      .map((entry) => [entry.demand_fact_id, entry]));
    expect(entries.get("safara.manual.fact.0016")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "POLICY_GAP",
      raw_support_ids: ["raw.asvs.v2-3-1"], policy_support: [] });
    expect(entries.get("safara.manual.fact.0027")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "CANONICALIZATION_GAP",
      raw_support_ids: ["raw.asvs.v14-2-6"], source_support_candidates: [] });
    for (const id of ["safara.manual.fact.0024", "safara.manual.fact.0035",
      "safara.manual.fact.0045"]) expect(entries.get(id)).toMatchObject({
        disposition: "SOURCE_OR_POLICY_GAP", gap_route: "CANONICALIZATION_GAP",
        raw_support_ids: ["raw.asvs.v14-1-1"], source_support_candidates: [] });
  });

  it("keeps all 111 classifications deterministic and candidate Policy support non-authoritative", () => {
    const first = evaluateSafaraBootstrapCoverageV2(demandFacts());
    const second = evaluateSafaraBootstrapCoverageV2(demandFacts());
    expect(first.result_hash)
      .toBe("7a28f7624e7e4c6a4aa3fde8dd13d7fd9298f0ea46d9f60ef7970614a4a9fbee");
    expect(first).toEqual(second);
    expect(first.entries).toHaveLength(111);
    expect(new Set(first.entries.map(({ demand_fact_id }) => demand_fact_id)).size).toBe(111);
    expect(first.entries.filter(({ disposition }) => disposition === "AWARENESS_EMITTED")
      .every(({ policy_support }) => policy_support.every(({ support_status }) =>
        support_status === "candidate_only"))).toBe(true);
    expect(first.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP"))
      .toHaveLength(5);
  });

  it("fails closed for incomplete or unknown demand input", () => {
    expect(() => evaluateSafaraBootstrapCoverageV2(demandFacts().slice(1))).toThrow(/111/u);
    const facts = [...demandFacts()];
    facts[0] = { ...facts[0]!, demand_fact_id: "safara.manual.fact.0112" };
    expect(() => evaluateSafaraBootstrapCoverageV2(facts)).toThrow(/partition/u);
  });
});

describe("POL-008-V01 Safara bootstrap coverage v3", () => {
  it("pins approved canonical v1.5 and accepted candidate decision taxonomy v1.1", () => {
    const v2 = evaluateSafaraBootstrapCoverageV2(demandFacts());
    const v3 = evaluateSafaraBootstrapCoverageV3(demandFacts());
    expect(v3).toMatchObject({ result_id: "ces-policies.safara-bootstrap.coverage-v3",
      predecessor_result_id: v2.result_id, canonical_vocabulary_revision: "1.5.0",
      candidate_taxonomy_revision: "1.1.0",
      taxonomy_decision_publication_status: "accepted",
      candidate_is_authoritative: false });
  });

  it("advances sequential flow to candidate awareness with complete lineage", () => {
    const entry = evaluateSafaraBootstrapCoverageV3(demandFacts()).entries
      .find(({ demand_fact_id }) => demand_fact_id === "safara.manual.fact.0016")!;
    expect(entry).toMatchObject({ disposition: "AWARENESS_EMITTED", gap_route: null,
      policy_support: [{ policy_id: "policy.sequential-business-flow",
        support_status: "candidate_only", canonical_concept_ids: ["ces.sequential-business-flow"],
        source_lineage: [{ raw_concept_id: "raw.asvs.v2-3-1",
          source_release_id: "owasp.asvs.5-0-0", source_locator: "v5.0.0-V2.3.1" }] }] });
  });

  it("advances all four data-protection facts to Policy gaps", () => {
    const entries = new Map(evaluateSafaraBootstrapCoverageV3(demandFacts()).entries
      .map((entry) => [entry.demand_fact_id, entry]));
    for (const id of ["safara.manual.fact.0024", "safara.manual.fact.0035",
      "safara.manual.fact.0045"]) expect(entries.get(id)).toMatchObject({
        disposition: "SOURCE_OR_POLICY_GAP", gap_route: "POLICY_GAP",
        raw_support_ids: ["raw.asvs.v14-1-1"], policy_support: [] });
    expect(entries.get("safara.manual.fact.0027")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "POLICY_GAP",
      raw_support_ids: ["raw.asvs.v14-2-6"], policy_support: [] });
  });

  it("remains deterministic, complete, and non-authoritative", () => {
    const first = evaluateSafaraBootstrapCoverageV3(demandFacts());
    expect(first.result_hash)
      .toBe("b78d1be0fa6dcb9cfcfb2b50f0056e1c5e99f07aff011a0d0a71b889d349f98e");
    expect(first).toEqual(evaluateSafaraBootstrapCoverageV3(demandFacts()));
    expect(first.entries).toHaveLength(111);
    expect(new Set(first.entries.map(({ demand_fact_id }) => demand_fact_id)).size).toBe(111);
    expect(first.entries.filter(({ disposition }) => disposition === "AWARENESS_EMITTED"))
      .toHaveLength(78);
    expect(first.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP"))
      .toHaveLength(4);
  });
});

describe("POL-008-V01 Safara bootstrap coverage v4", () => {
  it("pins accepted data-protection decision taxonomy v1.2 without final authority", () => {
    const v3 = evaluateSafaraBootstrapCoverageV3(demandFacts());
    const v4 = evaluateSafaraBootstrapCoverageV4(demandFacts());
    expect(v4).toMatchObject({ result_id: "ces-policies.safara-bootstrap.coverage-v4",
      predecessor_result_id: v3.result_id, canonical_vocabulary_revision: "1.5.0",
      candidate_taxonomy_revision: "1.2.0",
      taxonomy_decision_publication_status: "accepted",
      candidate_is_authoritative: false });
  });

  it("closes all four Policy gaps with fact-specific candidate lineage", () => {
    const entries = new Map(evaluateSafaraBootstrapCoverageV4(demandFacts()).entries
      .map((entry) => [entry.demand_fact_id, entry]));
    const expected = new Map([
      ["safara.manual.fact.0024", ["ces.sensitive-data-classification",
        "raw.asvs.v14-1-1", "v5.0.0-V14.1.1"]],
      ["safara.manual.fact.0027", ["ces.sensitive-data-disclosure-minimization",
        "raw.asvs.v14-2-6", "v5.0.0-V14.2.6"]],
      ["safara.manual.fact.0035", ["ces.sensitive-data-classification",
        "raw.asvs.v14-1-1", "v5.0.0-V14.1.1"]],
      ["safara.manual.fact.0045", ["ces.sensitive-data-classification",
        "raw.asvs.v14-1-1", "v5.0.0-V14.1.1"]],
    ]);
    for (const [id, [canonicalConceptId, rawConceptId, sourceLocator]] of expected) {
      const entry = entries.get(id)!;
      expect(entry).toMatchObject({ disposition: "AWARENESS_EMITTED", gap_route: null,
        policy_support: [{ policy_id: "policy.sensitive-data-protection",
          support_status: "candidate_only", canonical_concept_ids: [canonicalConceptId] }] });
      expect(entry.policy_support[0]?.source_lineage.map(({ raw_concept_id,
        source_locator }) => ({ raw_concept_id, source_locator }))).toEqual([
          { raw_concept_id: rawConceptId, source_locator: sourceLocator },
        ]);
    }
  });

  it("accounts for all facts with zero unexplained knowledge gaps", () => {
    const first = evaluateSafaraBootstrapCoverageV4(demandFacts());
    expect(first.result_hash)
      .toBe("3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3");
    expect(first).toEqual(evaluateSafaraBootstrapCoverageV4(demandFacts()));
    expect(first.entries).toHaveLength(111);
    expect(new Set(first.entries.map(({ demand_fact_id }) => demand_fact_id)).size).toBe(111);
    expect(first.entries.filter(({ disposition }) => disposition === "AWARENESS_EMITTED"))
      .toHaveLength(82);
    expect(first.entries.filter(({ disposition }) => disposition === "SOURCE_OR_POLICY_GAP"))
      .toHaveLength(0);
    expect(first.entries.filter(({ disposition }) =>
      disposition === "NO_SECURITY_AWARENESS_REQUIRED")).toHaveLength(24);
    expect(first.entries.filter(({ disposition }) => disposition === "OUTSIDE_SOFTWARE_SCOPE"))
      .toHaveLength(5);
  });

  it("fails closed for incomplete or unknown demand input", () => {
    expect(() => evaluateSafaraBootstrapCoverageV4(demandFacts().slice(1))).toThrow(/111/u);
    const facts = [...demandFacts()];
    facts[0] = { ...facts[0]!, demand_fact_id: "safara.manual.fact.0112" };
    expect(() => evaluateSafaraBootstrapCoverageV4(facts)).toThrow(/partition/u);
  });
});

describe("accepted POL-008-V01 coverage publication", () => {
  it("pins the reviewed result and preserves the final POL-008 authority boundary", () => {
    const publication = publishAcceptedSafaraBootstrapCoverageV4(
      evaluateSafaraBootstrapCoverageV4(demandFacts()));
    expect(publication).toMatchObject({
      publication_id: "ces-policies.safara-bootstrap.coverage-v4.accepted-v1",
      publication_status: "accepted",
      artifact: {
        result_id: "ces-policies.safara-bootstrap.coverage-v4",
        result_hash: "3e0e7253279437cd5c76780d11acccacd81290d80b74c7e135bc3cdb7591b3a3",
        lifecycle: "proposed",
        candidate_is_authoritative: false,
      },
      approval: {
        terminal_outcome: "ACCEPTED",
        reviewed_closure_commit: "94b50d84fb2fa693d1dc78d58353ea0585755626",
        review_class: "REVIEW_GATE",
        evidence_type: "project_owner_confirmation",
        final_pol_008_approval: false,
      },
    });
  });

  it("rejects an altered hash field", () => {
    const artifact = evaluateSafaraBootstrapCoverageV4(demandFacts());
    expect(() => publishAcceptedSafaraBootstrapCoverageV4({ ...artifact,
      result_hash: "0".repeat(64) })).toThrow(/preserve the reviewed result/u);
  });

  it("rejects altered artifact contents retaining the accepted hash", () => {
    const artifact = evaluateSafaraBootstrapCoverageV4(demandFacts());
    const entries = artifact.entries.map((entry, index) => index === 0
      ? { ...entry, rationale: `${entry.rationale} Altered.` }
      : entry);
    expect(() => publishAcceptedSafaraBootstrapCoverageV4({ ...artifact, entries }))
      .toThrow(/preserve the reviewed result/u);
  });
});
