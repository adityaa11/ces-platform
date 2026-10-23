# GO checkpoint — BSS-V2-014-04-01

- **Ticket:** `BSS-V2-014-04-01` — Reconciled process-capacity window-usage projection
- **Batch:** `BSS-V2-014`
- **Ticket authority:** [frozen ticket](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-04-01-process-window-usage-projection.md)
- **State:** `awaiting_review`
- **Implementation:** `bridge.read_process_capacity_window_usage_v1(text)` is an additive, read-derived projection of `provider_work_reservation`, `provider_work_attempt`, route binding, and `provider_window_usage_ledger`. It creates no table, trigger, writer, worker, counter, queue, scheduler, transport path, accounting authority, or admission decision.
- **Dependency check:** BSS-V2-014-02-02 CK PASS is recorded in [its verification](BSS-V2-014-02-02-7d7612b-verification.md). The consumed BSS-V2-006 reservation/window, recovery, and effective-policy boundaries remain unchanged.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-0140401-01` | Exact held/spent reconciliation for every effective dimension through reserve, completion, release, reset, cancellation, retry, ack loss, and restart; TPM remains spent until reset and seat release does not refund TPM. | `packages/atlas-db/tests/process-capacity-window-usage.integration.test.ts` drives the existing atomic admission, physical ledger, transport claim, feedback, cancellation, ack-loss and retry lifecycle. It asserts row-level held/spent semantics, current-window domain reconciliation, and expiry/reset visibility. The existing `provider-admitted-worker.integration.test.ts` passes the durable pg-boss claim/restart pathway. | `PROVEN` |
| `RC-0140401-02` | Every row carries exact reservation, process/profile, plan, window, and dimension identity; missing/foreign/stale identity and duplicate projection fail with no partial row. | `read_process_capacity_window_usage_v1` validates the authoritative reservation/work/route/plan/process chain before returning rows. The focused fixture proves missing route binding, foreign ledger domain, and duplicate identity failures inside savepoints, followed by unchanged read results. | `PROVEN` |
| `RC-0140401-03` | Authorized Anoman `rpd: unknown/not_enforced` creates no process or provider-window RPD row; missing/revoked/mismatched approval fails closed. | The focused fixture uses the approved explicit unknown-RPD exclusion and asserts only `rpm`, `tpm`, and `concurrency` rows. It exercises the existing effective-policy derivation and atomic admission boundary; no RPD value is fabricated. Existing BSS-V2-006-05 policy behavior remains the enforcement authority. | `PROVEN` |
| `RC-0140401-04` | Projection is read-derived; no independent writer, transaction, trigger, counter, accounting source, admission authority, ledger, queue, scheduler, job, transport, or provider call. | Migration `0098_bssv20140401_process_capacity_window_usage_projection.sql` adds only the read function and execute grant. The focused fixture inventories no projection table or trigger and one reader function; source review confirms no other implementation entrypoint. | `PROVEN` |

## Validation

All database-backed commands ran through Docker Compose project `atlas-canonical-perception` after rebuilding the affected `atlas` image:

```text
docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check
PASS — Atlas database migration check passed

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/process-capacity-window-usage.integration.test.ts
PASS — 1/1

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
PASS — 1/1

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
PASS — tsc -p tsconfig.json

git diff --check
PASS — no whitespace errors
```

The provider-worker fixture was updated to supply its already-required immutable capacity-route tuple, matching the approved qualified-route authority contract. This is test-fixture alignment only; it introduces no production behavior.

Internal readiness: READY_FOR_CK
