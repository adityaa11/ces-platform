# IDSER-BATCH-07 supplemental CFC progress

- Ticket: IDSER-007
- Base checkpoint: `e8d3851a491b9ece4419216a848524c1dfe15c28`
- Supplemental CK artifact: `IDSER-BATCH-07-e8d3851-contract-gap.md`
- Consumed authorization: `HMN-IDSER-007-006`
- Authorized target: supplemental clauses only
- Original CK matrix: historical outcomes protected; no original clause is a remediation target

| Clause | Frozen oracle source | Initial status | Evidence locator |
|---|---|---|---|
| `CK-SUP-001.a` | Supplemental CK artifact, distinct-bundle/distinct-user PostgreSQL/pg-boss oracle | `PROVEN` | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts`: separate project/bundle owners are distinct (`foreignOwner`), both reconciliations are delivered concurrently, and each bundle's completed/progression state is asserted. |
| `CK-SUP-002.a` | Supplemental CK artifact, actual Compose worker restart oracle | `PROVEN` | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` starts and stops a real `createBackgroundWorker` process in the Compose test container, leaves the reconciliation delivery queued while stopped, restarts the worker, and asserts one persisted result, progress transition, completed Bridge effect, and exactly one next-member job. `apps/agents-bridge/tests/reconciliation-restart-worker.ts` runs the production pg-boss worker loop with a deterministic fixture result. |

Required validation: `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed, 1/1, no skips.

Closure conditions and required validation remain solely in the supplemental CK
artifact. This progress view tracks status and evidence locations and does not
copy or amend its oracles.
