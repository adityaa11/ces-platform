# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `b4af1f50688ffa07f7f15f0059448b2e2903cea1` (`test(idser): cover semantic provider and handoff path`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`. Its checkpoint records that this commit consumes `HMN-IDSER-005-002` (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- Review type: HMN-authorized post-CFC verification of remaining portions of original CK-001 and CK-002 only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Reviewed the active HMN authorization [IDSER-005-hmn-002.md](IDSER-005-hmn-002.md), the bounded commit diff, and only original findings CK-001 and CK-002. `git diff --check b4af1f5^..b4af1f5` passed.
- In Compose, Bridge typecheck passed. Registered `test:semantic` passed 4/4: the three existing semantic-worker unit tests and the new provider/client test.
- The registered full Bridge suite was started. Its service, provider, perception, and semantic portions passed, but `worker.integration.test.ts` could not connect to `postgres` (`getaddrinfo ENOTFOUND postgres`) in the one-off `--no-deps` Compose environment; this is an unavailable test service, not a product assertion failure. The suite therefore was not fully verified in this run.

## Original findings verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-001: fenced immutable replay requires real worker/DB proof that a stale claimant cannot terminally fail the staged winner | **Unresolved evidence.** | `apps/agents-bridge/tests/semantic-worker.test.ts` remains a unit-double test; no new test invokes `createSemanticResultReplay`, `bridge.background_effects`, `bridge.semantic_result_delivery`, pg-boss, or fenced cleanup. The authorized actual lease/replay proof remains absent. |
| CK-002: real mocked-HTTP, Bridge-ledger, Atlas-route, restart/fencing, and configuration integration matrix | **Unresolved.** | The added `semantic-client.integration.test.ts` directly constructs `createAtlasSemanticClient` and `MistralProvider` with injected fetch doubles. It does cover both skill schemas and an authorization header, but it does not run `runSemanticJob`, `createBackgroundWorker`, real Bridge SQL, real Atlas internal routes, or any required restart, acknowledgement-loss, delivery-outage, cleanup, duplicate, lease-expiry, conflicting-stage, handler-unavailable, credential, bound, timeout, cancellation, or shutdown scenario. It is not the deterministic Compose integration suite explicitly required by the active HMN authorization. |

## Scope-change observations

None. The missing proof remains within the frozen IDSER-005 worker/replay/validation scope.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `b4af1f50688ffa07f7f15f0059448b2e2903cea1`. The HMN-authorized evidence remediation did not supply the required production-path matrix. Return control to human/planning authority; any further remediation requires a fresh explicit `hmn` authorization and must remain limited to unresolved original findings.
