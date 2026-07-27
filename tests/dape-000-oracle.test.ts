import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve("fixtures/safara");
const load = <T>(name: string): T =>
  JSON.parse(readFileSync(resolve(root, name), "utf8")) as T;

type Entry = {
  key: string;
  anchor_key?: string;
  mandatory: boolean;
};

describe("DAPE-000 contract-neutral Safara oracle", () => {
  const oracle = load<{
    minimum_counts: {
      functional_areas: number;
      roles: number;
      primary_business_rules: number;
      inspection_scenarios: number;
      deliverables: number;
      acceptance_criteria: number;
    };
    inventories: Record<string, string>;
  }>("semantic-oracle.yaml");
  const source = load<{ spans: Entry[] }>("expected-source-spans.yaml");
  const concepts = load<{ concepts: Entry[] }>("expected-concepts.yaml");
  const rules = load<{ rules: Entry[] }>("expected-business-rules.yaml");
  const acceptance = load<{
    inspection_scenarios: Entry[];
    deliverables: Entry[];
    acceptance_criteria: Entry[];
  }>("expected-acceptance-items.yaml");

  it("contains every required inventory and minimum category count", () => {
    expect(Object.keys(oracle.inventories).sort()).toEqual([
      "acceptance_items", "business_rules", "concepts", "source_spans",
    ]);
    expect(source.spans.filter(({ key }) => key.startsWith("span.area."))).toHaveLength(
      oracle.minimum_counts.functional_areas,
    );
    expect(concepts.concepts.filter(({ category }: Entry & { category?: string }) =>
      category === "role")).toHaveLength(oracle.minimum_counts.roles);
    expect(rules.rules.length).toBeGreaterThanOrEqual(
      oracle.minimum_counts.primary_business_rules,
    );
    expect(acceptance.inspection_scenarios).toHaveLength(
      oracle.minimum_counts.inspection_scenarios,
    );
    expect(acceptance.deliverables).toHaveLength(oracle.minimum_counts.deliverables);
    expect(acceptance.acceptance_criteria).toHaveLength(
      oracle.minimum_counts.acceptance_criteria,
    );
  });

  it("has unique keys, mandatory flags, and resolvable source anchors", () => {
    const inventories = [
      source.spans,
      concepts.concepts,
      rules.rules,
      acceptance.inspection_scenarios,
      acceptance.deliverables,
      acceptance.acceptance_criteria,
    ];
    const entries = inventories.flat();
    expect(new Set(entries.map(({ key }) => key)).size).toBe(entries.length);
    expect(entries.every(({ mandatory }) => typeof mandatory === "boolean")).toBe(true);
    const anchors = new Set(source.spans.map(({ key }) => key));
    expect(entries
      .filter(({ anchor_key }) => anchor_key !== undefined)
      .every(({ anchor_key }) => anchors.has(anchor_key!))).toBe(true);
  });

  it("records the named human approval decision", () => {
    const review = load<{
      status: string;
      reviewer: string | null;
      decision: string | null;
    }>("oracle-review-record.yaml");
    const accepted = review.status === "accepted"
      && typeof review.reviewer === "string"
      && review.reviewer.length > 0
      && review.decision === "approve";
    expect(accepted).toBe(true);
  });
});
