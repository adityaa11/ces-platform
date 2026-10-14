# CFC checkpoint: REL-03-DURABLE-001 (second bounded pass)

- Ticket: `REL-03-DURABLE-001` — fenced durable composite staging and replay
- State: `awaiting_review`
- Current CK artifact: `REL-03-DURABLE-001-1371775-verification.md`
- Consumed HMN authorization: `HMN-REL-03-DURABLE-001-003`

## Bounded remediation

This pass addresses only the still-unresolved frozen clauses `CK-001.a`,
`CK-001.b`, and `CK-003.a`. `CK-002.a`, `RC-DURABLE-03`, and
`RC-DURABLE-05` remain resolved and were not modified or reopened. Changed
implementation scope is limited to the authorized composite replay source and
its focused integration harness.

## Closure matrix

| Clause | Status | Evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `semantic-composite-replay.ts` now checks exact revision key sets, complete snapshot/document identity, locator shapes and source hashes, relationship vocabulary, candidate tuples, provenance, predecessor form, authority-null state, and immutable hash before SQL. The focused harness constructs a self-consistent recomputed-hash revision with bogus relationship vocabulary; a counting database observes zero `executeSql` calls. Fresh PostgreSQL negatives retain one existing winner. Oracle passed. |
| `CK-001.b` | `PROVEN` | Deferred descriptors now require their exact shape and tuple form and bind both `source.owned_source` and `source.context_source` to the qualified revision. The focused harness rejects a forged owned-source locator before durable effect; the PostgreSQL winner count remains unchanged. Oracle passed. |
| `CK-003.a` | `PROVEN` | The fresh PostgreSQL harness starts an isolated child process staging through a trigger-delayed SQL boundary, observes the live backend in `pg_stat_activity` waiting in that trigger, terminates the child, and proves zero partial rows. Separate fresh child processes load the already committed winner and return its unchanged payload, identities, hashes, and sole-winner state for delivery/acknowledgement recovery. No acknowledgement/delete path exists or is exercised. Oracle passed. |

## Executed validation

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014_07 pnpm --filter @atlas/db migrate` | PASS — fresh isolated database applied `0000` through `0025_rel03_semantic_composite_stage`. |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014_07 pnpm --filter @atlas/db migration:check` | PASS. |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014_07 node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts` | PASS — 1/1, zero skipped. The disposable database was dropped afterward. |

Internal readiness: `READY_FOR_CK`

This is a bounded CFC checkpoint, not a CK `PASS`. The ticket remains
`awaiting_review` for independent verification of only the three listed frozen
clauses.
