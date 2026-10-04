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

const mutationOutcomes = fixture.mutations.map((entry) => {
  const report = evaluateSemanticResult({ expected: entry.expected, observed: entry.observed, sourceText: sourceText(entry.expected.sourceSlot) });
  assert.equal(report.passed, false, `${entry.id} must fail`);
  const failedCheck = report.checks.find((check) => check.dimension === entry.expectedDimension && check.status === "FAIL");
  assert.ok(failedCheck, `${entry.id} must fail on ${entry.expectedDimension}`);
  return { id: entry.id, expectedDimension: entry.expectedDimension, observedStatus: failedCheck.status };
});

const complete = evaluateAccounting(expectedSlots, fixture.knownGood.map((entry) => entry.observed));
assert.equal(complete.passed, true, "every parsed fixture slot must be accounted for exactly once");
const accountingMutationOutcomes = fixture.accountingMutations.map((entry) => {
  const report = evaluateAccounting(expectedSlots, entry.observed);
  assert.equal(report.passed, false, `${entry.id} must fail`);
  const failedCheck = report.checks.find((check) => check.dimension === entry.expectedDimension && check.status === "FAIL");
  assert.ok(failedCheck, `${entry.id} must fail on ${entry.expectedDimension}`);
  return { id: entry.id, expectedDimension: entry.expectedDimension, observedStatus: failedCheck.status };
});

const serializedSchema = JSON.stringify(providerJsonSchema);
const schemaDescriptionRequirements = [
  { category: "source-slot-and-disposition", description: "Exact authorized source-unit slot" },
  { category: "source-slot-and-disposition", description: "Disposition of the source unit" },
  { category: "modality", description: "Explicit modality; absence means an assertion" },
  { category: "unresolved-aspect", description: "Semantic component that remains unresolved" },
  { category: "evidence-constraints", description: "Source-grounded evidence reference" },
];
for (const requirement of schemaDescriptionRequirements) {
  assert.ok(serializedSchema.includes(requirement.description), `generated provider schema must retain ${requirement.category} description`);
}

// The report deliberately contains only fixture-derived identifiers, digests,
// counts, and validation results; it never emits source text or credentials.
console.log(JSON.stringify({
  qualification: "SEMIR-004",
  parser: "parseNormalizedDocument (NormalizedDocument v1)",
  sourceSha256: fixture.document.sourceSha256,
  sourceSlotManifest: fixture.slots.map(({ caseId, sourceSlot, locatorId }) => ({ caseId, sourceSlot, locatorId })),
  knownGood: { total: knownGoodReports.length, passed: knownGoodReports.filter((report) => report.passed).length },
  evidenceAndOracleMutations: mutationOutcomes,
  accounting: { complete: complete.passed, expectedSlotCount: expectedSlots.size, mutations: accountingMutationOutcomes },
  mutations: { semanticRejected: fixture.mutations.length, accountingRejected: fixture.accountingMutations.length },
  schemaDescriptions: schemaDescriptionRequirements,
  providerCalls: 0,
}, null, 2));
console.log(`SEMIR-004 harness PASS: ${knownGoodReports.length} real normalized source units passed; ${fixture.mutations.length} semantic and ${fixture.accountingMutations.length} accounting mutations rejected; zero provider calls.`);
