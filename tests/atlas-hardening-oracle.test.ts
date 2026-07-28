import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureRoot = resolve("fixtures/safara");
const load = <T>(name: string): T =>
  JSON.parse(readFileSync(resolve(fixtureRoot, name), "utf8")) as T;

describe("ATLAS-HARD-008 Safara hardening oracle boundary", () => {
  const oracle = load<{
    semantic_inventory_oracle_id: string;
    inherited_review_record: string;
    qualification_scope: string;
    general_domain_coverage_claimed: boolean;
    production_import_allowed: boolean;
    workflow_areas: { key: string; anchor_key: string }[];
    primary_rule_keys: string[];
    category_expectations: { kind: string; anchor_keys: string[]; disposition: string }[];
    projection_checklist: Record<string, string[]>;
  }>("hardening-oracle.yaml");
  const source = load<{ spans: { key: string }[] }>("expected-source-spans.yaml");
  const rules = load<{ rules: { key: string }[] }>("expected-business-rules.yaml");
  const review = load<{ oracle_id: string; status: string; reviewer: string | null }>(
    oracle.inherited_review_record,
  );

  it("projects the accepted oracle across every hardening category", () => {
    expect(review).toMatchObject({
      oracle_id: oracle.semantic_inventory_oracle_id,
      status: "accepted",
    });
    expect(review.reviewer).toBeTruthy();
    expect(oracle.workflow_areas).toHaveLength(10);
    expect(oracle.primary_rule_keys).toHaveLength(10);
    expect(oracle.category_expectations).toHaveLength(16);
    const anchors = new Set(source.spans.map(({ key }) => key));
    expect(oracle.workflow_areas.every(({ anchor_key }) => anchors.has(anchor_key))).toBe(true);
    expect(oracle.category_expectations.flatMap(({ anchor_keys }) => anchor_keys)
      .every((key) => anchors.has(key))).toBe(true);
    const ruleKeys = new Set(rules.rules.map(({ key }) => key));
    expect(oracle.primary_rule_keys.every((key) => ruleKeys.has(key))).toBe(true);
    expect(Object.keys(oracle.projection_checklist)).toHaveLength(14);
  });

  it("limits qualification claims and forbids production imports", () => {
    expect(oracle.qualification_scope).toBe("safara_fixture_and_atlas_lifecycle_only");
    expect(oracle.general_domain_coverage_claimed).toBe(false);
    expect(oracle.production_import_allowed).toBe(false);
    const productionFiles = ["packages", "apps"].flatMap(filesUnder);
    const offenders = productionFiles.filter((file) =>
      readFileSync(file, "utf8").includes("fixtures/safara"));
    expect(offenders).toEqual([]);
  });
});

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return entry.isFile() && /\.(?:ts|tsx|js|mjs|cjs)$/u.test(path) ? [path] : [];
  });
}
