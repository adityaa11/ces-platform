# BSS-V2-BATCH-06-05-03 CFC checkpoint

- **Ticket:** `BSS-V2-006-05-03` — Authenticated effective-capacity snapshot
- **Ticket state:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-05-03`
- **Remediation authority:** user-invoked `cfc BSS-V2-006-05-03` following the first consolidated `CHANGES_REQUIRED` review.
- **Frozen CK source:** `project's goal/feedback/BSS-V2-BATCH-06-05-03-f130e30-review.md`
- **Reviewed base:** `f130e3043c430e852bfdbf1d51ceaf351af623e4`
- **Remediation commit:** this bounded checkpoint's commit (`test(capacity): close planning snapshot review evidence`)
- **Result:** `awaiting_review`

## CFC working progress and closure evidence

The frozen CK closure matrix remains the authority for all requirements and
oracles. This pass changes only
`apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts`; all
unrelated workspace changes were preserved.

| Authorized clause | Status | Evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | The public-route integration test issues a request without `Authorization`, asserts the fail-closed non-permit snapshot, and compares operational counters before/after. | `apps/agents-bridge> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/capacity-planning-snapshot.integration.test.ts` — PASS (1/1). | Passed: no-header request returns the fail-closed non-permit snapshot and produces zero attempts, reservations, jobs, sends, and quota-state deltas. |
| `CK-001.b` | `PROVEN` | The same transaction-scoped public-route fixture adds a capacity profile with no effective policy and a separately revoked policy; both requests assert stale fail-closed non-permit snapshots and per-domain zero counters. | Same focused PostgreSQL-role command — PASS (1/1). | Passed: missing policy returns `effective_policy_missing`; revoked/unavailable policy returns `effective_policy_unavailable`; both are non-qualified and zero-effect. |
| `CK-001.c` | `PROVEN` | The positive public snapshot assertion now covers migration-0076 source provenance, full policy identity and RPM/TPM/RPD/concurrency decisions, process/workload versions, structural/estimator identities, and inactive `plan: null`. | Same focused PostgreSQL-role command — PASS (1/1). | Passed: the exact Anoman source, enforcement, structural, estimator, process/workload, and inactive-plan identity is present. |

## Direct regressions

```text
corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
corepack pnpm --filter @atlas/db typecheck             PASS
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/service.test.ts  PASS (7/7)
packages/atlas-db> node --env-file=../../.env scripts/migrate.mjs --check    PASS
git diff --check                                                              PASS
```

All authorized clauses are `PROVEN`; the required PostgreSQL-role public-route
harness passed, and the remediation creates no direct regression outside the
Bridge planning-snapshot reader boundary.

Internal readiness: `READY_FOR_CK`.

## Handoff

This is one bounded remediation for frozen clauses `CK-001.a` through
`CK-001.c`. The ticket remains `awaiting_review` for CK verification. CFC
does not issue `PASS` or start another remediation cycle.
