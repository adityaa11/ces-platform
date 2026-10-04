import assert from 'node:assert/strict';
import { evaluateAccounting, evaluateSemanticResult } from './semir-003-oracle.mjs';
import { accountingMutations, knownGood, mutations } from './semir-003-fixtures.mjs';

const reports = knownGood.map((fixture) => evaluateSemanticResult({ expected: fixture.expected, observed: fixture.observed, sourceText: fixture.entry.source.text }));
assert.ok(reports.every((report) => report.passed), 'every frozen known-good fixture must pass all applicable dimensions');

const surface = structuredClone(knownGood[1]);
surface.observed.propositions[0].predicate = `  ${surface.observed.propositions[0].predicate.toUpperCase()}  `;
assert.equal(evaluateSemanticResult({ expected: surface.expected, observed: surface.observed, sourceText: surface.entry.source.text }).passed, true, 'surface-only predicate variation must preserve semantic dimensions');

for (const fixture of mutations) {
  const report = evaluateSemanticResult({ expected: fixture.expected, observed: fixture.observed, sourceText: fixture.entry.source.text });
  assert.equal(report.passed, false, `${fixture.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === fixture.expectedDimension && check.status === 'FAIL'), `${fixture.id} must fail on ${fixture.expectedDimension}`);
}

const expectedSlots = new Set(knownGood.map((fixture) => fixture.entry.id));
const complete = evaluateAccounting(expectedSlots, knownGood.map((fixture) => fixture.observed));
assert.equal(complete.passed, true, 'known-good results must account for each source exactly once');
for (const fixture of accountingMutations) {
  const report = evaluateAccounting(expectedSlots, fixture.observed);
  assert.equal(report.passed, false, `${fixture.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === fixture.expectedDimension && check.status === 'FAIL'), `${fixture.id} must fail on ${fixture.expectedDimension}`);
}

console.log(`SEMIR-003 oracle PASS: ${reports.length} frozen known-good fixtures passed; ${mutations.length} semantic mutations and ${accountingMutations.length} accounting mutations failed on named dimensions; zero provider calls.`);
