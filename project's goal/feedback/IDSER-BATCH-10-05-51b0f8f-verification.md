# CK verification: IDSER-010-05 / IDSER-BATCH-10-05

- **Ticket:** `IDSER-010-05-staged-result-replay-restart.md`
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `51b0f8fa3f34b8fcc784b987cdc03515d2b1dd04` (`test(idser): observe resumed Atlas result envelope`)
- **Remediation base:** `0d39413c9538b9d3481afd2f9a66e638d7f54771`
- **Original CK:** `IDSER-BATCH-10-05-0d39413-review.md` (`CHANGES_REQUIRED`)
- **Consumed HMN authorization:** `HMN-IDSER-010-05-001`
- **Review type:** Post-CFC CK verification
- **Result:** `PASS`

## Bounded verification scope

The remediation commit follows the original reviewed checkpoint and records the consumed HMN authorization for the single authorized clause, `CK-001.a`. The reviewed diff is limited to the Scenario H Compose harness, a test-only Atlas result-boundary observer, its disposable Compose overlay, and the CFC checkpoint. The ticket and frozen original CK artifact are unchanged. Unrelated working-tree changes do not overlap this target.

This verification covers only frozen `CK-001.a`, the remediation diff, its required evidence, and direct regressions introduced by that diff. Historical outcomes for `RC-010-05-02` and `RC-010-05-03` are carried forward unchanged.

## Frozen clause verification

| Original clause | Status | Evidence against frozen closure oracle |
|---|---|---|
| `CK-001.a` | **RESOLVED** | The passing controlled Compose run captured one request accepted at the trusted Atlas semantic-result boundary after the real worker restart. Scenario H deep-compared that Atlas-bound envelope to the durable pre-interruption staged envelope and asserted matching canonical SHA-256 fingerprints. The required binary oracle passed. |

## Validation and direct-regression check

- Ran `node apps/agents-bridge/tests/idser-010-compose.mjs` against commit `51b0f8f`; controlled Compose scenarios A/B/C/D/E/F/H passed and the disposable project was torn down by the harness.
- Fresh Scenario H evidence: execution `8ef685a0-839d-4c14-9780-342cfe16345f`; staged and resumed Atlas-bound envelope SHA-256 both `9e2075db20e4429c33dc767be71984af8d4a9f2908c43a9269b60cbc30748fd7`; captured Atlas-bound envelope count `1`; equality `true`; lease generation `1 -> 4`; structured provider totals `26 -> 29`; one scoped extraction call; final lifecycle completed with expected/completed counts `1/1` and one extraction result, candidate, evidence, relationship, and completed job.
- The test-only observer is enabled by `docker-compose.perception-smoke.yml`, records only successfully accepted semantic-result requests, and requires the Bridge credential for its read path. It does not change production behavior when the test-only observation path is unset.
- The same required harness run preserved the already proven replay, provider-call, lease, and singular-effect assertions. No direct regression from the remediation diff was identified.

## Decision

`IDSER-BATCH-10-05` receives `PASS`. Original clause `CK-001.a` is resolved against its frozen oracle; previously proven rows remain proven and were not reopened. This is bounded post-CFC verification and does not authorize another remediation cycle.
