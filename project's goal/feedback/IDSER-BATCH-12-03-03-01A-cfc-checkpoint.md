# CFC Checkpoint — IDSER-012-03-03-01A

- **Ticket:** `IDSER-012-03-03-01A` — Canonical RUN-003 derived-media reference compatibility at immutable plan persistence.
- **Batch:** `IDSER-BATCH-12-03-03-01A`.
- **State:** `awaiting_review`.
- **Remediation base:** `51576897a98e2a9f71f6a21be417b2c3ea6ec1bd`.
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-03-01A-5157689-review.md`.
- **Original CK result:** `CHANGES_REQUIRED` for `CK-001.a` through `CK-001.c` only.

## Bounded remediation

This pass changes only `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts`. It does not change production code, migrations, resolver/provenance behavior, downstream composition, or any previously proven Review Contract row. The original frozen closure matrix remains the sole source of the authority, proof requirements, and binary closure oracles.

## Frozen Finding Closure Matrix

| Frozen clause | Status | Evidence and required command | Frozen-oracle result |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | The nonempty canonical-media fixture now queries PostgreSQL by the returned `planId` and asserts exactly one `atlas.semantic_corpus_plan` row and two `atlas.planned_semantic_corpus_handoff` rows. It retains the exact stored `source.media` and parent-hash replay assertions. `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS (6/6). | Passed: the actual repository persistence produces the required durable parent and child row counts for the canonical-media fixture. |
| `CK-001.b` | `PROVEN` | The same fixture now calls `repository.persist(plan)` concurrently through `Promise.all`, proves both results have the same plan and handoff identities, then performs a further exact-input replay as the existing restart-style path. The command above — PASS (6/6). | Passed: concurrent and restart-style canonical-media replays collapse to the same immutable parent and handoff references without duplicate rows. |
| `CK-001.c` | `PROVEN` | The baseline query now includes queue, BSS work/attempt/reservation, and document-scoped SEM/candidate/reconciliation counters. The after query compares every value to its own before value after the positive, concurrent/replay, conflict, and malformed-input sequence. The command above — PASS (6/6). | Passed: every forbidden surface has an exact zero delta; fixture isolation and cleanup remain unchanged. |

## Direct regressions checked

```text
corepack pnpm --filter @atlas/db typecheck
PASS

node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
PASS — Atlas database migration check passed

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts
PASS — 6 tests, 6 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts
PASS — 1 test, 1 pass, 0 fail, 0 skipped

git diff --check
PASS
```

The unchanged resolver regression remains passing and is cited only as provenance coverage; this remediation does not claim the deferred `03-03-02` composition is complete. Existing canonical grammar, hash, conflict, invalid-input zero-write, append-only, transaction, authorization, and cleanup coverage remain in the same passing real-PostgreSQL harness.

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint for `CK-001.a` through `CK-001.c`. It does not issue `PASS`; CK must verify only the frozen clauses, this remediation diff, cited evidence, and direct regressions.
