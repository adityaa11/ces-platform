import { createHash } from 'node:crypto';

/**
 * This module deliberately models only the v0.3 offline experiment.  It has
 * no production imports and its counters are a static proof that this module
 * has no provider, image, database, queue, admission, or mutation surface.
 */
export const instrumentation = Object.freeze({
  external_provider_attempt_count: 0,
  image_read_count: 0,
  database_write_count: 0,
  queue_or_job_count: 0,
  admission_reservation_count: 0,
  production_mutation_count: 0,
});

export class IntegrityError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'IntegrityError';
    this.reason = reason;
  }
}

export function canonicalize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new IntegrityError('NON_CANONICAL_NUMBER');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value !== 'object') throw new IntegrityError('NON_JSON_VALUE');
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

export const sha256Bytes = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const sha256Canonical = (value) => sha256Bytes(Buffer.from(canonicalize(value), 'utf8'));
export const utf8Bytes = (value) => Buffer.byteLength(canonicalize(value), 'utf8');
export const expandedContent = (source) => source.text === undefined
  ? source.asset_ref
  : source.repeat === undefined ? source.text : source.text.repeat(source.repeat);
const immutableSourceContent = (source) => source.text === undefined ? source.asset_ref : source.text;

function sortedIds(values) { return [...values].sort((left, right) => left.localeCompare(right)); }

function sourceSlot(source, role) {
  return {
    content: expandedContent(source),
    id: source.id,
    kind: source.kind,
    locator: source.locator,
    role,
  };
}

export function requestFor(fixture, profile, ownerId, contextIds) {
  const sources = new Map(fixture.sources.map((source) => [source.id, source]));
  const owner = sources.get(ownerId);
  if (!owner) throw new IntegrityError('MISSING_OWNER');
  return {
    context: sortedIds(contextIds).map((id) => {
      const source = sources.get(id);
      if (!source) throw new IntegrityError('MISSING_CONTEXT_SOURCE');
      return sourceSlot(source, 'essential_context');
    }),
    document: { scope: fixture.document.scope, sha256: fixture.document.sha256 },
    owned: [sourceSlot(owner, 'owner')],
    profile_id: profile.profile_id,
    simulation: 'SEMCTX-SPIKE-001-v0.3',
  };
}

export function validateFixture(fixture) {
  if (!fixture?.fixture_id || !fixture.document?.scope || !fixture.document?.sha256) throw new IntegrityError('INVALID_DOCUMENT_SCOPE');
  if (!Array.isArray(fixture.sources) || fixture.sources.length === 0) throw new IntegrityError('INVENTORY_GAP');
  const ids = new Set();
  const locators = new Set();
  for (const source of fixture.sources) {
    if (!source.verified) throw new IntegrityError('MISSING_VERIFIED_SOURCE');
    if (!source.id || ids.has(source.id)) throw new IntegrityError('DUPLICATE_SOURCE_ID');
    if (!source.locator || !/^p\d+:(block|table|visual):.+/.test(source.locator)) throw new IntegrityError('FORGED_LOCATOR');
    if (locators.has(source.locator)) throw new IntegrityError('DUPLICATE_LOCATOR');
    if (!['independent_eligible', 'context_only', 'not_eligible'].includes(source.eligibility)) throw new IntegrityError('UNDEFINED_ELIGIBILITY');
    if (!source.content_sha256 || sha256Bytes(Buffer.from(immutableSourceContent(source), 'utf8')) !== source.content_sha256) {
      throw new IntegrityError('SOURCE_CONTENT_HASH_MISMATCH');
    }
    ids.add(source.id);
    locators.add(source.locator);
  }
  const edgeIds = new Set();
  for (const edge of fixture.dependencies ?? []) {
    if (!edge.id || edgeIds.has(edge.id)) throw new IntegrityError('DUPLICATE_EDGE_ID');
    if (!ids.has(edge.from) || !ids.has(edge.to)) throw new IntegrityError('MISSING_EDGE_SOURCE');
    if (edge.scope !== fixture.document.scope) throw new IntegrityError('FOREIGN_SCOPE');
    if (!['essential', 'optional', 'comparison'].includes(edge.type)) throw new IntegrityError('UNDEFINED_EDGE_TYPE');
    if (!['authorized', 'rejected'].includes(edge.authority)) throw new IntegrityError('UNDEFINED_EDGE_AUTHORITY');
    if (!edge.evidence_sha256 || (edge.authority === 'authorized' && /stale|substitut|fabricated/i.test(edge.evidence_sha256))) {
      throw new IntegrityError('HASH_SUBSTITUTION');
    }
    edgeIds.add(edge.id);
  }
}

