# CFC checkpoint: IDSER-010-04 / IDSER-BATCH-10-04

- **Ticket:** `IDSER-010-04-concurrent-bundle-identity-isolation.md`
- **CK authority:** `IDSER-BATCH-10-04-95cc521-review.md`, first consolidated review, `CHANGES_REQUIRED`.
- **Reviewed/remediation base:** `95cc521d63daae3188e2d698f619464ffd4cfe1e`.
- **Authorized scope:** `CK-001.a`, `CK-001.b`, and `CK-001.c` only. No HMN authorization applies to this first CFC pass.
- **Protected work:** The predecessor and scenarios A–E were not reopened. No unrelated files were staged for this checkpoint.
- **Status:** `awaiting_review` for the one allowed post-CFC CK verification.

## Frozen clause closure

The frozen authority, unsatisfied condition, harness/scenario/observation requirements, binary oracle, and direct-regression boundary for each clause remain exactly those in the cited CK artifact. This checkpoint maps each clause to evidence without restating or modifying its oracle.

| CK clause | Status | Evidence locator and result | Required command / oracle |
|---|---|---|---|
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F; `IDSER-BATCH-10-04-cfc-evidence.json` fields `ownersAndIds`, `deniedContext`, `deniedCrossOwnerProgressMutation`. Both same-name owners retain distinct project/workspace/bundle/document/execution IDs; each authenticated owner reads only its own project. The foreign capability is rejected with HTTP 400; foreign-scope result delivery is rejected with HTTP 409. Target and control progress snapshots are identical before/after both rejections. | `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed. Frozen oracle passed. |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F; evidence fields `queueJobs`, `workerEvents`, `unrelatedQueueStateUnchanged`, `acknowledgedOutboxRowsRemaining`. Four unique jobs on `bridge-background-execution-v1` map one-to-one to the two extraction and two reconciliation execution IDs. All four finish `completed`; production worker events show overlapping alpha/beta execution at both stages; each scope has one event per stage; unrelated queue state is unchanged; acknowledged result outbox rows remaining is 0. | `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed. Frozen oracle passed. |
| `CK-001.c` | `PROVEN` | `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F; evidence fields `deniedContext`, `deniedForeignCandidateReference`, `finalScopes`, `ownersAndIds`. Cross-owner context use is rejected with HTTP 400; foreign candidate target delivery is rejected with HTTP 422. Target/control observations are identical before/after each denial. Each independent owner ends `ready_for_review` at 1/1, with one extraction result, one reconciliation result, one candidate, one evidence row, and one relationship; the controlled meanings remain owner-specific. | `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed. Frozen oracle passed. |

The exact Compose command, generated safe scoped IDs, four pg-boss job IDs and queue names, worker event timestamps, response statuses, before/after database observations, cleanup counts, and final per-owner counts are preserved in `IDSER-BATCH-10-04-cfc-evidence.json`. Run totals: 13 controlled OCR calls and 26 structured-provider calls. No required validation was skipped or blocked by the environment.

## Direct regressions and validation

- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — passed.
- `node --check apps/agents-bridge/tests/mistral-ocr-mock.mjs` — passed.
- `git diff --check` — passed.
- `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed; deterministic production Compose scenarios A/B/C/D/E/F passed, including the new Scenario F owner-read/progress-denial, semantic context/result, foreign-reference, pg-boss worker overlap/claim/delivery, and cleanup observations. Compose returned to the base topology in the harness `finally` block.

## Internal readiness

All three authorized frozen clauses are `PROVEN`; required validation used the production Compose harness and passed; no direct in-scope regression remains.

**Internal readiness: READY_FOR_CK**

CK may perform only the allowed verification of these frozen clauses, the remediation diff, their required evidence, and direct regressions introduced by this remediation. CFC makes no `PASS` determination and starts no further review or remediation cycle.
