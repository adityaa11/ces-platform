# CFC checkpoint: IDSER-012-03-02-03 / IDSER-BATCH-12-03-02-03

- **Ticket:** `IDSER-012-03-02-03` — Structural-fit corpus partition proposal.
- **State:** `awaiting_review`.
- **Remediation basis:** first consolidated CK review `IDSER-BATCH-12-03-02-03-fc310ac-review.md`, reviewed commit `fc310aca828bdc7a01d4ef2d65f742a32eafe796`.
- **Authorized closure target:** frozen clause `CK-001.a` only. This is the initial CFC pass requested after the first `CHANGES_REQUIRED` review; no HMN authorization is consumed.

## Working closure progress

| Frozen clause | Ticket authority and oracle source | Remediation and evidence locator | Required command and outcome | Status / oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Ticket `IDSER-012-03-02-03` `RC-012030203-01`; use the frozen route-consistency oracle in `IDSER-BATCH-12-03-02-03-fc310ac-review.md`. | `apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts:154` blocks when the resolved estimator route differs from the authenticated BSS enforcement route. `apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts:84` proves a foreign route returns the existing typed read-gap block, has no proposal shape, and reaches only the initial metadata read. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS**: 4 tests, 0 failures, 0 skips. | `PROVEN`; the mismatched route is blocked before candidate fitting, while the matching route remains covered by the real integration below. |

## Direct-regression validation

- `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs ./apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts` — **PASS**: 1 real PostgreSQL matching-Anoman-route test, 0 failures, 0 skips.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `git diff --check -- apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts` — **PASS**.

The remediation changes only estimator-route/BSS-route consistency and its focused proof. It does not reopen BSS policy, runtime quota/admission, persistence, GHR, SEM, provider, or reconciliation behavior. Existing `RC-012030203-02` through `RC-012030203-06` remain untouched and retain the proven evidence recorded by the frozen CK review.

Internal readiness: `READY_FOR_CK`.

This checkpoint is CFC readiness only. It does not issue CK `PASS`; control returns to CK to verify frozen clause `CK-001.a` and direct regressions.
