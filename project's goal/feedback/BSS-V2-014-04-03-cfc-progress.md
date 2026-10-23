# CFC working progress — BSS-V2-014-04-03

- **Remediation base:** `9d01915f`.
- **Authorizing CK artifact:** [BSS-V2-014-04-03 first review](BSS-V2-014-04-03-2951722-review.md).
- **Authorized frozen clauses:** `CK-001.a` and `CK-001.b` only.
- **Scope:** ticket-authorized evidence in the existing real-PostgreSQL borrowing fixture and fair-selector seam; no production admission, planner, scheduler, queue, transport, provider, or activation change.

## Working closure view

| Clause | Current status | Frozen evidence target |
| --- | --- | --- |
| `CK-001.a` | `IMPLEMENTED_UNPROVEN` | Add the two-background exhausted-peer above-baseline denial to `apps/agents-bridge/tests/weighted-process-borrowing.integration.test.ts`, including zero reservation, ledger, dispatch, pg-boss-job, and transport-claim artifacts. |
| `CK-001.b` | `IMPLEMENTED_UNPROVEN` | In the same v2-configured fixture, call `bridge.admit_next_provider_work_attempt` to prove protected interactive priority, exclusion of the waiting above-baseline borrower while lender demand exists, subsequent lender admission, and unchanged in-flight borrower liabilities. |

This is a progress view only. The frozen CK closure matrix remains the source of
ticket authority, required proof, and closure oracle.
