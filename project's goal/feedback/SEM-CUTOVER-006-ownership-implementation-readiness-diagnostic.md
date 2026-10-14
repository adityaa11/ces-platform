# Diagnostic only — SEM-CUTOVER-006 ownership and implementation readiness

**Diagnostic date:** 2026-10-14
**Branch inspected:** `codex/new-atlas-backend`
**Exact HEAD:** `7802de7f927d4869e7dbae0d5bb6bb267d341a84`
**Decision:** `REQUIRES_PREREQUISITE_OWNER`

> This is a read-only diagnostic. It is not GO, HMN, CFC, or CK authority. It
> creates no authorization, does not resolve historical CK findings, and does
> not authorize implementation.

## Executive conclusion

The former dependent-meaning ownership blocker is materially changed: the
qualified REL-03 pure interface and SEM-CUTOVER-005 composite-accounting
interfaces now exist on this branch and have their own independent PASS
records. They provide a valid way to preserve provisional essential-dependent
meaning while finalizing independent tuples.

The primary contextual-trust blocker remains open. The current finalizer
accepts only a caller-supplied `{ ownedSourceSlot, contextSourceSlot }` pair.
No independently owned verifier or decision issuer exists that proves an
accepted relationship is valid for the exact execution, document, source SHA,
asset identity/hash, lineage/revision, contextual role, necessity, grant,
expiry, and revocation state. A finalizer cannot safely become that issuer.

Accordingly, the evidence-supported path is:

1. First qualify a separately owned, pure accepted-context verification/
   decision prerequisite.
2. Only after its independent PASS, request a narrow SEM-CUTOVER-006 HMN
   amendment allowing the finalizer to consume that decision and the already
   qualified REL-03/SEM-005 interfaces.
3. Keep worker, provider, persistence, REL-03 durable integration, and
   original protected work out of SEM-CUTOVER-006.

Option A (resume SEM-006 immediately with only an amended HMN) cannot satisfy
historical `CK-001.a`. Option C is not the recommended steady state because a
small independently owned prerequisite can supply the missing authority
without reopening qualified owners; it remains the required fail-closed result
until that prerequisite is actually qualified.

## Repository and worktree state

The inspected local branch and `origin/codex/new-atlas-backend` both resolve to
`7802de7f927d4869e7dbae0d5bb6bb267d341a84` at diagnostic time.

Tracked modifications preserved without inspection-driven edits:

- `apps/agents-bridge/src/semantic-extraction-finalizer.ts`
- `apps/agents-bridge/src/semantic-worker.ts`
- `apps/agents-bridge/tests/semantic-worker.test.ts`
- `packages/atlas-fixtures/generated/safara-golden-bundle.json`
- `packages/atlas-fixtures/generated/safara-reconciliation.md`

The first three files exactly match the hashes in the committed REL-03
candidate-preservation snapshot:

| Path | SHA-256 |
| --- | --- |
| `semantic-extraction-finalizer.ts` | `2DA347D78DB43B6FAEBAF48009D9549840AB521B7F369CE82E5C5C50EDEEC9D8` |
| `semantic-worker.ts` | `61D93809D05F7004DCA6E4A5ACAA50807CCC329202298A10EF2085756580CEE4` |
| `semantic-worker.test.ts` | `AFB0AAE9D0ADB34E11939816D1CB5302CABCBD93C12FC62E1B01B5129E08173D` |

The branch also contains unrelated untracked planning, feedback, fixture,
laboratory, and ignored runtime-output material. None is implementation
evidence for this decision. No reset, stash, clean, restore, formatting,
test run, stage, or modification was performed by the diagnostic.

## GitHub-available authoritative dependencies

The following files are committed on the inspected remote branch and may be
read as ordinary repository links:

- [SEM-CUTOVER-006 frozen ticket](../Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-006-03-05-context-trust-remediation.md)
- [SEM-CUTOVER-006 original blocked GO checkpoint](SEM-CUTOVER-006-go-blocked.md)
- [SEM-CUTOVER-006 HMN-001](SEM-CUTOVER-006-hmn-001.md)
- [Historical BSS-V2-004-03-05 CK review](BSS-V2-BATCH-04.03-05-298021d-review.md)
- [REL-03 pure-interface handoff](../Backend_Phase/relationship-lifecycle-successor-plan/REL-03-pure-interface-handoff.md)
- [REL-03 post-CFC PASS verification](BSS-V2-004-03-05-REL-03-f494f4c-verification.md)
- [SEM-005 interoperability PASS verification](SEM-CUTOVER-005-INTEROPERABILITY-d7a0345-verification.md)
- [SEM-005 composite-accounting PASS verification](SEM-CUTOVER-005-7e647cb-verification.md)

### Exact qualified results

- **REL-03:** `f494f4c18508a19f608b98e27f6a076af49644d7`, `PASS`. Its two
  frozen integrity clauses were resolved. The verified scope is the pure
  interface and its focused tests, not worker/durable integration.
- **SEM-005 composite accounting:**
  `7e647cb867d51b811547a0b6edce69c2cc8e847f`, `PASS`. It validates exact
  source evidence, immutable dependency provenance, and non-fabricated fully
  deferred accounting.
