# IDSER-012-05-03 — Immutable v3 multimodal handoff

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-01/-02 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Add the narrowest `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` shapes needed to bind the complete selected logical request: ordered media descriptors or independently reconstructible equivalent, owned/context-only selection, source-specification/manifest/logical-request hashes, estimator identity/configuration, complete measurements, and resource envelope. Reuse existing tables, transactions, cancellation/replay rules, parser dispatch, and reference-only GHR body. Preserve v2 reads, record hashes, and reconstruction behavior unchanged.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-03-01` | v3 immutable records strictly accept the complete selected-media identity and reject unknown fields, duplicated/reordered/foreign descriptors, inconsistent hashes, measurements, or estimator configuration. |
| `RC-01205-03-02` | Atomic persistence, rollback, cancellation, replay, and version dispatch remain within existing repository/tables; no media bytes, base64, source content, provider body, grant, or credential persists. |
| `RC-01205-03-03` | Historical v2 reads, hashes, and text/table reconstruction stay unchanged, while GHR remains a reference-only carrier. |

## Boundaries and workflow

No reconstruction, execution authority, hydration, provider transport, or semantic parsing belongs here. CFC is limited to v3 canonicalization/persistence/version dispatch. HMN is required for an unavoidable conflict with established immutable storage or GHR authority; it cannot create a new table, queue, or delivery path.
