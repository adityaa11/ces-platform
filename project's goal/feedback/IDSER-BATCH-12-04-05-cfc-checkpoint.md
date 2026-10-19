# CFC checkpoint: IDSER-012-04-05 / IDSER-BATCH-12-04-05

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-05-ghr-reference-only-v2-compatibility.md`.
- **CK authority:** `project's goal/feedback/IDSER-BATCH-12-04-05-72430455-review.md`.
- **Remediation base:** `7243045539b503fcba25dfd4886a91051d3ede22`.
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b` only.
- **Ticket state:** `awaiting_review`.

## Bounded remediation

The persisted, reference-only receiver now validates every v2
`contextOnlyLocators` entry against the parent document scope and the parent
inventory before accepting a body. It also rejects a persisted v1 or v2 plan
with no eligible source before an output body can be returned. The external
four-field body, immutable parser/persistence interfaces, and all delivery
boundaries remain unchanged.

## Frozen Finding Closure Matrix

| Clause | Status | Evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts` builds the v2 parent inventory, then rejects context-only locators whose `documentId` is outside the persisted parent scope or whose locator is absent from that inventory. `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` mutates a real persisted handoff to a foreign context-only locator and an in-scope-but-absent locator; both reject. The canonical persisted handoff with an in-scope context-only locator remains accepted. The frozen oracle passes. |
| `CK-001.b` | `PROVEN` | The receiver rejects when its persisted eligible set is empty before ownership coverage can produce a body. The focused persisted-record tests prove an empty v1 `units` plan and a v2 inventory with no eligible entry cannot produce `SemanticBatchPlanReady/v1`; normal positive v1 and v2 receiver paths remain accepted. The frozen oracle passes. |

## Validation and direct regressions

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `node --env-file=.env --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test --test-name-pattern="(strict non-delivering|v2 persisted records dispatch|no eligible source cannot produce)" packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS**: 3 tests, 0 failures. This is the clause-specific persisted PostgreSQL receiver harness.
- `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS**: 4 tests, 0 failures.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS**.
- `git diff --check -- packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS**.

No migration, persistence path, route, queue, outbox, forwarding,
acknowledgement, BSS, SEM, provider, semantic-truth, reconciliation, Master,
or CES surface was added. The focused receiver tests continue to assert the
zero-effect counter boundary.

Internal readiness: `READY_FOR_CK`.

This bounded CFC checkpoint is `awaiting_review` for CK verification of
`CK-001.a` and `CK-001.b`; it does not issue a CK result.
