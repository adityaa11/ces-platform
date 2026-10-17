# CFC checkpoint — BSS-V2-006-04-01

- **Ticket:** `BSS-V2-006-04-01` — Runtime capacity-constraint read boundary
- **Batch:** `BSS-V2-BATCH-06-04-01`
- **Remediation base:** `ad76fbaf4e9e5cf4e451b607d8fc0daa72bb6cc1`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-04-01-ad76fba-review.md`
- **Authorized clause:** `CK-001.a` only
- **Bounded remediation commit:** `3ae601f5a3dd1f2a01ac915b66d9edee95b109d1` — `fix(admission): expose runtime constraint read`.
- **Checkpoint state:** `awaiting_review`

## CFC working progress view

| Frozen clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/app.ts` exposes `GET /v1/runtime-capacity-constraint`; it accepts only a Bearer credential and no caller-provided process, route, domain, or class. `src/main.ts` composes configured server-owned principal bindings and the Bridge database role. `tests/runtime-capacity-constraint.integration.test.ts` starts the composed Fastify listener and the two external fake consumers call it with opaque credentials over HTTP. | `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/runtime-capacity-constraint.integration.test.ts` from `apps/agents-bridge` — PASS (1/1). | The committed versioned Bridge route authenticates opaque credentials to server-bound identities. Both qualified classes receive the bounded projection; forged/foreign, stale, cooldown, unavailable, and unknown-window reads fail conservatively while exact durable attempt/reservation/job/claim/send/quota counters have zero deltas. |

## Required validation and exact outcomes

| Command | Outcome |
| --- | --- |
| `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/runtime-capacity-constraint.integration.test.ts` from `apps/agents-bridge` | PASS — 1 test, 1 passed, 0 failed, 0 skipped. |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS. |
| `corepack pnpm --filter @atlas/db typecheck` | PASS. |
| `node --env-file=../../.env scripts/migrate.mjs --check` from `packages/atlas-db` | PASS — Atlas database migration check passed. |
| `git diff --check` on the remediation paths | PASS. |

## Direct regression and scope locks

- The fixture retains its non-inert 03A baseline and exact zero deltas for attempts, reservations, jobs, claims, sends, and quota mutation.
- It continues to prove forged credential/domain/class/route, stale effective revision, cooldown, unavailable policy, unknown window, and `atlas_app` SQL denial.
- The repair adds neither provider-work admission nor a send path, consumer adapter, semantic/reconciliation behavior, or BSS-005 publication.
- Unrelated tracked fixture edits and untracked artifacts in the worktree were not staged.

Internal readiness: `READY_FOR_CK`

The single authorized frozen clause is ready for independent CK verification.
