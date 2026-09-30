# CFC checkpoint: IDSER-009-03-02 / IDSER-BATCH-09-03-02

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Remediation base:** `746ba16fb734ae1dd245172cc6d0edb27746365b`
- **Supplemental closure artifact:** `IDSER-BATCH-09-03-02-supplemental-contract-correction.md`
- **HMN authorization consumed:** `HMN-IDSER-009-03-02-001`
- **State:** `awaiting_review`

## Corrected closure progress

| Frozen clause | Evidence location | Exact command and outcome | Frozen oracle |
|---|---|---|---|
| CK-SUP-009-03-02-A | `packages/atlas-db/tests/project-repository.integration.test.ts` | `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` — passed, 3/3. | PASS: committed waiting/queued/X=0/durable-job facts and rollback regression remain proven. |
| CK-SUP-009-03-02-B | `packages/atlas-db/src/perception-authority.ts`; `packages/atlas-db/tests/perception-authority.integration.test.ts` | `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck && corepack pnpm --filter @atlas/db test:perception-authority'` — typecheck passed; authority test passed, 1/1. | PASS: exact first authenticated redemption activates only the bound pair, preserves X=0, sets timestamps once, and leaves the control unchanged. |
| CK-SUP-009-03-02-C | `packages/atlas-db/tests/perception-authority.integration.test.ts` | Same focused DB command — passed. The matrix snapshots target execution/bundle/member and unrelated control rows around forged/missing/expired grants, wrong execution/document/source metadata, unbound and mismatched scope, terminal execution/bundle/member, duplicate redemption, and advanced-member replay. | PASS: every rejected case leaves the captured lifecycle state unchanged; valid replays preserve timestamps, progress, advanced state, and controls. |

## Direct regression

`docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/agents-bridge && corepack pnpm exec jiti tests/perception-integration.test.ts'` — passed, 2/2. This is supporting direct regression evidence for the authenticated route/worker path; it is not substituted for the focused DB authority proof.

## Scope protection

The remediation requires a matching exact D1 member and same-scope bundle in `PostgresPerceptionAuthority.redeem()` before lifecycle activation or protected-source release. It does not alter schema, queue/worker authority, approved predecessor behavior, or IDSER-009-04 browser/card work.

## Readiness

Internal readiness: `READY_FOR_CK`.

The corrected supplemental clauses are proven by the named Compose evidence. This checkpoint is a CFC readiness record only; CK must independently verify the supplemental matrix and remediation diff. No CK PASS is claimed here.
