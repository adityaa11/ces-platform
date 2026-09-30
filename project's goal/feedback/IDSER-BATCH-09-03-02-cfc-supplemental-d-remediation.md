# CFC checkpoint: IDSER-009-03-02 supplemental D

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Remediation base:** `ae03382946847373725616139f11662ac8a2cb53`
- **Supplemental closure artifact:** `project's goal/feedback/IDSER-BATCH-09-03-02-supplemental-d-contract-freeze.md`
- **HMN authorization consumed:** `HMN-IDSER-009-03-02-002`
- **State:** `awaiting_review`

## Corrected closure progress

| Frozen clause | Evidence location | Exact command and outcome | Frozen oracle |
|---|---|---|---|
| `CK-SUP-009-03-02-D` | `apps/agents-bridge/tests/perception-integration.test.ts`, in the existing wrong-service-credential route assertion. | `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/agents-bridge && corepack pnpm exec jiti tests/perception-integration.test.ts'` — passed, 2/2. | **Passed.** Before the real `routes.redeem("wrong-credential", request)` call, the target and separately scoped control each snapshot as `{ bundle_state: "waiting", bundle_started_at: null, completed_document_count: 0, member_state: "perception_queued", member_started_at: null }`. The route returned HTTP 401. Both persisted snapshots matched their respective before snapshots after the request. |

## Direct regression

`docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck && corepack pnpm --filter @atlas/db test:perception-authority'` — typecheck passed; focused authority integration passed, 1/1.

## Scope protection

This checkpoint changes only the focused route/worker integration fixture: it creates an unrelated waiting bundle/member control, captures the required persisted snapshots, asserts the existing unauthorized response, compares before/after state, and cleans up the control fixture. It does not alter production authentication, `PostgresPerceptionAuthority.redeem()`, lifecycle authority, prior grant/replay evidence, or IDSER-009-04.

## Readiness

Internal readiness: `READY_FOR_CK`.

`CK-SUP-009-03-02-D` has a named assertion, the exact focused Compose command passed, and its frozen binary oracle passed. This is a CFC readiness record only; CK must independently verify the supplemental D oracle and direct regressions.
