# CFC checkpoint: IDSER-012-03-01-02 / IDSER-BATCH-12-03-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-01-02-authorized-accepted-document-resolver.md`
- **Remediation base:** `d5d890662792f6155ce600e07740ac1072c20c75` (`docs(idser): record resolver checkpoint`)
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-01-02-d5d8906-review.md`
- **Authorized frozen clause:** `CK-001.a` only.
- **Checkpoint state:** `awaiting_review`.

## Bounded remediation

The persisted PostgreSQL integration test now changes the otherwise-valid
`atlas.extraction_bundle_document` member from `perceived` to the valid,
unaccepted `perception_queued` state, invokes the real authenticated resolver,
asserts its generic unavailable/unauthorized rejection, and restores the member
to `perceived` before continuing the existing media checks. No resolver,
parser, planner, GHR, provider, or downstream semantic behavior changed.

## Frozen Finding Closure Matrix

| Clause | Ticket authority | Required closure oracle | Evidence locator | Command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | `RC-012030102-02`; `SR-012030102-R1` | An otherwise-valid resolver redemption with a persisted member state other than `perceived` is rejected with no planner result/content leakage and unchanged read-only counters. | `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — lifecycle mutation and rejection assertion immediately after the cancelled-execution scenario; the test's final count assertion covers the complete positive/rejection run. | `pnpm --filter @atlas/db test:semantic-batch-plan-input` with repository `.env` loaded — **PASS**: 1 test, 1 pass, 0 failures, 0 skips. | `PROVEN` — frozen oracle passed. |

## Direct regression checks

- `pnpm --filter @atlas/db typecheck` — **PASS**.
- `pnpm --filter @atlas/db test:semantic-batch-plan-input` with repository `.env` loaded — **PASS**: 1 test, 1 pass, 0 failures, 0 skips.
- `git diff --check -- packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — **PASS**.

The only initially skipped test invocation had no `DATABASE_URL` in its process
environment; it is not used as closure evidence. The recorded passing run loaded
the repository `.env` and executed the real PostgreSQL integration harness.

Internal readiness: `READY_FOR_CK`

The remediation is limited to frozen clause `CK-001.a`; all CK-proven rows are
preserved. Hand off for CK verification of the frozen clause and direct
regressions only.
