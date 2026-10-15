# CK review — BSS-V2-005-04

- **Ticket:** `BSS-V2-005-04` — Versioned DesiredAdmissionProfile publication and cutover
- **Batch:** `BSS-V2-BATCH-05-04`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-04-desired-admission-profile-publication.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-05-04-go.md`
- **Reviewed commit:** `d25a08d59e28162c062d458f80c1bb1609e772d7` (`feat(admission): publish versioned desired profiles`)
- **Review type:** first consolidated review

## Review target and authority

The ticket is `awaiting_review`, and its GO checkpoint is committed in the reviewed commit. `HEAD` matches `d25a08d59e28162c062d458f80c1bb1609e772d7`. The worktree contains unrelated modified and untracked files, but none overlap the committed BSS-V2-005-04 implementation, ticket, or GO checkpoint paths; the review target is therefore unambiguous.

The frozen ticket's five Review Contract rows, its explicit Bridge role/security bindings, and the incorporated planning authority are the complete acceptance contract. The review is limited to immutable Bridge operational profile publication, atomic activation/read, activation revision history, the BSS-V2-006 plan-change seam, role boundaries, and the hard stop against admission/dispatch. No future provider, runtime, deployment, or dependency work is required.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00504-01` | PROVEN | `packages/atlas-db/migrations/0029_bssv200504_desired_admission_profile_publication.sql:2-35` defines immutable versioned profiles and exact capacity/process/workload references; `:57-68` rejects mutation; `:136-143` resolves one complete active profile. The focused integration test publishes `plan-v1`, retains it after `plan-v2`, and verifies the active version/capacity. |
| `RC-BSSV2-00504-02` | PROVEN | `...0029...sql:100-133` serializes activation per quota domain, validates the profile and version-bound inputs, appends activation history, and updates the active pointer in one transaction. Composite foreign keys and the exact process-to-workload trigger fail closed for invalid references. The integration test proves missing profile/capacity rejection and that the active pointer remains on `plan-v1`. |
| `RC-BSSV2-00504-03` | PROVEN | `...0029...sql:83-98,124-131` keeps append-only activation history and computes a locked monotonic revision. The integration test proves distinct `plan-v1`/`plan-v2` versions, revisions `1`/`2`, and distinct effective times without mutating the prior activation. |
| `RC-BSSV2-00504-04` | PROVEN | `...0029...sql:70-143` exposes the active pointer plus append-only activation history as the transaction-capable change seam and contains no admission/provider dispatch path. The integration test compares `pgboss.job` before/after cutover and observes no new job. |
| `RC-BSSV2-00504-05` | PROVEN | All four new relations are in `bridge.*` and owned by `agents_bridge`; the live role check confirms `agents_bridge` can access them, `atlas_app` cannot, and only `agents_bridge` can execute the activation/read functions. The migration introduces no Atlas trusted/domain/customer-entitlement relation. |

## Validation and evidence

Executed during CK against the running local PostgreSQL service:

```text
pnpm --filter @atlas/db migration:check — PASS
pnpm --filter @atlas/db test:desired-admission-profile-publication — PASS (1 test, 0 failures)
pnpm --filter @atlas/db test:provider-capacity-catalogue — PASS (1 test, 0 failures)
pnpm --filter @atlas/db test:process-workload-catalogue — PASS (1 test, 0 failures)
pnpm --filter @atlas/db typecheck — PASS
pnpm --filter @atlas/agents-bridge typecheck — PASS
git diff d25a08d^ d25a08d --check — PASS
```

The committed GO checkpoint additionally records the migration application, the same focused validation, and zero provider calls/admission/dispatch operations. The live database inspection confirmed the expected Bridge table ownership and role grants/denials. No provider call, admission, dispatch, second broker, or Atlas-domain write was observed or introduced by the reviewed diff.

## Frozen Finding Closure Matrix

No implementation-repairable findings were identified. There are no CK clauses to freeze.

## Scope-change observations

None. No product, policy, architecture, runtime, deployment, or dependency decision is needed to decide this ticket-bound review.

## Decision

`PASS`. All five ticket-derived Review Contract rows are proven, required validation passes, the Bridge role boundary is preserved, and the hard stop against provider admission/dispatch is satisfied.
