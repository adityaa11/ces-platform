# CFC checkpoint: IDSER-012-05-01-02 / IDSER-BATCH-12-05-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-01-02-conservative-multimodal-estimation.md`.
- **CK authority:** `project's goal/feedback/IDSER-BATCH-12-05-01-02-9279bd5-review.md`.
- **Reviewed commit:** `9279bd51a81594c443ad2aeef8e23d6f835b5669`.
- **Remediation base:** `792a734139b8ea9d7aa2952ceabef481934accf5`.
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b` only.
- **Ticket state:** `awaiting_review`.

## Bounded remediation

The shared complete-request estimator now treats every selected canonical PNG
with verified asset identity as required media accounting, regardless of whether
the canonical source slot is independently owned or context-only. Ownership
semantics remain upstream; this pure estimator only conservatively measures the
already selected request. The focused estimator fixture now proves the required
context-only image-only and owned-plus-context mixed compositions. No provider,
hydration, persistence, SEM, admission, or BSS behavior was changed.

## Frozen Finding Closure Matrix

| Clause | Status | Evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts:111-119` accepts every canonical selected visual with an asset identity for exact selected-media accounting. The focused `measures context-only and owned-plus-context PNGs exactly once` test returns successful estimates for a context-only PNG and one owned plus one context-only PNG. It asserts counts `1`/`2`, exact byte sums, per-image grid-token sums `1,032`/`2,064`, `requestBytes >= projectedTransportBytes`, and one output reservation in the BSS envelope. The frozen oracle passes. |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts:84-102` adds both required named scenarios to the pure estimator harness and retains the existing owned-image, mixed, text-only, negative, serializer-policy, and purity assertions. The focused command passes all five tests. The frozen oracle passes. |

## Validation and direct regressions

- `corepack pnpm --filter @atlas/agents-bridge test:conservative-multimodal-estimation` — **PASS**: 5 tests, 0 failures. This is the frozen clause-specific harness.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/complete-sem-candidate-request-estimator.test.ts` — **PASS**: 4 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/anoman-provider.test.ts` — **PASS**: 6 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/multipart-provider-capabilities.test.ts` — **PASS**: 7 tests, 0 failures.
- `git diff --check -- apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts` — **PASS**.

The CFC shadow-CK check is complete: both authorized frozen clauses are
`PROVEN` using the exact focused harness and their binary closure oracles; the
direct estimation and adapter regression boundaries remain green.

Internal readiness: `READY_FOR_CK`.

This bounded CFC checkpoint is `awaiting_review` for CK verification of
`CK-001.a` and `CK-001.b`; it does not issue a CK result.
