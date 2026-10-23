# BSS-V2-006-06 CK verification after CFC

- **Ticket:** `BSS-V2-006-06` — Public admission authority cutover
- **Ticket state:** `awaiting_review`
- **Review batch:** standalone bounded admission cutover
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-06-public-admission-authority-cutover.md`
- **Original CK artifact:** `project's goal/feedback/BSS-V2-006-06-99c452a3-review.md`
- **Consumed CFC checkpoint:** `project's goal/feedback/BSS-V2-006-06-cfc-checkpoint.md`
- **Original reviewed commit:** `99c452a316516c7673863e5e8d47c29dcd8402ca`
- **CFC remediation commit:** `8c7c2d7ee072e17348e39c7bc12575dafc2f792e` (`test(bss-v2): prove public admission rejections`)
- **Review type:** post-CFC bounded verification
- **Result:** `PASS`

## Verification scope and authority

The original CK result was `CHANGES_REQUIRED` with one consolidated finding,
`CK-001`, and frozen clauses `CK-001.a` and `CK-001.b`. This verification
consumes the exact CFC checkpoint and verifies only those two original clauses,
the remediation diff, the evidence named by their frozen oracles, and direct
regressions in the admission/claim/send and historical-fairness paths.

No new finding or acceptance condition was added. The approved predecessor
boundaries remain closed, and `BSS-V2-014-04-03` was not reviewed, modified, or
reopened.

The worktree still contains unrelated tracked and untracked changes. The
remediation commit is unambiguous and contains only the bounded public
admission fixture remediation plus this CFC checkpoint.

## Original frozen clause outcomes

| Original clause | Frozen oracle verification | Outcome |
| --- | --- | --- |
| `CK-001.a` | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts:418-426,478-490` starts the existing production worker with a ticket-authorized fake provider transport, captures `providerTransportSends` before every named calculated-v2 rejection, waits for the worker, and asserts unchanged sends together with zero reservation, dispatch, pg-boss job, and claim rows. The focused public test passed `2/2`. | `RESOLVED` |
| `CK-001.b` | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts:462-477` switches the same real fixture to historical `plan-v1`, proves a successful historical admission through the bigint binder, restores active calculated-v2, and then `:493` exercises `mixed-historical-success-active-calculated-v2-incomplete`; `:478-490` proves zero durable artifacts and unchanged provider sends. The focused public test passed `2/2`, and the historical fairness regression passed `1/1`. | `RESOLVED` |

Both original frozen closure oracles pass. The remediation is test/evidence-only;
no production implementation, ingress, binder, queue, worker, adapter, or
provider path was changed.

## Remediation diff and direct-regression verification

The bounded diff from the original target to the CFC remediation commit adds
only the fake transport counter/worker, the mixed historical/v2 scenario, and
per-negative zero-send assertions in the existing public-admission integration
fixture. `git diff --check` passed for the original target through the
remediation commit.

Direct regressions checked and passed:

- authenticated public admission, existing bigint-only binder, and the existing reservation → pg-boss → claim → send lane;
- the existing admitted-worker integration and its predecessor-boundary cases;
- corrected historical `plan-v1` fairness behavior;
- migration completeness and Bridge typecheck.

## Validation and evidence

Executed against the local PostgreSQL service with the real `agents_bridge`
role and actual Bridge/pg-boss integration:

```text
pnpm --filter @atlas/db migration:check
PASS: Atlas database migration check passed

DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts
PASS: 2/2

DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
PASS: 2/2

DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
PASS: 1/1

pnpm --filter @atlas/agents-bridge typecheck
PASS

git diff --check 99c452a316516c7673863e5e8d47c29dcd8402ca^ 8c7c2d7ee072e17348e39c7bc12575dafc2f792e
PASS
```

## Scope-change observations

None. The original clauses are resolved within the frozen ticket. No ticket
amendment, new provider/runtime/deployment target, architecture or policy
decision, predecessor reopening, or `BSS-V2-014-04-03` work is required.

## Decision

`PASS`. `CK-001.a` and `CK-001.b` are `RESOLVED`, no direct remediation
regression remains, and all original ticket-derived obligations remain proven.
This is the bounded post-CFC verification and does not authorize another CFC
cycle or a new full review.
