# CFC remediation status: IDSER-009-04 / IDSER-BATCH-09-04

- **Frozen ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Source CK artifact:** `IDSER-BATCH-09-04-e357928-review.md`
- **HMN authorization:** `HMN-IDSER-009-04-002` (`AUTHORIZE_NEXT_CFC`)
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c`
- **Checkpoint state:** `CFC_NOT_READY_FOR_CK`; no remediation commit and no CK handoff.

## Bounded closure progress

| Frozen clause | Status | Evidence / disposition |
|---|---|---|
| `CK-001.a` | `PROVEN` | `apps/atlas/tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` now seeds and reloads persisted `1 of 2` progress, a ready card with the committed bounded semantic-uncertainty signal, and contradictory persisted lifecycle data that is withheld without private detail. The exact focused Compose command passed 2/2. |
| `CK-001.b` | `IMPLEMENTED_UNPROVEN` | The focused spec now records collapsed desktop shell captures and checks a valid 48-character ID, 80-character mixed-case name, and 280-character mixed-case/unbroken description at the named widths/themes with overflow checks. The exact focused Compose command passed 2/2. The frozen clause also requires integrated loading/error refresh evidence; no ticket-bound production refresh loading/error surface was found in the current focused route, so this remaining observation has not been represented by an invented probe. |
| `CK-001.c` | `BLOCKED_AUTHORITY` | The required regression commands continue to render `Extracting` before `/home` observes the new card. The always-on authenticated Bridge worker redeems the durable queued job immediately, transitioning the persisted bundle/member under the CK-passed IDSER-009-03-02 activation boundary. Guaranteeing the frozen `Waiting for extraction` observation would require a production delay/activation gate (or altering the frozen assertion), both prohibited by the active HMN authorization and outside this ticket's lifecycle authority. |

## Commands run

- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — **passed**, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test --test-concurrency=1 tests/project-home.integration.test.mjs` — **failed**, 0/1: expected `Waiting for extraction`; persisted card rendered `Extracting`.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/production-project-create.spec.mjs` — began against the same retained creation-to-card regression; the prior direct integration failure already establishes the identical frozen mismatch. No passing result is claimed.

## Internal readiness

`CFC_NOT_READY_FOR_CK`.

The uncommitted focused-browser evidence changes are in scope and are preserved
for human/planning disposition. `HMN-IDSER-009-04-002` is **not consumed**:
the complete authorized closure matrix is not proven. No approved predecessor
contract, lifecycle rule, regression assertion, generated output, or unrelated
working-tree path was changed.
