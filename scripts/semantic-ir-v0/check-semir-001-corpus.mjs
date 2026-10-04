import assert from 'node:assert/strict';
import { corpus, coverage, requiredMembers } from './semir-001-corpus.mjs';

assert.ok(corpus.length >= 30, 'requires at least 30 cases');
assert.equal(new Set(corpus.map((c) => c.id)).size, corpus.length, 'case IDs must be stable and unique');
for (const c of corpus) {
  assert.match(c.id, /^SEMIR-001-\d{3}$/); assert.ok(c.source.text && c.source.authorization);
  assert.ok(c.expected.dimensions.length); assert.ok(['semantic','non_semantic','needs_review'].includes(c.expected.sourceDisposition));
  assert.ok(['context-free','context-dependent'].includes(c.expected.contextClassification));
  assert.ok(c.expected.evidenceExpectations.length, `${c.id}: requires an evidence expectation`);
  for (const evidence of c.expected.evidenceExpectations) { assert.equal(evidence.sourceSlot, c.id, `${c.id}: evidence must identify its authorized source slot`); assert.ok(c.source.text.includes(evidence.quote), `${c.id}: evidence quote must be grounded in source text`); }
  if (c.expected.sourceDisposition === 'semantic') assert.ok(c.expected.propositions.length, `${c.id}: semantic source requires proposition expectations`);
}
for (const [family, ids] of Object.entries(coverage)) { assert.ok(ids.length, `${family} must map to cases`); for (const id of ids) assert.ok(corpus.some((c) => c.id === id), `${family}: unknown ${id}`); }
for (const [member, ids] of Object.entries(requiredMembers)) { assert.ok(ids.length, `${member} must map to cases`); for (const id of ids) assert.ok(corpus.some((c) => c.id === id), `${member}: unknown ${id}`); }
for (const required of ['SEMIR-001-001','SEMIR-001-002','SEMIR-001-003','SEMIR-001-004','SEMIR-001-005','SEMIR-001-006','SEMIR-001-007','SEMIR-001-008','SEMIR-001-009','SEMIR-001-010','SEMIR-001-011','SEMIR-001-012','SEMIR-001-013','SEMIR-001-014','SEMIR-001-015']) assert.ok(corpus.some((c) => c.id === required), `mandatory contrast case ${required}`);
const approval = corpus.find((c) => c.id === 'SEMIR-001-007'); assert.deepEqual(approval.expected.dimensions.slice(0, 3), ['possibility','obligation','nested-modality']); assert.ok(approval.expected.prohibitedInterpretations.includes('unconditional obligation'));
assert.ok(corpus.filter((c) => c.expected.dimensions.includes('multi-proposition')).length >= 3);
for (const id of ['SEMIR-001-023','SEMIR-001-024','SEMIR-001-034']) assert.ok(corpus.find((c) => c.id === id).expected.propositions.length >= 2, `${id}: must preserve multiple proposition expectations`);
assert.ok(corpus.some((c) => c.expected.sourceDisposition === 'needs_review'));
const contrastCases = {
  A: ['SEMIR-001-001','SEMIR-001-002','SEMIR-001-003','SEMIR-001-004','SEMIR-001-005'],
  B: ['SEMIR-001-002','SEMIR-001-006','SEMIR-001-007'],
  C: ['SEMIR-001-008','SEMIR-001-009','SEMIR-001-010','SEMIR-001-011'],
  D: ['SEMIR-001-012','SEMIR-001-013','SEMIR-001-014'], E: ['SEMIR-001-010','SEMIR-001-015'],
};
for (const [set, ids] of Object.entries(contrastCases)) { const signatures = ids.map((id) => corpus.find((c) => c.id === id).expected.dimensions.join('|')); assert.equal(new Set(signatures).size, signatures.length, `contrast ${set}: each case requires a distinct semantic expectation`); }
console.log(`SEMIR-001 corpus PASS: ${corpus.length} human-authored cases, ${Object.keys(coverage).length} coverage families, ${Object.keys(requiredMembers).length} §13 member expectations, A–E contrasts, proposition/evidence expectations, zero provider calls.`);
