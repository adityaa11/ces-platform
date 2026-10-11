# CK review — BSS-V2-004-03-08-02-02

- **Ticket:** `BSS-V2-004-03-08-02-02` — Service identity, grant and derived-image authorization
- **Batch:** `BSS-V2-BATCH-04.03-08.02-02`
- **Review type:** first independent CK review
- **Reviewed implementation commit:** `a31ba9c` (`feat(atlas): add scoped derived image grants`)
- **Checkpoint commit:** `f2455aec34c3cb5e1799e63af93084754d53c58e` (`docs(bss): checkpoint scoped derived image grants`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-02-service-identity-grant-and-derived-image-authorization.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-02-02-go-checkpoint.md`
- **Ticket state before review:** `awaiting_review`
- **Reviewed base:** `68dce9e4f97e9f553db9c76fcd10d88d35dfc1a8` (`docs(bss): approve 08-02-01 after CK verification`)

## Review boundary and preconditions

The named ticket is `awaiting_review`. Its GO checkpoint records `a31ba9c` as the implementation commit and names the same reviewed base used here. The following checkpoint commit adds the GO record and changes only the ticket status from `planned` to `awaiting_review`; the ticket's scope and acceptance rows are unchanged. No earlier CK, CFC, or HMN artifact exists for this ticket. The two named prerequisites are recorded as CK `PASS`: `BSS-V2-BATCH-04.03-08.02-01-7ab1953-verification.md` and `IDSER-BATCH-12-01-03-02-7d842ad-verification.md`.

The implementation diff from the reviewed base to `a31ba9c` is limited to the four GO-listed paths: `packages/atlas-core/src/derived-image-grant.ts`, its additive export, its focused test, and the core test command registration. No resolver, browser endpoint, DocumentStore, Bridge, provider, queue, reservation, migration, UI, fixture/gold, or historical CK record is changed. The current worktree has unrelated modified and untracked paths, including a planning-only ticket copy marked `draft_planning_only`; none intersects the reviewed implementation diff or replaces the named frozen ticket. Those paths were left untouched.

The ticket's preservation rule requires candidate-HEAD legacy regression against the `08-01-01` parent-HEAD manifest for shared-code changes. The Atlas core change was reviewed alongside the manifest's relevant contracts, skills, and Bridge lanes. The existing session resolver source and ownership boundary were inspected; the implementation adds a separate core authorization seam and does not alter that browser/session resolver or its DocumentStore access policy.

## Independent evidence and validation

The grant parser requires an exact closed scope and authorization object. The scope binds service identity, tenant/project/document, document version, source hash, profile/page/locator, asset reference, manifest hash, media type, and either semantic execution or offline-grant identity. Issuance checks the configured service identity and current authority, limits lifetime to five minutes, and creates an opaque HMAC grant with a random replay fence. Redemption checks the exact request shape, configured service identity, signature, expiry, fence, and scope, then rechecks authority. The seam exposes no media reader, storage key/path, cookie, byte payload, database handle, or provider/job interface.

The focused tests cover service scope binding, offline authorization, expiry, foreign tenant/project/document, wrong profile/execution, stale authority, sequential replay, tampering, locator/reference mismatch, extra cookie input, unauthenticated service identity, and unsupported media. The source and diff contain no image bytes/base64 or credential material. The sequential replay test does not prove single-use behavior under concurrent redemption: `redeem` checks `record.consumed`, awaits the asynchronous authority, and only then sets `record.consumed`; two concurrent calls can both pass the check before either marks the record consumed. This leaves the ticket's replay denial condition unresolved; see `CK-001.a`.

| Exact command independently run | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 22 tests, including 3 derived-image-grant tests and existing perception/internal-route tests |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 18 tests, including unchanged text-only packet parity and multimodal packet coverage |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests |
| `git diff --check 68dce9e4f97e9f553db9c76fcd10d88d35dfc1a8 a31ba9c` | PASS |

Validation was local and deterministic. No live provider call, image retrieval, new job/reservation, reconciliation, publishing, or accepted-truth mutation was performed.

## Review Contract outcomes

| Row | Frozen ticket authority and required proof | Independent evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Ticket RC-01: bind service caller and all document/source/execution-or-offline/profile/page/locator/ref/manifest identities; enforce expiry/replay-fence identity; reject cookie borrowing and arbitrary storage/Bridge authority. | Closed scope parsing and equality bind all listed identities; configured service identity and authority are checked at issue and redemption; grant expiry is capped; exact request keys exclude cookies, paths, keys, and storage mounts. The reviewed diff exposes no media or storage capability. | `PROVEN` |
| `RC-02` | Ticket RC-02: the fake authority rejects each named foreign, wrong-profile/execution, stale/replayed/tampered, locator/ref mismatch, unauthenticated, and unsupported-media request before media access. | The focused suite passes each named negative and asserts zero effects. The sequential replay case passes, but the redemption flow permits a concurrent replay because consumption is recorded only after an asynchronous authority check; see `CK-001.a`. | `UNRESOLVED` |
| `RC-03` | Ticket RC-03 and review bindings `REV-READY-0040308-0202-02`: preserve retained visual evidence and existing session-resolver behavior without broadening browser endpoints or DocumentStore policy. | The diff does not touch the derived-asset resolver, browser routes, accepted evidence policy, or DocumentStore. Core perception/internal-route, contracts, skills legacy packet, and Bridge boundary/worker regression lanes pass. | `PROVEN` |

## Findings and scope observations

### `CK-001` — Concurrent redemption can consume one replay fence more than once

**Authority:** Frozen ticket RC-02 requires replayed grants to be rejected; RC-01 requires a replay-fence identity. The Review Contract row is `RC-02`.

**Evidence:** In `packages/atlas-core/src/derived-image-grant.ts:140–143`, redemption checks `record.consumed`, awaits `authority.assertAuthorized(record.scope)`, and sets `record.consumed = true` afterward. With two simultaneous redemptions of the same valid grant and fence, each call can pass the consumed check before either asynchronous authority call resolves, then both can return successfully. `packages/atlas-core/tests/derived-image-grant.test.ts:32–40` covers only sequential replay and does not assert the concurrent case.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction and binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Ticket RC-02: fake-authority validation rejects a replayed grant; ticket RC-01: the grant is bound to a replay-fence identity. | Two concurrent calls can both pass the `record.consumed` check before the awaited authority check resolves; the existing test only redeems sequentially. | Make redemption single-use under concurrent requests. **PASS iff** a focused test issues one grant, starts two simultaneous redemptions using the same grant/fence/scope, and proves exactly one fulfills while the other rejects as replay/unavailable; `corepack pnpm --filter @atlas/core test` passes on the remediation commit. Evidence location: `packages/atlas-core/tests/derived-image-grant.test.ts`; implementation evidence: `packages/atlas-core/src/derived-image-grant.ts`. | Check only the grant redemption replay-fence behavior, its focused tests, the remediation diff, and direct regressions in the authorization issuer/verifier. Preserve scope binding, authority recheck, expiry, opaque grant format, existing negative cases, no-media/no-provider boundary, and the already proven RC-01/RC-03 outcomes. |

No separate scope-change observation is required.

## Decision

`CHANGES_REQUIRED`

The committed work satisfies `RC-01` and `RC-03` and the named denial cases in `RC-02`, but it does not yet prove that a replay fence is single-use when two requests redeem concurrently. `CK-001.a` is the complete frozen closure target for any authorized remediation. This review does not authorize CFC or successor ticket work.
