# GO checkpoint: IDSER-010-05 / IDSER-BATCH-10-05

- **Ticket:** `IDSER-010-05-staged-result-replay-restart.md`
- **State:** `awaiting_review`
- **Predecessor:** IDSER-010-04 `PASS` (`ec1973a`)
- **Scope:** Scenario H only: staged semantic-result delivery, controlled restart and acknowledgement-loss replay, fingerprint conflict, and lease fencing.

## Bounded implementation

- Extended the existing disposable deterministic Compose harness with Scenario H and the one fixture phrase required to make that scenario observable.
- The harness creates a fresh isolated Compose project on ports 15432/13001/13002, stages an extraction result while Atlas is stopped, stops the real Bridge worker, and resumes from the persisted `semantic_result_delivery` row.
- A one-shot database trigger simulates acknowledgement loss after Atlas accepts the staged envelope. The worker redelivers the persisted winning envelope; the provider call counter proves no second extraction call occurs.
- The scenario attempts a conflicting completion-fingerprint insertion and a stale-generation completion. Both losing paths leave the durable winning stage/control state unchanged. It then proves singular extraction result, candidate, evidence, relationship, progress, successor job, and completed queue job after recovery.
- The harness tears down its Compose project and volumes in `finally`; it neither changes production retry/queue behavior nor consumes a developer's default Compose database.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
|---|---|---|---|
| `RC-010-05-01` | Stage a validated envelope before trusted Atlas delivery, interrupt the real worker, and resume delivery of that exact staged envelope. | `apps/agents-bridge/tests/idser-010-compose.mjs`, Scenario H: stops Atlas after staging, observes one durable `bridge.semantic_result_delivery` row with its execution ID, envelope and lease fence; stops the worker; deep-compares the surviving envelope; starts Atlas/worker; then observes delivery acknowledgement and bundle completion. `node apps/agents-bridge/tests/idser-010-compose.mjs` passed. Latest Scenario H evidence: execution `cb4783a7-c40c-4d86-b41a-c03953ca34a9`, staged envelope SHA-256 `1f9fdf6fc9243f89b4097b734f29e2768e60c6082ddcc5c9aaacdf211d58fd32`. | PROVEN |
| `RC-010-05-02` | Acknowledgement loss/restart does not make another Mistral call for staged work; the delivered stage is the only cleared stage. | Scenario H records the durable idempotency key `semantic:cb4783a7-c40c-4d86-b41a-c03953ca34a9`, installs a one-shot completion-trigger fault, and checks that exactly one structured-provider event has that execution scope while the staged outbox row is eventually removed. The full controlled Compose command passed with provider totals 26 before Scenario H and 29 after its one OCR/extraction/reconciliation path; scoped extraction count remained one. | PROVEN |
| `RC-010-05-03` | Identical replay is exactly once; conflicting fingerprint/result and stale lease claimant are denied without mutation. | Scenario H uses persisted snapshots and assertions: `ON CONFLICT` cannot replace the winning staged fingerprint/envelope; stale `(lease_owner, lease_generation)` completion returns no row and leaves the superseding control row intact. After replay it observes lifecycle `completed`, expected/completed document counts `1/1`, exactly one extraction result/candidate/evidence/relationship and one completed job. Lease generation advances from `1` to `3`. `node apps/agents-bridge/tests/idser-010-compose.mjs` passed. | PROVEN |

## Direct regressions and environment evidence

- `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed: controlled Compose scenarios A/B/C/D/E/F/H, including fresh build, restart/replay, conflict/fencing, and `finally` teardown.
- `docker compose -p idser-010-compose -f docker-compose.yml -f docker-compose.perception-smoke.yml run --rm --build --no-deps agents-bridge-worker corepack pnpm --filter @atlas/agents-bridge typecheck` — passed in the built worker image.
- Fresh isolated PostgreSQL: `... atlas corepack pnpm --filter @atlas/db migrate`, followed by `... atlas corepack pnpm --filter @atlas/db migration:check` — passed; all migrations through `0020_idser008_bundle_completion_lifecycle` applied and verified.
- `node --check apps/agents-bridge/tests/idser-010-compose.mjs`; `node --check apps/agents-bridge/tests/mistral-ocr-mock.mjs`; `docker compose ... config -q`; and `git diff --check` — passed.
- `docker compose -p idser-010-compose -f docker-compose.yml -f docker-compose.perception-smoke.yml ps --all` returned no services after validation; the disposable volumes and network were removed.

Internal readiness: READY_FOR_CK

GO makes no PASS determination. CK must decide the three frozen replay/fencing rows from this committed checkpoint.
