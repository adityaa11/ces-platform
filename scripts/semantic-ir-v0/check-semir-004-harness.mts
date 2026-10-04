import assert from "node:assert/strict";
import { providerJsonSchema } from "./semir-002-schema.mjs";
import { evaluateAccounting, evaluateSemanticResult } from "./semir-003-oracle.mjs";
import { createQualificationFixtures } from "./semir-004-harness.mts";

const fixture = createQualificationFixtures();
const expectedSlots = new Set(fixture.slots.map((slot) => slot.sourceSlot));
const sourceText = (sourceSlot: string) => {
  const text = fixture.textBySlot.get(sourceSlot);
  assert.ok(text, `${sourceSlot} must be an authorized parsed fixture slot`);
  return text;
};

const knownGoodReports = fixture.knownGood.map((entry) => evaluateSemanticResult({
  expected: entry.expected,
  observed: entry.observed,
  sourceText: sourceText(entry.expected.sourceSlot),
}));
assert.ok(knownGoodReports.every((report) => report.passed), "every mapped known-good fixture must pass against its parsed source unit");

for (const entry of fixture.mutations) {
  const report = evaluateSemanticResult({ expected: entry.expected, observed: entry.observed, sourceText: sourceText(entry.expected.sourceSlot) });
  assert.equal(report.passed, false, `${entry.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === entry.expectedDimension && check.status === "FAIL"), `${entry.id} must fail on ${entry.expectedDimension}`);
}

const complete = evaluateAccounting(expectedSlots, fixture.knownGood.map((entry) => entry.observed));
assert.equal(complete.passed, true, "every parsed fixture slot must be accounted for exactly once");
for (const entry of fixture.accountingMutations) {
  const report = evaluateAccounting(expectedSlots, entry.observed);
  assert.equal(report.passed, false, `${entry.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === entry.expectedDimension && check.status === "FAIL"), `${entry.id} must fail on ${entry.expectedDimension}`);
}

const properties = providerJsonSchema.properties as Record<string, { description?: string }>;
assert.ok(properties.sourceSlot?.description?.includes("Exact authorized source-unit slot"), "generated provider schema must retain source-slot description");
assert.ok(properties.sourceDisposition?.description?.includes("Disposition of the source unit"), "generated provider schema must retain disposition description");

// The report deliberately contains only fixture-derived identifiers, digests,
// counts, and validation results; it never emits source text or credentials.
console.log(JSON.stringify({
  qualification: "SEMIR-004",
  parser: "parseNormalizedDocument (NormalizedDocument v1)",
  sourceSha256: fixture.document.sourceSha256,
  sourceSlotManifest: fixture.slots.map(({ caseId, sourceSlot, locatorId }) => ({ caseId, sourceSlot, locatorId })),
  knownGood: { total: knownGoodReports.length, passed: knownGoodReports.filter((report) => report.passed).length },
  mutations: { semanticRejected: fixture.mutations.length, accountingRejected: fixture.accountingMutations.length },
  schemaDescriptions: ["sourceSlot", "sourceDisposition"],
  providerCalls: 0,
}, null, 2));
console.log(`SEMIR-004 harness PASS: ${knownGoodReports.length} real normalized source units passed; ${fixture.mutations.length} semantic and ${fixture.accountingMutations.length} accounting mutations rejected; zero provider calls.`);
