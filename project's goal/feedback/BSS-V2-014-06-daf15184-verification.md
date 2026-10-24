# CK verification — BSS-V2-014-06

- **Ticket:** `BSS-V2-014-06` — Parent release/activation closure
- **Batch:** `BSS-V2-014`
- **Review type:** post-CFC committed-checkpoint verification
- **Consumed CFC checkpoint:** [BSS-V2-014-06 CFC checkpoint 001](BSS-V2-014-06-cfc-checkpoint-001.md)
- **Original CK authority:** [BSS-V2-014-06 first review at `73ee3014`](BSS-V2-014-06-73ee3014-review.md)
- **Frozen ticket:** [BSS-V2-014-06 parent-release-activation-closure.md](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md)
- **Active replacement contract:** [BSS-V2-014-06 GO-dependency replacement contract freeze 001](BSS-V2-014-06-go-dependency-replacement-contract-freeze-001.md)
- **Remediation base:** `73ee30145525850de90f91f7058d0d1a995559b7` (`feat(bss-v2): distinguish candidate and active reader`)
- **Remediation commit:** `daf1518421fad39aabc7fdf4cf83dee3d48f6896` (`fix(bss-v2): fence reader fingerprint mismatches`)
- **Ticket/checkpoint state at verification:** `awaiting_review`
- **HMN authorization consumed:** none; this verifies the single bounded CFC remediation pass.
- **Decision:** `PASS`

## Verification preconditions and scope

The ticket, original CK review, CFC checkpoint, remediation base, and
remediation commit resolve uniquely. The CFC checkpoint is committed in
`daf15184`, which is a descendant of the original reviewed implementation.
The relevant implementation and evidence paths are clean in the worktree;
unrelated modified and untracked paths do not overlap this remediation target.

This verification is bounded to original finding `CK-001`, clauses
`CK-001.a` and `CK-001.b`, the `73ee3014..daf15184` remediation diff, the
evidence required by their unchanged closure oracles, and direct regressions
introduced by that remediation. Previously proven rows, the parent activation
boundary, and the blocked `RRC-01406-02.c` authority condition were not
reopened.

## Frozen finding verification

| Clause | Outcome | Frozen closure oracle | Verification evidence |
| --- | --- | --- | --- |
| `CK-001.a` | **RESOLVED** | A persisted candidate or allocation fingerprint mismatch must produce a typed non-qualified v2 result with no `allocation` or `sizing`, stop the v2 consumer with typed stop/replan, and leave effect counters unchanged. | `packages/atlas-db/migrations/0107_bssv201406_candidate_allocation_fingerprint_fencing.sql:82-86` fences both candidate and allocation digests before any qualified response. `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:168-175` proves typed non-qualified output, no numeric fallback, and zero effects; `:240-251` mutates each persisted fingerprint through the existing reader and proves both the reader and composed consumer stop. The focused integration suite passes `2/2`; the v2 consumer suite passes `7/7`. |
| `CK-001.b` | **RESOLVED** | After the exact active pointer is selected, the same reader must expose the persisted active desired-profile, activation, allocation, route-authority, and canonical-fingerprint tuple, while excluding a newer inactive candidate; existing stale-pointer negatives remain green. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:184-206` compares the active response to the persisted tuple and proves the newer candidate is absent; `:209-213` preserves the missing activation-row stale negative. The pointer-first implementation remains in the bounded migration chain, and the focused integration suite passes `2/2`. |

## Validation and direct-regression checks

Executed against the repository's configured local environment:

```text
pnpm --filter @atlas/agents-bridge typecheck
# PASS

node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-capacity-planning-snapshot-v2.test.ts
# PASS — 7/7

node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts
# PASS — 2/2

pnpm --filter @atlas/agents-bridge test:ghr-01b
# PASS — 3/3

pnpm --filter @atlas/agents-bridge test:ghr-03a
# PASS — 4/4

node --env-file=.env --test packages/atlas-db/tests/permissions.test.mjs
# PASS — 1/1

node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
# PASS — Atlas database migration check passed

git diff --check 73ee3014 daf15184
# PASS
```

The remediation diff adds only the bounded candidate/allocation fingerprint
fence, its PostgreSQL mutation evidence, migration registration, and this CFC
checkpoint. No direct activation, admission, provider, scheduler, GHR, SEM,
or downstream regression was identified.

## Scope-change observations

None. Both original clauses are resolved against their unchanged frozen
oracles. `RRC-01406-02.c` remains the explicit `RELEASE_ATTESTATION_AUTHORITY_GAP`
production-activation boundary and is not a failed implementation condition.
No supplemental gap, ticket amendment, new provider/runtime target,
architecture or product decision, predecessor reopening, or additional CFC
cycle is required.

## Decision

`PASS`: `CK-001.a` and `CK-001.b` are resolved against the frozen closure
oracles, the bounded remediation evidence passes, and no direct in-scope
regression remains. This verification does not authorize positive release
attestation, production activation, or a new CFC cycle.
