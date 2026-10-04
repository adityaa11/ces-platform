import { execFileSync } from 'node:child_process';

const frozenCommit = '8e865a9';
const frozenPath = 'scripts/semantic-ir-v0/semir-001-corpus.mjs';
const frozenSource = execFileSync('git', ['show', `${frozenCommit}:${frozenPath}`], { encoding: 'utf8' });
const frozenModule = await import(`data:text/javascript;base64,${Buffer.from(frozenSource).toString('base64')}`);
const { corpus } = frozenModule;

const clone = (value) => structuredClone(value);
const evidence = (entry) => [{ sourceSlot: entry.id, quote: entry.source.text }];
const has = (entry, dimension) => entry.expected.dimensions.includes(dimension);
const unresolvedAspect = (line) => {
  const [label, detail = 'unspecified'] = line.split(': ');
  const aspect = label === 'referent' ? 'reference' : label === 'attachment' ? 'other' : label;
  return { aspect, knownMeaning: `source retains ${line}`, missingInformation: detail, clarificationQuestion: `What is the ${aspect}?` };
};

// These fixtures are independently materialized qualification proposals. The
// oracle below receives only expected/observed proposals; it has no case-ID or
// source-text answer table and cannot make a proposal pass by repairing it.
export function goodResultFor(entry) {
  const qualifiers = { polarity: has(entry, 'negative') ? 'negative' : 'positive', conditions: [], triggers: [], temporal: [], quantities: [], scopes: [] };
  let modality;
  if (has(entry, 'possibility')) modality = { type: 'possibility', evidence: evidence(entry) };
  if (has(entry, 'obligation')) modality = modality?.type === 'possibility' ? { ...modality, appliesTo: { type: 'obligation', evidence: evidence(entry) } } : { type: 'obligation', evidence: evidence(entry) };
  if (has(entry, 'permission')) modality = { type: 'permission', evidence: evidence(entry) };
  if (has(entry, 'prohibition')) modality = { type: 'prohibition', evidence: evidence(entry) };
  if (has(entry, 'recommendation')) modality = { type: 'recommendation', evidence: evidence(entry) };
  if (modality) qualifiers.modality = modality;
  if (has(entry, 'condition')) qualifiers.conditions.push({ text: 'source condition', evidence: evidence(entry) });
  if (has(entry, 'trigger')) qualifiers.triggers.push({ text: 'source trigger', evidence: evidence(entry) });
  if (has(entry, 'temporal-before')) qualifiers.temporal.push({ relation: 'before', target: 'processing', evidence: evidence(entry) });
  if (has(entry, 'temporal-after')) qualifiers.temporal.push({ relation: 'after', target: 'approval', evidence: evidence(entry) });
  if (has(entry, 'threshold') || has(entry, 'maximum')) qualifiers.quantities.push({ comparator: 'maximum', value: 2, unit: 'items', evidence: evidence(entry) });
  if (has(entry, 'minimum')) qualifiers.quantities.push({ comparator: 'minimum', value: 1, unit: 'item', evidence: evidence(entry) });
  if (has(entry, 'range')) qualifiers.quantities.push({ comparator: 'range', lowerBound: 5, upperBound: 20, unit: 'percent', evidence: evidence(entry) });
  if (entry.expected.dimensions.some((value) => value.includes('scope'))) qualifiers.scopes.push({ text: 'source scope', evidence: evidence(entry) });
  if (has(entry, 'state')) qualifiers.state = { kind: 'assertion', to: 'source state', evidence: evidence(entry) };
  if (has(entry, 'state-transition')) qualifiers.state = { kind: 'transition', from: 'prior state', to: 'source outcome', evidence: evidence(entry) };
  const propositions = entry.expected.propositions.map((predicate) => ({
    predicate,
    arguments: has(entry, 'actor') ? [{ role: 'actor', value: 'source actor', evidence: evidence(entry) }] : [],
    qualifiers: clone(qualifiers),
    unresolvedAspects: entry.expected.unresolved.filter((line) => !line.startsWith('known:') && !line.startsWith('question:')).map(unresolvedAspect).map((value) => ({ ...value, evidence: evidence(entry) })),
    evidence: evidence(entry),
  }));
  const result = { sourceSlot: entry.id, sourceDisposition: entry.expected.sourceDisposition, propositions };
  if (has(entry, 'example')) result.discourseRole = 'example';
  else if (has(entry, 'rationale')) result.discourseRole = 'rationale';
  else if (has(entry, 'reference')) result.discourseRole = 'reference';
  else if (entry.expected.sourceDisposition === 'semantic') result.discourseRole = 'assertion';
  return result;
}

export const knownGood = corpus.map((entry) => ({ entry, expected: goodResultFor(entry), observed: goodResultFor(entry) }));
const byId = (id) => knownGood.find((fixture) => fixture.entry.id === id);
const mutation = (id, caseId, expectedDimension, change) => {
  const fixture = byId(caseId);
  const observed = clone(fixture.observed);
  change(observed);
  return { id, entry: fixture.entry, expected: fixture.expected, observed, expectedDimension };
};

