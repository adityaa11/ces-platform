import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const local = import.meta.dirname;
const root = path.resolve(local, '../..');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readBytes = (relative) => readFile(path.join(local, relative));
const readJson = async (relative) => JSON.parse(await readFile(path.join(local, relative), 'utf8'));

// This runs before the dynamic planner import.  A corrupt oracle therefore
// cannot execute planner logic.
function canonicalize(value) {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

async function verifyManifest() {
  const manifest = await readJson('gold/manifest.json');
  for (const [relative, digests] of Object.entries(manifest.members)) {
    const raw = await readBytes(relative);
    assert.equal(sha256(raw), digests.raw_sha256, `raw frozen member changed: ${relative}`);
    if (digests.canonical_sha256) {
      assert.equal(sha256(Buffer.from(canonicalize(JSON.parse(raw.toString('utf8'))), 'utf8')), digests.canonical_sha256, `canonical frozen member changed: ${relative}`);
    }
  }
  const self = structuredClone(manifest);
  delete self.manifest_sha256;
  assert.equal(sha256(Buffer.from(canonicalize(self), 'utf8')), manifest.manifest_sha256, 'manifest self hash changed');
  return manifest;
}

const manifest = await verifyManifest();
const { IntegrityError, canonicalize: plannerCanonicalize, instrumentation, oracleOutput, planFixture, validateOutcome } = await import('./planner.mjs');
const profile = await readJson('gold/profile.json');
const expected = await readJson('gold/expected-output.json');
const negativeCases = await readJson('gold/negative-cases.json');
const assertionMatrix = await readJson('gold/oracle-assertion-matrix.json');
const fixtures = Object.fromEntries(await Promise.all([
  ['F1', 'fixtures/f1-complete.json'], ['F2', 'fixtures/f2-unproven-context.json'], ['F3', 'fixtures/f3-bounded-mixed.json'],
].map(async ([id, file]) => [id, await readJson(file)])));
const report = { status: 'READY_FOR_CK', manifest_sha256: manifest.manifest_sha256, assertions: {}, negative_cases: {}, replays: {}, forbidden_effects: instrumentation };
const actual = {};
for (const id of ['F1', 'F2', 'F3']) {
  const result = planFixture(fixtures[id], profile);
  validateOutcome(fixtures[id], profile, oracleOutput(result));
  actual[id] = oracleOutput(result);
  assert.equal(plannerCanonicalize(actual[id]), plannerCanonicalize(expected.fixtures[id]), `full canonical oracle output differs for ${id}`);
}

const pass = (id, detail) => { report.assertions[id] = { status: 'PROVEN', detail }; };
pass('A-01', 'All source content hashes, immutable identifiers, scopes, and locators validated before planning.');
pass('A-02', 'Every plan payload has the frozen byte count and SHA-256.');
pass('A-03', 'F3-D independently completes with its frozen zero-context proposition.');
pass('A-04', 'F3-C has the frozen 4551-byte C+D closure and overflow deferral.');
pass('A-05', 'F3-H and F3-I preserve qualified multihop essential closure.');
pass('A-06', 'Optional/comparison edges are excluded and the E/F SCC is deferred.');
pass('A-07', 'F2-V remains meaningful, uninterpreted, non-fact=false, and uncovered.');
pass('A-08', 'Ownership, terminal ledger rows, and complete/partial coverage are exact.');
pass('A-09', 'Every frozen negative case is executed below with its binary oracle.');
pass('A-10', 'All raw/canonical manifest-member hashes and manifest self hash match before planner import.');
assert.equal(Object.keys(report.assertions).length, assertionMatrix.assertions.length, 'assertion matrix coverage');

const expectIntegrity = (fn, reason) => assert.throws(fn, (error) => error instanceof IntegrityError && error.reason === reason);
const cloned = (value) => structuredClone(value);
{
  const value = cloned(fixtures.F1); value.sources[0].locator = 'malformed';
  expectIntegrity(() => planFixture(value, profile), 'FORGED_LOCATOR');
  report.negative_cases['N-01'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'FORGED_LOCATOR' };
}
{
  const value = cloned(fixtures.F2); value.dependencies[0].authority = 'authorized';
  expectIntegrity(() => planFixture(value, profile), 'HASH_SUBSTITUTION');
  report.negative_cases['N-02'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'HASH_SUBSTITUTION' };
}
{
  const value = cloned(fixtures.F3); value.sources.reverse();
  const deterministic = { contract_version: expected.contract_version, fixtures: { F1: actual.F1, F2: actual.F2, F3: oracleOutput(planFixture(value, profile)) } };
  assert.equal(sha256(Buffer.from(plannerCanonicalize(deterministic), 'utf8')), negativeCases.cases[2].expected.canonical_output_sha256);
  report.negative_cases['N-03'] = { status: 'PROVEN', result: 'DETERMINISTIC_EQUAL', canonical_output_sha256: negativeCases.cases[2].expected.canonical_output_sha256 };
}
{
  const value = cloned(actual.F3); value.plans.push({ ...value.plans[0], context: [value.plans[0].owner] });
  expectIntegrity(() => validateOutcome(fixtures.F3, profile, value), 'CONTEXT_OWNER_OVERLAP');
  report.negative_cases['N-04'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'CONTEXT_OWNER_OVERLAP' };
}
{
  const value = cloned(fixtures.F3); value.sources.find((source) => source.id === 'F3-C').text = 'short';
  expectIntegrity(() => planFixture(value, profile), 'SOURCE_CONTENT_HASH_MISMATCH');
  report.negative_cases['N-05'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'SOURCE_CONTENT_HASH_MISMATCH' };
}
{
  const value = cloned(actual.F3); value.ledger['F3-E'] = { state: 'completed', assertion_id: 'forged' };
  expectIntegrity(() => validateOutcome(fixtures.F3, profile, value), 'ESSENTIAL_DEPENDENCY_CYCLE');
  report.negative_cases['N-06'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'ESSENTIAL_DEPENDENCY_CYCLE' };
}
{
  const value = cloned(actual.F2); value.ledger['F2-V'] = { state: 'completed', non_fact: true };
  expectIntegrity(() => validateOutcome(fixtures.F2, profile, value), 'COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION');
  report.negative_cases['N-07'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION' };
}
{
  const value = cloned(actual.F2); delete value.ledger['F2-V'];
  expectIntegrity(() => validateOutcome(fixtures.F2, profile, value), 'INVENTORY_GAP');
  report.negative_cases['N-08'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'INVENTORY_GAP' };
}
{
  const value = cloned(actual.F3); value.plans.find((plan) => plan.owner === 'F3-H').context = ['F3-I'];
  expectIntegrity(() => validateOutcome(fixtures.F3, profile, value), 'ESSENTIAL_CLOSURE_INCOMPLETE');
  report.negative_cases['N-09'] = { status: 'PROVEN', result: 'INTEGRITY_REJECTED', reason: 'ESSENTIAL_CLOSURE_INCOMPLETE' };
}
assert.equal(Object.keys(report.negative_cases).length, negativeCases.cases.length, 'negative matrix coverage');

for (const id of ['F1', 'F2', 'F3']) {
  const baseline = plannerCanonicalize(actual[id]);
  for (let replay = 0; replay < 10; replay += 1) assert.equal(plannerCanonicalize(oracleOutput(planFixture(fixtures[id], profile))), baseline, `${id} replay ${replay}`);
  const shuffled = cloned(fixtures[id]); shuffled.sources.reverse();
  assert.equal(plannerCanonicalize(oracleOutput(planFixture(shuffled, profile))), baseline, `${id} input order`);
  report.replays[id] = { runs: 10, input_order_perturbation: 'PROVEN', canonical_output_sha256: sha256(Buffer.from(baseline, 'utf8')) };
}

for (const value of Object.values(instrumentation)) assert.equal(value, 0, 'forbidden effect counter');
const implementationFiles = (await readdir(local)).filter((file) => file.endsWith('.mjs'));
for (const file of implementationFiles) {
  const content = await readFile(path.join(local, file), 'utf8');
  const imports = [...content.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
  assert.ok(imports.every((specifier) => specifier.startsWith('node:') || specifier === './planner.mjs'), `prohibited import in ${file}`);
}

console.log(JSON.stringify(report, null, 2));
