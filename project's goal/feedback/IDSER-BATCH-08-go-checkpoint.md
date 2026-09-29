# GO checkpoint: IDSER-008 / IDSER-BATCH-08

- Ticket: `IDSER-008-bundle-completion-and-failure-lifecycle.md`
- Ticket state: `awaiting_review`
- Consumed HMN authorization: `HMN-IDSER-008-002` (`RETURN_TO_GO`)
- Implementation commit: this GO handoff commit (the repository commit named in the CK handoff).

## Changes

- Added atomic final reconciliation completion validation and review-ready bundle/workspace transition.
- Added durable authenticated semantic and perception technical-failure transitions to `needs_attention`; staged successful results remain replayable.
- Registered the omitted `0019` predecessor migration before `0020` and added the completion-lifecycle migration.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence | Status |
|---|---|---|---|
| RC-001 | Mandatory completion gate; AC-23/27/31/32; REV-READY-IDSER-008-01. Independently enforce manifest, member/stage/execution, candidate/evidence/reference, active-stage, accepted-state and Master conditions in the final transaction. | `reconciliation-acceptance.ts`; Compose `test:reconciliation-acceptance` mutates manifest/count/member/perception/execution/active-stage/Master conditions and proves rollback, then valid atomic transition and replay. | PROVEN |
| RC-002 | Lifecycle rules; AC-28/29; REV-READY-IDSER-008-02. Authenticated technical failure persists safe attention state; failure cannot regress completion; outage leaves Bridge replay responsibility. | `semantic-authority.ts`, `perception-authority.ts`, authenticated Compose route assertions in `semantic-authority.integration.test.ts`; semantic failure/race and perception provider-timeout state are persisted and forged scope is rejected. | PROVEN |
| RC-003 | Validation and REV-READY-IDSER-008-03. Preserve candidate-only reviewable state, empty Master and no downstream authority. | PostgreSQL constraints plus completion test observe candidate state cannot become accepted and Master cannot leave `empty`; handler only writes Atlas incoming lifecycle tables. | PROVEN |

## Validation

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/contracts typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core test` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:semantic-authority` — passed, 1/1 Compose PostgreSQL integration.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed, 1/1 Compose PostgreSQL + pg-boss integration.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check` and `git diff --check` — passed.

Internal readiness: READY_FOR_CK
