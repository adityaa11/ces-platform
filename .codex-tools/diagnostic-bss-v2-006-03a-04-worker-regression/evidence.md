# BSS-V2-006-03A-04 diagnostic evidence

This file is diagnostic evidence only. It does not change implementation,
tests, ticket state, or acceptance status.

## Capture metadata

- Active branch before snapshot: `codex/new-atlas-backend`
- Source HEAD before snapshot: `c3dcf10c756e1db272ba6c611975f07c3d7bb217`
- Database evidence was read from the local PostgreSQL Compose instance.
- Credentials, environment files, payload bodies, and provider secrets are not
  included.

## Exact focused commands and failures

### 03A-04 wakeup/replan integration

Command:

```text
DATABASE_URL=<sanitized-local-url> corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts
```

Exit code: `1`

```text
✖ BSS-V2-006-03A-04 deduplicates activation wakeups and emits only bounded convergence intents (60.8201ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ todo 0
ℹ duration_ms 63.6103

✖ failing tests:

test at tests/plan-wakeup-convergence.integration.test.ts:7:23
✖ BSS-V2-006-03A-04 deduplicates activation wakeups and emits only bounded convergence intents (60.8201ms)
  AssertionError [ERR_ASSERTION]: one activation has one durable pg-boss dispatch identity

  0 !== 1

      at TestContext.<anonymous> (C:/Workspace/atlas/ces-platform/packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts:37:21)
```

The test's transaction rolled back in its `finally` block after the assertion.
Therefore the exact failed test invocation has no surviving test-specific job
ID, attempt, reservation, claim, or feedback row to report. The observed
persisted job below is the corresponding earlier wakeup delivery from the same
working-tree implementation.

### Admitted-worker integration regression

Command:

```text
DATABASE_URL=<sanitized-local-url> corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
```

Exit code: `1`

```text
✖ BSS-V2-006-03A consumes an admitted pg-boss job once and feeds the production ingress (636.4212ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ todo 0
ℹ duration_ms 639.875

✖ failing tests:

test at tests\\provider-admitted-worker.integration.test.ts:63:23
✖ BSS-V2-006-03A consumes an admitted pg-boss job once and feeds the production ingress (636.4212ms)
  PostgresError: permission denied for table qualified_provider_route_authority
  SQL function: bridge.publish_qualified_provider_route_authority(...)
  SQLSTATE: 42501
```

This failure occurs before the admitted job is created. Job ID: none for this
exact invocation. Original-vs-rejected replay: not reached.

## Persisted queue and worker evidence

The following rows were read after the focused failures and sanitized to retain
only durable identities, states, retry metadata, and bounded error messages.

### Wakeup job

- Job ID: `69a21f38-d49f-4517-9682-afab704513a0`
- Queue: `bridge-provider-work-wakeup-v1`
- Data identity: quota domain `provider-work-1792154156260`, wakeup key
  `activation:plan-v1:1`
- State: `retry`
- Retry count/limit: `0/2`
- Output: PostgreSQL `42883`; `bridge.consume_active_plan_wakeup(unknown, unknown)`
  does not exist; worker path was `provider-wakeup-worker.ts:22` through
  `worker.ts:175`.

### Admitted-worker replay evidence

- Job IDs `e2c9f6a6-50f3-4e3d-bf39-29ea5d3d6d39` and
  `16cc833b-3f28-40a2-89f6-6c6444577d83`
- Queue: `bridge-provider-admitted-execution-v1`
- State: `failed`
- Retry count/limit: `2/2`
- Sanitized output: `reservation already authorized an outbound attempt`
- Interpretation: deliberately repeated delivery/replay, not an original
  admitted send. The current focused run did not reach this branch because it
  failed earlier on route-authority permissions.

### Related persisted state snapshot

- Wakeup dispatch table exists: `bridge.provider_work_wakeup_dispatch`
- Convergence-intent table exists: **no** (`to_regclass(...)` returned null)
- Recent wakeup dispatch rows were present, including the job ID above, and
  remained unclaimed (`claimed_at` null).
- Related attempt/reservation/claim/feedback rows from prior fixtures were
  present; the exact just-failed wakeup transaction left none because it rolled
  back. Feedback observations retained only qualified source/trust and
  identity fields; usage and provider payloads were omitted.

## Migration check observed before snapshot

Command:

```text
DATABASE_URL=<sanitized-local-url> corepack pnpm --filter @atlas/db migration:check
```

Exit code: `1`; the local database reported only these missing registrations:

```text
0051_bssv200603a_pressure_cfc_closure,
0056_bssv200603a_post_cooldown_domain_pressure_clamp
```

The database reported `0055_bssv200603a_durable_wakeup_consumer` as applied,
but its current working-tree schema shape is inconsistent with the source
file: the dispatch table exists while the convergence-intent table and
`consume_active_plan_wakeup` function do not.

## Pre-snapshot status

The source status was captured before adding this evidence directory. Relevant
03A-04 and directly related entries were:

```text
 M apps/agents-bridge/src/production-worker-composition.ts
 M apps/agents-bridge/src/worker.ts
 M packages/atlas-db/scripts/migrate.mjs
 M packages/atlas-db/tests/provider-work-reservation-window.integration.test.ts
?? apps/agents-bridge/src/provider-wakeup-worker.ts
?? packages/atlas-db/migrations/0039_bssv200603a_feedback_variable_conflict_forward_fix.sql
?? packages/atlas-db/migrations/0040_bssv200603a_reset_feedback_guc.sql
?? packages/atlas-db/migrations/0041_bssv200603a_feedback_function_forward_replacement.sql
?? packages/atlas-db/migrations/0042_bssv200603a_feedback_trust_forward_fix.sql
?? packages/atlas-db/migrations/0043_bssv200603a_admitted_job_notify.sql
?? packages/atlas-db/migrations/0044_bssv200603a_remove_redundant_job_notify.sql
?? packages/atlas-db/migrations/0045_bssv200603a_feedback_shape_forward_fix.sql
?? packages/atlas-db/migrations/0046_bssv200603a_feedback_wall_clock_forward_fix.sql
?? packages/atlas-db/migrations/0055_bssv200603a_durable_wakeup_consumer.sql
?? packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts
```

Unrelated modified and untracked paths were intentionally excluded from the
diagnostic snapshot.
