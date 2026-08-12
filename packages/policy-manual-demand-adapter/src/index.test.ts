import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertProductionContextBindingEligible,
  loadManualSafaraDemandFacts,
  ManualSafaraInventorySchema,
  type ManualSafaraFixtureInput,
} from "./index.js";

const root = resolve(import.meta.dirname, "../../..");
const fixtureRoot = resolve(root, "fixtures/policies/safara-v1.1-cycle-01");

function acceptedInput(): ManualSafaraFixtureInput {
  const inventoryBytes = readFileSync(resolve(fixtureRoot, "manual-facts.json"));
  return {
    sourceManifest: JSON.parse(readFileSync(resolve(fixtureRoot,
      "source-manifest.json"), "utf8")),
    inventory: JSON.parse(inventoryBytes.toString("utf8")),
    inventoryBytes,
    reviewRecord: JSON.parse(readFileSync(resolve(fixtureRoot,
      "human-review-record.json"), "utf8")),
    sourcePdfBytes: readFileSync(resolve(root, "docs/prd/Safara_Buyer_Business_PRD.pdf")),
  };
}

describe("POL-016-V01-I02 manual demand adapter", () => {
  it("maps all accepted facts deterministically with manual provenance", () => {
    const first = loadManualSafaraDemandFacts(acceptedInput());
    const second = loadManualSafaraDemandFacts(acceptedInput());
    expect(first).toHaveLength(111);
    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      demand_fact_id: "safara.manual.fact.0001",
      provenance: { kind: "manual_golden_fixture", page: 1 },
      production_context_binding_eligible: false,
    });
    expect(new Set(first.map(({ demand_fact_id }) => demand_fact_id)).size).toBe(111);
  });

  it("rejects duplicate IDs, categories, pages, source text, methods, and authority", () => {
    const valid = acceptedInput().inventory as Record<string, unknown> & { facts: unknown[] };
    const fact = valid.facts[0] as Record<string, unknown>;
    for (const mutation of [
      { facts: [fact, fact, ...valid.facts.slice(2)] },
      { facts: [{ ...fact, category: "unknown" }, ...valid.facts.slice(1)] },
      { facts: [{ ...fact, page: 0 }, ...valid.facts.slice(1)] },
      { facts: [{ ...fact, exact_text: "" }, ...valid.facts.slice(1)] },
      { facts: [{ ...fact, extraction_method: "atlas" }, ...valid.facts.slice(1)] },
      { atlas_authority: true },
    ]) expect(() => ManualSafaraInventorySchema.parse({ ...valid, ...mutation })).toThrow();
  });

  it("rejects mismatched inventory and PDF bytes", () => {
    const accepted = acceptedInput();
    const inventoryMismatch = { ...accepted,
      inventoryBytes: Buffer.concat([accepted.inventoryBytes, Buffer.from("\n")]) };
    expect(() => loadManualSafaraDemandFacts(inventoryMismatch)).toThrow(/inventory hash/u);
    const sourceMismatch = { ...acceptedInput(),
      sourcePdfBytes: Buffer.from("not the pinned PDF") };
    expect(() => loadManualSafaraDemandFacts(sourceMismatch)).toThrow(/source PDF hash/u);
  });

  it("rejects proposed review and fabricated Atlas identities", () => {
    const accepted = acceptedInput();
    const proposed = { ...accepted, reviewRecord: {
      ...(accepted.reviewRecord as object), status: "proposed" } };
    expect(() => loadManualSafaraDemandFacts(proposed)).toThrow();
    const atlas = { ...acceptedInput(), sourceManifest: {
      ...(acceptedInput().sourceManifest as object), atlas_authority: true,
      atlas_revision: 1 } };
    expect(() => loadManualSafaraDemandFacts(atlas)).toThrow();
  });

  it("always blocks production Context Binding eligibility", () => {
    const fact = loadManualSafaraDemandFacts(acceptedInput())[0]!;
    expect(() => assertProductionContextBindingEligible(fact)).toThrow(
      /cannot produce production Context Bindings/u);
  });
});
