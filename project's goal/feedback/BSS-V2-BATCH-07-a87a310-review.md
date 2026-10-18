# CK review — BSS-V2-007

- **Ticket:** `BSS-V2-007` — Authenticated internal receiving boundary (narrow reusable contract)
- **Batch:** `BSS-V2-BATCH-07`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-007-reusable-receiving-authorization-boundary.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-07-go-checkpoint.md`
- **Reviewed commit:** `a87a31021b65d850d5c7df94c149051dab63d520` (`feat(bss): add internal receiving boundary`)
- **Parent/base:** `5bf318591442033a4fbe03915f103e0911e10343`
- **Checkpoint HEAD:** `27e90042f79f56fd8ae630ae30f783d9fe9f1cf3` (later GO documentation-only update)
- **Review type:** first consolidated review

## Review target and authority

The active-ticket tuple is unambiguous from the explicit user instruction and
the ticket/GO records. The ticket is `awaiting_review`, the GO checkpoint names
the reviewed implementation commit, and that commit is an ancestor of the
checkpoint HEAD. The implementation diff from the recorded base is limited to
the Atlas Core public export, the new receiving-boundary module, its focused
tests, package test wiring, and the ticket/checkpoint records. The current
worktree has unrelated dirty and untracked paths; none overlaps the reviewed
implementation or checkpoint paths, so the target is not ambiguous.

Authority is the frozen BSS-V2-007 ticket, including its exact TypeScript API,
five-row CK Review Contract, ownership/forbidden-implementation boundaries,
and explicit direct-route regression requirement. Approved predecessor work is
used only for the named route regressions and is not reopened.

## Review Contract outcomes

| Row | Status | Independent evidence |
| --- | --- | --- |
| `RC-BSSV2-007-01` | `PROVEN` | `packages/atlas-core/src/internal-receiving-boundary.ts` matches the binding API, exports are present in `src/index.ts`, short configured secrets fail fast, and equal-length credentials use `timingSafeEqual` after a byte-length check. Focused tests and typecheck pass. |
| `RC-BSSV2-007-02` | `PROVEN` | Focused tests show missing, wrong, and unequal-length credentials reject before parser/redeem counters change; valid credentials invoke parsing then redemption once per call. The implementation creates no permit, context, or token. |
| `RC-BSSV2-007-03` | `PROVEN` | The focused test composes the same factory into distinct plan and report receivers with strict parsers and separate authorization callbacks; ineligible inputs are rejected and no protected result is returned. |
| `RC-BSSV2-007-04` | `PROVEN` | The replay test invokes the same authorized read twice and observes two parser/redemption executions. The module contains no TTL, replay ledger, grant, assignment, revocation, or delivery state and makes no per-job/GHR claim. |
| `RC-BSSV2-007-05` | `PROVEN` | The full `@atlas/core` suite passes, including the existing perception and semantic internal-route tests with active delivery side-effect assertions. The reviewed diff contains no migration, Bridge DB, provider, queue, or persisted-truth path. |

## Validation and evidence

Validation was run in the shared worktree. The implementation and tests are
unchanged from the reviewed commit; the only later target-path change is the
GO record's commit identifier.

| Exact command | Result |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 31 tests, 0 failures, including 4 receiving-boundary tests and the preserved perception/semantic route tests |
| `git diff --check a87a3102^ a87a3102` | PASS |
| `git merge-base --is-ancestor a87a3102 HEAD` | PASS — reviewed commit is the checkpoint ancestor |
| `git diff --name-only a87a3102^ a87a3102` | PASS — only the bounded implementation, tests, package wiring, ticket, and GO checkpoint are in the reviewed diff |

The route tests use active counters/observations: perception delivery records
`deliver`, and semantic delivery records its attempted delivery before the
closed acceptance response. No Compose, database, provider, queue, HTTP-host,
or downstream IDSER validation is required by this frozen library-only ticket.

## Frozen Finding Closure Matrix

No blocking findings were identified. Therefore no `CK-###` finding or closure
clause is frozen for this first review.

## Scope-change observations

None. The reviewed work stays within the ticket's reusable receiving-boundary
module, public export, focused callback-reuse tests, and required direct-route
regressions. Future IDSER background composition, GHR assignment/delivery,
host byte caps/status mapping, and any worker or resolver change remain outside
this checkpoint as the ticket requires.

## Decision

`PASS`

All five ticket-derived Review Contract rows are proven, required validation
passes, and no direct in-scope regression or scope-authority blocker remains.
Publish only the reusable boundary and honor the ticket's hard stop before any
GHR route, new live worker, or IDSER resolver change.
