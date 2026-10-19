# IDSER-012-03-03-02 planning amendment 001 — V1 replay contract alignment

- **Decision:** `IDSER_012_03_03_02_RC_03_V1_ALIGNED`
- **Ticket:** `IDSER-012-03-03-02`.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Parent contract:** `IDSER-012-03-03` / `RC-0120303-03`.
- **Authority:** explicit planning resolution selecting Option 1 from `HMN-IDSER-012-03-03-02-001`.
- **Inspected HEAD:** `f0e6953251621276de1c8807d0f80ebb21048be5`.
- **Workflow state:** `awaiting_review`; this amendment does not approve the ticket or authorize GO, CFC, or CK.
- **Affected ticket paths:**
  - `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`
  - `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md`
- **Historical records preserved unchanged:** original CK `IDSER-BATCH-12-03-03-02-e20d7b5-review.md`, CFC checkpoint, post-CFC verification at `f0e69532`, and `HMN-IDSER-012-03-03-02-001`.

## Planning decision and boundary

This append-only decision aligns the active `RC-012030302-03` and the child-specific portion of `RC-0120303-03` with the currently approved Atlas V1 accepted-document, resolver, planner, and immutable-persistence interfaces. It does not introduce REL revision support, source rebinding, a second execution path, a new provider/runtime, a predecessor reopening, or any implementation authority.

The historical CK-002.a closure oracle remains a historical record and remains unresolved at commit `f0e6953251621276de1c8807d0f80ebb21048be5`. This amendment does not rewrite that oracle or claim that its missing evidence passed.

## Authority evidence

- `packages/atlas-db/src/semantic-batch-plan-input.ts:180-187` exposes `AcceptedDocumentPlannerResultV1.rel` only as `{ state: "unavailable" }` and explicitly states that NormalizedDocument v1 has no REL graph and must not fabricate one.
- `packages/atlas-db/src/semantic-batch-plan-input.ts:266-287` resolves accepted records read-only and returns `rel: { state: "unavailable" }`.
- `apps/agents-bridge/src/idser-corpus-demand-estimator.ts:102-108` rejects a non-unavailable REL state as `rel_not_unavailable`.
- `packages/atlas-db/src/immutable-semantic-corpus-plan.ts:16-18,81` types and validates persisted source REL as exactly `{ state: "unavailable" }`.
- `packages/atlas-db/src/immutable-semantic-corpus-plan.ts:108-134` revalidates the accepted source binding and scopes predecessor replan to the same project/workspace/bundle/document; it does not provide source rebinding.
- `apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts:112-123` changes only proposal metadata (`previousProposal.sourceHash`); it is not evidence of a changed accepted source.
- The child ticket's predecessor compatibility gate requires the existing persistence interface unmodified and prohibits a second resolver, persistence path, or fallback.

## Superseded historical requirements

The following wording is superseded only for the active V1 contract described below; the original ticket text, CK matrix, CFC record, and HMN record remain unchanged as historical evidence.

1. Child `RC-012030302-03` previously required replay across “changed source/asset/REL/profile/structural conditions.” The changed-REL portion is superseded because V1 has no authorized REL revision representation. The same-document source-rebinding implication is superseded because the approved resolver selects an already accepted source binding and persistence has no source-version/rebinding interface.
2. Parent `RC-0120303-03` previously included “changed source/asset/REL/profile and authorized structural replan.” For this child and its family closure, the changed-REL and same-document source-rebinding portions are superseded for the same authority reasons. The parent’s cancel, restart, crash-before-commit, lost-ack, concurrent-claim, immutable-version, exact-coverage, and authorized structural-replan requirements remain binding.
3. Any interpretation that treats a manually changed planner/proposal `sourceHash` as a changed accepted source is superseded and prohibited.
4. Any interpretation that treats `rel: { state: "unavailable" }` as a changed REL revision is superseded and prohibited.

## Active replacement acceptance contract: child RC-012030302-03

The following is the authoritative replacement PASS condition for `RC-012030302-03` in subsequent workflow events:

**RC-012030302-03 — PASS iff:**

### A. Same-input replay

