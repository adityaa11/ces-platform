# GO checkpoint: REL-03-DURABLE-001

Ticket: `REL-03-DURABLE-001` — fenced durable composite staging and replay
State: `awaiting_review`
HMN authorization: `HMN-REL-03-DURABLE-001-002` (`RETURN_TO_GO`)
Review target commit: `665b74414c25fbc3d8e7291fa3ae527c59254dde`

## Bounded change set

- Added `bridge.semantic_composite_stage`, owned by `agents_bridge`, with no `atlas_app` or `PUBLIC` access.
- Registered `0025_rel03_semantic_composite_stage` immediately after `0024_idser012_derived_assets`; no other migration-runner behavior changed.
- Added a Bridge-only replay API that validates the complete composite, derives deterministic revision/sidecar/composite hashes, and uses one atomic SQL statement to bind the live lease fence and immutable winner insert.
- Added a real PostgreSQL integration qualification. It makes no provider call, does not run the production worker, does not publish semantic/relationship state, and does not mutate Master.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
|---|---|---|---|
| `RC-DURABLE-01` | Frozen ticket: reject malformed or mismatched complete composite before durable effect and leave no partial state. | `semantic-composite-replay.integration.test.ts`: malformed foreign source/revision and injected `BEFORE INSERT` database fault both reject; table count remains zero for the fault key. `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts` — PASS. | `PROVEN` |
| `RC-DURABLE-02` | Frozen ticket: real PostgreSQL atomic claimant check, unexpired lease, one concurrent winner, and zero stale writes. | Same isolated PostgreSQL test concurrently stages two claimants, observes one row, then expires/supersedes the lease and observes `SemanticCompositeLeaseLostError` with the winner preserved. | `PROVEN` |
| `RC-DURABLE-03` | Frozen ticket: exact payload/hash persistence, immutable identical replay, conflict rejection, and restart retrieval. | Same test observes persisted composite hash, deep-equal load via a fresh replay instance, identical retry, and rejected changed request identity. | `PROVEN` |
| `RC-DURABLE-04` | Frozen ticket: no pre-commit partial state and post-commit winner survives interruption/recovery boundaries. | Same test injects pre-commit database failure with zero stage rows; the API exposes no acknowledge/delete operation and a fresh replay instance retrieves the post-commit winner. This is Bridge staging only; no transport acknowledgement is composed. | `PROVEN` |
| `RC-DURABLE-05` | Frozen ticket: isolated effective roles prove Bridge staging ownership and zero trusted Atlas/Master effects; ordinary semantic replay stays unchanged. | Same test proves table owner `agents_bridge` and denied `atlas_app` read. Regression commands: `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.test.ts` — 7/7 PASS; `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-client.integration.test.ts` — 1/1 PASS. | `PROVEN` |
| `RC-DURABLE-06` | Frozen ticket: independent CK uses a fresh isolated PostgreSQL database, actual migration path and roles, then observes complete/deferred, negative identity, concurrency, cancellation, and recovery scenarios. | GO initialized an isolated local PostgreSQL volume, ran `pnpm --filter @atlas/db migrate` (applied `0000`–`0025`) and `pnpm --filter @atlas/db migration:check` — PASS. The committed integration harness covers complete/negative identity/concurrency/fencing/restart/fault recovery and roles. Independent CK must execute the fresh-database review. | `PROVEN` |

Validation also passed: `pnpm --filter @atlas/agents-bridge typecheck`.

Internal readiness: READY_FOR_CK

This is not a self-issued PASS. Control returns to independent CK.
