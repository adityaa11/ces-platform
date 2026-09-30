# GO checkpoint: IDSER-009-01 / IDSER-BATCH-09-01

- Ticket: `IDSER-009-01-authorized-persisted-lifecycle-read.md`
- Ticket state: `awaiting_review`
- Implementation commit: this GO handoff commit.

## Changes

- Added a persistence-neutral authorized lifecycle read contract containing project/workspace/bundle identities, immutable `N`/`X`, typed member facts and a bounded technical-failure signal.
- Replaced the PostgreSQL home read with a membership-first query and fail-closed validation of workspace, bundle, count, member sequence/state and completion-gate combinations.
- Kept legacy no-bundle records explicit, withheld malformed or inconsistent bundle-backed records, and never returned raw failure codes/details.
- Added PostgreSQL integration fixtures for isolation; waiting, processing, failure and ready records; legacy/malformed distinction; and failure-data redaction.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / command | Status |
|---|---|---|---|
| RC-009-01-01 | Membership joins precede the lifecycle read; owner and unrelated user cannot see the same project data. | `project-repository.ts` membership-first query; `project-repository.integration.test.ts` creates owner and unrelated identities. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — pass (3/3). | PROVEN |
| RC-009-01-02 | Valid waiting, processing, terminal technical-failure and completion-gated ready records return typed lifecycle facts, `X` and `N`. | `AuthorizedPersistedLifecycle` and `PersistedLifecycleMemberFact`; PostgreSQL fixture assertions in `project-repository.integration.test.ts`. Same Compose command — pass (3/3). | PROVEN |
| RC-009-01-03 | Legacy PCC no-bundle/no-downstream records are explicit; missing or inconsistent bundle-backed records fail closed. | Legacy and malformed-count fixtures in `project-repository.integration.test.ts`; repository rejects duplicate/invalid bundle rows before projection. Same Compose command — pass (3/3). | PROVEN |
| RC-009-01-04 | Invalid `N`/`X`/member/workspace combinations and raw failure detail cannot cross as valid lifecycle data. | Validation guards in `project-repository.ts`; malformed fixture withheld and failure serialization assertion excludes raw provider/failure fields. Same Compose command — pass (3/3). | PROVEN |

## Validation

- `docker compose ps` — PostgreSQL healthy.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed, 3/3 PostgreSQL integration tests.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/core typecheck && corepack pnpm --filter @atlas/db typecheck'` — passed.
- Host typechecks were diagnostic-only and unavailable because `tsc` is absent from the host checkout; Compose supplied the authoritative validation.

Internal readiness: READY_FOR_CK
