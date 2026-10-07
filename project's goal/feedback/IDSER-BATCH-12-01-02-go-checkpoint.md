# GO checkpoint: IDSER-012-01-02 / IDSER-BATCH-12-01-02

- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-01-02-two-worker-docling-perception-composition.md`
- **State:** `awaiting_review`
- **Predecessor:** IDSER-012-01-01 is approved at `8ac6d47`; CK PASS is recorded in `IDSER-BATCH-12-01-01-2fbb213-verification.md`.

Implemented only the two-worker local-perception composition: distinct Bridge background/perception limits, a private CPU Docling 2/2/2/1 profile, parser-validated terminal `perceived` delivery, durable fenced recovery across restart/replay, and isolated real-PDF qualification. The Bridge bootstrap now installs the narrow pg-boss privileges required by the current partitioned `job` table for atomic Atlas enqueueing; it does not grant queue management or job lifecycle mutation. The inherited admission test reads queue evidence using its admin observer, preserving Atlas's enqueue-only application path.

## Review Contract Closure

| Row | Required proof | Evidence / test locator | Outcome | Status |
| --- | --- | --- | --- | --- |
| RC-0120102-01 | Effective 2/2/2/1 profile and mismatch rejection. | `apps/agents-bridge/tests/idser-012-01-02-qualification.mjs` profile report. | Live Docling inspection: Uvicorn 1, local conversions 2, CPU/no remote services; Bridge perception 2; invalid 3 rejected. | PROVEN |
| RC-0120102-02 | Held third call remains unadmitted; terminal release refills without exceeding two. | Qualification `heldConcurrency`. | Atlas 2 / pg-boss 2 / real Docling peak 2; third had no execution, grant, or job; refill occurred after release. | PROVEN |
| RC-0120102-03 | One valid accepted result, `perceived`, and zero semantic work. | Qualification `terminal`; `tests/perception-integration.test.ts`. | One cache/result per successful document; parser-valid v1; bundles remained processing; zero semantic jobs. | PROVEN |
| RC-0120102-04 | Ack loss, duplicate, restart, failure containment and healthy refill. | Qualification `replayRestartFailure`; `tests/worker.integration.test.ts`; isolated `test:staged-perception-admission`. | Duplicate did not change fingerprint or turn; restart stayed capped at 2; failed bundle was needs_attention plus unadmitted pending member; healthy refill completed. | PROVEN |
| RC-0120102-05 | Deterministic sequential/concurrent PDFs, warm boundary and local resource observation. | Qualification `determinism`. | Identical normalized hashes; 4.4–5.1s document routes, 5.1s concurrent wall time, peak 2, CUDA unavailable. | PROVEN |

Validation passed:

```text
node apps/agents-bridge/tests/idser-012-01-02-qualification.mjs
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/db typecheck
pnpm --filter @atlas/db migration:check
jiti apps/agents-bridge/tests/worker.integration.test.ts
jiti apps/agents-bridge/tests/perception-integration.test.ts
jiti apps/agents-bridge/tests/perception-negative.integration.test.ts
isolated Compose pnpm --filter @atlas/db test:staged-perception-admission
git diff --check
```

Internal readiness: READY_FOR_CK

This is implementation readiness only; GO does not issue PASS.
