import assert from 'node:assert/strict';
import { normalizeProviderWireResult, providerJsonSchema, providerWireResultSchema, sourceSemanticResultSchema } from './semir-002-schema.mjs';
import { inspectGroqStrictSchema } from './provider-schema-compatibility.mjs';

const evidence = [{ sourceSlot: 'wire-slot', quote: 'source text' }];
const base = () => ({
  sourceSlot: 'wire-slot', sourceDisposition: 'semantic', discourseRole: null,
  propositions: [{
    predicate: 'send receipt', arguments: [{ role: 'entity', value: 'system', evidence }],
    qualifiers: { modality: null, polarity: 'positive', conditions: [], triggers: [], temporal: [], quantities: [], scopes: [], state: null },
    unresolvedAspects: [], evidence,
  }],
});

const parsedBase = providerWireResultSchema.parse(base());
assert.deepEqual(normalizeProviderWireResult(parsedBase), sourceSemanticResultSchema.parse({ sourceSlot: 'wire-slot', sourceDisposition: 'semantic', propositions: [{ ...base().propositions[0], qualifiers: { polarity: 'positive', conditions: [], triggers: [], temporal: [], quantities: [], scopes: [] } }] }), 'required wire nulls normalize only to Atlas semantic absence');

const modalityAbsent = normalizeProviderWireResult(base());
assert.equal(modalityAbsent.propositions[0].qualifiers.modality, undefined, 'nullable modality normalizes to Atlas modality absence');
const stateAbsent = normalizeProviderWireResult(base());
assert.equal(stateAbsent.propositions[0].qualifiers.state, undefined, 'nullable state normalizes to Atlas state absence');
const discourseAbsent = normalizeProviderWireResult(base());
assert.equal(discourseAbsent.discourseRole, undefined, 'nullable discourse role normalizes to Atlas absence');

const plainPossibility = base();
plainPossibility.propositions[0].qualifiers.modality = { type: 'possibility', appliesTo: null, evidence };
assert.equal(normalizeProviderWireResult(plainPossibility).propositions[0].qualifiers.modality.appliesTo, undefined, 'nullable appliesTo preserves plain possibility');
const nestedPossibility = base();
nestedPossibility.propositions[0].qualifiers.modality = { type: 'possibility', appliesTo: { type: 'obligation', evidence }, evidence };
assert.equal(normalizeProviderWireResult(nestedPossibility).propositions[0].qualifiers.modality.appliesTo.type, 'obligation', 'non-null appliesTo preserves possibility(obligation)');
for (const type of ['permission', 'prohibition', 'recommendation']) {
  const wire = base();
  wire.propositions[0].qualifiers.modality = { type, evidence };
  assert.equal(normalizeProviderWireResult(wire).propositions[0].qualifiers.modality.type, type, `${type} survives provider-wire round-trip`);
}

const unitless = base();
unitless.propositions[0].qualifiers.quantities = [{ comparator: 'maximum', value: 3, unit: null, evidence }];
assert.equal(normalizeProviderWireResult(unitless).propositions[0].qualifiers.quantities[0].unit, undefined, 'nullable quantity unit preserves a unitless quantity');
const assertionState = base();
assertionState.propositions[0].qualifiers.state = { kind: 'assertion', from: null, to: 'sent', evidence };
const normalizedState = normalizeProviderWireResult(assertionState).propositions[0].qualifiers.state;
assert.equal(normalizedState.from, undefined, 'nullable state from preserves an assertion rather than inventing a transition');
assert.equal(normalizedState.kind, 'assertion');
const invalidRange = base();
invalidRange.propositions[0].qualifiers.quantities = [{ comparator: 'range', lowerBound: 5, upperBound: 2, unit: null, evidence }];
assert.throws(() => normalizeProviderWireResult(invalidRange), 'Atlas validation must still enforce the non-JSON-Schema range refinement after transport normalization');

const report = inspectGroqStrictSchema(providerJsonSchema);
assert.equal(report.compatible, true, JSON.stringify(report.violations, null, 2));
assert.ok(report.objects.length > 0, 'provider schema must contain reachable objects');
for (const object of report.objects) {
  assert.ok(object.properties.every((property) => object.required.includes(property)), `${object.path} must require every property`);
  assert.equal(object.additionalProperties, false, `${object.path} must be closed`);
}
// The old Atlas-emitted schema is intentionally unsuitable for transport: the
// offline validator must catch the exact DIAG-01 incompatibility class.
const atlasSchema = (await import('./semir-002-schema.mjs')).atlasSemanticJsonSchema;
const atlasReport = inspectGroqStrictSchema(atlasSchema);
assert.ok(atlasReport.violations.some((violation) => violation.kind === 'missing-required'), 'validator must catch optional Atlas fields such as unit and from');
const omittedAtlasProperties = atlasReport.violations.filter((violation) => violation.kind === 'missing-required').flatMap((violation) => violation.properties);
assert.ok(omittedAtlasProperties.includes('unit'), 'validator must catch the confirmed quantity.unit DIAG-01 failure');
assert.ok(omittedAtlasProperties.includes('from'), 'validator must catch the confirmed state.from DIAG-01 failure');

const rejectedNestedAnyOfSchema = {
  type: 'object', properties: {
    appliesTo: { anyOf: [
      { anyOf: [{ type: 'object', properties: { type: { type: 'string' } }, required: ['type'], additionalProperties: false }] },
      { type: 'null' },
    ] },
  }, required: ['appliesTo'], additionalProperties: false,
};
const nestedAnyOfReport = inspectGroqStrictSchema(rejectedNestedAnyOfSchema);
assert.ok(nestedAnyOfReport.violations.some((violation) => violation.kind === 'nested-anyof-wrapper' && violation.path === '#/properties/appliesTo/anyOf/0'), 'validator must reject the Groq-rejected nested anyOf wrapper at appliesTo');
assert.ok(!report.violations.some((violation) => violation.kind === 'nested-anyof-wrapper'), 'provider schema must not contain nested anyOf wrappers');

console.log(JSON.stringify({
  qualification: 'SEMSPIKE-006 provider-wire compatibility',
  strictSchema: { compatible: report.compatible, objectCount: report.objects.length, violations: report.violations },
  emittedRiskKeywords: report.emittedKeywords,
  structuralConstructs: report.structuralConstructs,
  providerCalls: 0,
}, null, 2));
console.log(`SEMSPIKE-006 provider-wire PASS: ${report.objects.length} provider objects are closed and require every declared property; nullable absence normalization preserved semantic meaning; zero provider calls.`);
