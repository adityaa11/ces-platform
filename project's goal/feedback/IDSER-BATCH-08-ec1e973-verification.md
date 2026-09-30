# CK verification: IDSER-008 / IDSER-BATCH-08

- **Review type:** post-HMN-authorized CFC verification
- **Ticket:** IDSER-008 — Bundle completion and failure lifecycle
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `ec1e97380b7a23226baa87de9726e1b95e4a51f7` (`fix(idser): prove residual worker lifecycle evidence`)
- **Consumed authorization:** `HMN-IDSER-008-005`
- **CFC checkpoint:** `IDSER-BATCH-08-cfc-remediation-3.md`
- **Original frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **Prior CK verification:** `IDSER-BATCH-08-8e0abca-verification.md`
- **Result:** `PASS`

This is bounded verification of the original frozen clauses, the single HMN-authorized remediation diff, and direct regressions introduced by that remediation. It does not restart broad review or add findings. The active tuple is IDSER-008 / IDSER-BATCH-08, `awaiting_review`, with the reviewed commit at `HEAD` and the CFC checkpoint recording the consumed HMN authorization.

## Frozen clause outcomes

| Original clause | Outcome | Verification against its frozen oracle |
|---|---|---|
| `CK-001.a` | **RESOLVED (preserved)** | The previously proven Compose perception worker fixture remains unchanged. It injects replay-load, Atlas source-handoff (503), and replay-stage outages; observes the Bridge operational effect remain retryable and Atlas execution non-terminal; then observes recovery after dependency restoration, with one provider call and replay cleanup. The exact perception Compose command passed 2/2 including the new lifecycle test. No remediation change invalidated this oracle. |
| `CK-001.b` | **RESOLVED** | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` now sets the active-version semantic execution to the real `queued` lifecycle and calls final acceptance. Its helper asserts rejection, no final reconciliation result, and unchanged processing bundle/count before restoring the fixture. The same Compose test retains bundle-wide candidate/evidence checks, exact normalized locator matching, other rejection cases, valid atomic acceptance, exact replay, and stopped/restarted worker progression. The exact required Compose command passed 1/1. |
| `CK-001.c` | **RESOLVED** | The real pg-boss perception worker Compose fixture observes bounded retry exhaustion, source delivery against a grant already beyond its validity, terminal failure reporting without trusted completion, and a stale failure report rejected after worker-committed accepted perception completion. The real stopped/restarted Compose reconciliation worker commits accepted completion and then rejects a stale terminal report while retaining completed execution/member state. The prior semantic worker Compose test still passes its Atlas-outage/replay/restart observations, and the semantic authority integration still passes its extraction completion/failure race. The required worker and integration scenarios are not replaced by direct authority-unit tests or mocked worker evidence. |

## Checks performed

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — **passed**, 2/2, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — **passed**, 1/1, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` — **passed**, 1/1, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:semantic-authority` — **passed**, 1/1, 0 skipped.
- `git diff HEAD^ HEAD --check` — **passed**.
- Supplemental `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:perception-authority` — **failed twice** at the unchanged assertion in `packages/atlas-db/tests/perception-authority.integration.test.ts:42` (`Missing expected rejection` for a token formed by changing only the last base64url character). The remediation diff changes neither this test nor perception authority code. The frozen perception worker oracle itself passed and observed accepted completion resisting a stale failure. This supplemental failure is recorded as an out-of-scope observation, not a remediation regression or a new CK finding.

## Direct remediation regression

None identified. The committed diff changes only the named Compose integration fixtures and the CFC evidence record; both frozen clause commands passed. `CK-001.a`'s recovery proof remains intact.

## Decision

Record `PASS` for IDSER-008 / IDSER-BATCH-08 at `ec1e97380b7a23226baa87de9726e1b95e4a51f7`. All original frozen clauses `CK-001.a` through `CK-001.c` satisfy their closure oracles, and no direct remediation regression remains. The supplemental standalone perception-authority failure is outside this bounded post-HMN verification and does not alter the original frozen outcomes. No further remediation cycle is authorized or requested.
