# IDSER-012-03-03-02 — GHR output compatibility and composition closure

- **State:** `planned`; GO requires IDSER-012-03-03-01 CK `PASS`.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Parent:** [IDSER-012-03-03 split map](IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md).
- **Dependencies:** CK `PASS` for every preceding `IDSER-012-03-01-01`, `-01-02`, `-02-01`, `-02-02`, `-02-03`, and `-03-01` executable child.

## Outcome

Implement the strict non-delivering fixture receiver for the proposed `SemanticBatchPlanReady/v1` body and prove the entire already-approved path composes into persisted, unissued handoffs. This is the sole IDSER-012-03 closure. **HARD STOP before any GHR route/issuer/outbox/delivery/ack, BSS execution, SEM intake, provider call, semantic acceptance, reconciliation, Master, CES, or project-truth effect.**

## Authorized scope

Build and strictly validate only:

```ts
type SemanticBatchPlanReadyV1 = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchCount: number;
  batchHandoffRefs: readonly Readonly<{ batchId: string; ref: string; hash: string; }>[];
}>;
```

Reject missing/extra/duplicate/oversized fields, nonpositive count, unequal count/array length, duplicate batch IDs, foreign/stale ref, wrong parent membership/hash/scope, incomplete owned coverage and nonpersisted records. A too-large array returns a typed blocker for a separately versioned manifest-pointer design; it does not invent a field. `NO_ELIGIBLE_SOURCE` emits no body.

The composition test uses the real approved parser/resolver, BSS snapshot reader, estimator, partition and persistence interfaces without changing their internals. It validates stored records through the fixture receiver only. Do not instantiate a GHR router, outbox, queue, route registry, SEM consumer, provider client or delivery acknowledgement.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030302-01 | Real accepted source flows through approved input/resolution, BSS planning, estimation/partition and `-03-03-01` persistence to produce the correct positive N-batch stored records; zero eligible source yields no body. |
| RC-012030302-02 | The strict fixture receiver validates a body made from real persisted refs and rejects wrong/missing/extra/duplicate/foreign/stale hash/count/member/ownership cases. |
| RC-012030302-03 | Replaying the composed path shows immutable prior versions across changed source/asset/REL/profile/structural conditions; recovery semantics are observed through the approved persistence interface, not reimplemented here. |
| RC-012030302-04 | Each body and referenced handoff retains exact BSS policy/provider provenance, REL/visual/context/deferred state and bounded envelope identity without treating unknown RPD as unlimited. |
| RC-012030302-05 | A non-inert positive committed plan/body validation coexists with exact zero GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM call/intake/fragment, Atlas semantic candidate/evidence/index, reconciliation/Master/CES effect. |
| RC-012030302-06 | The replacement boundary is explicit: future GHR delivery may reuse the body but this fixture is not a route or SEM intake and introduces no limiter, send lane, or OPEN-A acceptance. |

## Security Readiness

- `SR-012030302-T1`: persisted scoped plan/handoff refs → strict opaque proposed output body.
- `SR-012030302-C1`: prohibit treating output validation as GHR issuance, execution eligibility, scheduler creation, raw-payload export or a second limiter.
- `SR-012030302-R1`: CK proves body/member validation against real records; `SR-012030302-R2` proves end-to-end exact zero downstream counters.

## Evidence and hard stop

Record each predecessor CK identity, real composed fixture identities, stored refs/hashes, validated body bytes/digest, rejection matrix and non-inert/zero-effect counters. A missing GHR activation authority is expected, not a gap to fill. The only successful output is a validated yet **unissued** body and durable Atlas records; all future delivery/execution work requires separate GO/CK and OPEN-A where applicable.