- **SEM-005 interoperability:**
  `d7a0345455828fe29fc8ef495b50944ac133586d`, `PASS`. It proves the genuine
  composite result contains exact independent/deferred tuple identity and
  mixed accounting.

Those PASS records are predecessor evidence only. They do **not** authorize
SEM-006 and do **not** establish accepted-context authority.

## Original blocker versus current implementation

### A. Accepted-context authorization remains absent

The committed finalizer's actual trust boundary is two strings plus source-slot
role checking. The following is reproduced here because the local finalizer is
currently modified and therefore cannot safely be referenced as GitHub proof:

```ts
export type AcceptedContextEvidence = {
  readonly ownedSourceSlot: string;
  readonly contextSourceSlot: string;
};

for (const relationship of input.acceptedContextEvidence ?? []) {
  const owner = ownedById.get(relationship.ownedSourceSlot);
  const context = slotsById.get(relationship.contextSourceSlot);
  if (!owner || !context || (context.role ?? "owned_source") !== "reference_context") {
    fail("SOURCE_RELATIONSHIP_BLOCKED: contextual evidence is not an accepted owned-to-reference binding.");
  }
  const existing = contextualEvidence.get(owner.slot) ?? [];
  if (existing.some((item) => item.slot === context.slot)) {
    fail("SOURCE_RELATIONSHIP_BLOCKED: duplicate contextual evidence binding.");
  }
  existing.push(context);
  contextualEvidence.set(owner.slot, existing);
}
```

It does not validate or retain:

- execution, document, bundle/project/workspace, or source-SHA scope;
- relationship lineage or immutable revision;
- visual asset reference, asset hash, or asset source SHA;
- contextual role or necessity;
- grant/attestation provenance, expiration, or revocation.

`buildUnhydratedMultimodalSourcePacket()` has an
`AuthorizedSourceRelationshipBinding` input, but it only validates an already
provided binding. It does not verify a grant or issue an accepted decision.
The stepwise and provisional relationship contracts explicitly preserve
`authorization: null`. Thus neither is an eligible positive issuer.

A fake verifier is valid only as a controlled consumer test double after an
owner has specified what a real decision means. A fake that itself creates the
positive accepted decision would collapse issuer and consumer authority and
hide the missing security boundary.

### B. Dependent meaning is now independently qualified

Committed REL-03 exports `prepareDeferredDependentInterpretations()`. It:

- validates complete scope and normalized-document identities;
- recomputes lineage/revision hashes and validates full source/asset locators;
- accepts only provisional (`authorization: null`) revisions;
- maps essential relationship candidate tuples to deterministic deferred
  descriptors with `canonical_candidate_id: null`;
- retains independent tuples and optional-relationship tuples separately; and
- rejects duplicate, foreign, mismatched, malformed, or out-of-range tuples.

SEM-005's committed composite accounting consumes this output and requires
every provider candidate tuple to be independently finalized, optional-but-
independent, or essential-dependent-deferred. It rejects canonical bindings
for deferred tuples and rejects false `non_fact` source accounting.

This resolves the earlier claim that no owner could preserve dependent meaning.
It does not make the finalizer's current input/output types compatible with the
qualified interface.

## Actual schema and integration mismatch

REL-03's trusted slots include source SHA and optional full asset identity;
the current SEM-006 finalizer slot type contains only slot/page/locator/content
and role. REL-03 emits snake-case tuple fields (`source_slot`,
`candidate_index`); the protected finalizer experiment introduces an unrelated
camel-case `{ sourceSlot, candidateIndex }` type.

The protected experiment contains the following skip logic:

```ts
export type DeferredCandidateTuple = {
  readonly sourceSlot: string;
  readonly candidateIndex: number;
};

for (const [index, proposed] of proposalResult.candidates.entries()) {
  const local_candidate_id = candidateId(source.slot, index);
  if (deferred.has(`${source.slot}\u0000${index}`)) continue;
  candidateIds.push(local_candidate_id);
  // create canonical assertion
}
```

That is insufficient for a fully deferred source. Semantic V1 requires every
`candidate`-classified inventory item to have at least one destination local
candidate ID. Skipping its only candidate leaves a `candidate` inventory item
with an empty destination list; canonical parsing must reject it. Reclassifying
the source as `non_fact` would violate the frozen no-fabrication rule.

Therefore a fully deferred source cannot be truthfully represented as a
standalone Semantic V1 finalizer result. It must remain an explicitly
non-canonical SEM-005 composite/sidecar result. This is a `SCHEMA_FIT_BLOCKED`
condition until an authorized SEM-006 adapter consumes the qualified composite
contract rather than attempting to encode deferred meaning in V1.

The protected worker experiment is additionally out of bounds: it changes
worker composition, provider schema selection, relationship packet loading,
and replay behavior. It is preservation material only and cannot be salvaged
as SEM-006 evidence or scope.

## RC-006 gap matrix

