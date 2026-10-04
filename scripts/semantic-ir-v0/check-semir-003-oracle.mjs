import assert from 'node:assert/strict';
import { evaluateAccounting, evaluateSemanticResult } from './semir-003-oracle.mjs';
import { accountingMutations, knownGood, mutations } from './semir-003-fixtures.mjs';

// Emit evaluator diagnostics produced only from the frozen, non-confidential
// qualification corpus; no external source or secret-bearing input is read.
const outputValue = (value) => value === undefined ? null : value;
const diagnostic = ({ kind, id, report }) => JSON.stringify({
  kind,
  id,
  caseId: report.caseId ?? null,
  passed: report.passed,
  checks: report.checks.map((check) => ({
    dimension: check.dimension,
    status: check.status,
    expected: outputValue(check.expected),
    observed: outputValue(check.observed),
  })),
});

function assertDiagnostic(line, { id, failingDimension }) {
  const parsed = JSON.parse(line);
  assert.equal(parsed.id, id, `${id} diagnostic must retain its case or mutation ID`);
  assert.ok(parsed.checks.length > 0, `${id} diagnostic must include dimension checks`);
  for (const check of parsed.checks) {
    assert.equal(typeof check.dimension, 'string', `${id} diagnostic must name every dimension`);
    assert.ok(['PASS', 'FAIL'].includes(check.status), `${id} diagnostic must expose each dimension status`);
    assert.ok(Object.hasOwn(check, 'expected'), `${id} diagnostic must expose expected values`);
    assert.ok(Object.hasOwn(check, 'observed'), `${id} diagnostic must expose observed values`);
  }
  if (failingDimension) assert.ok(parsed.checks.some((check) => check.dimension === failingDimension && check.status === 'FAIL'), `${id} diagnostic must expose ${failingDimension} as failing`);
}

const diagnostics = [];
const emitDiagnostic = (entry) => {
  const line = diagnostic(entry);
  assertDiagnostic(line, { id: entry.id, failingDimension: entry.failingDimension });
  diagnostics.push(line);
  console.log(`SEMIR-003 diagnostic: ${line}`);
};

const reports = knownGood.map((fixture) => evaluateSemanticResult({ expected: fixture.expected, observed: fixture.observed, sourceText: fixture.entry.source.text }));
assert.ok(reports.every((report) => report.passed), 'every frozen known-good fixture must pass all applicable dimensions');
for (const report of reports) emitDiagnostic({ kind: 'known-good', id: report.caseId, report });

const surface = structuredClone(knownGood[1]);
surface.observed.propositions[0].predicate = `  ${surface.observed.propositions[0].predicate.toUpperCase()}  `;
assert.equal(evaluateSemanticResult({ expected: surface.expected, observed: surface.observed, sourceText: surface.entry.source.text }).passed, true, 'surface-only predicate variation must preserve semantic dimensions');

for (const fixture of mutations) {
  const report = evaluateSemanticResult({ expected: fixture.expected, observed: fixture.observed, sourceText: fixture.entry.source.text });
  assert.equal(report.passed, false, `${fixture.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === fixture.expectedDimension && check.status === 'FAIL'), `${fixture.id} must fail on ${fixture.expectedDimension}`);
  emitDiagnostic({ kind: 'semantic-mutation', id: fixture.id, report, failingDimension: fixture.expectedDimension });
}

const expectedSlots = new Set(knownGood.map((fixture) => fixture.entry.id));
const complete = evaluateAccounting(expectedSlots, knownGood.map((fixture) => fixture.observed));
assert.equal(complete.passed, true, 'known-good results must account for each source exactly once');
for (const fixture of accountingMutations) {
  const report = evaluateAccounting(expectedSlots, fixture.observed);
  assert.equal(report.passed, false, `${fixture.id} must fail`);
  assert.ok(report.checks.some((check) => check.dimension === fixture.expectedDimension && check.status === 'FAIL'), `${fixture.id} must fail on ${fixture.expectedDimension}`);
  emitDiagnostic({ kind: 'accounting-mutation', id: fixture.id, report, failingDimension: fixture.expectedDimension });
}

assert.equal(diagnostics.length, reports.length + mutations.length + accountingMutations.length, 'every qualification case must emit a diagnostic');
console.log(`SEMIR-003 oracle PASS: ${reports.length} frozen known-good fixtures passed; ${mutations.length} semantic mutations and ${accountingMutations.length} accounting mutations failed on named dimensions; zero provider calls.`);
