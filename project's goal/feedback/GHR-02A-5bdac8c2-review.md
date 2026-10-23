# GHR-02A CK review

- **Ticket:** GHR-02A — Immutable trusted issuance records and false-only route-policy authority
- **Batch:** GHR-02A checkpoint; no separate batch identifier is declared by the frozen ticket or GO artifact.
- **Ticket state at review:** `awaiting_review`
- **Reviewed commit:** `5bdac8c23845e4a2b2a3c3eea9a1707446af2edb` — `feat(db): add GHR immutable issuance seam`
- **Frozen ticket:** [GHR-02A immutable issuance and route policy](../Backend_Phase/tickets/GHR_Phase/GHR-02A-immutable-issuance-and-route-policy.md)
- **Source authority:** incorporated GHR v0.6 §§5.1, 6, and 8–10 in [the GHR implementation context](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md)
- **GO checkpoint:** [GHR-02A GO checkpoint](GHR-02A-go-checkpoint.md)
- **Dependency:** GHR-01B CK `PASS` for `0212ee83`, recorded in [its CK review](GHR-01B-0212ee8-review.md)

## Review preconditions

The GO checkpoint records `awaiting_review` and review target `5bdac8c2`. The
target resolves to the recorded implementation commit. The current worktree
contains unrelated pre-existing tracked and untracked changes, but none touch
the GHR-02A implementation, ticket, or GO checkpoint paths; the review target
is therefore unambiguous and is limited to the committed GHR-02A revision.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-02A-RC-01 | Only the frozen false-only policy permits an internal trusted accepted-NDV1 facts request. Forged or mismatched producer/execution/scope facts, route or pin selection, body contract or mode, unsupported contract, and disabled/revoked policy must fail before persistence. | `packages/atlas-db/migrations/0103_ghr02a_immutable_issuance.sql` constrains and seeds the sole `perception.acceptance` / `NormalizedDocumentAccepted/v1` → `semantic/batch-plan`, `v1`/`v1`, `SemanticBatchPlanInput/v1`, `can_continue=false` policy. `packages/atlas-db/src/generic-handoff-issuer.ts` fixes route/pins/mode, validates producer and payload execution identity, uses the existing canonical five-field serializer, and queries only the exact enabled/unrevoked policy. The PostgreSQL integration test passed positive issuance, forged-producer, mismatched-execution, disabled-policy, same-key-divergence, and persistence assertions. | PROVEN |
| GHR-02A-RC-02 | Persisted intent must retain immutable trusted header/pins, exact false-wrapper bytes/hash, and stable idempotency; mutation and same-key divergence must reject. | `generic-handoff-issuer.ts` constructs only `{"can_continue":false,"payload":<canonical payload>}` and hashes those exact bytes. The migration bounds the wrapper at 2,081 bytes, stores the header/pins/hash/bytes, and installs update/delete rejection triggers. The PostgreSQL integration test passed exact byte/hash parity, replay returning the original handoff, conflicting-body rejection, and rejected body-hash mutation. | PROVEN |
| GHR-02A-RC-03 | `atlas_app` writes policy/intent; `agents_bridge` has only known-handoff read access and cannot write either Atlas record. No Bridge delivery state may exist. | Migrations `0103`/`0104` make both Atlas tables `atlas_app`-owned, revoke Bridge table access, grant only `atlas.read_generic_handoff_dispatch_v1(text)`, and grant schema usage required to invoke it. The PostgreSQL integration test passed the known-handoff function read, denied direct select/insert, and confirmed `bridge.generic_handoff_delivery` is absent. | PROVEN |
| GHR-02A-RC-04 | The focused implementation must have no acceptance-path call, pg-boss, queue/job, worker, receipt, resolver, or domain side effect. | `packages/atlas-db/tests/ghr-02a-boundary.test.mjs` passed its static dependency and migration boundary assertions. The PostgreSQL integration test observed no `atlas-generic-handoff-v1` jobs. The commit changes only the two migrations, issuer/export/script wiring, and focused tests; no acceptance path is modified. Both package typechecks passed. | PROVEN |

## Validation record

Executed against the review workspace and the local PostgreSQL database with the
repository's configured environment:

```text
pnpm --filter @atlas/db typecheck             PASS
pnpm --filter @atlas/agents-bridge typecheck PASS
pnpm --filter @atlas/db test:ghr-02a-boundary PASS (1 test)
pnpm --filter @atlas/db test:ghr-02a        PASS (1 PostgreSQL integration test)
pnpm --filter @atlas/db migration:check     PASS
git diff --check 5bdac8c2^ 5bdac8c2          PASS
```

## Frozen Finding Closure Matrix

No blocking findings were identified. There are no `CK-###` findings or
closure clauses to freeze.

## Scope-change observations

None. No ticket change, new dependency/runtime/deployment target,
architecture/product decision, unresolved policy, or predecessor reopening is
required for this checkpoint. Acceptance-path activation, pg-boss publication,
Bridge delivery state, receiver/parser work, and `can_continue=true` remain
outside GHR-02A and are not conditions of this review.

## Decision

**PASS** — all four ticket-derived Review Contract rows are proven, required
validation passed, and no direct in-scope regression was identified.