function essentialAuthorizedEdges(fixture) {
  return (fixture.dependencies ?? []).filter((edge) => edge.type === 'essential' && edge.authority === 'authorized');
}

function cycleComponents(sourceIds, edges) {
  const adjacency = new Map(sourceIds.map((id) => [id, []]));
  for (const edge of edges) adjacency.get(edge.from).push(edge.to);
  for (const next of adjacency.values()) next.sort();
  const components = [];
  const stack = [];
  const onStack = new Set();
  const indexes = new Map();
  const lowlinks = new Map();
  let nextIndex = 0;
  const visit = (id) => {
    indexes.set(id, nextIndex); lowlinks.set(id, nextIndex); nextIndex += 1;
    stack.push(id); onStack.add(id);
    for (const target of adjacency.get(id)) {
      if (!indexes.has(target)) { visit(target); lowlinks.set(id, Math.min(lowlinks.get(id), lowlinks.get(target))); }
      else if (onStack.has(target)) lowlinks.set(id, Math.min(lowlinks.get(id), indexes.get(target)));
    }
    if (lowlinks.get(id) === indexes.get(id)) {
      const component = [];
      let member;
      do { member = stack.pop(); onStack.delete(member); component.push(member); } while (member !== id);
      if (component.length > 1 || adjacency.get(id).includes(id)) components.push(sortedIds(component));
    }
  };
  for (const id of sortedIds(sourceIds)) if (!indexes.has(id)) visit(id);
  return components;
}

function closureFor(owner, edges) {
  const byOwner = new Map();
  for (const edge of edges) byOwner.set(edge.from, [...(byOwner.get(edge.from) ?? []), edge.to]);
  const seen = new Set();
  const walk = (id) => {
    for (const target of sortedIds(byOwner.get(id) ?? [])) if (!seen.has(target)) { seen.add(target); walk(target); }
  };
  walk(owner);
  return sortedIds(seen);
}

function deferredFor(source, reason, extra = {}) { return { state: 'deferred', reason, ...extra }; }

function completedFor(fixture, source, closure) {
  const completed = { state: 'completed', assertion_id: `${fixture.fixture_id}-provisional-${source.id}` };
  if (source.independent_proposition) completed.proposition_asserted = source.independent_proposition;
  if (closure.length) completed.closure_members = [source.id, ...closure];
  return completed;
}

export function planFixture(fixture, profile) {
  validateFixture(fixture);
  if (!profile?.profile_id || !Number.isInteger(profile.max_request_utf8_bytes) || !Number.isInteger(profile.max_owned_slots) || !Number.isInteger(profile.max_context_slots)) {
    throw new IntegrityError('INVALID_PROFILE');
  }
  const sources = [...fixture.sources].sort((left, right) => left.id.localeCompare(right.id));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const essential = essentialAuthorizedEdges(fixture);
  const components = cycleComponents(sources.map((source) => source.id), essential);
  const cyclic = new Map(components.flatMap((component) => component.map((id) => [id, component])));
  const plans = [];
  const ledger = {};
  const processingLedger = [];

  for (const source of sources) {
    const record = { source_id: source.id, states: ['unplanned'] };
    if (cyclic.has(source.id)) {
      ledger[source.id] = deferredFor(source, 'ESSENTIAL_DEPENDENCY_CYCLE', { closure_members: cyclic.get(source.id) });
      record.states.push('deferred'); processingLedger.push(record); continue;
    }
    if (source.eligibility !== 'independent_eligible') {
      const reason = source.kind === 'visual' && source.meaningful ? 'MEANINGFUL_ASSET_UNINTERPRETED' : 'NOT_SEMANTICALLY_ELIGIBLE_BY_POLICY';
      ledger[source.id] = deferredFor(source, reason, source.kind === 'visual' && source.meaningful
        ? { asset_ref: source.asset_ref, interpreted: false, non_fact: false }
        : { policy_reason: source.eligibility_reason });
      record.states.push('deferred'); processingLedger.push(record); continue;
    }
    const rejected = (fixture.dependencies ?? []).filter((edge) => edge.from === source.id && edge.type === 'essential' && edge.authority === 'rejected');
    if (rejected.length) {
      ledger[source.id] = deferredFor(source, 'SOURCE_RELATIONSHIP_UNPROVEN', { blocking_edges: sortedIds(rejected.map((edge) => edge.id)) });
      record.states.push('deferred'); processingLedger.push(record); continue;
    }
    const context = closureFor(source.id, essential);
    const payload = requestFor(fixture, profile, source.id, context);
    const payloadBytes = utf8Bytes(payload);
    const payloadSha = sha256Canonical(payload);
    if (context.length > profile.max_context_slots || payload.owned.length > profile.max_owned_slots) throw new IntegrityError('PROFILE_SLOT_LIMIT');
    if (payloadBytes > profile.max_request_utf8_bytes) {
      ledger[source.id] = deferredFor(source, 'IRREDUCIBLE_ESSENTIAL_CLOSURE_OVERFLOW', {
        closure_members: [source.id, ...context], payload_bytes: payloadBytes, payload_sha256: payloadSha,
      });
      record.states.push('planned', 'deferred'); processingLedger.push(record); continue;
    }
    plans.push({ owner: source.id, context, payload_bytes: payloadBytes, payload_sha256: payloadSha });
    ledger[source.id] = completedFor(fixture, source, context);
    record.states.push('planned', 'executed', 'completed'); processingLedger.push(record);
  }
  const completed = Object.values(ledger).filter((entry) => entry.state === 'completed').length;
  const coverage = completed === sources.length ? 'complete' : completed ? 'partial' : 'none';
  return {
    fixture_id: fixture.fixture_id,
    coverage,
    semantic_ready: false,
    accepted: false,
    plans: plans.sort((left, right) => left.owner.localeCompare(right.owner)),
    ledger: Object.fromEntries(Object.entries(ledger).sort(([left], [right]) => left.localeCompare(right))),
    processing_ledger: processingLedger,
  };
}

