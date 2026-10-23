# CFC checkpoint — BSS-V2-014-04-03

- **Remediation base:** `9d01915f`.
- **Authorizing CK artifact:** [BSS-V2-014-04-03 first review](BSS-V2-014-04-03-2951722-review.md).
- **Authorized frozen clauses:** `CK-001.a` and `CK-001.b` only.
- **Remediation commit:** this bounded checkpoint commit (`test(bss-v2): close borrowing evidence gaps`).
- **State:** `awaiting_review`.

## Frozen finding closure matrix

| Clause | Ticket authority / frozen oracle | Remediation evidence | Required command and outcome | Oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `RC-0140403-01`: with a borrower already at baseline and the peer's same-lock held/spent baseline exhausted in all enforced dimensions, an above-baseline borrower is deferred with zero reservation, ledger, dispatch, pg-boss, or transport artifacts. | `apps/agents-bridge/tests/weighted-process-borrowing.integration.test.ts` adds an isolated two-background matrix that admits the borrower baseline and lender baseline, then proves the follow-up borrower is `unavailable`. `artifacts()` now also checks transport claims, and the denial asserts all five operational counters remain zero. Existing positive, disabled, lender-demand, and independent-resource cases are retained. | `pnpm --filter @atlas/agents-bridge exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\weighted-process-borrowing.integration.test.ts` — **PASS**, 1/1; 0 skipped. | **PASS** |
| `CK-001.b` | `RC-0140403-02`: in one v2-configured fixture, the fair selector leaves an in-flight above-baseline borrower unchanged, selects protected interactive work first, excludes the waiting borrower while its lender is waiting, and admits that lender on the next fair turn; no forbidden borrower-side reservation or send artifact is created. The existing weighted-order regression must remain green. | The focused fixture now calls `bridge.admit_next_provider_work_attempt` against its existing v2 allocation/profile. It snapshots the borrowed reservation liability, observes interactive selection before background work, then observes lender selection while the borrower remains waiting; it proves the prior borrower liability is unchanged and the excluded borrower has zero reservation, ledger, dispatch, job, and claim artifacts. | Focused borrowing command above — **PASS**, 1/1; 0 skipped. `pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\policy-aware-runtime-admission-fairness.integration.test.ts` — **PASS**, 1/1; 0 skipped. | **PASS** |

## Direct regressions checked

- `pnpm --filter @atlas/agents-bridge typecheck` — **PASS** (`tsc -p tsconfig.json`).
- `git diff --check` over the authorized fixture and CFC artifacts — **PASS**.
- The remediation changes only the existing fixture and its CFC evidence. It adds no production admission, borrowing, fair-selector, queue, scheduler, provider, transport, activation, or request-sizing lane.
- `RC-0140403-03` is already `PROVEN` in the frozen CK artifact and was not reopened or modified.

Internal readiness: **READY_FOR_CK**.

CFC makes no PASS determination. CK must verify only frozen `CK-001.a` and
`CK-001.b`, this bounded remediation diff, the named evidence, and direct
regressions introduced by this remediation.
