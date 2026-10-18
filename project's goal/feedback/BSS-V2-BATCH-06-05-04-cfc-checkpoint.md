# CFC checkpoint — BSS-V2-006-05-04

- **Ticket:** `BSS-V2-006-05-04` — Policy-aware runtime admission and fairness
- **Review batch:** `BSS-V2-BATCH-06-05-04`
- **Remediation authority:** `project's goal/feedback/BSS-V2-BATCH-06-05-04-d9cb830-review.md`, first consolidated `CHANGES_REQUIRED` review.
- **Remediation commit:** this checkpoint's bounded remediation commit.
- **Scope:** fixture-only proof completion in `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts`. No policy-authority, migration, scheduler, queue, transport, or provider-route implementation changed.

## CFC closure matrix

| Frozen clause | Status | Closure evidence and oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | The real PostgreSQL fixture creates a separate qualified three-dimensional domain for RPM, TPM, and concurrency. For each, `ProviderWorkAdmission/v1` admits an independently fitting request, then a request saturating only that dimension is denied with unchanged reservation, ledger, dispatch, and transport-claim counts. The admitted reservation has exactly `concurrency`, `rpm`, and `tpm` ledger rows; `rpd` is absent. Oracle passed. |
| `CK-001.b` | `PROVEN` | The fixture exercises a missing effective-policy binding and a revoked effective-policy binding through `RuntimeCapacityConstraint/v1` and `ProviderWorkAdmission/v1`. Each runtime read returns `unknown_policy_blocked`; the admission returns `policy_or_resource_unfit`; attempts, admission records, reservations, ledgers, dispatches, and claims retain exact zero deltas. Oracle passed. |
| `CK-002.a` | `PROVEN` | The qualified masked shared-domain fixture records deterministic multi-lane admissions with differentiated RPM/TPM/concurrency envelopes and durable weighted lane state, then admits a background borrower and protected interactive work concurrently. Its ledger assertion confirms no RPD liability/vector contribution. Oracle passed. |
| `CK-002.b` | `PROVEN` | The isolated saturation cases prove zero send after each selected-dimension denial and exact one-row-per-selected-dimension liabilities with one held concurrency seat for admitted work. The same masked fixture injects a failure at attempt update, reservation insert, pg-boss job insert, and dispatch insert; each rolls back to zero reservations, ledgers, jobs, dispatches, and claims. Oracle passed. |

## Executed validation

```text
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/policy-aware-runtime-admission-fairness.integration.test.ts
PASS — 1/1.

packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/fair-admission-atomic-dispatch.integration.test.ts
PASS — 1/1.

packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/migrate.mjs --check
PASS.

packages/atlas-db> corepack pnpm typecheck
PASS.
```

The initial concurrent diagnostic run caused a PostgreSQL lock deadlock between the two transaction-scoped DB fixtures; the required database validations above were rerun serially and passed. This is not an implementation failure or an environment limitation.

Direct regressions checked: existing four-dimensional fair/atomic admission behavior and migration registry integrity. The remediation changed only the ticket-owned masked-policy evidence fixture.

Internal readiness: READY_FOR_CK

**Status:** `awaiting_review` — hand off to CK verification of frozen clauses `CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-002.b` only.
