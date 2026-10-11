# CK verification — BSS-V2-004-03-08-02-02

- **Ticket:** `BSS-V2-004-03-08-02-02` — Service identity, grant and derived-image authorization
- **Batch:** `BSS-V2-BATCH-04.03-08.02-02`
- **Review type:** post-CFC verification
- **Original CK artifact:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-02-a31ba9c-review.md`
- **Original implementation:** `a31ba9c` (`feat(atlas): add scoped derived image grants`)
- **Consumed HMN authorization:** `HMN-BSS-V2-004-03-08-02-02-CK-001.a-001` (`AUTHORIZE_BOUNDED_CFC`)
- **CFC checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-02-02-cfc-checkpoint.md`
- **Remediation commit under review:** `b6f7063bbcb71dc308e8e708cba3dfac253de31f` (`fix(atlas): claim derived image grants before authority recheck`)
- **Checkpoint commit:** `f86543bbf33d9df47e2b68532afc16a189cd8cb1` (`docs(bss): record derived image grant CFC evidence`)

## Bounded verification

The CFC checkpoint is `awaiting_review`, records the exact remediation commit, and consumes the valid HMN authorization selecting only `CK-001.a`. The remediation commit follows the original checkpoint commit. Its implementation diff is limited to `packages/atlas-core/src/derived-image-grant.ts` and `packages/atlas-core/tests/derived-image-grant.test.ts`. The later checkpoint commit adds only CFC evidence, progress, and the consumed HMN record. The worktree contains unrelated modified and untracked paths, none intersecting these implementation paths; they were left untouched.

Verification was limited to the original frozen `CK-001.a` oracle, the remediation diff, its required focused evidence, and direct regressions in the grant issuer/verifier. Original `RC-01` and `RC-03` outcomes remain protected and were not reopened.

## Frozen clause outcome

| Original clause | Outcome | Verification against frozen oracle |
| --- | --- | --- |
| `CK-001.a` | `RESOLVED` | `derived-image-grant.ts` now sets `record.consumed = true` synchronously after signature, expiry, fence and exact-scope checks and before awaiting authority validation. The focused test `concurrent redemption claims a replay fence before awaiting authority validation` uses a blocking authority and proves one redemption fulfills, the overlapping redemption is rejected as replay before authority validation, and a later attempt is also rejected. `failed authority recheck leaves the replay fence consumed` verifies a failed authority recheck cannot reopen the grant. These observations satisfy the original binary oracle. |

The authority recheck still occurs before a successful redemption returns. The opaque grant format, exact scope checks, expiry, and sequential denial cases remain intact. Moving consumption before the authority await can burn the grant when authority revalidation fails; this is fail-closed and does not violate the frozen ticket or oracle. The in-memory replay fence is single-use within this issuer instance/process; no distributed replay guarantee was part of the frozen requirement.

## Validation independently run

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 24 core tests; derived-image grant suite 5/5, including the concurrent and failed-recheck cases |
| `git diff --check f2455aec34c3cb5e1799e63af93084754d53c58e b6f7063bbcb71dc308e8e708cba3dfac253de31f` | PASS |
| `git diff --check b6f7063bbcb71dc308e8e708cba3dfac253de31f..HEAD` | PASS |

No direct regression was found in the authorized grant redemption boundary. This bounded verification did not restart the broader review or rerun unrelated legacy lanes.

## Decision

`PASS`

The sole original unresolved clause, `CK-001.a`, is resolved against its frozen oracle, and no direct remediation regression remains. Previously proven `RC-01` and `RC-03` outcomes remain unchanged. This verification closes the bounded CFC cycle; it does not authorize another CFC cycle or successor ticket work.
