# GHR-02B GO checkpoint

- **Ticket:** GHR-02B — Atomic NDV1 acceptance integration and pointer-only pg-boss publication
- **State:** `awaiting_review`
- **Implementation/review target:** pending commit
- **Authority:** [GHR-02B frozen ticket](../Backend_Phase/tickets/GHR_Phase/GHR-02B-atomic-ndv1-acceptance-and-pg-boss-publication.md) and its incorporated [GHR v0.6 §§5.1, 6, 8–10](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md); GHR-02A CK PASS at `5bdac8c2`.
- **Runtime evidence exception:** the user explicitly authorized writes to the canonical database/volume after the clone-only Atlas server failed to expose a port. The fresh manual project-card/PDF proof below is therefore canonical, not a substitute silently labelled as clone evidence. The isolated clone remains the PostgreSQL/pg-boss commit/replay/rollback harness.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-02B-RC-01 | An eligible accepted NDV1 atomically commits terminal accepted facts, exactly one GHR intent, and one pointer job; injected publication failure rolls all three back. | Normal signed-in project-card flow created canonical project `ghr-02b-canonical-20261024` from `docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf`: project `d58ef5a5-d010-44f3-a21d-7e79a1186cee`, workspace `fe6144a3-7526-468a-a4cc-4ba66f1586f3`, bundle `e114c28c-cfe1-4d34-828b-bdfff2e99a3d`, document `199e181f-7211-4809-a9b3-ed262d2b209c`, execution `9af1bf28-55cb-4ee1-825d-990ce127bdd8`, fingerprint `eb94f6e4cab4804c3c40e51066d1bdbc2c1783367c647e431fddaddf4772f437`. Direct PostgreSQL inspection observed `completed` + `perceived`, one intent, and one job. Isolated logical clone `atlas-ghr02b-qualification-postgres` / database `atlas_ghr02b` (host port `15434`) ran `pnpm --filter @atlas/db test:ghr-02b` PASS, including injected post-enqueue failure rollback and no dangling job. | PROVEN under explicit canonical-write authorization |
| GHR-02B-RC-02 | Live Perception facts are the sole GHR-02A producer/route/pins/scope/body contract; tampering cannot alter issuance. | `packages/atlas-db/src/perception-authority.ts` obtains project/workspace/bundle/document/execution/cache/fingerprint only after durable accepted-state writes, supplies no caller-controlled route/pin/mode data, and delegates body/header authority to `PostgresGenericHandoffIssuer`. Focused clone integration asserts exact false-only bytes/hash and source/fact-shape parity; `test:ghr-02b-boundary` rejects boundary expansion. | PROVEN |
| GHR-02B-RC-03 | Completed replay/restart preserves the original logical handoff and singleton job identity, without reissue/polling/mode change. | Focused clone PostgreSQL/pg-boss test reconstructs the authority and repeats delivery; it observed one immutable intent and one singleton job. Canonical job singleton key is `ghr-ndv1-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f`. | PROVEN |
| GHR-02B-RC-04 | Queue metadata is only `GenericHandoffJob/v1` plus `handoffId`; no consumer, receipt, or lease state exists. | Canonical queue inspection showed exactly `{"type":"GenericHandoffJob/v1","handoffId":"ghr-handoff-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f"}`. `apps/agents-bridge/src/worker.ts` declares the queue but deliberately registers no consumer; boundary oracle passed. | PROVEN |
| GHR-02B-RC-05 | Positive and failure paths produce no receiver/ACK/resolver/planner/BSS/SEM/provider/reconciliation/projection effects. | Canonical scoped counts: one intent, one job, zero `semantic_execution`, zero `semantic_candidate`. Clone integration asserts unchanged BSS count, absence of Bridge delivery table, zero semantic effects, and rollback leaves no job that lacks persisted issuance truth. | PROVEN |

## Validation record

```text
Normal project-card/PDF flow in canonical Compose `atlas-canonical-perception`     PASS
Canonical PostgreSQL/pg-boss scoped provenance and queue inspection                PASS
DATABASE_URL=...atlas_ghr02b pnpm --filter @atlas/db test:ghr-02b                 PASS (1 PostgreSQL integration test)
pnpm --filter @atlas/db typecheck                                                  PASS
pnpm --filter @atlas/agents-bridge typecheck                                      PASS
pnpm --filter @atlas/db test:ghr-02b-boundary                                     PASS (1 boundary test)
pnpm --filter @atlas/db test:ghr-02a-boundary                                     PASS (1 predecessor-boundary test)
git diff --check                                                                   PASS
```

## Scope and handoff

The change binds the accepted staged Perception branch to GHR-02A and same-transaction pg-boss publication. The producer job is pointer-only and singleton-deduplicated. It adds no worker consumer, receiver, receipt, lease, delivery retry, parser, resolver, planner, semantic/BSS/provider work, reconciliation, or projection.

Internal readiness: READY_FOR_CK
