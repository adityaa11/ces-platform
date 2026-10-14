# CFC checkpoint: REL-03-DURABLE-001

Ticket: `REL-03-DURABLE-001` — fenced durable composite staging and replay  
State: `awaiting_review`  
Reviewed CK artifact: `REL-03-DURABLE-001-665b744-review.md`  
Reviewed commit: `665b74414c25fbc3d8e7291fa3ae527c59254dde`

## Bounded remediation

This first CFC pass addresses only the unresolved frozen clauses `CK-001.a`,
`CK-001.b`, `CK-002.a`, and `CK-003.a`. The already proven CK rows
`RC-DURABLE-03` and `RC-DURABLE-05` were preserved. No worker composition,
provider, publication, accepted-context, or Master behavior was changed.

## Closure evidence

| Frozen clause | Status | Evidence and closure-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/semantic-composite-replay.ts` now requires the complete qualified REL-03 revision shape, source/scope binding, immutable-content revision hash, and duplicate rejection before SQL. `semantic-composite-replay.integration.test.ts` stages a qualified revision and rejects an unqualified/tampered sidecar before durable effect. Fresh PostgreSQL harness passed; oracle passed. |
| `CK-001.b` | `PROVEN` | The replay API now requires the SEM-005 composite-accounting version, source/profile/request/canonical hash bindings, immutable sidecar hash, dependency equality, authority-null boundary, and qualified deferred tuple/revision/source linkage before SQL. The focused malformed-sidecar negative leaves the existing key’s sole winner unchanged. Fresh PostgreSQL harness passed; oracle passed. |
| `CK-002.a` | `PROVEN` | The claimant CTE locks the exact `bridge.background_effects` row with `FOR UPDATE` while staging. The PostgreSQL harness delays insertion, starts a competing lease supersession, observes that it is blocked behind the claimant lock, then observes exactly one committed winner; a pre-existing superseded/expired claimant still receives `SemanticCompositeLeaseLostError` with no extra row. Oracle passed. |
| `CK-003.a` | `PROVEN` | The fresh PostgreSQL harness retains the pre-commit fault/zero-row check and adds named cancellation, delivery-failure, acknowledgement-loss, and fresh-instance recovery observations against the committed winner. Each observes unchanged payload, identities, and hashes with no API deletion path. Oracle passed. |

## Executed validation

| Command | Outcome |
| --- | --- |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014 pnpm --filter @atlas/db migrate` | PASS — applied `0000` through `0025_rel03_semantic_composite_stage` to a fresh isolated PostgreSQL database. |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014 pnpm --filter @atlas/db migration:check` | PASS. |
| `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/cfc_rel03_durable_20261014 node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts` | PASS — 1/1, zero skipped. |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS. |
| `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.test.ts` | PASS — 7/7. |
| `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-client.integration.test.ts` | PASS — 1/1. |
| `git diff --check` | PASS. |

Internal readiness: `READY_FOR_CK`

This is a single bounded remediation checkpoint, not a CK `PASS`. Control now
returns to CK verification of the frozen clauses only.
