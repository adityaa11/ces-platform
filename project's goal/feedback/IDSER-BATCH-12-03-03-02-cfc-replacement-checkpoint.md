# CFC replacement checkpoint: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`
- **Replacement closure authority:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-f0e6953-replacement-contract-freeze.md`
- **Historical checkpoint:** `f0e6953251621276de1c8807d0f80ebb21048be5`
- **Historical protection:** `CK-001.a`, `CK-001.b`, `CK-002.b`, and `CK-002.c` remain resolved and unchanged. Historical `CK-002.a` remains unresolved and is preserved as history; only `RCK-001.a` through `RCK-001.e` are remediated here.
- **HMN authorization consumed:** `HMN-IDSER-012-03-03-02-002`.

## Replacement closure matrix

| Replacement clause | Status | Evidence location and frozen-oracle result |
| --- | --- | --- |
| `RCK-001.a` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:170-174` persists the identical real accepted-source input twice, asserts identical plan/handoff results, and queries exactly one scoped plan row. The real PostgreSQL harness passed: same identity, hash, parent membership, no duplicate row, and no mutation. Oracle passed. |
| `RCK-001.b` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:195-208` persists the approved changed asset, BSS-profile, and structural-bound variants, then verifies unchanged original plan and handoff immutable content/membership. The real PostgreSQL harness passed. Oracle passed. |
| `RCK-001.c` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:210-255` proves a stale binding rejects at the approved persistence boundary, then uses the real authority/resolver/planner/persistence composition for a genuinely distinct accepted document. Its separate plan has distinct scope and no predecessor/implicit-successor relation; the original snapshot is unchanged. The real PostgreSQL harness passed. Oracle passed. |
| `RCK-001.d` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:177-190` reads persisted source content and proves exact accepted `rel: { state: "unavailable" }`; `:215-219` proves a fabricated REL state is rejected by the V1 persistence boundary. Changed accepted-REL revision replay remains deferred, as frozen. The real PostgreSQL harness passed. Oracle passed. |
| `RCK-001.e` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:71-76,170-255` proves a non-inert durable plan/handoffs and validated unissued body while all available GHR/BSS/SEM/reconciliation before/after counters retain zero delta. The bounded diff adds only integration evidence and no delivery, queue, execution, or downstream route. The real PostgreSQL harness passed. Oracle passed. |

## Validation record

```text
corepack pnpm --filter @atlas/db typecheck
PASS

corepack pnpm --filter @atlas/agents-bridge typecheck
PASS

node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
PASS — Atlas database migration check passed

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts
PASS — 3 tests, 3 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts
PASS — 1 test, 1 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts
PASS — 6 tests, 6 pass, 0 fail, 0 skipped

node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts
PASS — 4 tests, 4 pass, 0 fail, 0 skipped

git diff --check
PASS
```

All authorized replacement closure oracles are proven by the frozen required real-PostgreSQL harness. No direct remediation regression is known.

Internal readiness: READY_FOR_CK

**State:** `awaiting_review`. This is one bounded CFC handoff to CK verification of only `RCK-001.a` through `RCK-001.e`; it is not a CK `PASS`.
