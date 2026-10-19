# CK verification after HMN-authorized replacement CFC: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Ticket:** `IDSER-012-03-03-02` — GHR output compatibility and composition closure.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`.
- **Reviewed remediation commit:** `cb37faa69b7455a2816c3020d410e893e691235f` (`test(idser): prove replacement output composition clauses`).
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-cfc-replacement-checkpoint.md`.
- **Consumed HMN authorization:** `HMN-IDSER-012-03-03-02-002` in `project's goal/feedback/IDSER-012-03-03-02-hmn-002.md`.
- **Replacement closure authority:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-f0e6953-replacement-contract-freeze.md`.
- **Ticket state at review:** `awaiting_review`.
- **Review type:** bounded verification after an HMN-authorized replacement CFC.
- **Result:** `PASS`.

## Preconditions and review boundary

The committed checkpoint records consumption of `HMN-IDSER-012-03-03-02-002`
and limits its closure matrix to `RCK-001.a` through `RCK-001.e`. Its commit is
the unambiguous current committed remediation target and changes only the
real-PostgreSQL composition evidence plus CFC records. The worktree contains
pre-existing unrelated modified and untracked files, including ticket/amendment
records; they were preserved and do not alter the reviewed commit or the
bounded evidence paths.

This verification checks only the five authorized replacement clauses, their
frozen real-PostgreSQL evidence, the `cb37faa6` diff, and direct regressions.
It does not reopen protected `CK-001.a`, `CK-001.b`, `CK-002.b`, or
`CK-002.c`; it retains historical `CK-002.a` as unresolved history, with only
its superseded portion replaced by the active `RCK` clauses.

## Replacement-clause verification

| Clause | Frozen oracle outcome | Evidence verified |
| --- | --- | --- |
| `RCK-001.a` | **RESOLVED** | The real accepted-source path persists identical immutable input twice and asserts identical persisted plan/handoff results plus exactly one scoped plan row at `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:170-174`. The same harness validates the persisted body before readback at `:175-176`; the passing command below proves no duplicate or mutation in the composed path. |
| `RCK-001.b` | **RESOLVED** | The harness persists the authorized changed asset, BSS profile, and structural-bound variants, then reads the original plan and all original handoffs and asserts their byte-equivalent immutable content at `:200-208`. This preserves the frozen identity/content/membership boundary without reopening historical clauses. |
| `RCK-001.c` | **RESOLVED** | A stale source hash rejects through the approved persistence acceptance boundary at `:210-214`. A genuinely distinct accepted document is created through the real authority → resolver → planner → persistence path at `:221-247`; `:248-253` proves independent scope, no original mutation, and no implicit predecessor/successor relation. No same-document rebinding or source-version interface is claimed. |
| `RCK-001.d` | **RESOLVED** | The persisted plan readback exactly equals the accepted source, including `rel: { state: "unavailable" }`, at `:177-180`; every stored handoff is read and checked at `:185-193`. A fabricated REL state is rejected by the V1 immutable-persistence validator at `:215-219`. The checkpoint and this verification treat changed accepted-REL revision replay as deferred, as frozen. |
| `RCK-001.e` | **RESOLVED** | The positive real composition persists a durable plan/handoffs and validates an unissued body at `:168-176`. `downstreamCounts` captures every available named counter surface—queue, BSS admission/attempt/reservation/dispatch/transport, semantic execution/candidate/evidence/index, and reconciliation—at `:74-76`; the after-state zero-delta assertion is at `:254-255`. The bounded diff adds only evidence and CFC records, not a route, queue, execution, or delivery implementation. |

All active replacement closure oracles are therefore proven. No direct
remediation regression was identified.

## Historical outcomes carried forward unchanged

| Historical clause | Outcome | Treatment |
| --- | --- | --- |
| `CK-001.a` | `RESOLVED` | Protected; not reopened. |
| `CK-001.b` | `RESOLVED` | Protected; not reopened. |
| `CK-002.a` | `UNRESOLVED` historically | Preserved for audit only; its superseded portion is satisfied only through `RCK-001.a`–`RCK-001.e`. |
| `CK-002.b` | `RESOLVED` | Protected; not reopened. |
| `CK-002.c` | `RESOLVED` | Protected; not reopened. |

## Validation performed

- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS** (3 tests, 3 pass, 0 fail, 0 skipped).
- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — **PASS** (1 test, 1 pass, 0 fail, 0 skipped).
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS** (6 tests, 6 pass, 0 fail, 0 skipped).
- `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts` — **PASS** (4 tests, 4 pass, 0 fail, 0 skipped).
- `git diff --check cb37faa6^ cb37faa6` — **PASS**.

## Decision

`PASS`. Every still-applicable original obligation and every active replacement
clause is proven, with no direct remediation regression. This closes the
bounded CK verification; it does not alter the preserved historical artifacts
or authorize unrelated work.