export const mutations = [
  mutation('MUT-MODALITY-PERMISSION-OBLIGATION', 'SEMIR-001-002', 'propositions.0.modality', (r) => { r.propositions[0].qualifiers.modality.type = 'obligation'; }),
  mutation('MUT-MODALITY-POSSIBILITY-ASSERTION', 'SEMIR-001-006', 'propositions.0.modality', (r) => { delete r.propositions[0].qualifiers.modality; }),
  mutation('MUT-MODALITY-NESTED-PERMISSION', 'SEMIR-001-007', 'propositions.0.modality', (r) => { r.propositions[0].qualifiers.modality = { type: 'permission', evidence: r.propositions[0].evidence }; }),
  mutation('MUT-MODALITY-RECOMMENDATION-OBLIGATION', 'SEMIR-001-005', 'propositions.0.modality', (r) => { r.propositions[0].qualifiers.modality.type = 'obligation'; }),
  mutation('MUT-POLARITY-NEGATIVE-POSITIVE', 'SEMIR-001-004', 'propositions.0.polarity', (r) => { r.propositions[0].qualifiers.polarity = 'positive'; }),
  mutation('MUT-APPLICABILITY-INVENTED-CONDITION', 'SEMIR-001-011', 'propositions.0.conditions', (r) => { r.propositions[0].qualifiers.conditions.push({ text: 'invented condition', evidence: r.propositions[0].evidence }); }),
  mutation('MUT-APPLICABILITY-REMOVED-CONDITION', 'SEMIR-001-009', 'propositions.0.conditions', (r) => { r.propositions[0].qualifiers.conditions = []; }),
  mutation('MUT-APPLICABILITY-CONDITION-TRIGGER', 'SEMIR-001-010', 'propositions.0.conditions', (r) => { r.propositions[0].qualifiers.triggers = r.propositions[0].qualifiers.conditions; r.propositions[0].qualifiers.conditions = []; }),
  mutation('MUT-UNRESOLVED-SUPPLIED-ACTOR', 'SEMIR-001-022', 'propositions.0.unresolved', (r) => { r.propositions[0].unresolvedAspects = []; r.propositions[0].arguments.push({ role: 'actor', value: 'invented actor', evidence: r.propositions[0].evidence }); }),
  mutation('MUT-UNRESOLVED-SUPPLIED-THRESHOLD', 'SEMIR-001-032', 'propositions.0.unresolved', (r) => { r.propositions[0].unresolvedAspects = []; r.propositions[0].qualifiers.quantities.push({ comparator: 'greater_than', value: 100, evidence: r.propositions[0].evidence }); }),
  mutation('MUT-UNRESOLVED-WRONG-ASPECT', 'SEMIR-001-031', 'propositions.0.unresolved', (r) => { r.propositions[0].unresolvedAspects[0].aspect = 'condition'; }),
  mutation('MUT-UNRESOLVED-QUESTION-KNOWN', 'SEMIR-001-007', 'propositions.0.unresolved', (r) => { r.propositions[0].unresolvedAspects[0].clarificationQuestion = 'Is approval required?'; }),
  mutation('MUT-UNRESOLVED-LOSES-UNCERTAINTY', 'SEMIR-001-007', 'propositions.0.unresolved', (r) => { r.propositions[0].unresolvedAspects[0].knownMeaning = 'approval is required'; }),
  mutation('MUT-DISCOURSE-EXAMPLE-ASSERTION', 'SEMIR-001-035', 'discourseRole', (r) => { r.discourseRole = 'assertion'; }),
  mutation('MUT-DISCOURSE-RATIONALE-OBLIGATION', 'SEMIR-001-036', 'discourseRole', (r) => { r.discourseRole = 'assertion'; }),
  mutation('MUT-DISCOURSE-REFERENCE-FABRICATED', 'SEMIR-001-037', 'discourseRole', (r) => { r.discourseRole = 'assertion'; r.propositions.push({ predicate: 'fabricated behavior', arguments: [], qualifiers: { polarity: 'positive', conditions: [], triggers: [], temporal: [], quantities: [], scopes: [] }, unresolvedAspects: [], evidence: r.propositions[0]?.evidence ?? [{ sourceSlot: r.sourceSlot, quote: 'See' }] }); }),
  mutation('MUT-EVIDENCE-QUOTE-NOT-PRESENT', 'SEMIR-001-001', 'propositions.0.evidence', (r) => { r.propositions[0].evidence[0].quote = 'not in fixture source'; }),
  mutation('MUT-EVIDENCE-WRONG-SLOT', 'SEMIR-001-001', 'propositions.0.evidence', (r) => { r.propositions[0].evidence[0].sourceSlot = 'wrong-slot'; }),
  mutation('MUT-EVIDENCE-FOREIGN-CASE', 'SEMIR-001-001', 'propositions.0.evidence', (r) => { r.propositions[0].evidence[0] = { sourceSlot: 'SEMIR-001-002', quote: 'Users may export reports.' }; }),
];

export const accountingMutations = [
  { id: 'MUT-ACCOUNTING-MISSING', expectedDimension: 'accounting.missing', observed: knownGood.map((fixture) => fixture.observed).slice(1) },
  { id: 'MUT-ACCOUNTING-DUPLICATE', expectedDimension: 'accounting.duplicate', observed: [...knownGood.map((fixture) => fixture.observed), clone(knownGood[0].observed)] },
  { id: 'MUT-ACCOUNTING-UNKNOWN', expectedDimension: 'accounting.unknown', observed: [...knownGood.map((fixture) => fixture.observed), { ...clone(knownGood[0].observed), sourceSlot: 'unknown-slot' }] },
];
