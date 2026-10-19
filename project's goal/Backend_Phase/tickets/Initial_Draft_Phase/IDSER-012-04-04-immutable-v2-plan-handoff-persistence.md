# IDSER-012-04-04 — Immutable v2 plan and handoff persistence

- **State:** `approved` following CK `PASS` for reviewed remediation commit `66df38b5`; **Review record:** [IDSER-BATCH-12-04-04-66df38b-verification.md](../../../feedback/IDSER-BATCH-12-04-04-66df38b-verification.md).
- **Batch:** `IDSER-BATCH-12-04-04`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** `IDSER-012-04-03` CK `PASS`; existing Atlas immutable transaction, authorization, idempotency, cancellation, and replan boundaries.

## Outcome

Define strict `ImmutableSemanticCorpusPlan/v2` and `PlannedSemanticCorpusHandoff/v2` contracts and persist an approved partition proposal atomically as immutable Atlas records. **STOP before GHR body compatibility, SEM reconstruction, BSS admission, or execution.**

## Authorized scope

Use explicit version dispatch: v1 keeps its original parser, hashes, and meaning; v2 uses strict new parsers; unknown versions fail closed. The v2 parent retains existing proposal/provenance identity and inventory entries of `locator`, classification (`eligible`, `deferred`, `unexamined`), and optional bounded reason—never fabricated per-locator full-request demand. Each v2 handoff binds parent plan hash, deterministic batch ID/slot, exact owned and authorized context-only locators, packet/profile/estimator/configuration identity, `ConservativeLogicalRequestBytes/v1`, request bytes, separate input/reserved-output values, request envelope, and bounded fit trace.

Reject unknown/corpus-content fields, malformed hashes, invalid locator shape/uniqueness, stale or foreign parent/child bindings, invalid order, incomplete or duplicate eligible coverage, and numeric/accounting inconsistency. Reuse `atlas.semantic_corpus_plan`, `atlas.planned_semantic_corpus_handoff`, immutable JSONB storage, and Atlas transactions. Migration is additive only if necessary; no parallel store or raw source/table/packet/media/provider body is persisted.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120404-01` | Strict v2 canonicalizers/parsers validate parent/child bindings, field sets, hashes, locators, coverage, order, and frozen accounting; malformed/stale/foreign data fails closed. |
| `RC-0120404-02` | One approved proposal atomically creates one parent and exactly N immutable v2 handoffs; replay/idempotency, conflict, cancellation, rollback, crash/restart, and replan preserve prior records. |
| `RC-0120404-03` | v1 parses and behaves unchanged, v2 dispatches independently, unknown versions fail, and no prior immutable record is rehashed or rewritten. |
| `RC-0120404-04` | Persistence contains references/hashes/metadata only and creates zero GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM call, semantic acceptance, reconciliation, Master, or CES effect. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120404-B1` keeps immutable parent/child persistence Atlas-owned and BSS/SEM/GHR downstream.
- **Trust / sensitive assets:** `SR-0120404-T1` qualified unpublished proposal → atomic scoped v2 records; `SR-0120404-A1` covers identity/provenance hashes and excludes raw corpus/media/prompt material.
- **Prohibited couplings:** `SR-0120404-C1` prohibits Bridge truth writes, mutable/recomputed historic hashes, a parallel store, outbox/scheduler creation, and downstream eligibility state.
- **Verification / unresolved policy:** `SR-0120404-V1` requires transaction/replay/role and v1-preservation tests; `SR-0120404-U1` does not decide future GHR or execution policy.
- **Review binding:** `SR-0120404-R1` verifies `T1/C1` with real transaction, failure-recovery, strict-parser, and forbidden-counter evidence.

## Evidence and hard stop

Record migration state, canonical IDs/hashes, transaction and recovery traces, and no-payload inspection. `NO_ELIGIBLE_SOURCE` writes neither plan nor handoff. Missing Atlas transaction/authorization is `BLOCKED_AUTHORITY`; it does not authorize a new persistence owner. CK `PASS` exposes v2 records only to `-04-05` and `-04-06`.
