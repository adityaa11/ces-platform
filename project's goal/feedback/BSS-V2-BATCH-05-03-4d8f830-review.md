# CK review — BSS-V2-005-03

- **Ticket:** `BSS-V2-005-03` — Deterministic multi-resource provider capacity planner
- **Batch:** `BSS-V2-BATCH-05-03`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-03-deterministic-multi-resource-capacity-planner.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-05-03-go.md`
- **Reviewed commit:** `4d8f830f788530eeea95130a7e55049dcced012b` (`feat(admission): add deterministic capacity planner`)
- **Review type:** first consolidated review

## Review target and authority

The active-ticket tuple is unambiguous. The ticket is `awaiting_review`, and the GO checkpoint is committed in the reviewed `HEAD` at `4d8f830`. The ticket, GO checkpoint, planner, planner test, and package manifest have no worktree edits. Existing dirty paths are unrelated to this ticket and do not make the committed review target ambiguous.

The frozen ticket's five Review Contract rows are the complete acceptance contract. The incorporated post-generation planning amendment is limited to the provider-capacity planning inputs and dependency shape relevant to this ticket. The approved BSS-V2-005-01 and BSS-V2-005-02 dependency boundaries are consumed; no deferred runtime admission, provider client, persistence, deployment, or future-ticket work is required or reopened.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00503-01` | PROVEN | `apps/agents-bridge/src/capacity-planner.ts` has no clock, random, provider, persistence, or runtime-counter seam and sorts active processes and reserve targets by stable keys. `tests/capacity-planner.test.ts` reverses process/workload input and deep-compares serialized output. |
| `RC-BSSV2-00503-02` | PROVEN | `knownCapacity` requires known limits for all four dimensions; `subtract` rejects headroom, hard-reserve, and cap oversubscription. The focused fail-closed fixture covers unknown concurrency, zero RPM, oversubscribed headroom, and oversubscribed interactive reserve. |
| `RC-BSSV2-00503-03` | PROVEN | The generated profile carries separate `hardInteractiveReserve` and `backgroundCapacity`; the focused fixture proves usable capacity `{rpm: 90, tpm: 9000, rpd: 900, concurrency: 9}` becomes background capacity `{rpm: 70, tpm: 7000, rpd: 700, concurrency: 7}` after the explicit interactive reserve. |
| `RC-BSSV2-00503-04` | PROVEN | Background lanes expose normalized weights, optional caps, workload-derived multi-resource planning costs, dominant-resource cost, and `mayBorrowIdleCapacity`; the focused token-heavy/request-heavy fixture proves distinct costs and normalized weights `0.25`/`0.75`. No FIFO or provider worker allocation is emitted. |
| `RC-BSSV2-00503-05` | PROVEN | `knownCapacity` requires an explicit known concurrency dimension and the focused unknown-concurrency fixture fails closed; no RPM/TPM-derived seat calculation exists in the planner. |

## Validation and evidence

Executed successfully:

```text
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts
git diff --check HEAD^ HEAD
```

Results:

```text
typecheck: PASS
capacity-planner.test.ts: 3 passed, 0 failed
capacity-catalogue.test.ts: 3 passed, 0 failed
process-workload-catalogue.test.ts: 4 passed, 0 failed
git diff --check HEAD^ HEAD: PASS
```

The full `pnpm --filter @atlas/agents-bridge test` suite was also executed. The planner and all preceding suites passed; the suite stopped at the existing unrelated Docling assertion `Docling route requires its immutable service, runtime, adapter, and profile identity` in `apps/agents-bridge/tests/docling-provider.test.ts:109-112`, which reports `Route docling-digital-pdf does not name the approved RUN-003 qualification`. This does not exercise or regress the reviewed planner paths.

The ticket requires synthetic matrices only. Compose commands/counts: `0`; no network call, runtime database counter mutation, provider call, or deployment operation was used.

## Frozen Finding Closure Matrix

No `CK-###` findings were identified. There are no unresolved clauses or closure oracles to freeze.

## Scope-change observations

None. No product, policy, architecture, runtime, deployment, or dependency decision is needed to decide this ticket-bound review.

## Decision

`PASS`. All five frozen Review Contract rows are proven by the committed implementation and required synthetic evidence. The unrelated Docling suite failure is recorded as validation context only and is not a regression or requirement of `BSS-V2-005-03`. Keep the ticket's workflow record at `awaiting_review`; this CK result does not authorize a successor ticket or runtime admission implementation.
