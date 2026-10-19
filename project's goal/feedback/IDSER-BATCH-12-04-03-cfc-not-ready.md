# CFC not ready: IDSER-012-04-03 / IDSER-BATCH-12-04-03

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-03-bss-structural-fit-corpus-partition.md`
- **Reviewed CK artifact:** `project's goal/feedback/IDSER-BATCH-12-04-03-22ced70-review.md`
- **Authorized clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c`.
- **CFC state:** `CFC_NOT_READY_FOR_CK`.

## Working closure view

| Clause | Current status | Evidence location | Required command / outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `IMPLEMENTED_UNPROVEN` | `idser-prospective-capacity-snapshot.ts` validates BSS-owned `maxPromptBytes` and `maxContextTokens`; `idser-structural-fit-corpus-partition.ts` compares each complete candidate against all four structural limits and retains the BSS output reservation in the context calculation. `idser-prospective-capacity-snapshot.test.ts` and `idser-structural-fit-corpus-partition.test.ts` cover missing bounds and prompt/context overages. | Focused tests and `corepack pnpm --filter @atlas/agents-bridge typecheck` passed. The required authenticated PostgreSQL integration command could not run because `docker compose up -d postgres` failed to bind `127.0.0.1:5432`, which is held by the separately running `atlas-canonical-perception-postgres-1`. | Not yet proven on the required real authenticated reader harness. |
| `CK-001.b` | `IMPLEMENTED_UNPROVEN` | `idser-structural-fit-corpus-partition.ts` now maps a later non-unfit reader exception to `BSS_CAPACITY_CONSUMER_READ_GAP`; the focused partition test asserts no proposal/replan and no trace when the later read fails. | Focused partition test passed; PostgreSQL integration remains unavailable as above. | Not yet proven on the required real authenticated reader harness. |
| `CK-001.c` | `IMPLEMENTED_UNPROVEN` | `idser-structural-fit-corpus-partition.ts` derives units before validating media identities; the focused partition test covers foreign, duplicate, and malformed media while retaining each visual as `unexamined`. | Focused partition test passed; direct affected typecheck passed. | Not yet proven with the ticket's full required validation set. |

## Executed evidence

- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — **PASS**: 2 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS**: 7 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `docker compose up -d postgres` — **BLOCKED_ENVIRONMENT**: Docker could not bind `127.0.0.1:5432` because `atlas-canonical-perception-postgres-1` is running there. The required `tests/capacity-planning-snapshot.integration.test.ts` did not execute. The canonical Perception database was not used as a substitute because this CFC's write-capable integration fixture is not authorized to mutate it.

No remediation commit, `awaiting_review` checkpoint, or CK handoff has been created. This remains the same uncommitted, in-scope CFC work and may only be resumed under the workflow's applicable continuation authority.

## Resolution

The blocked host-port path was replaced with the same project-local PostgreSQL
volume in a temporary no-published-port container. The canonical Perception
database was not accessed. The authenticated integration then passed; see the
bounded CFC checkpoint for the final closure evidence.
