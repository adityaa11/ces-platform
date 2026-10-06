# CK review: IDSER-009-03-02 / IDSER-BATCH-09-03-02

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `746ba16fb734ae1dd245172cc6d0edb27746365b`
- **GO checkpoint:** `IDSER-BATCH-09-03-02-go-checkpoint.md`
- **Review type:** First consolidated CK review
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Required behavior and proof | Status |
|---|---|---|---|
| RC-009-03-02-01 | Ticket, Preserve IDSER-003 transactional kickoff | Compose project-creation integration observes waiting bundle, queued D1, X=0, durable job, and rollback after enqueue failure. | PROVEN by the GO checkpoint's recorded project-repository Compose suite and committed integration assertions. |
| RC-009-03-02-02 | Ticket, Frozen lifecycle rule and selected seam | Authenticated, exact-scope first redemption activates the exact D1 pair in the redemption transaction before source release. | PROVEN by the committed transaction ordering and the recorded Compose route/worker integration. |
| RC-009-03-02-03 | Ticket, Activation, replay, and negative authority | Reject the specified invalid credential, grant, execution, document, scope, and terminal cases without lifecycle mutation; active replay preserves progress and unrelated/terminal state. | UNRESOLVED; see CK-001 and CK-002.a. |
| RC-009-03-02-04 | Ticket, Deterministic test-only waiting proof | With the existing Compose worker stopped, real authenticated creation remains waiting on the production card; valid redemption makes that same card Extracting; cleanup restores the worker. | IMPLEMENTED_UNPROVEN; see CK-002.b. |

The GO checkpoint records these validations as passing:

- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository && corepack pnpm --filter @atlas/db test:perception-authority'` — 3/3 and 1/1.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/agents-bridge && corepack pnpm exec jiti tests/perception-integration.test.ts'` — 2/2.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck'` — passed.
- `git diff --check` — passed.

This review inspected the committed implementation, tests, ticket, and recorded checkpoint; it did not rerun those commands.

## Findings

### CK-001 — Redemption accepts an execution with no matching bundle member

**Authority:** Ticket section “Activation, replay, and negative authority” requires the grant/execution to link to the exact D1 member and same project/workspace/bundle. Its explicit negative matrix requires rejection of a valid grant whose execution has no matching D1 member in that scope.

**Unsatisfied evidence:** In `packages/atlas-db/src/perception-authority.ts`, the redemption query uses `LEFT JOIN` for the bundle member. When no member is found, the `row.bundle_id === null` branch explicitly continues to source release. Thus a valid grant for an execution without a matching D1 member is accepted, contrary to the ticket's explicit negative case. The standalone no-bundle path in `perception-authority.integration.test.ts` exercises this accepted behavior; it does not satisfy the new ticket's scope rule.

### CK-002 — Required negative and production-card observations are not proven

**Authority:** Ticket Review Contract rows `RC-009-03-02-03` and `RC-009-03-02-04`; “Activation, replay, and negative authority”; and “Deterministic test-only waiting proof.”

**Unsatisfied evidence:** The committed perception integration test checks pre-worker waiting rows and eventual pipeline progression, but it does not prove the complete ticket-named negative matrix with lifecycle before/after snapshots or the required same-project production-card transition. Its fixture inserts project, bundle, and member rows directly; the test does not stop `agents-bridge-worker` before authenticated project creation, assert the production card label `Waiting for extraction`, redeem the created project's valid job, and assert that card becomes `Extracting`.


## Frozen Finding Closure Matrix

| Finding / clause | Exact ticket authority | Unsatisfied evidence | Observable correction and binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|
| CK-001.a | “Activation, replay, and negative authority”: exact D1 member/same project-workspace-bundle binding; reject a valid grant with no matching member or a different bundle. | `redeem()` continues when the left join yields no member/bundle and proceeds to update the execution and return the protected source. | **PASS iff** a valid grant whose execution has no matching D1 member, and a valid grant whose associated member/bundle does not satisfy the exact scope join, are rejected before source release and leave all affected bundle/member lifecycle rows unchanged. Prove in the Compose PostgreSQL authority/route harness with before/after snapshots for the affected and unrelated lifecycle rows. | Source-grant redemption and the bundle/member activation transaction only; do not expand into semantic/pipeline failure behavior. |
| CK-002.a | `RC-009-03-02-03`; negative matrix in “Activation, replay, and negative authority.” | Existing assertions cover wrong service credential, wrong execution, selected artifact metadata mismatches, and an expired-grant worker outcome. They do not demonstrate the full required applicable matrix with unchanged target and unrelated lifecycle rows; the no-member case is CK-001.a. | **PASS iff** the Compose PostgreSQL authority/route integration rejects each applicable non-membership case named by the ticket—wrong service credential; forged/tampered, expired, or revoked/missing persisted grant; stale/terminal execution; execution/artifact/source metadata mismatch, including wrong document—and before/after snapshots show target and unrelated lifecycle rows unchanged. The same evidence must show valid active replay preserves start time/progress and does not regress a progressed or terminal bundle/member. Evidence is the focused committed Compose integration assertions and recorded passing command. | Grant validation, execution/document binding, replay, and bundle/member activation only; no expansion into semantic/pipeline failure behavior. |
| CK-002.b | `RC-009-03-02-04`; “Deterministic test-only waiting proof.” | `apps/agents-bridge/tests/perception-integration.test.ts` seeds lifecycle rows directly and asserts waiting persisted state, then observes later worker progression. The evidence does not establish the required real authenticated project-create/card path or either required card label, nor the worker-stop/cleanup orchestration for that focused path. | **PASS iff** a focused Compose test pauses the existing worker before real authenticated project creation, observes the committed queued facts and production card `Waiting for extraction`, then drives that same project's scope-valid D1 execution through the authenticated source route and observes persisted activation plus production card `Extracting`; cleanup restores the worker even on failure. Evidence is the focused integration test and its passing Compose command. | Creation-to-activation lifecycle and its production card labels only; visual matrix, loading/error, collapsed-shell, and other IDSER-009-04 proof remains out of scope. |

## Decision

`CHANGES_REQUIRED`. CK-001.a is an implementation-repairable violation of the explicit scope-negative requirement. CK-002.a and CK-002.b are missing ticket-required proof in the named Compose harness. The committed checkpoint does not yet satisfy all four frozen Review Contract rows. The frozen clauses above are the complete closure target for any bounded remediation; no additional acceptance conditions are implied.
