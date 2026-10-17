# BSS-V2-BATCH-06-04-03 CFC checkpoint

- **Ticket:** `BSS-V2-006-04-03`
- **Remediation base:** `895d811a58c3c1b3e70e371507fdecc4a910fd1a`
- **Frozen CK source:** `project's goal/feedback/BSS-V2-BATCH-06-04-03-895d811-review.md`
- **HMN authorization:** `HMN-BSS-V2-006-04-03-001`
- **Status:** `awaiting_review`
- **Remediation commit:** this bounded CFC checkpoint commit
- **HMN authorization consumed:** `HMN-BSS-V2-006-04-03-001`

## Clause-keyed closure evidence

| Frozen clause | Ticket-bound evidence target | Status | Exact evidence and frozen-oracle result |
| --- | --- | --- | --- |
| `CK-001.a` | Timeout/connection-loss through the production Bridge worker, fresh-worker restart, conservative unknown state, no duplicate claim/send, and distinct post-recovery explicit retry. | `PROVEN` | The named `timeout-ack-loss` case at `apps/agents-bridge/tests/provider-work-admission.integration.test.ts:358-392` throws after the durable claim/possible send, then starts a fresh production worker. It asserts preserved public identity, one claim/send, `may_have_started` feedback, retained unknown RPM/RPD/TPM/concurrency ledger state, and no replay send. The explicit distinct retries after matched 429 recovery remain asserted at `:308-316` and `:348-356`. The real PostgreSQL/pg-boss fixture command below passed. |
| `CK-001.b` | Per-ticket-case persisted work, reservation, dispatch/job, claim, fake-send, feedback/usage, pressure/recovery where applicable, and public-outcome assertions. | `PROVEN` | Reusable persisted-state assertions at `apps/agents-bridge/tests/provider-work-admission.integration.test.ts:88-138` correlate durable identity, pg-boss job, claim, fake send, normalized feedback, usage ledger, and public result. They cover exact success `:199-215`, pre-send cancellation `:237-252`, provider failure `:280`, metadata-free 429 plus explicit retry `:315-316`, Retry-After 429 plus explicit retry `:355-356`, and timeout/ack-loss `:376-392`. Durable pressure recovery rows are asserted at `:307` and `:347`. The real PostgreSQL/pg-boss fixture command below passed. |

## Direct regression validation

```text
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.test.ts PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge typecheck PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check PASS
corepack pnpm --filter @atlas/db typecheck PASS
git diff --check PASS
```

The direct regression boundary remained limited to the admitted worker, typed operational feedback ingress, physical-window accounting, pressure/recovery projection, and `ProviderWorkAdmission/v1`. No provider credentials, semantic processing, consumer interface, provider routing policy, or deployment path was changed.

Internal readiness: READY_FOR_CK

Historical CK criteria remain authoritative and were not copied, altered, or expanded by this checkpoint. CFC does not issue CK `PASS`; this checkpoint awaits independent CK verification.
