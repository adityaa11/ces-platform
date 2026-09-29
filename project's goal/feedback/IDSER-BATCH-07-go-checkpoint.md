# GO checkpoint: IDSER-007 / IDSER-BATCH-07

- Ticket: `IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
- Ticket state: `awaiting_review`
- Consumed planning authorization: `HMN-IDSER-007-002` plus
  `IDSER-007-hmn-planning-decision.md` (`RETURN_TO_GO`)
- Implementation commit: this GO handoff commit (`feat(idser): add bounded reconciliation advancement`)
- Scope: bounded incoming reconciliation selection, exact-context result
  validation, relationship persistence, transactional next-document
  perception scheduling, bounded relationship reads, and their PostgreSQL /
  pg-boss evidence only.

## Changes

- Added deterministic Atlas-owned selection of current candidates plus prior,
  completed incoming candidates in the same bundle. Selection uses exact
  `semantic_key` before same-kind expansion, then document sequence and
  semantic ID; Master and accepted-base state are never queried.
- Persisted the selected reconciliation context in the authority transaction,
  and added Atlas-side reconciliation result validation/persistence. Every
  current candidate must be accounted for and every target/evidence reference
  must be from the persisted authorized context.
- Made reconciliation completion transactionally persist proposal rows,
  advance the completed count, and create/enqueue exactly the next perception
  execution through pg-boss. Final completion fails closed pending IDSER-008.
- Added indexed bounded relationship traversal and the required scoped query
  indexes. Production Compose wiring now serves the reconciliation selector
  and handler.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
|---|---|---|---|
| RC-001 | Outcome; Neighborhood selection; AC-17/18; REV-READY-007-01. Current candidates remain complete (max 500); prior incoming scope is same bundle, completed, preceding documents only; deterministic key/kind selection is bounded to 500 / 1,000 / 1 MiB and snapshots to execution. | `reconciliation-selector.ts`; Compose `test:reconciliation-acceptance` proves stored/reused context, exact-first candidate selection, 500-prior overflow, stable canonical IDs, and no accepted-base path. Contract UTF-8/bounds suite covers 500/1,000/1 MiB limits including multibyte data. | PROVEN |
| RC-002 | Result acceptance; AC-21; REV-READY-007-01. Every current candidate has accounting; no invented, unselected, or out-of-scope ID/evidence can persist. | `reconciliation-acceptance.ts`; Compose test rejects an invented canonical target with zero result rows, then accepts only context-bound sources/evidence. Authority context is persisted and replayed by execution ID. | PROVEN |
| RC-003 | Result acceptance; AC-19/20/22; REV-READY-007-03. All ten relationship types persist as incoming proposals, including same-document contradiction/ambiguity; no ordering-based winner/resolution. | Compose test persists all ten types, including `contradicts`, `ambiguous`, `requires_resolution`, and `supersedes`, and observes candidate state remains `candidate`; contract suite validates vocabulary/forms. | PROVEN |
| RC-004 | Outcome; AC-23/24/26; REV-READY-007-02. A reconciliation and only its next perception operation/job commit atomically; replay/concurrency cannot double advance; final completion fails closed until IDSER-008. | Compose test uses real PostgreSQL and `pgboss.job`, concurrently delivers the same result through two Atlas connections, then replays after authority reconstruction: one result, one D2 job, count increment once. It also proves final member rollback when the IDSER-008 validator is absent. | PROVEN |
| RC-005 | Neighborhood/API contract; AC-33/34/35; Validation query evidence. Candidate/evidence/relationship reads are scope-bound and capped at 100 without full PDF/project scans. | `PostgresSemanticCandidateRepository.listRelationships`, migration `0019`; Compose test confirms scoped relationship traversal and wrong-project isolation. SQL indexes cover key/kind/scope, sequence, source and target traversal. | PROVEN |
| RC-006 | Validation and security bindings. No Master mutation, accepted truth, projection runtime, provider scheduling authority, or cross-bundle context leak. | Selector and acceptance implementation access only Atlas-owned incoming bundle tables; test observes incoming `candidate` state after relationship persistence and empty accepted-base context. Production handler remains Atlas-owned; Bridge retains no DB access. | PROVEN |

## Validation

- `corepack pnpm --filter @atlas/db typecheck` — passed.
- `corepack pnpm --filter @atlas/core typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed, 1/1 PostgreSQL + real pg-boss integration.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/contracts test` — passed, 11/11.
- `corepack pnpm --filter @atlas/app build` — passed.
- `git diff --check` — passed.

## Baseline observation

`docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` still reports the pre-existing IDSER-006 Node 24 `Result`-container versus array assertion mismatch at line 139. Per `HMN-IDSER-007-002` and the recorded planning decision, IDSER-006 remains `PASS`; no predecessor repair is included or claimed as passing evidence here.

Internal readiness: READY_FOR_CK