The same authorized accepted-source input, passed through the approved resolver, planner, and persistence interface, produces exactly the same persisted plan and handoff identities, hashes, and parent membership on replay. Replay creates no duplicate records and mutates no prior immutable content.

### B. Changed asset, provider profile, and structural bound

The already approved composition evidence preserves immutable prior plan/handoff content and identity when accepted-source-derived asset identity, BSS provider/process profile, or structural-bound versions change through the approved interfaces. Existing resolved findings are not reopened or redesigned.

### C. Changed source

1. A mismatched or stale source binding for an existing accepted document fails closed through the approved resolver/persistence acceptance checks.
2. A genuinely distinct accepted document, resolved through the approved Atlas authority, may create its own scoped plan.
3. The distinct document's plan and handoffs must not mutate the original document's plan/handoffs and must not be recorded as an implicit successor of the original.
4. A manually modified planner/proposal `sourceHash` is not evidence of a changed accepted source.
5. Same-document source rebinding and new source-version interfaces are not authorized by this amendment.

### D. REL

1. V1 preserves exactly `rel: { state: "unavailable" }` from accepted-document resolution into persisted plan content.
2. Unsupported REL states and fabricated REL revisions fail validation and cannot pass.
3. Replay across genuinely changed accepted REL revisions is deferred to a future separately authorized REL-capable contract.
4. The deferred REL revision obligation is not represented as completed, proven, or tested under V1.

### E. Immutability and forbidden effects

Original persisted plan/handoff content, hashes, identities, and parent membership remain unchanged. Positive validation creates no GHR issuance, outbox, dispatch, acknowledgement, BSS admission, provider attempt, SEM execution, or reconciliation effect. The existing GHR/BSS/SEM hard-stop boundary remains unchanged.

## Active replacement acceptance contract: parent RC-0120303-03

For the `IDSER-012-03-03-02` child and its family closure, `RC-0120303-03` now adopts the same A–E conditions above. This amendment narrows only the previously impossible changed-REL and same-document source-rebinding interpretations; all other parent replay, cancel, restart, crash, acknowledgement-loss, concurrency, exact-coverage, immutable-version, and authorized structural-replan obligations remain binding.

The parent continues to require REL/visual/context/deferred metadata to remain correctly bound in every published plan/handoff. Under V1, the REL value that is correctly bound is the exact unavailable state; no REL revision is implied.

## Protected completed work and historical relationship

The following original CK clauses remain resolved and protected from reopening:

- `CK-001.a`
- `CK-001.b`
- `CK-002.b`
- `CK-002.c`

`CK-002.a` remains historically unresolved at `f0e6953251621276de1c8807d0f80ebb21048be5`. The original closure oracle is not changed in place; this amendment supplies replacement ticket authority for a later review-contract freeze.

## Remaining evidence obligations for CK-002.a

The remaining V1 evidence target is limited to the replacement contract above:

- same-input exact identity replay with no duplicate or mutation;
- changed asset, provider profile, and structural-bound immutability evidence;
- stale/mismatched source-binding rejection for an existing accepted document;
- a genuinely distinct accepted document through the approved authority, with an independently scoped plan and no mutation or implicit successor relationship to the original;
- exact persisted `rel.state="unavailable"`, with unsupported/fabricated REL states rejected or not admitted by the approved V1 interfaces;
- original plan/handoff immutability and the existing exact zero-effect hard-stop observations.

Changed accepted REL revision replay is explicitly deferred and must not appear in V1 evidence as completed or tested.

## Review and remediation path

Because the historical CK closure matrix is immutable, this amendment is not itself a new CK closure oracle and does not authorize CFC. A separate CK contract-freeze/re-baselining artifact must freeze the replacement `RC-012030302-03` evidence rows and binary oracles with new clause identifiers, while carrying historical `CK-002.a` forward unchanged and preserving the four resolved clauses. Only after that replacement freeze may a fresh explicit HMN invocation decide whether to authorize one bounded evidence-remediation CFC cycle for the replacement unresolved clause(s).

**Precise next authorized workflow command:** do not run GO, CFC, or CK automatically. First obtain the required replacement CK contract freeze; then invoke a fresh `hmn IDSER-012-03-03-02` to decide whether bounded evidence remediation is authorized. This amendment does not mark the ticket approved.
