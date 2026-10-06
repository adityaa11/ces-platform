# CK review: IDSER-009-01 / IDSER-BATCH-09-01

- **Review type:** first committed-checkpoint review
- **Ticket:** `IDSER-009-01-authorized-persisted-lifecycle-read.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `d6354f7348ac35591c83e1284901a33e36c5a58d` (`feat(atlas): add authorized lifecycle read`)
- **GO checkpoint:** `IDSER-BATCH-09-01-go-checkpoint.md`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-009-01-authorized-persisted-lifecycle-read.md` as committed at the reviewed checkpoint
- **Dependency:** IDSER-008 `PASS`, recorded at `IDSER-BATCH-08-ec1e973-verification.md`
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Required behavior / proof | Status |
|---|---|---|---|
| RC-009-01-01 | IDSER-009-01, review contract row 1 | PostgreSQL membership-scoped read; owner and unrelated user isolation | PROVEN |
| RC-009-01-02 | IDSER-009-01, review contract row 2; consumed IDSER-008 lifecycle rules | Truthful typed waiting, processing, terminal failure and ready lifecycle facts, including N and X | IMPLEMENTED_UNPROVEN; processing, failure and ready assertions do not verify returned N/X/member facts |
| RC-009-01-03 | IDSER-009-01, review contract row 3 | Legacy no-bundle distinction and fail-closed handling of malformed bundle records | UNRESOLVED; contradictory member states remain exposable under CK-001 |
| RC-009-01-04 | IDSER-009-01, review contract row 4 | Invalid N/X/member/workspace combinations and raw failure details cannot cross as valid lifecycle data | UNRESOLVED; see CK-001.a and CK-001.b |

## Evidence and validation reviewed

- Confirmed the ticket is `awaiting_review`, HEAD is the checkpoint's implementation commit `d6354f7`, and no uncommitted changes touch the ticket's implementation, test, or checkpoint paths. Existing modifications are generated outputs and unrelated untracked workflow artifacts; they do not make this committed target ambiguous.
- Inspected the full implementation diff, the frozen ticket, its IDSER-008 dependency semantics, the GO checkpoint and the PostgreSQL integration fixture.
- `docker compose ps` — PostgreSQL healthy.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed, 3/3 tests, 0 skipped. The IDSER-009-01 integration test covers nominal waiting, processing, failure, ready, legacy and missing-member cases, but not the inconsistent count or contradictory waiting-state cases below.
- The GO checkpoint records passing Core/DB typechecks; these were reviewed as checkpoint evidence but were not rerun during CK.

## Finding

### CK-001 — Fail-closed lifecycle validation accepts contradictory persisted states

**Ticket authority:** IDSER-009-01, Authority and outcome paragraphs 2–3 and review contract rows `RC-009-01-02` and `RC-009-01-04`; IDSER-009-01 explicitly consumes IDSER-008 lifecycle semantics. IDSER-008 lifecycle rule 1 says `waiting` means no document has started active processing, and rule 2 reserves `perceiving`, `extracting`, and `reconciling` for active lifecycle state. These are within the ticket's persisted-truth and integrity boundary.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
|---|---|---|---|
| **CK-001.a** | IDSER-009-01 says invalid N/X/member combinations fail closed (`RC-009-01-04`). In `packages/atlas-db/src/project-repository.ts:130-132`, the `needs_attention` branch checks only that at least one member is failed; it does not require persisted `completed_document_count` to equal the number of member facts in `completed`. Thus a bundle with N=2, X=0, one completed member and one `needs_attention` member can be returned as a valid `technical_failure` lifecycle despite contradictory X/member facts. The existing fixture's failed record has zero completed members, so the passing suite does not expose this case. | Apply the same completed-count/member-count integrity check to terminal failure records before returning lifecycle data, and cover the mismatched-X failure record in the PostgreSQL fixture. | **PASS iff** the PostgreSQL test `IDSER-009-01 returns only membership-scoped, internally consistent persisted lifecycle facts` proves the mismatched-X `needs_attention` project is omitted while the valid terminal-failure fixture still returns its bounded `technical_failure` signal, and the exact command `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` passes with the added assertions. **Direct-regression boundary:** lifecycle reads of `needs_attention` bundles and their completed-count/member consistency only. |
| **CK-001.b** | IDSER-009-01 requires contradictory bundle/workspace/member state to fail closed (`RC-009-01-03` and `RC-009-01-04`); its valid-state contract consumes IDSER-008 lifecycle rule 1. In `packages/atlas-db/src/project-repository.ts:130`, the shared `waiting || processing` condition accepts any member states so long as X matches the count of completed members and no failure is recorded. A `waiting` bundle with a member in `perceiving`, `extracting`, or `reconciling` therefore crosses as valid, although IDSER-008 defines waiting as having no document started active processing. It also permits a `completed` member with matching positive X under `waiting`, which contradicts that same rule. | Validate member states against the waiting lifecycle rule before projecting a waiting bundle; only `pending` and `perception_queued` members can remain in `waiting`. | **PASS iff** the same named PostgreSQL integration test proves both (1) a `waiting` bundle with an active member is omitted and (2) a `waiting` bundle with a completed member and matching positive X is omitted, while the valid pending/pending waiting fixture remains returned; the exact Compose command listed in CK-001.a passes with these assertions. **Direct-regression boundary:** `waiting` bundle/member consistency and preservation of the valid pending waiting read only. |

### CK-002 — Required per-state lifecycle facts are not asserted by the PostgreSQL proof

**Ticket authority:** IDSER-009-01, review contract row `RC-009-01-02`, which requires PostgreSQL fixtures/query assertions for each of waiting, processing, terminal technical-failure and completion-gated ready, including truthful lifecycle facts, X and N.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
|---|---|---|---|
| **CK-002.a** | The integration test `IDSER-009-01 returns only membership-scoped, internally consistent persisted lifecycle facts` in `packages/atlas-db/tests/project-repository.integration.test.ts` asserts waiting N/X but compares `memberFacts` to itself, while processing and ready assert only `lifecycle.kind`; terminal failure asserts only its kind and absence of raw text. Therefore the required PostgreSQL proof does not establish returned N/X and truthful member facts for processing, failure and ready (or member facts for waiting). | Add explicit PostgreSQL assertions against the fixture's expected N, X, member sequence/state/failure facts for all four valid lifecycle states, while preserving the existing privacy assertion for failure data. | **PASS iff** the named test explicitly compares: waiting N=2/X=0 and pending/pending member facts; processing N=2/X=0 and perceiving/pending facts; failure N=2/X=0 and the needs_attention/pending facts plus bounded signal; ready N=2/X=2 and completed/completed facts. It must also assert the expected sequence and failure indicator for those members. The exact command `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` must pass with those assertions. **Direct-regression boundary:** returned typed lifecycle facts for the four named database states only. |

All clauses are frozen at this artifact. Their closure oracles are limited to the ticket-authorized persisted lifecycle read and do not require card mapping, browser serialization, presentation, or broader IDSER-008 revalidation.

## Scope-change observations

None. No product, architecture, dependency, deployment, or policy decision is needed to resolve the findings.

## Decision

Record `CHANGES_REQUIRED` for IDSER-009-01 / IDSER-BATCH-09-01 at `d6354f7348ac35591c83e1284901a33e36c5a58d`. The checkpoint's PostgreSQL suite passes its current assertions, but two ticket-authorized contradictory lifecycle states can still be exposed as valid, and the ticket-required per-state lifecycle facts are not fully asserted. The complete admissible repair target is CK-001.a, CK-001.b and CK-002.a with the frozen closure oracles above.
