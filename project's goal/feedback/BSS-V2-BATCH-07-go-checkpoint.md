# BSS-V2-BATCH-07 GO checkpoint

- **Ticket:** `BSS-V2-007` — Authenticated internal receiving boundary (narrow reusable contract)
- **Batch:** `BSS-V2-BATCH-07`
- **State:** `awaiting_review`
- **Review target:** `a87a31021b65d850d5c7df94c149051dab63d520` (`feat(bss): add internal receiving boundary`)
- **Dependency:** current approved Atlas perception/semantic internal HTTP authentication convention, consumed only as an established credential-validation convention. No GHR or IDSER consumer implementation is consumed.

## Bounded implementation

`@atlas/core` now exposes only `createInternalReceivingBoundary`,
`InternalReceivingUnauthorizedError`, and `InternalReceivingBoundary` from the
new `internal-receiving-boundary` module. Its receiver validates a configured
32-byte minimum internal service credential, rejects a missing or wrong
presented credential before parsing, then invokes only the server-wired strict
parser and domain-owned redemption callback.

The module has no SQL, route, workspace, project, document, queue, provider,
or credential-issuance surface. It creates no permit/context/token and retains
no replay, TTL, grant, assignment, cancellation, or delivery state. Existing
perception and semantic internal routes are unmodified.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `RC-BSSV2-007-01` | Exact public TypeScript API | Exact exported function/type/error; fail-fast 32-byte secret check; timing-safe equality for equal-length candidates. | `packages/atlas-core/src/internal-receiving-boundary.ts`; `packages/atlas-core/tests/internal-receiving-boundary.test.ts` short-secret and credential cases. | `corepack pnpm --filter @atlas/core typecheck` — PASS. | `PROVEN` |
| `RC-BSSV2-007-02` | Credential ordering and no authorization artifact | Wrong/missing credentials call neither parser nor redeem; correct credentials call them once in order; no returned permit/context/token exists. | `internal-receiving-boundary.test.ts` first test uses active parser/redemption counters; third test asserts the exact parse/redeem audit order. | `corepack pnpm --filter @atlas/core test` — PASS (31 tests, including 4 receiving-boundary tests). | `PROVEN` |
| `RC-BSSV2-007-03` | Reuse across two domain-owned receiving callbacks | Two separate strict parser/redeem callbacks reuse one function; owner rejects ineligible work without protected data. | `internal-receiving-boundary.test.ts` third test: distinct `plan` and `report` schemas and independent authorization checks. | `corepack pnpm --filter @atlas/core test` — PASS. | `PROVEN` |
| `RC-BSSV2-007-04` | No generic authorization lifecycle policy | Repeated authorized reads revalidate through the callback; no BSS replay/TTL/grant state or claim of per-job assignment, revocation, or GHR delivery. | `internal-receiving-boundary.test.ts` fourth test invokes the same read twice and proves two parser/redemption calls; module contains no stateful storage or grant type. | `corepack pnpm --filter @atlas/core test` — PASS. | `PROVEN` |
| `RC-BSSV2-007-05` | Direct route regression and forbidden-boundary preservation | Existing perception/semantic internal routes remain green; no migration, direct Bridge Atlas DB access, provider request, queue publication, or Atlas-truth mutation. | Existing active route side-effect counters remain exercised in `perception-internal-route.test.ts` and `semantic-internal-route.test.ts`; bounded diff is limited to core library/test exports and no migration/Bridge/provider/queue/Atlas route path. | `corepack pnpm --filter @atlas/core test` — PASS; `git diff --check` — PASS. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/core typecheck  PASS
corepack pnpm --filter @atlas/core test       PASS (31 tests; 0 failures)
git diff --check                              PASS
```

The test suite includes the two preserved direct internal-route regression
files. No Compose, database, provider, queue, or HTTP host change is required
by this frozen library-only ticket. The host request-byte cap, redacted HTTP
mapping, and domain resource authorization remain owned by their respective
existing or downstream boundaries.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`; control
returns to CK for independent review of this bounded target.
