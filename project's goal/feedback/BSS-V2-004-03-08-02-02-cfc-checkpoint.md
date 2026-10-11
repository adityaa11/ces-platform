# CFC checkpoint — BSS-V2-004-03-08-02-02

- **Ticket:** `BSS-V2-004-03-08-02-02`
- **State:** `awaiting_review`
- **Remediation base:** `f2455aec34c3cb5e1799e63af93084754d53c58e`
- **Reviewed implementation:** `a31ba9c`
- **Remediation commit:** `b6f7063bbcb71dc308e8e708cba3dfac253de31f` (`fix(atlas): claim derived image grants before authority recheck`)
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-02-a31ba9c-review.md`
- **HMN authorization consumed:** `HMN-BSS-V2-004-03-08-02-02-CK-001.a-001` (`AUTHORIZE_BOUNDED_CFC`), recorded in `BSS-V2-004-03-08-02-02-hmn-001.md`
- **Authorized scope:** `CK-001.a` only
- **Changed implementation files:** `packages/atlas-core/src/derived-image-grant.ts`; `packages/atlas-core/tests/derived-image-grant.test.ts`

## Authorized closure

| Frozen clause | Status | Evidence and required command | Frozen oracle |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | Redemption sets the existing in-memory record's consumed flag synchronously after signature, expiry, fence and exact-scope checks, before awaiting authority validation. `packages/atlas-core/tests/derived-image-grant.test.ts`, test `concurrent redemption claims a replay fence before awaiting authority validation`, uses a controlled authority barrier and proves one fulfillment, one replay rejection, and a subsequent replay rejection; authority sees exactly one redemption check with the exact scope. Test `failed authority recheck leaves the replay fence consumed` proves a rejected authority recheck cannot reopen the grant. `corepack pnpm --filter @atlas/core test` — **PASS**, all core tests; derived-image grant suite: 5 passed, 0 failed. | **Passed:** the frozen CK binary oracle is satisfied by the deterministic concurrent test and passing required core test command. |

## Validation record

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — all tests passed; derived-image grant suite 5/5 |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 18 tests |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests |
| `git diff --check` | PASS |

## Preserved boundaries and direct regressions

The existing sequential replay, expiry, signature tampering, foreign scope, stale authority, cookie rejection, service identity and unsupported-media negatives remain in the focused suite and pass. Exact scope validation and the authority recheck remain in place. RC-01 is preserved by the existing scope-binding, authorization, expiry, replay and service-boundary assertions. RC-03 is preserved: this commit changes only the grant issuer and its focused test; the required core, contracts, skills and Bridge lanes above all pass, and no resolver, browser endpoint or DocumentStore policy changed. The opaque grant format is unchanged. No media access, provider call, job, reservation, storage access or historical artifact was changed.

The grant store remains the issuer's existing in-memory map. The correction makes concurrent redemption single-use within that issuer instance and process; it does not claim cross-process or distributed replay protection, which is outside this ticket's authorized scope.

Internal readiness: READY_FOR_CK

This checkpoint does not issue CK `PASS`. Stop for independent CK verification of `CK-001.a`, the remediation commit, and its direct regressions. No further CFC cycle is authorized.
