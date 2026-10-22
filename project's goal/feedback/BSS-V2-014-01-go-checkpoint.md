# GO checkpoint — BSS-V2-014-01

- **Ticket:** `BSS-V2-014-01` — Versioned weighted class/process allocation contract
- **State:** `awaiting_review`
- **Authorized checkpoint:** explicit `GO BSS-V2-014-01` after [contract freeze 001](BSS-V2-014-01-contract-freeze-001.md).
- **Planning baseline:** `4ec121ed793e1d23fe125faf063fa5a247cd12d0`.
- **Authority:** the frozen ticket, BSS-V2-014 parent/ticket-set rules, and the accepted BSS-V2-005 planner/registry and BSS-V2-006-05 effective-policy boundaries.

## Bounded implementation

- Added `ClassAllocationPolicy/v1` and deeply immutable `CalculatedClassProcessAllocation/v1` as optional planned data of the existing pure `planEffectiveDesiredAdmissionProfile` boundary. Existing desired-profile fields remain unchanged; no publication, activation, runtime admission, database, provider, job, transport, or consumer path changed.
- The allocation policy is exactly 1000/2000/7000 basis points. Every effective dimension receives `ceil` headroom and interactive totals; background is the conserving remainder. Per-class baselines use positive safe-integer weights, floor plus largest fractional remainder, and canonical `(processId, profileVersion)` tie-breaking.
- Added `allocationPolicy.interactive.weight` exclusively to the existing server process parser/registry path. It rejects missing interactive weight, background-on-interactive, and interactive-on-background input while retaining `hardInteractiveProtection`.
- Uses the accepted effective-policy mask. A valid Anoman RPD `unknown/not_enforced` decision has only `rpm`, `tpm`, and `concurrency` numeric allocations; malformed approval/exclusion input fails closed.
- Carries existing explicit background caps into the calculated result as hard caps. Cap-cut capacity is emitted as `unallocatedRemainder` and is never reassigned. Zero essential baselines are typed `unfit`; concurrency is allocated independently and never derived from RPM.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and exact result | Status |
| --- | --- | --- | --- |
| `RC-01401-01` | Exact OpenAI-like and Anoman 10/20/70 class totals, conservation, deterministic JSON. | `tests/weighted-capacity-allocation.test.ts`, test 1: OpenAI-like `5000/2000000/40` yields `500/1000/3500`, `200000/400000/1400000`, and `4/8/28`; test 3: Anoman yields `2/4/14`, `4000/8000/28000`, and `3/5/17`. Both conserve exactly. **PASS (4/4 suite).** | `PROVEN` |
| `RC-01401-02` | One per-class rational share, 3:1 result, shuffled/tied deterministic largest remainder, and typed zero-seat unfit. | `tests/weighted-capacity-allocation.test.ts`, tests 1–2: background 3:1 is 75%/25%, permutations serialize identically, canonical `alpha` wins a tie, and zero baseline is `unfit`. RPM, TPM, RPD, and concurrency allocation each conserves before caps. **PASS (4/4 suite).** | `PROVEN` |
| `RC-01401-03` | Authorized Anoman policy has only `rpm,tpm,concurrency`; unauthorized/malformed exclusion rejects. | `tests/weighted-capacity-allocation.test.ts`, test 3: exact effective keys and no numeric RPD assertion; missing approval reference throws `CapacityPlannerError`. **PASS (4/4 suite).** | `PROVEN` |
| `RC-01401-04` | Interactive weight only on the existing versioned registry/parser path; invalid field combinations reject; no parallel registry. | `tests/process-workload-catalogue.test.ts`, `RC-01401-04`: parses and round-trips the weight through `parseServerProcessRegistry`; rejects absent interactive policy, background-on-interactive, and interactive-on-background. `tests/registered-process-policy.test.ts` preserves predecessor registry authority. **PASS (5/5 and 5/5).** | `PROVEN` |
| `RC-01401-05` | Explicit cap is a hard cap and cap remainder is not redistributed. | `tests/weighted-capacity-allocation.test.ts`, test 2: a Semantic cap emits `{rpm:100,tpm:100000,rpd:100,concurrency:1}`, reports the exact unallocated remainder, and leaves Reconciliation at its original 875 RPM share. **PASS (4/4 suite).** | `PROVEN` |
| `RC-01401-06` | Pure planner with no database/write/job/transport/provider/request-body path. | `tests/weighted-capacity-allocation.test.ts`, test 4 statically asserts the planner imports only the capacity catalogue and process catalogue and has no prohibited operational dependency. `pnpm --filter @atlas/agents-bridge typecheck` passed. **PASS.** | `PROVEN` |

## Exact validation

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-capacity-allocation.test.ts   PASS (4/4)
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts     PASS (5/5)
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts               PASS (3/3)
pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts      PASS (5/5)
pnpm --filter @atlas/agents-bridge typecheck                                               PASS
git diff --check                                                                           PASS
```

## Scope and handoff

Changed only the existing planner and process-workload catalogue, their direct tests, the contract-freeze/GO evidence, and the ticket lifecycle. No second planner, compatibility lane, database admission path, provider execution path, capacity authority, migration, historical plan mutation, or downstream ticket work was created.

Every applicable frozen row is proven. The ticket is ready for independent CK review only; this checkpoint does not issue CK `PASS`, invoke CFC/HMN, or authorize any successor ticket.

Internal readiness: READY_FOR_CK
