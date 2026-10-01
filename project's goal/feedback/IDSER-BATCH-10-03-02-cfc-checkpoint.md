# CFC checkpoint: IDSER-010-03-02 / IDSER-BATCH-10-03-02

- **CFC source:** `IDSER-BATCH-10-03-02-a0db61d-review.md` (`CHANGES_REQUIRED`)
- **Remediation base:** `a0db61d171895356ecfb3672f040e65917547850`
- **HMN authorization consumed:** `HMN-IDSER-010-03-02-002` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- **State:** `awaiting_review`
- **Authorized frozen clauses:** `CK-001.a`, `CK-002.a`, `CK-002.b`, and `CK-003.a` only.

## Bounded remediation

- Added immutable target/control/materialization/lifecycle/queue snapshots to
  the existing semantic-authority Compose fixture for denied requests.
- Sent a schema-valid result containing invalid evidence through the controlled
  production worker into `PostgresExtractionAcceptanceHandler`, rather than
  synthesizing a typed rejection in the fixture.
- Added per-provider-case call counts and zero result/materialization/progress/
  successor assertions, plus an empty Master and unrelated control-bundle/
  queue snapshot around Scenario G terminal containment.
- No retry policy, lifecycle, queue, worker, provider, schema, replay, or
  production implementation changed.

## Frozen Finding Closure Matrix

| Clause | Status | Required evidence and executed outcome | Frozen oracle |
|---|---|---|---|
| `CK-001.a` | PROVEN | `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` exited 0 (1 test). The committed fixture snapshots target lifecycle/progress/member state, an unrelated control bundle/member, and matching pgboss rows before and after denied context/result requests; the snapshots are identical. | PASS |
| `CK-002.a` | PROVEN | `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml exec -T atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` exited 0 (1 test). The controlled provider records one call for credential rejection, malformed output, schema-invalid output, provider timeout, and the actual invalid-evidence result. Each asserts zero trusted acceptance, replay, extraction result, candidates, completed progress, and reconciliation successor; the invalid evidence reaches the real extraction handler then the established terminal failure handoff. `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml exec -T atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` exited 0 (2 tests), and `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml exec -T atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` exited 0 (1 test), preserving invalid-form rollback and reviewable uncertainty evidence. | PASS |
| `CK-002.b` | PROVEN | The successful worker Compose command above asserts the terminal target is `failed` / `needs_attention` with completed count 0, zero trusted result/candidate/successor, and exactly one failure handoff. The same fixture begins with an empty Master and proves it remains empty; it snapshots an unrelated completed control bundle and its pgboss job observation before and after Scenario G and asserts byte-for-byte equality. | PASS |
| `CK-003.a` | PROVEN | This checkpoint records each exact Compose command and its terminal passing result for semantic-authority (1/1), production semantic worker (1/1), extraction acceptance (2/2), and reconciliation acceptance (1/1). Their committed assertions provide the required denial and terminal target/control DB and queue observations. | PASS |

## Direct regressions checked

- `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml up -d --build --wait` — exited 0; all controlled services healthy.
- The four exact Compose suite commands recorded above — all exited 0.
- `git diff --check` — passed.
- Host `pnpm --filter @atlas/agents-bridge typecheck` and
  `pnpm --filter @atlas/db typecheck` could not run because the host checkout
  has no `tsc` executable; the ticket-required Compose test image supplied the
  validated runtime.

Internal readiness: READY_FOR_CK

CFC makes no PASS determination. CK must verify only the frozen
`CK-001.a`, `CK-002.a`, `CK-002.b`, and `CK-003.a` closure oracles, this
remediation diff, and direct regressions.
