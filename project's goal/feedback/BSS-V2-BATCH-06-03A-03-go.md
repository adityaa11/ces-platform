# GO Checkpoint — BSS-V2-006-03A-03

- **Ticket:** `BSS-V2-006-03A-03` — Scoped runtime pressure and bounded probe recovery
- **Batch:** `BSS-V2-BATCH-06-03A-03`
- **Authority:** explicit user command `GO BSS-V2-006-03A-03`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-03-scoped-pressure-and-probe-recovery.md`.
- **Predecessors:** 03A-01 CK `PASS` at `BSS-V2-BATCH-06-03A-01-29c7ef3-verification.md`; 03A-02 CK `PASS` at `BSS-V2-BATCH-06-03A-02-7ed97f1-review.md` (approved by commit `4143395`).
- **State:** `awaiting_review`; this is an implementation readiness record, not a CK decision.

## Bounded implementation

- Split the existing uncommitted `0049`–`0051` draft at the ticket boundary. This checkpoint contains only pressure policy, incidents, scoped admission fencing, one durable probe claim, monotonic domain clamps, and matching recovery. Wakeups, replan intents, plan activation, and dispatch consumption remain unmodified for 03A-04.
- Added a Bridge-owned versioned policy and durable incident record. A missing policy creates a non-probeable route hold, so no additional admission/probe transport is enabled by an absent configuration.
- Route-scoped feedback blocks only the attributed route. A numeric clamp is recorded only for qualified domain-scoped feedback with a dimension, physical window identity, and non-negative remaining value; later larger values cannot raise its ceiling.
- Kept BSS-005 as numeric authority: pressure adjusts only the active profile's usable vector for an already-proven domain clamp and never publishes, activates, or recalculates a plan.
- Added a focused PostgreSQL integration scenario for stable incident identity, scope isolation, one probe claim, missing-policy fail-closed behavior, monotonic clamp, and exact trusted recovery.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-03-01` | Shared and independent domain fixtures must preserve one canonical numeric owner; route-only pressure must not create a shared numeric clamp or fallback. | `0049_bssv200603a_pressure_wakeup_convergence.sql` records numeric remaining units only for qualified domain scope; `0050_bssv200603a_route_pressure_admission.sql` applies only those domain values. Focused integration assertion observes route A blocked while B is not, then the sole domain vector clamped. | `PROVEN` |
| `RC-03-02` | Versioned operator policy governs 429 with and without trusted Retry-After; missing policy is fail-closed with no probe or transport. | `record_provider_429_pressure` snapshots configured policy and uses bounded Retry-After or metadata-free cooldown. The focused integration scenario proves an absent policy persists a route hold and denies probe claim. | `PROVEN` |
| `RC-03-03` | A stable incident permits exactly one fresh atomically claimed probe across restart; failure consumes budget and no retry recursion is introduced. | `claim_provider_pressure_probe` locks the persisted incident with `FOR UPDATE SKIP LOCKED` and writes `probe_claimed_at` once. The focused integration test proves first claim succeeds and second fails; no worker/retry loop was added. | `PROVEN` |
| `RC-03-04` | Only matching trusted recovery clears matching pressure; stale, higher, malformed, repeated, or unrelated feedback cannot raise a ceiling or lift an incident. | `0051_bssv200603a_route_pressure_admission_forward_fix.sql` matches domain/route/dimension/window, requires qualified non-future evidence, and has no ceiling-increase path. Focused scenario proves unrelated recovery fails and later higher feedback leaves the clamp unchanged. | `PROVEN` |

## SecurityReadiness

- `SR-03-SCOPE` — route holds and domain clamps are separate; only domain-qualified evidence reaches the numeric vector.
- `SR-03-POLICY` — values remain immutable operator configuration; no defaults, plan rewrite, or provider retry policy was invented.
- `RB-04` — the focused integration covers restart-durable incident state through transactional records, probe exhaustion, invalid scope isolation, monotonic feedback, and matching recovery.

## Validation evidence

Executed against fresh disposable PostgreSQL database `atlas_bssv200603a03_go` after applying the complete registered migration list:

```text
corepack pnpm --filter @atlas/db migrate                                                        PASS
corepack pnpm --filter @atlas/db migration:check                                                PASS
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts  PASS (5 tests)
corepack pnpm --filter @atlas/db typecheck                                                      PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                           PASS
git diff --check                                                                                PASS
```

The focused database test's expected `ROLLBACK` cleanup emits PostgreSQL's harmless “no transaction in progress” warning after its explicit rollback; all five assertions passed.

Internal readiness: READY_FOR_CK
