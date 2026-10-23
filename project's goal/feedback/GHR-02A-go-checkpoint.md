# GHR-02A GO checkpoint

- **Ticket:** GHR-02A — Immutable trusted issuance records and false-only route-policy authority
- **State:** `awaiting_review`
- **Implementation/review target:** `5bdac8c2` — `feat(db): add GHR immutable issuance seam`
- **Authority:** [GHR-02A frozen ticket](../Backend_Phase/tickets/GHR_Phase/GHR-02A-immutable-issuance-and-route-policy.md) and its incorporated [GHR v0.6 §§5.1, 6, 8–10](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md)
- **Dependency:** GHR-01B CK `PASS` for `0212ee83`, recorded in [its CK review](GHR-01B-0212ee8-review.md).

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-02A-RC-01 | Only the frozen policy permits trusted accepted-NDV1 facts. Forged/mismatched producer, execution, scope identity, route/policy/handler/body-contract/mode selection, disabled/revoked policy, and unsupported contract must fail before persistence. | `packages/atlas-db/migrations/0103_ghr02a_immutable_issuance.sql` constrains and seeds the sole false-only `perception.acceptance` / `NormalizedDocumentAccepted/v1` → `semantic/batch-plan` `v1` policy. `packages/atlas-db/src/generic-handoff-issuer.ts` accepts no caller route/pin/mode field, verifies the frozen producer and payload execution identity, and queries only an enabled/unrevoked exact policy. `pnpm --filter @atlas/db test:ghr-02a` passed the positive issuance, forged-producer, mismatched-execution, disabled-policy, and same-key-divergence PostgreSQL cases. | PROVEN |
| GHR-02A-RC-02 | Persisted intent keeps immutable trusted header/pins, exact false-wrapper bytes/hash, and stable idempotency; body/hash mutation and same-key divergence reject. | `generic-handoff-issuer.ts` builds only `{"can_continue":false,"payload":<canonicalSemanticBatchPlanInputV1 bytes>}` and hashes those bytes. Migration `0103` limits the wrapper to 2,081 bytes, stores the header/pins/hash/bytes, and rejects all intent update/delete mutations. The focused PostgreSQL test proved exact byte/hash parity, replay returning the original handoff, conflicting body rejection, and a rejected body-hash update. | PROVEN |
| GHR-02A-RC-03 | `atlas_app` writes policy/intent; `agents_bridge` has only known-handoff read access and cannot write Atlas records. No Bridge delivery state exists. | Migrations `0103`/`0104` make both Atlas tables `atlas_app`-owned, revoke Bridge table access, and expose only `atlas.read_generic_handoff_dispatch_v1(handoff_id)` to `agents_bridge`. The focused PostgreSQL test proved the Bridge function read, denied direct select/insert, and confirmed `bridge.generic_handoff_delivery` is absent. | PROVEN |
| GHR-02A-RC-04 | No acceptance-path call, pg-boss, queue/job, worker, receipt, resolver, or domain side effect exists. | `packages/atlas-db/tests/ghr-02a-boundary.test.mjs` passed and rejects queue/worker/receipt/resolver/semantic-parser or Perception-authority coupling; it also confirms the migration creates neither pg-boss work nor delivery state. The PostgreSQL test observed zero `atlas-generic-handoff-v1` jobs. `pnpm --filter @atlas/db typecheck` and `pnpm --filter @atlas/agents-bridge typecheck` passed. | PROVEN |

## Validation record

Executed against the local Compose PostgreSQL database after applying the two GHR-02A migrations:

```text
pnpm --filter @atlas/db typecheck                  PASS
pnpm --filter @atlas/db test:ghr-02a-boundary      PASS (1 test)
pnpm --filter @atlas/db test:ghr-02a               PASS (1 PostgreSQL integration test)
pnpm --filter @atlas/db migration:check            PASS
pnpm --filter @atlas/agents-bridge typecheck       PASS
git diff --check                                   PASS
```

## Scope and handoff

The target adds only immutable Atlas-owned policy/intent persistence, the transaction-required issuer seam, exact false-wrapper serialization, and the narrow Bridge function-only read seam. It does not alter `PostgresPerceptionAuthority.deliver()`, publish pg-boss work, create a Bridge delivery table, invoke a parser/receiver/resolver, or add `can_continue=true` behavior.

Internal readiness: READY_FOR_CK