| Review row | Required frozen behavior | Current evidence | Qualified predecessor coverage | Remaining work and owner | Classification |
| --- | --- | --- | --- | --- | --- |
| `RC-006-01` / historical `CK-001.a` | Context evidence must arise from an exact validated accepted relationship; forged, foreign, stale, duplicate, unsupported, mismatched, revoked identities fail before canonical output. | Finalizer accepts only caller-supplied slot pair and role. | None supplies accepted authority. REL-03 deliberately requires `authorization: null`. | New independently owned accepted-context verifier/decision issuer; SEM-006 consumes, never issues. | `EXTERNAL_PREREQUISITE` |
| `RC-006-02` / historical `CK-001.b` | Accepted context enriches the same candidate; missing essential context withholds only dependent authority without `non_fact`, source loss, or unrelated failure. | Protected skip experiment cannot form valid V1 for fully deferred source. | REL-03 descriptors and SEM-005 accounting provide the required preservation semantics. | SEM-006 pure adapter must use qualified descriptor/composite shape; no REL-03 change. | `SCHEMA_FIT_BLOCKED` |
| `RC-006-03` | Proposed/unresolved relationship remains provisional while independent candidates/accounting remain valid. | No committed finalizer consumption. | REL-03 and SEM-005 PASS prove the underlying behavior. | Bounded finalizer consumption/adaptation after authority prerequisite. | `OPEN_WITHIN_006_OWNER` |
| `RC-006-04` | Deterministic IDs, canonical parsing, exact slots, wording/evidence/origin; malformed and rogue inputs fail. | Existing finalizer preserves strict proposal parse, owned-slot coverage, deterministic IDs, and canonical parse. | Existing predecessor behavior remains valid. | New adapter must retain these invariants, including fully deferred rejection from V1-only route. | `OPEN_WITHIN_006_OWNER` |
| `RC-006-05` | No provider-specific imports, reconciliation changes, staging effects, or normal D1 activity. | Committed finalizer remains pure; protected worker change would violate this scope. | Historical pure-boundary proof remains valid. | Preserve and exclude worker change; SEM-006 stays finalizer plus focused tests. | `RESOLVED_BY_QUALIFIED_PREDECESSOR` |

## Exact protected-file conflicts

| Protected material | Conflict | Required handling |
| --- | --- | --- |
| Dirty `semantic-extraction-finalizer.ts` | Same file as SEM-006, but experiment is incomplete and snapshot-preserved. | Do not overwrite, stage, or use as qualification evidence. Any future authorized work begins from a newly scoped diff. |
| Dirty `semantic-worker.ts` and test | Worker/provider/replay composition is forbidden by SEM-006. | Preserve untouched; exclude from any SEM-006 commit. |
| REL-03 pure sidecar | Clean, committed, independently qualified predecessor. Its integration entry point deliberately fails closed. | Consume only its pure descriptor output; do not modify REL-03. |
| SEM-005 sidecar/composite accounting | Clean, committed, independently qualified predecessor. | Reuse it; do not create parallel accounting or V1 fallback semantics. |

## Permitted future boundaries

### New prerequisite owner

May own only a provider-neutral accepted-context verification decision and
focused tests. Its immutable decision must bind, at minimum:

- exact execution/project/workspace/bundle/document/source-SHA scope;
- relationship lineage and immutable revision;
- owned and contextual locators, roles, necessity, and asset identity/hash;
- issuer/grant/attestation identity;
- expiration, revocation, duplicate/replay, foreign, and malformed rejection.

It must not change the worker, provider dispatch, repository, database,
reconciliation, publication, Master, or REL-03/SEM-005 owners.

### Later SEM-CUTOVER-006 owner

After the prerequisite PASS and a narrow HMN amendment, may modify only the
finalizer and focused finalizer tests to:

- consume—not issue—the accepted-context decision;
- consume REL-03 tuple descriptors using a fully validated adapter;
- retain independent and optional candidate identity/index mapping;
- route fully deferred outcomes to the existing SEM-005 composite accounting
  representation rather than fabricate a Semantic V1 result; and
- test accepted, forged, foreign, stale, expired, revoked, duplicate,
  unsupported, source/asset/role/necessity mismatch, mixed, and fully deferred
  cases.

## Proposed next HMN scope, if and only if requested after prerequisite PASS

Do not create `HMN-002` from this diagnostic. If the prerequisite later passes,
a subsequent HMN should name the exact verifier-decision path/type and allow
only its pure consumption from:

- `apps/agents-bridge/src/semantic-extraction-finalizer.ts`
- focused finalizer tests

It should explicitly forbid changes to:

- `semantic-worker.ts`, provider adapters, source grants, schema authority,
  database/migrations, REL-03, admission, reconciliation, Master, publication,
  or canonical RUN-003 data;
- accepted-decision issuance inside the finalizer; and
- use of the preserved dirty worker/finalizer experiment as a merge base or
  qualification result.

## Final stopping rule

Until the accepted-context decision prerequisite is independently qualified,
SEM-CUTOVER-006 remains unable to close frozen `CK-001.a`. Do not weaken that
oracle, treat matching metadata as authority, or represent a fully deferred
meaning as Semantic V1 `non_fact`.

**Final readiness decision: `REQUIRES_PREREQUISITE_OWNER`.**
