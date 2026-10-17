# CFC checkpoint — BSS-V2-005-05-03

- **Ticket:** BSS-V2-005-05-03 — Authorized desired-plan convergence
- **Batch:** BSS-V2-BATCH-05-05-03
- **Remediation base:** `445c6366a8ca5483cdb8950d2e82b184881e4733`
- **Source CK review:** `project's goal/feedback/BSS-V2-BATCH-05-05-03-445c636-review.md`
- **Addressed frozen clause:** `CK-001.a`
- **State:** `awaiting_review`

## Bounded remediation

The focused convergence integration now opens two distinct `agents_bridge`
database clients for the competing candidates. A third Bridge connection holds
the same per-domain advisory lock before both candidate calls are started. The
harness verifies that both writer backend PIDs are waiting on that lock, then
releases it and asserts one `published` result, one `stale` result, exactly one
new activation, and an active desired-plan identity equal to the published
winner. The prior identical-input, immutable-history, qualified-capacity,
versioned stale/unfit, and no-provider-work assertions remain in the scenario.

## Frozen Finding Closure Matrix

| CK clause | Status | Exact evidence / command | Frozen oracle |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts` uses `writerA`, `writerB`, and `gate`; it confirms separate backend PIDs, waits for both writer PIDs to block at the per-domain advisory fence, releases the gate, and asserts `published`/`stale`, three activation-history rows, and the active winner. `pnpm --filter @atlas/db test:authorized-desired-plan-convergence` — PASS (1 test, 0 skipped). | PASS — two independently connected, barrier-controlled writers from activation revision 2 yield one committed activation and one stale result; the winning immutable plan remains active and prior versions remain intact. |

## Direct regressions checked

- `pnpm --filter @atlas/db migration:check` — PASS (`Atlas database migration check passed`).
- `pnpm --filter @atlas/db test:desired-admission-profile-publication` — PASS (1 test, 0 skipped).
- `pnpm --filter @atlas/db typecheck` — PASS.
- `git diff --check` — PASS.

Internal readiness: READY_FOR_CK

This CFC checkpoint is a bounded remediation handoff only; CK retains the
authority to verify the frozen clause and issue a result.
