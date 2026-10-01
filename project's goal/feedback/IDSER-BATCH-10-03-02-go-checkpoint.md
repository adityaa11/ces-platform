# GO checkpoint: IDSER-010-03-02 / IDSER-BATCH-10-03-02

- Ticket: `IDSER-010-03-02-semantic-failure-containment.md`
- HMN authorization: `HMN-IDSER-010-03-02-001` (`RETURN_TO_GO`)
- State: `awaiting_review`

## Review Contract Closure

| Row | Required proof | Evidence / validation | Status |
|---|---|---|---|
| RC-010-03-02-01 | Unauthorized or mismatched context/result does not mutate trusted state. | `packages/atlas-db/tests/semantic-authority.integration.test.ts`; Compose `@atlas/db test:semantic-authority` passed 1/1. | PROVEN |
| RC-010-03-02-02 | Provider rejection, timeout, malformed output, schema rejection, and deterministic acceptance rejection fail without fabricated progress. | `apps/agents-bridge/tests/semantic-worker.integration.test.ts`; detached Compose `@atlas/agents-bridge test:semantic-integration` exited 0, passed 1/1. | PROVEN |
| RC-010-03-02-03 | Invalid evidence, inventory, and cross-scope references roll back; uncertainty remains candidate/reviewable. | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts` (2/2) and `reconciliation-acceptance.integration.test.ts` (1/1) via Compose. | PROVEN |
| RC-010-03-02-04 | Only the target member/bundle enters `needs_attention`; no progress or successor follows. | Production-worker integration asserts failed execution, no trusted acceptance/replay, target member/bundle `needs_attention`, and completed count 0. | PROVEN |

Implementation distinguishes deterministic Atlas semantic acceptance rejection (`422`) from retryable handler/transport unavailability (`409`). Only the deterministic classification uses the existing authenticated technical-failure handoff; staged unavailable deliveries retain replay behavior.

Validation also passed: Compose `@atlas/agents-bridge test:semantic` (5 worker tests, 1 client integration) and Compose typechecks for `@atlas/agents-bridge` and `@atlas/db`.

Internal readiness: READY_FOR_CK
