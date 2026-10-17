# GO checkpoint — BSS-V2-005-05-01

- **Ticket:** BSS-V2-005-05-01 — Registered process policy and generic planner preservation
- **Batch:** BSS-V2-BATCH-05-05-01
- **State:** `awaiting_review`
- **Date:** 2026-10-17
- **Dependencies:** BSS-V2-005-01..04 are independently CK-approved. This checkpoint consumes only their accepted catalogue, process/workload, generic planner, and immutable-publication boundaries.
- **Review target commit:** `89f60e292f7db2d398ff7fcbc48681691ed76a2d` (`feat(admission): register generic process policies`).

## Bounded implementation

- Replaced the finite TypeScript `ProcessKind` type with a registry-owned identifier while preserving the legacy parser's conservative fixed vocabulary.
- Added strict parsing and resolution for a versioned server process registry and its minimal consumer reference. Resolution requires the exact registry/version/domain/process identity, a qualified quota domain and route, an active compatible workload, and accepted quota-accounting authority.
- Added deterministic synthetic registry fixtures. They prove shared-domain generic planning, domain isolation, active/inactive and route/workload version recomputation, independent dimensions, explicit headroom/reserve/caps, transient/secret-field rejection, and the existing chat interactive-reserve behavior.
- `apps/agents-bridge/src/capacity-planner.ts` is unchanged. No publication activation, snapshot endpoint, reservations, pg-boss work, provider transport, consumer truth, or provider-limit discovery was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `RC-00505-01` | Frozen review contract row 01 | Versioned server registration admits a synthetic kind; foreign, unqualified, and invalid identity/capability fail closed; generic planner is not edited. | `apps/agents-bridge/src/process-workload-catalogue.ts`; `apps/agents-bridge/tests/registered-process-policy.test.ts` first test; no diff in `apps/agents-bridge/src/capacity-planner.ts`. | `pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts` — 5/5 passed. | `PROVEN` |
| `RC-00505-02` | Frozen review contract row 02 | Same-domain processes plan deterministically, another domain is isolated, and inactive/workload/route/version updates recompute via the generic policy. | `registered-process-policy.test.ts` second test. | `pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts` — 5/5 passed. | `PROVEN` |
| `RC-00505-04` | Frozen review contract row 04 | Preserve separate RPM/TPM/RPD/concurrency dimensions, version-bound workload constraints, caps/headroom/reserve, and fail closed for zero capacity. | `registered-process-policy.test.ts` third test; existing `capacity-planner.test.ts`. | `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts` — 3/3 passed; focused registry command — 5/5 passed. | `PROVEN` |
| `RC-00505-06` | Frozen review contract row 06 | Reject transient queue/usage/cooldown and source/secret material; registry resolution produces no runtime/wakeup metadata. | `registered-process-policy.test.ts` fourth test. | `pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts` — 5/5 passed. | `PROVEN` |
| `RC-00505-09` | Frozen review contract row 09 | Generic registered chat and semantic profiles retain hard-reserve/background subtraction; consumer cannot forge a background identity as interactive. | `registered-process-policy.test.ts` fifth test; existing `capacity-planner.test.ts`. | `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts` — 3/3 passed; focused registry command — 5/5 passed. | `PROVEN` |

Additional validation:

- `pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `pnpm --filter @atlas/agents-bridge test` runs the new test successfully and then stops at existing `tests/docling-provider.test.ts` route-identity assertion (`Route docling-digital-pdf does not name the approved RUN-003 qualification`). The BSS-V2-005-05-01 changes do not touch the Docling route, adapter, qualification, or its test; this is recorded as non-ticket diagnostic evidence, not a contract row or direct regression.

Internal readiness: `READY_FOR_CK`.

This checkpoint is not a self-issued `PASS`; CK must review only the five frozen rows, this bounded diff, the listed evidence, and direct regressions.
