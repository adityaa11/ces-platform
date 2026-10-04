import { sourceSemanticResultSchema } from './semir-002-schema.mjs';

const sameText = (left, right) => left.replace(/\s+/g, ' ').trim().toLocaleLowerCase() === right.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
const stable = (value) => JSON.stringify(value);
const pass = (dimension, expected, observed) => ({ dimension, status: 'PASS', expected, observed });
const fail = (dimension, expected, observed) => ({ dimension, status: 'FAIL', expected, observed });

function compareText(dimension, expected, observed) {
  return sameText(expected, observed) ? pass(dimension, expected, observed) : fail(dimension, expected, observed);
}

function compareValue(dimension, expected, observed) {
  return stable(expected) === stable(observed) ? pass(dimension, expected, observed) : fail(dimension, expected, observed);
}

function compareEvidence(dimension, evidence, sourceSlot, sourceText) {
  const valid = Array.isArray(evidence) && evidence.length > 0 && evidence.every((item) => item.sourceSlot === sourceSlot && sourceText.includes(item.quote));
  return valid ? pass(dimension, 'evidence from the current source slot', evidence) : fail(dimension, 'evidence from the current source slot', evidence);
}

function compareProposition(expected, observed, sourceSlot, sourceText, index) {
  const prefix = `propositions.${index}`;
  const checks = [
    compareText(`${prefix}.predicate`, expected.predicate, observed?.predicate ?? ''),
    compareValue(`${prefix}.arguments`, expected.arguments, observed?.arguments),
    compareValue(`${prefix}.modality`, expected.qualifiers.modality, observed?.qualifiers?.modality),
    compareValue(`${prefix}.polarity`, expected.qualifiers.polarity, observed?.qualifiers?.polarity),
    compareValue(`${prefix}.conditions`, expected.qualifiers.conditions, observed?.qualifiers?.conditions),
    compareValue(`${prefix}.triggers`, expected.qualifiers.triggers, observed?.qualifiers?.triggers),
    compareValue(`${prefix}.temporal`, expected.qualifiers.temporal, observed?.qualifiers?.temporal),
    compareValue(`${prefix}.quantities`, expected.qualifiers.quantities, observed?.qualifiers?.quantities),
    compareValue(`${prefix}.scopes`, expected.qualifiers.scopes, observed?.qualifiers?.scopes),
    compareValue(`${prefix}.state`, expected.qualifiers.state, observed?.qualifiers?.state),
    compareValue(`${prefix}.unresolved`, expected.unresolvedAspects, observed?.unresolvedAspects),
    compareEvidence(`${prefix}.evidence`, observed?.evidence, sourceSlot, sourceText),
  ];
  for (const argument of observed?.arguments ?? []) checks.push(compareEvidence(`${prefix}.arguments.${argument.role}.evidence`, argument.evidence, sourceSlot, sourceText));
  for (const unresolved of observed?.unresolvedAspects ?? []) checks.push(compareEvidence(`${prefix}.unresolved.${unresolved.aspect}.evidence`, unresolved.evidence, sourceSlot, sourceText));
  return checks;
}

// This evaluator compares two untrusted proposals. It never derives, repairs,
// canonicalizes, or substitutes semantic meaning from a source string.
export function evaluateSemanticResult({ expected, observed, sourceText }) {
  const expectedStructural = sourceSemanticResultSchema.safeParse(expected);
  const observedStructural = sourceSemanticResultSchema.safeParse(observed);
  const checks = [];
  if (!expectedStructural.success) throw new Error('The fixture expectation is structurally invalid.');
  if (!observedStructural.success) {
    return { caseId: expected.sourceSlot, passed: false, checks: [fail('structure', 'valid Semantic IR proposal', observedStructural.error.issues.map((issue) => issue.path.join('.')))] };
  }
  checks.push(compareValue('sourceDisposition', expected.sourceDisposition, observed.sourceDisposition));
  checks.push(compareValue('discourseRole', expected.discourseRole, observed.discourseRole));
  checks.push(compareValue('propositions.count', expected.propositions.length, observed.propositions.length));
  checks.push(expected.propositions.length
    ? compareEvidence('result.evidence', observed.propositions.flatMap((item) => item.evidence), expected.sourceSlot, sourceText)
    : pass('result.evidence', 'not applicable to a proposition-free source', 'not applicable'));
  for (let index = 0; index < expected.propositions.length; index += 1) checks.push(...compareProposition(expected.propositions[index], observed.propositions[index], expected.sourceSlot, sourceText, index));
  return { caseId: expected.sourceSlot, passed: checks.every((check) => check.status === 'PASS'), checks };
}

export function evaluateAccounting(expectedSlots, observedResults) {
  const checks = [];
  const seen = new Set();
  for (const result of observedResults) {
    if (!expectedSlots.has(result.sourceSlot)) checks.push(fail('accounting.unknown', 'known source slot', result.sourceSlot));
    else if (seen.has(result.sourceSlot)) checks.push(fail('accounting.duplicate', 'one result per source slot', result.sourceSlot));
    else seen.add(result.sourceSlot);
  }
  for (const sourceSlot of expectedSlots) if (!seen.has(sourceSlot)) checks.push(fail('accounting.missing', 'one result per source slot', sourceSlot));
  if (!checks.length) checks.push(pass('accounting', 'one result per source slot', 'complete'));
  return { passed: checks.every((check) => check.status === 'PASS'), checks };
}
