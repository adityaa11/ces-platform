# BSS-V2-BATCH-06-05-02 CFC checkpoint

- **Ticket:** `BSS-V2-006-05-02` — Effective-plan publication convergence
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-05-02-fbfbaa7-review.md`
- **Reviewed base:** `fbfbaa7e9b8fb7a16b6a708a2f05bee0f7c100b4`
- **State:** `awaiting_review`
- **Internal readiness:** `READY_FOR_CK`

## Frozen closure matrix progress

| Authorized clause | Status | Exact evidence, command, and frozen-oracle outcome |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/tests/effective-plan-publication-convergence.integration.test.ts` now publishes a known-RPD policy-bound profile (numeric `rpd: 500`), snapshots that immutable row and its activation history, then publishes an authorized unknown-RPD/not-enforced effective-mask successor. It asserts exactly one new activation revision and durable wakeup on the transition, zero deltas on identical replay, and deep equality of the original profile and activation row after the transition. `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/effective-plan-publication-convergence.integration.test.ts` — PASS (1/1). **Frozen oracle passed.** |
| `CK-001.b` | `PROVEN` | Forward-only migration `packages/atlas-db/migrations/0081_bssv20060502_effective_plan_nested_vector_validation.sql` constrains every persisted nested lane `cap` and `planningCost` vector to the server-derived eligible mask and rejects noncanonical extra capacity/fairness representations. The same PostgreSQL-role test proves generated three-dimensional lane data has no numeric RPD and rejects forged RPD in top-level capacity, lane `cap`, lane `planningCost`, and a fairness-cost representation before insertion. The focused command above — PASS (1/1). **Frozen oracle passed.** |

## Direct regressions checked

```text
corepack pnpm --filter @atlas/db typecheck                                                   PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                         PASS
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts         PASS (3/3)
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/authorized-enforcement-policy-provenance.integration.test.ts  PASS (1/1)
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/effective-plan-publication-convergence.integration.test.ts    PASS (1/1)
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/migrate.mjs --check  PASS
git diff --check                                                                              PASS
```

The implementation remains inside the BSS-005 effective-plan publication,
activation-revision fence, and existing `active-plan:<revision>` wakeup path.
It adds no runtime admission, provider transport, consumer activation, or new
wakeup/broker authority. Unrelated dirty worktree changes were not staged.

## Handoff

Both frozen CK clauses are `PROVEN`; the bounded remediation is ready for CK
verification. CFC does not issue `PASS` and stops here for verification of
`CK-001.a`, `CK-001.b`, this remediation diff, and direct regressions.
