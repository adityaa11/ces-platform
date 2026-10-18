# CFC checkpoint: IDSER-012-03-02-01 / IDSER-BATCH-12-03-02-01

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-02-01-authorized-bss-prospective-snapshot-reader.md`
- **Remediation base:** `104ce8ce` (`docs(idser): record snapshot reader commit`)
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-02-01-c80a819-review.md`
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`.
- **Checkpoint state:** `awaiting_review`.

## Bounded remediation

The IDSER prospective-snapshot adapter now derives `eligibleDimensions` from
the BSS enforcement projection in BSS order: the authorized Anoman
unknown/not-enforced RPD result exposes `rpm`, `tpm`, and `concurrency`; a
known enforced RPD result also exposes `rpd`. The distinct
`RequestResourceEnvelope` remains the unchanged four-field
`{requestUnits,tokenUnits,dayUnits,concurrencyUnits}` demand shape, including
positive `dayUnits` for Anoman.

The adapter now rejects an otherwise unknown/not-enforced RPD state when either
its source or enforcement object carries a numeric RPD limit. It continues to
accept the real authorized no-limit shape with its approval reference. No BSS
runtime admission, planner, estimator, persistence, GHR, SEM, provider, or
reconciliation behavior changed.

## Frozen Finding Closure Matrix

| Clause | Ticket authority | Required closure oracle | Evidence locator | Command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | `RC-012030201-03`; parent split-map exact demand-shape clarification. | The result keeps BSS provider mask separate from demand: Anoman unknown/not-enforced RPD yields `['rpm','tpm','concurrency']`; known RPD yields `['rpm','tpm','rpd','concurrency']`; positive `dayUnits` remains in the exact four-field envelope. | `apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts` derives the mask from validated enforcement; `apps/agents-bridge/tests/idser-prospective-capacity-snapshot.test.ts` asserts unknown- and known-RPD masks; `apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts` asserts the real Anoman result and unchanged positive `dayUnits`. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — **PASS**: 2 tests, 0 failures. `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts` with repository `.env` loaded — **PASS**: 1 real PostgreSQL test, 0 failures, 0 skips. | `PROVEN` — frozen oracle passed. |
| `CK-001.b` | `RC-012030201-03`; frozen ticket prohibition on converting unknown RPD into a numeric provider limit. | The adapter rejects both a numeric source-side RPD value and a numeric enforcement-side RPD limit for unknown/not-enforced RPD; the real authorized no-limit snapshot remains accepted with positive `dayUnits` unchanged. | `apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts` rejects numeric fields before accepting unknown RPD; the focused consumer test exercises both rejected mutations; the PostgreSQL integration exercises the no-limit Anoman projection. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — **PASS**: 2 tests, 0 failures. `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts` with repository `.env` loaded — **PASS**: 1 real PostgreSQL test, 0 failures, 0 skips. | `PROVEN` — frozen oracle passed. |

## Direct regression checks

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — **PASS**: 2 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts` with repository `.env` loaded — **PASS**: 1 real PostgreSQL test, 0 failures, 0 skips.
- `corepack pnpm --filter @atlas/db migration:check` with repository `.env` loaded — **PASS**.
- `git diff --check -- apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts apps/agents-bridge/tests/idser-prospective-capacity-snapshot.test.ts apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts` — **PASS**.

Internal readiness: `READY_FOR_CK`

Every authorized frozen clause is proven. The remediation is limited to
`CK-001.a` and `CK-001.b`; the already-proven rows remain protected. Hand off
for CK verification of the frozen clauses and direct regressions only.
