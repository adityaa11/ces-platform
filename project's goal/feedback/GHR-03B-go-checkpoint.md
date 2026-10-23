# GHR-03B GO checkpoint — ready for CK

- **Ticket:** `GHR-03B` — Bridge delivery, lease fencing, and durable parsed-only ACK
- **Authority:** [frozen GHR-03B ticket](../Backend_Phase/tickets/GHR_Phase/GHR-03B-bridge-delivery-fencing-and-parsed-only-ack.md), its incorporated GHR v0.6 §§3.1–3.2, 5.1, 6, 8–10, and predecessor CK PASS artifacts for GHR-02B and GHR-03A.
- **Checkpoint state:** `awaiting_review`; the bounded GO change is ready for CK. This is not a self-issued `PASS`.
- **Database boundary:** an isolated writable PostgreSQL logical clone, `atlas-ghr03b-qualification-postgres` on host port `15435`, was derived from the read-only Compose source `atlas-canonical-perception-postgres-1`. The canonical Compose database and volumes were not modified.

## Bounded change set

- Adds Bridge-owned `bridge.generic_handoff_delivery` state, terminal receipts, immutable identity binding, and lease-generation fencing in migration `0105_ghr03b_bridge_delivery`.
- Exposes the exact active/revocation policy predicate to `agents_bridge` as a security-definer function; it does not grant reads or writes on Atlas intent or policy tables.
- Registers the `atlas-generic-handoff-v1` consumer in the normal Bridge worker. It accepts only `GenericHandoffJob/v1` plus `handoffId`, loads through `atlas.read_generic_handoff_dispatch_v1`, validates raw envelope/hash/pins and route-conditional scope, invokes GHR-03A's real `receiveVerifiedBatchPlan`, then writes the terminal receipt.
- Keeps the payload opaque to generic delivery. No resolver, IDSER, BSS, SEM, provider, reconciliation, projection, source redemption, replay, promotion, or fallback was added.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and current status |
| --- | --- | --- |
| `GHR-03B-RC-01` | Genuine accepted NDV1 must traverse its real GHR-02B pointer job, real GHR-03A receiver, and one durable `parsed_only` receipt on the protected clone. | `GHR03B_REAL_E2E=1 … test:ghr-03b` consumed canonical-derived handoff `ghr-handoff-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f` through pg-boss and recorded one `parsed_only` delivery receipt. Bound identity: project `d58ef5a5-d010-44f3-a21d-7e79a1186cee`, workspace `fe6144a3-7526-468a-a4cc-4ba66f1586f3`, bundle `e114c28c-cfe1-4d34-828b-bdfff2e99a3d`, document `199e181f-7211-4809-a9b3-ed262d2b209c`, execution `9af1bf28-55cb-4ee1-825d-990ce127bdd8`. **PROVEN** |
| `GHR-03B-RC-02` | Required forged/corrupt/header/wrapper/pin/policy/receiver negatives must persist sanitized `blocked` or `quarantined` outcomes. | Protected-clone case matrix in `apps/agents-bridge/tests/ghr-03b-real-e2e.integration.test.ts`, “complete RC-02 negative matrix”: forged producer; wrong route/policy/handler/contract; missing scope; invalid header/wrapper; duplicate-key raw body; changed bytes/hash; real GHR-03A rejection; and disabled policy. Each asserts its durable sanitized classification and the unchanged downstream counts. Command below: **PASS**. **PROVEN** |
| `GHR-03B-RC-03` | Restart, lost ACK, duplicate/reordered jobs, concurrent claims, stale/expired leases, classified retries and exhaustion must preserve one terminal receipt. | Same protected-clone suite: two actual normal pg-boss pointer jobs separated by a Bridge-worker restart complete against one `parsed_only` receipt; an expired generation-1 lease is reclaimed only as generation 2; two simultaneous claims retain one terminal row; a classified receipt-persistence fault is retryable before final attempt and becomes durable `retry_exhausted/transient_delivery` on final attempt. Command below: **PASS**. **PROVEN** |
| `GHR-03B-RC-04` | Every delivery path has zero downstream effect. | The real GHR-02B positive path observes unchanged semantic execution/candidate, BSS, and non-GHR queue counts; the full RC-02 matrix compares the same protected-clone counters before/after; static dependency proof rejects resolver, provider, reconciliation, projection, semantic-worker, and background queue dependencies. Commands below: **PASS**. **PROVEN** |
| `GHR-03B-RC-05` | No replay/promotion/fallback/broad write access/sensitive diagnostics. | `GHR-03B exposes neither delivery replay controls nor sensitive Bridge state` proves no recovery/migration surface, Bridge cannot read raw Atlas issuance or mutate route policy, Atlas cannot read Bridge delivery state, and the receipt schema excludes body/header/payload/diagnostic fields. `test:ghr-03b-boundary` proves the migration's role boundary. Commands below: **PASS**. **PROVEN** |

## Executed validation

```text
corepack pnpm --filter @atlas/db typecheck                                      PASS
corepack pnpm --filter @atlas/db test:ghr-03b-boundary                          PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                           PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b                       PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a                       PASS
DATABASE_URL=postgresql://atlas:…@127.0.0.1:15435/atlas_dev GHR03B_REAL_E2E=1 \
  corepack pnpm --filter @atlas/agents-bridge test:ghr-03b                         PASS (5 tests)
```

## CK handoff

All ticket-derived rows are proven with their named harnesses and observations. The clone remains isolated; the canonical Compose database and volumes were untouched. **Internal readiness: READY_FOR_CK**.
