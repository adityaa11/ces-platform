# GO checkpoint — BSS-V2-005-05-03

- **Ticket:** BSS-V2-005-05-03 — Authorized desired-plan convergence
- **Batch:** BSS-V2-BATCH-05-05-03
- **State:** `awaiting_review`
- **Implementation commit:** `445c6366a8ca5483cdb8950d2e82b184881e4733` (`feat(admission): converge authorized desired plans`)
- **Authority:** frozen ticket `BSS-V2-005-05-03`, including its explicit `BSS-V2-005-05` split-map reference and the accepted BSS-V2-005-04 publication seam.

## Bounded implementation

Migration `0067_bssv20050503_authorized_desired_plan_convergence` adds the
Bridge-owned `publish_converged_desired_admission_profile` wrapper. It accepts
only an existing qualified capacity-profile version and active, exact
process/workload bindings; computes a canonical effective-input fingerprint;
uses the existing per-domain 005-04 advisory-lock/activation seam; preserves
immutable published versions; returns `unchanged` for an active identical
fingerprint and `stale` for a superseded writer. It does not author capacity,
create 03A intents, enqueue wakeups, reserve/dispatch work, or invoke a
provider.

`resolve_versioned_planning_envelope` is a read-only planning observation. It
returns version-bound `stale`, `unfit`, or `qualified` evidence for the active
plan and exact process/workload identity. It does not add a generic replan
semantic path. The real durable wakeup/worker proof remains deliberately owned
by `BSS-V2-005-05-04`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-00505-03a` | A qualified effective registry/workload/policy input publishes one immutable plan through the 005-04 per-domain fence; identical active input is a no-op; stale writer cannot overwrite a newer activation; registration alone is not activation authority. | `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts` uses the existing `planDesiredAdmissionProfile`, publishes through `bridge.publish_converged_desired_admission_profile`, asserts revisions 1/2, one identical-input activation row, no active plan after an unselected registration, and one `published` plus one `stale` competing expected-revision result. `pnpm --filter @atlas/db test:authorized-desired-plan-convergence` — PASS. | `PROVEN` |
| `RC-00505-07a` | An already-qualified provenance-bound capacity-profile revision, including a lower limit, deterministically recomputes and activates through 005-04; an operational intent is not capacity publication authority. | The focused integration publishes `capacity-v2` with lower TPM and receives activation revision 2. It proves the pseudo-version `capacity_revision_request` is rejected as a missing qualified profile. The wrapper reads only immutable `bridge.provider_capacity_profile` versions and exposes no feedback/intents input. Same command — PASS. | `PROVEN` |
| `RC-00505-08` | A structural downgrade produces versioned stale/unfit evidence only for the affected envelope; unrelated eligible work remains live; no consumer mutation or generic semantic replan is added. | The focused integration asserts the old semantic plan is `stale`, the lowered semantic v2 envelope is `unfit`, and the chat envelope remains `qualified`. It also asserts zero new `bridge.provider_work_attempt` records. Same command — PASS. | `PROVEN` |

Additional regression evidence:

- `pnpm --filter @atlas/db migration:check` — PASS.
- `pnpm --filter @atlas/db test:desired-admission-profile-publication` — PASS (005-04 immutable publication/atomic-cutover regression).
- `pnpm --filter @atlas/db typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts` — PASS, 3/3.
- `git diff --check` — PASS before the implementation commit.

Internal readiness: READY_FOR_CK

This is implementation readiness only, not a self-issued CK `PASS`.
