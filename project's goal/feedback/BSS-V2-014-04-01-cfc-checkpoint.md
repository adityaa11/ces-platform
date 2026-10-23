# CFC checkpoint — BSS-V2-014-04-01

- **Ticket:** `BSS-V2-014-04-01` — Reconciled process-capacity window-usage projection
- **Batch:** `BSS-V2-014`
- **CFC authority:** first CK review [`BSS-V2-014-04-01-b5831bc-review.md`](BSS-V2-014-04-01-b5831bc-review.md), `CHANGES_REQUIRED`
- **Reviewed commit:** `b5831bce4464618073232d358d46f10bb866d912`
- **Authorized clauses:** `CK-001.a`, `CK-001.b`, `CK-001.c`, and `CK-001.d`
- **Ticket state:** `awaiting_review`

## Bounded remediation

`0099_bssv20140401_process_capacity_window_usage_cfc.sql` preserves the
read-derived function and adds no table, trigger, writer, worker, counter,
queue, scheduler, transport, provider call, or alternate accounting path. It
now validates the immutable activation lineage and re-derives the existing
effective enforcement policy before it can return projection rows. The latter
uses the established provenance reader and fails closed for a missing, revoked,
or mismatched unknown-dimension approval.

The focused PostgreSQL fixture now proves stale
plan/activation/provider-capacity rollback cases, all three WCA-15 negative
approval cases, source/DDL entrypoint inventory, lifecycle trace stability,
and zero effects for job, transport, provider-call, accounting, and scheduler
counters. The existing worker fixture now reads and reconciles the projection
after an actual Bridge worker restart. No admission, borrowing, provider,
route, or consumer behavior was changed.

## Frozen Finding Closure Matrix

| Clause | Frozen oracle and evidence locator | Required command and outcome | Status |
| --- | --- | --- | --- |
| `CK-001.a` | `packages/atlas-db/tests/process-capacity-window-usage.integration.test.ts` runs exact held/spent reconciliation and immutable lifecycle trace checks. `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts` now reads the process projection and reconciles it to the held/spent domain ledger after an actual Bridge worker restart. | Focused fixture: `PASS` (1/1). Worker fixture: `PASS` (1/1). The oracle passed: settled TPM remains spent until reset, released seats do not refund TPM, and the post-restart projection/reconciliation remains exact. | `PROVEN` |
| `CK-001.b` | The focused fixture mutates stale reservation-plan, work-activation, and ledger provider-capacity identities inside savepoints, observes the reader fail closed, rolls back each case, and compares the pre-existing rows. `0099_bssv20140401_process_capacity_window_usage_cfc.sql` validates activation history and profile lineage. | Focused fixture: `PASS` (1/1). The oracle passed: every stale identity case fails before rows are returned and rollback preserves the projection. | `PROVEN` |
| `CK-001.c` | The focused fixture keeps the approved Anoman unknown-RPD positive case, then proves missing policy, append-only revocation, and mismatched approval-content failures in savepoints. `0099_bssv20140401_process_capacity_window_usage_cfc.sql` invokes the existing policy-provenance reader for each ledger route. | Focused fixture: `PASS` (1/1). The oracle passed: each negative case fails closed; after rollback RPM/TPM/concurrency rows remain and no RPD row is accepted. | `PROVEN` |
| `CK-001.d` | The focused fixture inventories one reader, no projection table, no other projection entrypoint, and no projection trigger. It snapshots job, transport, provider-call, accounting, and scheduler counters plus the reservation/window trace before and after the reader call. | Migration check: `PASS`. Focused fixture: `PASS` (1/1). Worker fixture: `PASS` (1/1). Bridge typecheck: `PASS`. The oracle passed: the reader has zero lifecycle effects and no independent projection path. | `PROVEN` |

## Validation

All ticket-required validation ran against Docker Compose project
`atlas-canonical-perception` after rebuilding the affected `atlas` image:

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
PASS
```

Direct regressions checked: the original process projection lifecycle, the
durable Bridge worker restart/delivery fixture, migration registration, and
Bridge type safety. No environment limitation applies.

Internal readiness: READY_FOR_CK

**State:** `awaiting_review` — hand off only to CK verification of the frozen
`CK-001.a`–`CK-001.d` clauses, this bounded remediation diff, and direct
regressions.
