# GO Checkpoint — BSS-V2-BATCH-05-03

- Ticket: `BSS-V2-005-03`, [deterministic multi-resource provider capacity planner](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-03-deterministic-multi-resource-capacity-planner.md)
- Batch: `BSS-V2-BATCH-05-03`
- Review target: the commit containing this GO checkpoint (current `HEAD` at handoff).
- Dependency gates: BSS-V2-005-01 CK `PASS` at `e8fa864`; BSS-V2-005-02 CK `PASS` at `38787e1`.
- Scope: pure Bridge planning only. No provider client, clock/random input, persistence, runtime counter, database mutation, worker allocation, or runtime admission was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00503-01` | Equivalent capacity, process/workload, and explicit policy inputs produce canonical deterministic desired-profile output independent of input ordering, wall-clock, random, and provider calls. | `apps/agents-bridge/src/capacity-planner.ts`; fixture `planner is canonical, pure, and protects the interactive reserve from saturated background` compares JSON canonical output after reversed process/workload input. | PROVEN |
| `RC-BSSV2-00503-02` | The four known resource ceilings apply configured headroom; oversubscribed headroom/reserve and unknown/zero dimensions fail closed rather than being invented. | `knownCapacity` and `subtract`; fixture `planner fails closed for unknown, zero, headroom, reserve, and inferred concurrency cases`. | PROVEN |
| `RC-BSSV2-00503-03` | Explicit interactive targets sum to a non-lendable hard reserve; generated background capacity is usable capacity minus that reserve. | Planner output carries separate `hardInteractiveReserve` and `backgroundCapacity`; canonical fixture proves `{rpm: 70, tpm: 7000, rpd: 700, concurrency: 7}` remains after a `{20,2000,200,2}` reserve from usable capacity. | PROVEN |
| `RC-BSSV2-00503-04` | Active background lanes retain normalized configured weights, optional multi-resource caps, workload-derived resource costs, dominant-resource cost, and idle-borrow policy; no FIFO/provider worker allocation is emitted. | Fixture `background planning costs preserve dominant resource differences and normalized weighted policy` proves distinct request/token-heavy costs and `0.25`/`0.75` normalized weights. | PROVEN |
| `RC-BSSV2-00503-05` | Hard concurrency planning uses only an explicit known concurrency ceiling; RPM/TPM never imply seats. | `knownCapacity` rejects unknown/zero concurrency before planning; focused fail-closed fixture covers unknown concurrency. | PROVEN |

## Validation evidence

- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts` — PASS: 3 tests, 0 failures.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` — PASS: 3 tests, 0 failures.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts` — PASS: 4 tests, 0 failures.
- `pnpm --filter @atlas/agents-bridge test` — reached the existing unrelated Docling route-qualification assertion failure after the new planner suite passed. It reports stale expected RUN-003 qualification identity and does not exercise planner code.
- Compose commands/counts: `0`; the frozen ticket requires synthetic matrices only and forbids runtime DB-counter mutation. No network, Compose, or database operation was used.
- `git diff --check` — PASS.

Internal readiness: READY_FOR_CK
