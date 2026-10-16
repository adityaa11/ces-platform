# CFC Checkpoint — BSS-V2-006-03A-03 / CK-001.d

- **Ticket:** `BSS-V2-006-03A-03` — Scoped runtime pressure and bounded probe recovery
- **Batch:** `BSS-V2-BATCH-06-03A-03`
- **State:** `awaiting_review`
- **Original CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-03A-03-ace06af-review.md`
- **Post-CFC CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-03A-03-c07a802-verification.md`
- **Reviewed base:** `c07a80285dd6010d4e2041fce1b176f0b505b248`
- **Bounded remediation commit:** `bb3b514` — `fix(admission): retain unrecovered domain pressure after cooldown`
- **HMN authorization consumed:** `HMN-BSS-V2-006-03A-03-001` from `project's goal/feedback/BSS-V2-BATCH-06-03A-03-hmn-001.md`
- **Authorized clause:** `CK-001.d` only

## CFC working progress view

| Clause | Status | Evidence locator | Frozen oracle |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` carried forward | Existing seven-test focused suite, including shared/independent-domain and route-only isolation scenario | Preserved from the prior CFC checkpoint; not reopened |
| `CK-001.b` | `PROVEN` carried forward | Existing seven-test focused suite, including trusted Retry-After, metadata-free cooldown, and missing-policy fail-closed assertions | Preserved from the prior CFC checkpoint; not reopened |
| `CK-001.c` | `PROVEN` carried forward | Existing seven-test focused suite, including fresh-connection durable probe claim and no recursive job assertion | Preserved from the prior CFC checkpoint; not reopened |
| `CK-001.d` | `PROVEN` | `provider-route-bound-operational-runtime.integration.test.ts:289-365`; forward correction at `0056_bssv200603a_post_cooldown_domain_pressure_clamp.sql:4-23` | Unrecovered qualified domain pressure remains clamped after cooldown; probe claim does not recover; invalid feedback is non-lifting; matching recovery alone lifts the clamp |

## Required validation and exact outcomes

| Required command / validation | Outcome |
| --- | --- |
| Fresh disposable database: `corepack pnpm --filter @atlas/db migrate` | PASS; applied migration `0056_bssv200603a_post_cooldown_domain_pressure_clamp` |
| Fresh disposable database: `corepack pnpm --filter @atlas/db migration:check` | PASS |
| Incremental reviewed-base setup through `0051_bssv200603a_pressure_cfc_closure`, then `corepack pnpm --filter @atlas/db migrate` | PASS; real migration system applied only `0056` after the reviewed base |
| Incremental database: `corepack pnpm --filter @atlas/db migration:check` after `0056` | PASS |
| `corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts` | PASS: 8 tests, 8 passed, 0 failed; includes all seven existing tests plus the post-cooldown regression |
| `corepack pnpm --filter @atlas/db typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `git diff --check` | PASS |

## Exact closure evidence

The added scenario creates two server-selected routes in one canonical shared
domain and one independent domain. Before cooldown expiration, the persisted
incident has `recovered_at = NULL` and `numeric_remaining_units = 0`, the
effective shared TPM capacity is `0`, both shared routes return `unavailable`
with null reservations, and no shared-domain job is created. The independent
domain returns `admitted`.

After deterministic cooldown expiration, the same incident identity remains
unrecovered with numeric remaining capacity `0`; effective shared TPM remains
`0`, both shared routes remain denied, and the job count does not increase for
denied work. One probe claim succeeds, the second fails, `probe_claimed_at` is
durable, and `recovered_at` remains `NULL`.

Stale, malformed, wrong-dimension, and higher numeric feedback remain
non-lifting. Matching qualified recovery returns `true`, repeated recovery
returns `false`, effective TPM returns only to the approved plan value `20`,
and ordinary shared admission then returns `admitted`.

## Direct regressions and scope locks

- `CK-001.a`, `CK-001.b`, and `CK-001.c` remain protected and were rerun in the same focused suite.
- No previously applied migration was rewritten; the correction is forward-only in `0056`.
- Route-only pressure remains route-local; no domain-wide clamp or fallback is fabricated for it.
- No scheduler, retry loop, provider fallback, unrestricted probe transport, or BSS-005 plan publication change was added.

Internal readiness: `READY_FOR_CK`

The bounded CFC pass is complete. Stop for one independent CK verification; do
not start another CFC cycle automatically.
