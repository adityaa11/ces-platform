# CK verification: IDSER-009-01 / IDSER-BATCH-09-01

- **Review type:** post-CFC verification
- **Ticket:** `IDSER-009-01-authorized-persisted-lifecycle-read.md`
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `dd5f6cb` (`fix(atlas): close persisted lifecycle read feedback`)
- **CFC checkpoint:** `IDSER-BATCH-09-01-cfc-remediation.md`
- **Original frozen CK artifact:** `IDSER-BATCH-09-01-d6354f7-review.md`
- **Original reviewed commit:** `d6354f7348ac35591c83e1284901a33e36c5a58d`
- **Result:** `PASS`

This is bounded verification of the original frozen clauses, the remediation diff, the evidence required by their closure oracles, and direct regressions introduced by the remediation. No new review finding is added.

## Frozen clause outcomes

| Original clause | Outcome | Verification against its frozen oracle |
|---|---|---|
| `CK-001.a` | **RESOLVED** | `packages/atlas-db/src/project-repository.ts` now requires `completed === completedFacts` for `needs_attention`. The PostgreSQL fixture adds an X/member mismatch with N=2, X=0, one completed member and one failed member and verifies it is omitted; the valid terminal-failure record remains returned with bounded failure facts. |
| `CK-001.b` | **RESOLVED** | The repository now accepts `waiting` only when every member is `pending` or `perception_queued`. PostgreSQL fixtures verify both an active member and a completed member with positive matching X are withheld, while the valid pending/pending record remains returned. |
| `CK-002.a` | **RESOLVED** | The PostgreSQL integration test now asserts N, X, ordered document/member identities, member states, and failure indicators for waiting, processing, terminal failure and completion-gated ready. It retains the failure-payload redaction assertion. |

## Direct remediation regression

No direct regression was found in the behavior changed by this remediation. Valid waiting, processing, terminal-failure and ready records retain the expected typed lifecycle facts; malformed failure counts and contradictory waiting member states fail closed.

## Checks performed

- Confirmed `dd5f6cb` is HEAD and the remediation commit changes only the repository lifecycle validation, its PostgreSQL integration test, and the CFC checkpoint.
- Inspected the diff from `d6354f7` to `dd5f6cb` against the three frozen closure oracles.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — **passed**, 3/3 tests, 0 skipped.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/core typecheck && corepack pnpm --filter @atlas/db typecheck'` — **passed**.
- `git diff --check d6354f7..dd5f6cb` — **passed**.

## Decision

Record `PASS` for IDSER-009-01 / IDSER-BATCH-09-01 at remediation commit `dd5f6cb`. All three original frozen clauses are resolved and no direct remediation regression remains. This verification does not authorize another CFC cycle.
