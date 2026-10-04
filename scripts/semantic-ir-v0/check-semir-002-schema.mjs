import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { sourceSemanticResultSchema, providerJsonSchema } from './semir-002-schema.mjs';

const frozenCommit = '8e865a9';
const frozenPath = 'scripts/semantic-ir-v0/semir-001-corpus.mjs';
const frozenCorpusSource = execFileSync('git', ['show', `${frozenCommit}:${frozenPath}`], { encoding: 'utf8' });
const frozenModule = await import(`data:text/javascript;base64,${Buffer.from(frozenCorpusSource).toString('base64')}`);
const { corpus } = frozenModule;

const evidence = (sourceSlot, quote) => [{ sourceSlot, quote }];
const resultFor = (entry) => {
  const { id, source, expected } = entry;
  const proposition = (predicate) => ({
    predicate,
    arguments: [{ role: 'entity', value: 'source subject', evidence: evidence(id, source.text) }],
    qualifiers: {}, unresolvedAspects: [], evidence: evidence(id, source.text),
  });
  const result = { sourceSlot: id, sourceDisposition: expected.sourceDisposition, propositions: [] };
  if (expected.dimensions.includes('example')) result.discourseRole = 'example';
  if (expected.dimensions.includes('rationale')) result.discourseRole = 'rationale';
  if (expected.dimensions.includes('reference')) result.discourseRole = 'reference';
  if (expected.sourceDisposition === 'semantic') result.propositions = expected.propositions.map(proposition);
  return result;
};

for (const entry of corpus) assert.doesNotThrow(() => sourceSemanticResultSchema.parse(resultFor(entry)), `${entry.id} must be representable by the shared contract`);
assert.equal(corpus.length, 43, 'mapping evidence must cover the frozen SEMIR-001 corpus');

const full = sourceSemanticResultSchema.parse({
  sourceSlot: 'slot-1', sourceDisposition: 'semantic', discourseRole: 'assertion',
  propositions: [{ predicate: 'send receipt', arguments: [{ role: 'other', roleDescription: 'approver', value: 'reviewer', evidence: evidence('slot-1', 'When approved, send one receipt before closing.') }], qualifiers: {
    modality: { type: 'possibility', appliesTo: { type: 'obligation', evidence: evidence('slot-1', 'must') }, evidence: evidence('slot-1', 'may') }, polarity: 'negative',
    conditions: [{ text: 'approval exists', evidence: evidence('slot-1', 'approved') }], triggers: [{ text: 'approval completes', evidence: evidence('slot-1', 'approved') }], temporal: [{ relation: 'before', target: 'closing', evidence: evidence('slot-1', 'before closing') }], quantities: [{ comparator: 'maximum', value: 1, unit: 'receipt', evidence: evidence('slot-1', 'one receipt') }], scopes: [{ text: 'per order', evidence: evidence('slot-1', 'one receipt') }], state: { kind: 'transition', from: 'pending', to: 'sent', evidence: evidence('slot-1', 'send') },
  }, unresolvedAspects: [{ aspect: 'outcome', knownMeaning: 'a receipt is sent', missingInformation: 'whether delivery completes', clarificationQuestion: 'Does delivery need confirmation?', evidence: evidence('slot-1', 'send') }], evidence: evidence('slot-1', 'send one receipt') }],
});
assert.equal(full.propositions[0].qualifiers.modality.type, 'possibility');

for (const invalid of [
  { sourceSlot: 'x', sourceDisposition: 'unknown', propositions: [] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [] },
  { sourceSlot: 'x', sourceDisposition: 'non_semantic', propositions: [full.propositions[0]] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [{ ...full.propositions[0], arguments: [{ role: 'other', value: 'x', evidence: evidence('x', 'x') }] }] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [{ ...full.propositions[0], arguments: [{ role: 'invented-role', value: 'x', evidence: evidence('x', 'x') }] }] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [{ ...full.propositions[0], qualifiers: { ...full.propositions[0].qualifiers, modality: { type: 'possibility', appliesTo: { type: 'possibility', evidence: evidence('x', 'x') }, evidence: evidence('x', 'x') } } }] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [{ ...full.propositions[0], qualifiers: { ...full.propositions[0].qualifiers, quantities: [{ comparator: 'range', lowerBound: 5, upperBound: 2, evidence: evidence('x', 'x') }] } }] },
  { sourceSlot: 'x', sourceDisposition: 'semantic', propositions: [{ ...full.propositions[0], evidence: [{ sourceSlot: 'x' }] }] },
]) assert.equal(sourceSemanticResultSchema.safeParse(invalid).success, false, 'invalid structural proposal must fail closed');

const serialized = JSON.stringify(providerJsonSchema);
for (const phrase of ['Exact authorized source-unit slot', 'Possibility may qualify', 'Semantic component that remains unresolved', 'Source-grounded evidence reference']) assert.ok(serialized.includes(phrase), `generated schema retains description: ${phrase}`);
console.log(`SEMIR-002 schema PASS: ${corpus.length} frozen SEMIR-001 cases parse; independent dimensions, structural failures, and Zod JSON Schema descriptions verified; zero provider calls.`);
