# IDSER-012-03-03-02 — GHR output compatibility and composition closure

- **State:** `approved`; CK `PASS` at [`IDSER-BATCH-12-03-03-02-cb37faa-verification`](../../../feedback/IDSER-BATCH-12-03-03-02-cb37faa-verification.md) verified the HMN-authorized replacement CFC checkpoint `cb37faa6`. GO consumed IDSER-012-03-03-01 historical CK `PASS` and the corrective [IDSER-012-03-03-01A](IDSER-012-03-03-01A-derived-media-ref-persistence-compatibility.md) independent CK `PASS`. This is not authority for this ticket to repair predecessor internals.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Parent:** [IDSER-012-03-03 split map](IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md).
- **Dependencies:** CK `PASS` for every preceding `IDSER-012-03-01-01`, `-01-02`, `-01-03`, `-02-01`, `-02-02`, `-02-03`, and `-03-03-01` executable child, **plus** the interposed media-reference compatibility correction `IDSER-012-03-03-01A` CK `PASS` before this composition resumes.

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

**Predecessor compatibility gate:** the real resolver's authorized RUN-003 `source.media[].assetRef` has canonical `derived/<lowercase-uuid>` shape. The corrective `IDSER-012-03-03-01A` permits that exact shape at the existing persistence predicate only. This ticket must consume that same fixed `PostgresImmutableSemanticCorpusPlanRepository.persist` interface unmodified; neither rewrite/strip refs nor add a second media resolver, persistence path, or fallback. `01A` proves field-format compatibility; the actual full accepted-media chain remains an independent RC-012030302-01/03/04 obligation here.

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

## Planning amendment 001 — active V1 replacement for RC-012030302-03

The append-only planning decision [`IDSER-012-03-03-02-planning-amendment-001`](../../../feedback/IDSER-012-03-03-02-planning-amendment-001.md) is now the active authority for `RC-012030302-03` in subsequent workflow events. It supersedes only the prior changed-REL and same-document source-rebinding interpretations that cannot be realized through approved V1 contracts. It does not rewrite the original ticket text, CK-002.a, CFC, post-CFC verification, or HMN artifacts.

`RC-012030302-03` now requires:

- same authorized accepted-source input produces identical persisted plan/handoff identities, hashes, and parent membership with no duplicates or mutation;
- changed asset, BSS provider/process profile, and structural-bound versions preserve prior immutable plan/handoff content, without reopening resolved findings;
- stale or mismatched source bindings for an existing accepted document fail closed; a genuinely distinct accepted document may create only its own scoped plan, which must not mutate or become an implicit successor of the original; manually changed proposal `sourceHash` is not source-change evidence and same-document source rebinding is unauthorized;
- V1 preserves exactly `rel: { state: "unavailable" }`; unsupported or fabricated REL states fail validation; changed accepted REL revision replay is deferred to a separately authorized REL-capable contract and is not V1 evidence;
- original plan/handoff content, hashes, identities, and parent membership remain unchanged, with no GHR issuance/outbox/dispatch/acknowledgement, BSS admission/provider attempt, SEM execution, or reconciliation effect.

The historical `CK-002.a` closure oracle remains unresolved at `f0e6953251621276de1c8807d0f80ebb21048be5`; it is not rewritten to `PASS`. `CK-001.a`, `CK-001.b`, `CK-002.b`, and `CK-002.c` remain resolved and protected. This planning amendment does not authorize GO, CFC, CK, production changes, or approval. A separate CK replacement contract freeze is required before a fresh HMN can decide whether to authorize bounded evidence remediation.
