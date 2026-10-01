# CFC checkpoint: IDSER-010-02 / IDSER-BATCH-10-02

- **CFC source:** `IDSER-BATCH-10-02-4361daf-review.md` (`CHANGES_REQUIRED`)
- **Remediation base:** `4361daf4c7a38a88616dee101713cfc352804e43`
- **State:** `awaiting_review`
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c` only.

## Bounded remediation

- Permit a queued D(n+1) perception to redeem while its bundle is already
  `processing`; reconciliation creates that exact state atomically after D(n)
  is accepted.
- Correct the multi-document production-card assertion so its processed-count
  observation is scoped to the actual C/D/E document count.
- Correct the two existing extraction-acceptance fixtures: compare the
  PostgreSQL result as an ordinary array and seed a first perception in its
  ticket-valid `perception_queued` state.

## Frozen Finding Closure Matrix

| Clause | Status | Required evidence and executed outcome | Frozen oracle |
|---|---|---|---|
| `CK-001.a` | PROVEN | `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` exited 0 and printed `IDSER-010 controlled Compose scenarios A/B/C/D/E passed.` The C/D assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` observed the support and duplicate relationships, unresolved contradiction, authorized candidate/evidence references, and candidate-only state. | PASS |
| `CK-001.b` | PROVEN | The same successful Compose command completed E and its persisted member/job assertions: three completed members, ordered D1→D2→D3 start/completion boundaries, and exactly one queued D3 perception job. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` exited 0 (1 test, 0 failures), preserving the frozen transaction-atomicity evidence. | PASS |
| `CK-001.c` | PROVEN | `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` exited 0 (2 tests, 0 failures); the reconciliation command above also exited 0. The successful Compose E assertion observed `expected_document_count=3`, `completed_document_count=3`, completed semantic stages, ready bundle/card state, and scoped, addressable semantic result/relationship/evidence/source-inventory observations. | PASS |

## Direct regressions checked

- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — passed.
- `node --check apps/agents-bridge/tests/mistral-ocr-mock.mjs` — passed.
- `git diff --check` — passed.

Internal readiness: READY_FOR_CK

CFC makes no PASS determination. CK must verify only the frozen `CK-001.a`
through `CK-001.c` closure oracles, this remediation diff, and direct
regressions.
