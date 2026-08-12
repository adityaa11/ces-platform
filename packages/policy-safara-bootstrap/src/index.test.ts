import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadManualSafaraDemandFacts } from
  "@company/ces-policy-manual-demand-adapter";
import { evaluateSafaraBootstrapCoverage } from "./index.js";

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

  it("routes sensitive-data and workflow knowledge to canonicalization", () => {
    const entries = new Map(evaluateSafaraBootstrapCoverage(demandFacts()).entries
      .map((entry) => [entry.demand_fact_id, entry]));
    expect(entries.get("safara.manual.fact.0016")).toMatchObject({
      disposition: "SOURCE_OR_POLICY_GAP", gap_route: "CANONICALIZATION_GAP",
      raw_support_ids: ["raw.asvs.v2-3-1"],
    });
    for (const id of ["safara.manual.fact.0024", "safara.manual.fact.0027",
      "safara.manual.fact.0036", "safara.manual.fact.0045"]) {
      expect(entries.get(id)).toMatchObject({ disposition: "SOURCE_OR_POLICY_GAP",
        gap_route: "CANONICALIZATION_GAP",
        raw_support_ids: ["raw.asvs.v14-2-1"] });
    }
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
});
