# CFC corrective checkpoint: SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE

- Ticket: `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`
- HMN authorization consumed: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-003`
- Remediation base: `ed0e70198a9ead931d6b8a626be1226a9194d2e6`
- Frozen post-CFC CK artifact: `project's goal/feedback/SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-ed0e701-verification.md`
- Corrective target: the direct shutdown regression identified by that CK artifact
- State: `awaiting_review`

## Scope protection

The original frozen clauses `CK-001.a` and `CK-001.b` were already `RESOLVED`
and remain closed. This checkpoint does not reopen, redesign, or re-verify them
as new remediation clauses. It records only the one HMN-authorized direct
regression correction and its direct effects.

## Corrective change

The redundant pre-existing HTTP-server `close` listener was removed from
`apps/atlas/perception-internal.ts`. The newly introduced cleanup remains the
single owned listener and retains `Promise.allSettled()` over exactly one call
each to `semanticQueue.close()`, `perceptionQueue.close()`, and
`sql.end({ timeout: 1 })`.

The mounted qualified-result integration test adds one focused assertion that
the mounted plugin registers exactly one owned `close` handler. The existing
server close path completes successfully in the same test, proving the
single-handler shutdown path does not request duplicate resource finalization.

## Exact implementation diff

Only these implementation/test paths changed relative to `ed0e701`:

| Path | Change |
| --- | --- |
| `apps/atlas/perception-internal.ts` | Remove the redundant second `close` listener. |
| `packages/atlas-db/tests/qualified-deferred-acceptance.integration.test.ts` | Expose the mounted listener count and assert it is exactly `1`. |

`git diff --check` passed. No semantic routing, accepted data, database
authority, admission, reconciliation, or deferred-acceptance behavior changed.

## Validation evidence

| Required validation | Outcome | Evidence |
| --- | --- | --- |
| `pnpm --filter @atlas/db test:qualified-deferred-acceptance` | PASS, 5/5 | Mounted route test includes `shutdownHandlerCount === 1`; server close completes. |
| `pnpm --filter @atlas/db test:extraction-acceptance` | PASS, 2/2 | Existing full-canonical extraction/reconciliation regression remains green. |
| `pnpm --filter @atlas/db test:staged-perception-admission` | PASS, 2/2 | Existing staged-admission boundary remains green. |
| `node --test apps/atlas/tests/home-projects.test.mjs` | PASS, 5/5 | Home-projects lifecycle/projection regression remains green. |
| `pnpm --filter @atlas/db typecheck` | PASS | No type errors. |
| `pnpm --filter @atlas/db migration:check` | PASS | Atlas database migration check passed. |

## Direct-regression closure

The production plugin has one `server.httpServer?.once("close", ...)` handler,
and that handler requests each owned resource exactly once. The focused mounted
test observes one handler and successfully closes the HTTP server. The
corrective implementation diff is limited to the shutdown correction and its
narrow regression assertion.

## Internal readiness

`READY_FOR_CK`.

This is one bounded corrective checkpoint. It does not issue `PASS`; independent
CK must verify this direct regression, the exact corrective diff, and the
required validation while carrying forward `CK-001.a` and `CK-001.b` as
resolved.