export function oracleOutput(result) {
  return {
    coverage: result.coverage,
    semantic_ready: result.semantic_ready,
    accepted: result.accepted,
    plans: result.plans,
    ledger: result.ledger,
  };
}

export function validateOutcome(fixture, profile, outcome) {
  validateFixture(fixture);
  const sources = new Map(fixture.sources.map((source) => [source.id, source]));
  const expectedIds = sortedIds(sources.keys());
  if (canonicalize(Object.keys(outcome.ledger ?? {}).sort()) !== canonicalize(expectedIds)) throw new IntegrityError('INVENTORY_GAP');
  if (outcome.accepted !== false || outcome.semantic_ready !== false) throw new IntegrityError('COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION');
  const essential = essentialAuthorizedEdges(fixture);
  const cyclic = new Map(cycleComponents(expectedIds, essential).flatMap((component) => component.map((id) => [id, component])));
  const owners = new Set();
  for (const plan of outcome.plans ?? []) {
    if (!sources.has(plan.owner) || owners.has(plan.owner) || plan.context.includes(plan.owner)) throw new IntegrityError('CONTEXT_OWNER_OVERLAP');
    owners.add(plan.owner);
    const expectedContext = closureFor(plan.owner, essential);
    if (canonicalize(plan.context) !== canonicalize(expectedContext)) throw new IntegrityError('ESSENTIAL_CLOSURE_INCOMPLETE');
    const payload = requestFor(fixture, profile, plan.owner, plan.context);
    if (plan.payload_bytes !== utf8Bytes(payload) || plan.payload_sha256 !== sha256Canonical(payload) || plan.payload_bytes > profile.max_request_utf8_bytes) {
      throw new IntegrityError('REQUEST_BOUND_VIOLATION');
    }
  }
  let completed = 0;
  for (const id of expectedIds) {
    const row = outcome.ledger[id];
    if (cyclic.has(id)) {
      if (row.state !== 'deferred' || row.reason !== 'ESSENTIAL_DEPENDENCY_CYCLE' || canonicalize(row.closure_members) !== canonicalize(cyclic.get(id))) throw new IntegrityError('ESSENTIAL_DEPENDENCY_CYCLE');
      continue;
    }
    const source = sources.get(id);
    if (source.kind === 'visual' && source.meaningful && source.eligibility !== 'independent_eligible') {
      if (row.state !== 'deferred' || row.reason !== 'MEANINGFUL_ASSET_UNINTERPRETED' || row.interpreted !== false || row.non_fact !== false) throw new IntegrityError('COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION');
      continue;
    }
    if (row.state === 'completed') completed += 1;
  }
  const coverage = completed === expectedIds.length ? 'complete' : completed ? 'partial' : 'none';
  if (outcome.coverage !== coverage) throw new IntegrityError('COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION');
}
