# IDSER-012-05-03 — Immutable v3 multimodal handoff

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-01/-02 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Add the narrowest `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` shapes needed to bind the complete selected logical request: ordered media descriptors or independently reconstructible equivalent, owned/context-only selection, source-specification/manifest/logical-request hashes, estimator identity/configuration, complete measurements, and resource envelope. Reuse existing tables, transactions, cancellation/replay rules, parser dispatch, and reference-only GHR body. Do not mutate historical v1/v2 persisted record bytes or hashes. Retire production v1/v2 writers, parsers used for operational acceptance, public exports, and version dispatch, so only v3 can be persisted, read for execution, validated by GHR, or reconstructed. Neither backward-compatible execution nor a legacy fallback is authorized.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-03-01` | v3 immutable records strictly accept the complete selected-media identity and reject unknown fields, duplicated/reordered/foreign descriptors, inconsistent hashes, measurements, or estimator configuration. |
| `RC-01205-03-02` | Atomic persistence, rollback, cancellation, replay, and version dispatch remain within existing repository/tables; no media bytes, base64, source content, provider body, grant, or credential persists. |
| `RC-01205-03-03` | All active plan/handoff writers, readers, dispatchers, and GHR receiver paths accept v3 only; v1/v2 records and mixed parent/child versions fail closed without changing any historical immutable rows/hashes. Text/table behavior is proven on v3, not a v2 compatibility branch. GHR remains reference-only. |

## Retirement prerequisite

Before cutting over active APIs, run a read-only inventory of v1/v2 persisted plans/handoffs and linked in-flight work in the target environment. This repository review alone cannot prove that those rows are absent. Nonempty legacy inventory requires explicit authorized disposition (retire/cancel or replan from original accepted source) without rewriting immutable contents or creating a compatibility executor. Test that implicit v1 persistence, explicit v1/v2 persistence, mixed record versions, and legacy GHR acceptance are all rejected. Remove old-version support exports from production dependency surfaces.

## Boundaries and workflow

No reconstruction, execution authority, hydration, provider transport, or semantic parsing belongs here. CFC is limited to v3 canonicalization/persistence/version dispatch. HMN is required for an unavoidable conflict with established immutable storage or GHR authority; it cannot create a new table, queue, or delivery path.
