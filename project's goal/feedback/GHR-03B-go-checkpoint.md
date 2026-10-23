# GHR-03B GO checkpoint — implementation in progress

- **Ticket:** `GHR-03B` — Bridge delivery, lease fencing, and durable parsed-only ACK
- **Authority:** [frozen GHR-03B ticket](../Backend_Phase/tickets/GHR_Phase/GHR-03B-bridge-delivery-fencing-and-parsed-only-ack.md), its incorporated GHR v0.6 §§3.1–3.2, 5.1, 6, 8–10, and predecessor CK PASS artifacts for GHR-02B and GHR-03A.
- **Checkpoint state:** implementation committed for continued GO work; **not awaiting CK**.
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
| `GHR-03B-RC-02` | Required forged/corrupt/header/wrapper/pin/policy/receiver negatives must persist sanitized `blocked` or `quarantined` outcomes. | The protected-clone test proves body/hash corruption → `quarantined/corrupt_envelope` and disabled policy → `blocked/invalid_policy`; code also fail-closes strict raw parsing, exact route lookup, and false-only receiver rejection. The complete named negative matrix is not yet executed. **IMPLEMENTED_UNPROVEN** |
| `GHR-03B-RC-03` | Restart, lost ACK, duplicate/reordered jobs, concurrent claims, stale/expired leases, classified retries and exhaustion must preserve one terminal receipt. | The protected-clone test proves terminal duplicate acknowledgement and stale-lease re-claim at generation `2`; code retains terminal receipts and fences every update. Restart, concurrent-claim, and retry-exhaustion scenarios still need the ticket-named harness evidence. **IMPLEMENTED_UNPROVEN** |
| `GHR-03B-RC-04` | Every delivery path has zero downstream effect. | Real positive flow asserts unchanged semantic-execution, semantic-candidate, BSS, and non-GHR queue counts; static boundary test rejects downstream dependencies. The full negative matrix remains coupled to RC-02 work. **IMPLEMENTED_UNPROVEN** |
| `GHR-03B-RC-05` | No replay/promotion/fallback/broad write access/sensitive diagnostics. | Migration boundary test proves no Bridge grant on Atlas intent/policy and no Atlas write on Bridge delivery table; delivery uses only sanitized error classes. Full forbidden-surface and role matrix is still pending. **IMPLEMENTED_UNPROVEN** |

## Executed validation

```text
corepack pnpm --filter @atlas/db typecheck                                      PASS
corepack pnpm --filter @atlas/db test:ghr-03b-boundary                          PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                           PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b                       PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a                       PASS
DATABASE_URL=clone GHR03B_REAL_E2E=1 pnpm --filter @atlas/agents-bridge test:ghr-03b  PASS (3 tests)
```

## Remaining GO work

The frozen ticket requires the complete RC-02 negative matrix, RC-03 restart/concurrency/retry-exhaustion proof, and their corresponding RC-04/RC-05 observations. Those rows are implemented but are not yet proven with the required harness. Therefore **Internal readiness: NOT_READY_FOR_CK**. This checkpoint is not a self-issued pass and does not advance the ticket to `awaiting_review`.
