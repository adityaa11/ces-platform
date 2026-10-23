# BSS-V2-006-06 CFC checkpoint

- **Ticket:** `BSS-V2-006-06` — Public admission authority cutover
- **Review remediated:** `BSS-V2-006-06-99c452a3-review.md`
- **Reviewed target:** `99c452a316516c7673863e5e8d47c29dcd8402ca`
- **State:** `awaiting_review`
- **Authorization:** first bounded CFC pass for the consolidated `CHANGES_REQUIRED` review, explicitly invoked by the user; no HMN authorization is consumed.

## CFC working progress view

| Frozen clause | Status | Closure evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `provider-work-admission.integration.test.ts` starts the existing production bridge worker with the ticket-authorized fake outbound transport. `assertZeroArtifacts` now captures the transport send counter before every named calculated-v2 rejection, waits for the worker, and asserts that the counter is unchanged alongside zero reservation, dispatch, pg-boss job, and transport-claim rows. **Oracle passed:** each named invalid authority request has zero durable artifacts and zero provider transport sends. |
| `CK-001.b` | `PROVEN` | The same real public API/Bridge/PostgreSQL fixture now admits a named historical `plan-v1` request through the bigint binder, makes calculated `plan-v2` active again, and rejects `mixed-historical-success-active-calculated-v2-incomplete` with the full zero-artifact and zero-send assertion. The pre-existing fairness fixture remains the required historical regression. **Oracle passed:** historical success cannot permit incomplete active calculated-v2 authority. |

## Commands and outcomes

```text
pnpm --filter @atlas/db migration:check                                                     PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts  PASS (2 tests)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts    PASS (2 tests)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts  PASS (1 test)
pnpm --filter @atlas/agents-bridge typecheck                                                 PASS
git diff --check                                                                             PASS
```

Direct regressions checked: the authenticated public admission endpoint, bigint-only binder, existing reservation/pg-boss/claim/send lane, and the historical fairness validation. No production implementation, alternate ingress, binder, queue, worker, adapter, or provider path was changed.

## Review handoff

Internal readiness: `READY_FOR_CK`

This is one bounded remediation checkpoint for `CK-001.a` and `CK-001.b`. It does not issue `PASS`; CK must verify the frozen clauses, this remediation diff, and direct regressions only.
