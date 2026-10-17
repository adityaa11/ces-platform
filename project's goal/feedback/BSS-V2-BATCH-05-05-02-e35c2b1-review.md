# CK review — BSS-V2-005-05-02

- **Ticket:** `BSS-V2-005-05-02` — Authenticated capacity-planning snapshot boundary
- **Batch:** `BSS-V2-BATCH-05-05-02`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-05-02-authenticated-capacity-planning-snapshot-boundary.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-05-05-02-go.md`
- **Reviewed commit:** `e35c2b1c06227e65cb8b2cdbaaa7e9460b1820da` (`test(admission): prove authenticated planning snapshots`)
- **Review type:** first consolidated review

## Review target and authority

The ticket is `awaiting_review`. The GO checkpoint records implementation
commit `e35c2b1` as the review target; the later `21c4677` commit only records
that hash in the GO artifact. The reviewed implementation,
ticket, and GO paths have no worktree modifications. Other dirty files are
unrelated, so the review target is unambiguous.

The frozen ticket's two Review Contract rows, the directly incorporated
`HMN-BSSV2-005-05-02-001` fixture bindings, and the approved 005-04/005-05-01
dependency boundaries are the complete authority. This review does not require
a production consumer API, runtime admission, provider execution, or a second
planner; the ticket explicitly bounds this child to the authenticated fake
consumer fixture and its evidence.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-00505-10` | `IMPLEMENTED_UNPROVEN` | `packages/atlas-db/tests/capacity-planning-snapshot.integration.test.ts:28-58,109-114` supplies one shared fixture read and two credentials, role denial, active-plan reads, and zero-side-effect counters. It does not project or assert the ticket-required media estimator/version and complete accounting/safety/protection/policy version coherence. |
| `RC-00505-11` | `IMPLEMENTED_UNPROVEN` | `.../capacity-planning-snapshot.integration.test.ts:115-132` proves route/class mismatch, forged credential, stale activation/missing active plan, unknown/zero capacity, and prospective sizing. It does not prove the explicitly named foreign process/quota scope, inactive/unqualified dispatch, or outdated-estimator fail-closed cases. |

The focused harness is structurally suitable and the exercised cases pass, but
the missing named observations prevent either row from being `PROVEN`.

## Validation and evidence

- `pnpm --filter @atlas/db test:capacity-planning-snapshot` without a database URL — **SKIPPED**; this is not accepted as proof.
- With the local Compose PostgreSQL service and the repository-local credentials: `pnpm --filter @atlas/db test:capacity-planning-snapshot` — **PASS**, 1 test, 0 failures, 0 skipped.
- `pnpm --filter @atlas/db test:desired-admission-profile-publication` — **PASS**, 1 test, 0 failures.
- `pnpm --filter @atlas/db migration:check` — **PASS**.
- `pnpm --filter @atlas/db typecheck` — **PASS**.
- `git diff --check e35c2b1^ e35c2b1` — **PASS**.

The executed test confirmed two qualified reads, shared `CapacityPlanningSnapshot/v1`
identity, role/table denial for `atlas_app`, stale/missing/unknown/zero and
prospective outcomes, and zero attempts/reservations/provider jobs/transports/
quota-window mutations. It did not establish the omitted ticket observations.

## Frozen Finding Closure Matrix

### `CK-001` — Required snapshot projection and coherence are incomplete

**Authority:** Frozen `RC-00505-10` and the ticket Outcome require the same
versioned snapshot to return coherent process/workload/route/quota-domain,
service-class, resource/window, structural/estimator/output/media,
accounting/safety/protection, policy, and plan/activation versions for both
authenticated consumers.

#### `CK-001.a`

- **Unsatisfied evidence:** The fixture response at `packages/atlas-db/tests/capacity-planning-snapshot.integration.test.ts:42-56` includes structural, estimator, output, safety, quota-accounting, capacity limits/window policy, and plan fields, but no media estimator/version or explicit protection/policy-version projection. The assertions at `:109-114` only compare API version, activation revision, service class, and estimator text; they do not prove complete input/active-plan coherence.
- **Observable correction:** The shared `CapacityPlanningSnapshot/v1` response must expose the ticket-required media estimator and accounting/safety/protection/policy/activation version bindings, and the integration test must assert those bindings for both principals against the fixture's server-selected process/workload/route/quota-domain and 005-04 active-plan identity.
- **Binary closure oracle:** `RESOLVED` only if the executed focused integration test asserts a complete, coherent snapshot for both principals, including a non-omitted media estimator/version and the required accounting/safety/protection/policy/activation versions; otherwise `UNRESOLVED`. Direct-regression boundary: this snapshot fixture/read seam and its projection assertions only; do not add runtime admission or provider behavior.

### `CK-002` — Named fail-closed cases are not all proven

**Authority:** Frozen `RC-00505-11` and the ticket Boundary and evidence
require fail-closed proof for foreign process/quota/route scope or forged
interactive class, inactive/unqualified dispatch, missing/stale plan,
unknown/zero required quota, and outdated estimator.

#### `CK-002.a`

- **Unsatisfied evidence:** The test at `packages/atlas-db/tests/capacity-planning-snapshot.integration.test.ts:115-123` checks a forged credential, route mismatch, class mismatch, dispatch intent on an otherwise qualified read, stale activation, and prospective scope. It does not exercise a foreign process assertion or quota-domain scope, an inactive/unqualified process/route dispatch, or an estimator version that is stale/outdated and must fail closed. The fixture creates only active `v2` estimators at `:95`.
- **Observable correction:** Add isolated fixture mutations and assertions for the omitted ticket cases: foreign process and quota-domain scope, an inactive/unqualified dispatch attempt, and an outdated estimator. Each must return the ticket's typed fail-closed status/reason, with no activation, registration, reservation, provider job, transport, or reusable permit; retain the existing positive, stale/missing, unknown/zero, and prospective assertions.
- **Binary closure oracle:** `RESOLVED` only if the focused integration command records passing assertions for all three omitted named cases and the zero-side-effect counters remain zero after them; otherwise `UNRESOLVED`. Direct-regression boundary: only the authenticated planning fixture's negative handling and its existing non-inert counter/role-boundary checks.

## Scope-change observations

None. The deficiencies are repairable evidence/fixture gaps within the frozen
ticket; no product, policy, architecture, deployment, dependency, or provider
decision is required.

## Decision

`CHANGES_REQUIRED`. The implementation passes the executed checks for the
covered cases, but `RC-00505-10` and `RC-00505-11` remain
`IMPLEMENTED_UNPROVEN` because the frozen ticket requires additional snapshot
projection/coherence and named fail-closed observations. The two findings above
are the complete bounded closure target for any later CFC/HMN workflow.
