# Diagnostic snapshot manifest

The snapshot is based on source HEAD `c3dcf10c756e1db272ba6c611975f07c3d7bb217`.
The following current working-tree paths were added or captured in the
diagnostic commit:

- `apps/agents-bridge/src/production-worker-composition.ts`
- `apps/agents-bridge/src/worker.ts`
- `apps/agents-bridge/src/provider-wakeup-worker.ts`
- `packages/atlas-db/scripts/migrate.mjs`
- `packages/atlas-db/tests/provider-work-reservation-window.integration.test.ts`
- `packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts`
- `packages/atlas-db/migrations/0039_bssv200603a_feedback_variable_conflict_forward_fix.sql`
- `packages/atlas-db/migrations/0040_bssv200603a_reset_feedback_guc.sql`
- `packages/atlas-db/migrations/0041_bssv200603a_feedback_function_forward_replacement.sql`
- `packages/atlas-db/migrations/0042_bssv200603a_feedback_trust_forward_fix.sql`
- `packages/atlas-db/migrations/0043_bssv200603a_admitted_job_notify.sql`
- `packages/atlas-db/migrations/0044_bssv200603a_remove_redundant_job_notify.sql`
- `packages/atlas-db/migrations/0045_bssv200603a_feedback_shape_forward_fix.sql`
- `packages/atlas-db/migrations/0046_bssv200603a_feedback_wall_clock_forward_fix.sql`
- `packages/atlas-db/migrations/0055_bssv200603a_durable_wakeup_consumer.sql`
- `.codex-tools/diagnostic-bss-v2-006-03a-04-worker-regression/evidence.md`
- `.codex-tools/diagnostic-bss-v2-006-03a-04-worker-regression/MANIFEST.md`

Unchanged dependencies remain available through the parent source tree,
including `apps/agents-bridge/src/provider-admitted-worker.ts`,
`apps/agents-bridge/tests/provider-admitted-worker.test.ts`,
`apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts`,
`apps/agents-bridge/src/provider-operational-runtime.ts`, the existing 03A
database migrations, and the ticket document
`project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-04-plan-wakeup-and-replan-intents.md`.

Excluded: secrets, credentials, local environment files, database dumps, and
unrelated modified/untracked workspace paths.
