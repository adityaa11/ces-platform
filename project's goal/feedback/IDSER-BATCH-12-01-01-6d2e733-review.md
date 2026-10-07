# CK review: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Ticket:** `IDSER-012-01-01-staged-fair-local-perception-admission-and-cutover.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `6d2e73300e2e43500a40218ee93db4944eadd311` (`feat: add staged perception admission gate`)
- **Review type:** First consolidated CK review
- **Result:** `CHANGES_REQUIRED`

## Review target and scope

The active ticket is `IDSER-012-01-01`, review batch `IDSER-BATCH-12-01-01`,
with the implementation and ticket state committed together at `6d2e733`.
Tracked implementation files are clean at that revision. The worktree contains
only unrelated untracked feedback artifacts; none overlaps this review target.

Review authority is the ticket's five Review Contract rows, its explicit
validation and hard-stop requirements, its Security Refactor Readiness review
bindings, and the approved dependency boundaries named by the ticket. This
review does not reopen Docling worker requalification, semantic execution,
provider admission, reconciliation redesign, or the approved IDSER-010
predecessor contracts except for the ticket-required regression probes.

## Review Contract traversal

| Row | Authority and required proof | CK status | Evidence |
|---|---|---|---|
| `RC-0120101-01` | Explicit staged policy; legacy bundles are not silently selected; an incompatible active legacy scheduler cannot bypass the same local capacity authority. | `IMPLEMENTED_UNPROVEN` | Migration and staged-only candidate predicate are present. No negative or mixed-scheduler observation proves that an active legacy path cannot bypass the two-permit authority. |
| `RC-0120101-02` | A saturated staged project creation commits durable pending members with no execution, source grant, or queue job until capacity opens. | `IMPLEMENTED_UNPROVEN` | The isolated direct-gate fixture passes its A/B/C sequence, but it does not saturate and create a project through `PostgresAtlasProjectRepository.create`, nor assert the committed third project's pending/no-effect state. |
| `RC-0120101-03` | Concurrent creation/refill is globally race-safe and cannot create a third non-terminal permit under one Atlas-owned PostgreSQL serialization seam. | `IMPLEMENTED_UNPROVEN` | The singleton gate row is locked `FOR UPDATE`, but the submitted fixture invokes the gate serially and records no concurrent creation/refill run or competing transaction observations. |
| `RC-0120101-04` | Durable bundle fairness, lowest pending sequence, and elastic lone-bundle borrowing are proven by the A(4)/B(5)/C(2) fixture. | `IMPLEMENTED_UNPROVEN` | The isolated fixture proves the sequential A/B/C, lowest-sequence, and lone-A observations. It does not prove the ticket-bound concurrent/restart fairness evidence in `VERIFY-0120101-RACE-FAIRNESS` / `REV-READY-0120101-02`. |
| `RC-0120101-05` | Admission atomically creates execution, fresh grant, pg-boss job, and member transition; rollback leaves none; queue metadata contains no raw source path. | `IMPLEMENTED_UNPROVEN` | Rollback and no-`private/` payload checks pass with an in-memory producer. The fixture does not prove a successful fresh grant and durable pg-boss job, or the real transactional producer path, in the positive admission case. |
| `RC-0120101-VAL` | The ticket's named validation includes creation/refill races, rollback, grant-expiry negative, permission denial, and IDSER-010-04/05 regressions. | `UNRESOLVED` | Isolated migration, permissions, perception-authority expiry/denial, and staged-admission checks pass. `node tests/idser-010-compose.mjs` times out waiting for the first bundle to reach `ready_for_review`; the existing project-repository IDSER-003 kickoff assertion also fails because the changed path is now staged. |

## Validation and evidence

Passed:

- `corepack pnpm --filter @atlas/db typecheck`
- `corepack pnpm --filter @atlas/core test`
- `corepack pnpm --filter @atlas/agents-bridge typecheck`
- `git diff HEAD^ HEAD --check`
- In a fresh isolated PostgreSQL database: `corepack pnpm --filter @atlas/db migrate`, `migration:check`, and `test:staged-perception-admission`.
- In the same isolated database: `test:permissions` and `test:perception-authority` passed, covering the source-grant expiry and Bridge permission-denial negatives.

The first staged-admission run against the shared local database was not used as
acceptance evidence: that database contained 260 pre-existing non-terminal
perception executions, so the global cap correctly admitted zero new work. The
isolated rerun passed and the temporary database was removed.

The required IDSER-010 Compose command was run as
`corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose`. Compose
services became healthy, but the harness timed out at
`apps/agents-bridge/tests/idser-010-compose.mjs:119` while waiting for the
first created bundle to reach `ready_for_review`; the temporary Compose project
was confirmed absent afterward. The isolated project-repository run passed its
repository-read test but failed the existing IDSER-003 kickoff assertion that
expects the superseded immediate-D1 behavior.

No real multi-document Docling load or worker-concurrency requalification was
run, consistent with the ticket hard stop.

## Frozen Finding Closure Matrix

### CK-001 — Ticket-required admission and cutover evidence is incomplete

This is one consolidated finding covering the ticket-bound deficiencies found
across the Review Contract and named validation. Each clause is frozen here;
later verification must not strengthen these or add unrelated conditions.

#### CK-001.a — Mixed legacy/new capacity authority is not proven

- **Exact ticket authority:** `RC-0120101-01`; `COUPLING-0120101-MIXED-SCHEDULERS`; `REV-READY-0120101-03`.
- **Unsatisfied evidence:** The implementation restricts the new candidate query to `staged-fair-local-v1`, but no executed negative demonstrates that an active legacy scheduler cannot create a concurrent non-terminal execution outside the same two-permit authority.
- **Observable correction/proof:** Run the ticket-approved mixed-scheduler negative with an explicitly legacy bundle and the staged gate active; show that the legacy path cannot bypass the Atlas-owned local-capacity authority and that only staged-policy rows enter this gate.
- **Binary closure oracle:** **RESOLVED** only when the scoped mixed-scheduler run proves that no incompatible legacy path can create an execution outside the single two-permit authority while staged admission is active. **UNRESOLVED** if the evidence only shows a staged-only query or a fixture containing no legacy scheduler.
- **Exact evidence location/validation:** `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` plus the ticket's named mixed-scheduler negative.
- **Direct-regression boundary:** Local perception admission/cutover capacity paths only; do not reopen future provider or Docling work.

#### CK-001.b — Saturated project creation is not exercised

- **Exact ticket authority:** `RC-0120101-02`; Outcome; `VERIFY-0120101-GRANT-EXPIRY` boundary as it applies to the pending/no-effect state.
- **Unsatisfied evidence:** The passing fixture inserts bundles directly and calls the gate. It does not create a saturated staged project through the production repository boundary and prove that the committed project remains durable with every member pending and no execution, grant, or pg-boss job.
- **Observable correction/proof:** Extend the deterministic isolated DB/queue fixture to occupy both permits, create a third project through `PostgresAtlasProjectRepository.create`, commit it, and assert durable bundle/documents plus zero execution, source grant, and queue job until a permit is freed.
- **Binary closure oracle:** **RESOLVED** only when the named production creation boundary passes those durable/no-effect assertions under saturation. **UNRESOLVED** if only direct SQL setup or direct gate invocation is observed.
- **Exact evidence location/validation:** `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` and the production project repository path in `packages/atlas-db/src/project-repository.ts`.
- **Direct-regression boundary:** Staged project creation and its pending admission state; do not require semantic or Docling execution.

#### CK-001.c — Creation/refill race proof is missing

- **Exact ticket authority:** `RC-0120101-03`; `VERIFY-0120101-RACE-FAIRNESS`; `REV-READY-0120101-02`.
- **Unsatisfied evidence:** The committed fixture performs each admission call sequentially. It does not run concurrent creation/refill transactions and capture the serialized gate, occupied count, and final execution count.
- **Observable correction/proof:** Execute concurrent staged creation/refill calls on separate PostgreSQL transactions/connections and assert exactly two non-terminal executions, no duplicate member transition, and monotonic durable turns.
- **Binary closure oracle:** **RESOLVED** only when the concurrent run passes with at most two non-terminal permits and no duplicate or lost admission. **UNRESOLVED** if only serial calls or source inspection are provided.
- **Exact evidence location/validation:** The staged-admission integration harness and its isolated PostgreSQL command.
- **Direct-regression boundary:** The Atlas-owned local admission transaction and direct creation/refill callers only.

#### CK-001.d — Fairness restart/concurrency observations are missing

- **Exact ticket authority:** `RC-0120101-04`; `VERIFY-0120101-RACE-FAIRNESS`; `REV-READY-0120101-02`.
- **Unsatisfied evidence:** A/B/C order, lowest pending sequence, and lone-bundle borrowing pass serially, but no restart or concurrent A/B/C observation is recorded for the durable turn behavior.
- **Observable correction/proof:** Add the bounded restart/concurrent fairness observation and retain the durable turn values and selected bundle/sequence order for A(4)/B(5)/C(2), including lone-A borrowing.
- **Binary closure oracle:** **RESOLVED** only when the required A/B/C fairness observations remain correct across the bounded restart/concurrency probe. **UNRESOLVED** if the evidence remains the current serial fixture only.
- **Exact evidence location/validation:** `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` and its executed isolated-DB evidence.
- **Direct-regression boundary:** Durable fair-turn selection and local permit refill; do not reopen worker requalification.

#### CK-001.e — Positive atomic grant/job proof uses a stub

- **Exact ticket authority:** `RC-0120101-05`; `TRUST-0120101-ADMISSION`; `SEAM-0120101-JIT-GRANT`; `COUPLING-0120101-SOURCE-IN-QUEUE`.
- **Unsatisfied evidence:** The rollback and payload assertions use an in-memory `producer`. They do not demonstrate that a successful admission has one fresh persisted source grant and one durable pg-boss job atomically committed with the execution and member transition.
- **Observable correction/proof:** Run the positive admission and rollback scenarios with the existing transactional pg-boss producer, asserting one fresh grant, one job, one execution, and the transitioned member on success, and no such effects after enqueue rollback; inspect the actual queued payload for absence of storage paths.
- **Binary closure oracle:** **RESOLVED** only when the real transactional producer run proves the successful four-way atomic state and rollback absence. **UNRESOLVED** if only an in-memory enqueue return value is observed.
- **Exact evidence location/validation:** `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` and `apps/agents-bridge/src/queue.ts` through the existing transactional producer.
- **Direct-regression boundary:** JIT local perception admission transaction and pg-boss handoff; no provider quota or semantic queue requirement.

#### CK-001.f — Named IDSER-010 regression validation does not pass

- **Exact ticket authority:** Ticket `Validation and hard stop`; `IDSER-010-04/05 regressions`; the ticket's explicit preservation of approved predecessor boundaries.
- **Unsatisfied evidence:** The required Compose regression command timed out waiting for the first staged project to reach `ready_for_review`. The existing project-repository IDSER-003 test also still expects immediate D1 kickoff, so the committed checkpoint has no passing evidence for the changed production creation path plus the named predecessor regression boundary.
- **Observable correction/proof:** Provide a ticket-scoped regression harness/evidence run that exercises the approved legacy or otherwise explicitly staged-compatible boundary, records the required IDSER-010-04/05 observations, and passes without silently treating the staged cutover as the historical sequential path. If the current ticket cannot select that compatibility arrangement, return the authority question to planning rather than weakening this oracle.
- **Binary closure oracle:** **RESOLVED** only when the ticket-named IDSER-010-04/05 regression validation completes with its required observations and the staged cutover remains bounded. **UNRESOLVED** if the command still times out or only the old immediate-kickoff expectation is reported.
- **Exact evidence location/validation:** `apps/agents-bridge/tests/idser-010-compose.mjs`, the ticket's scoped regression evidence, and the production staged creation path.
- **Direct-regression boundary:** Only the IDSER-010-04/05 behavior explicitly named by this ticket; do not reopen unrelated semantic or provider work.

## Scope-change observations

The existing IDSER-003 project-repository assertion and the IDSER-010 Compose
harness encode the historical immediate-D1/sequential lifecycle, while this
ticket deliberately introduces staged policy. Whether those predecessor
harnesses should be adapted to create explicit legacy fixtures or a separate
staged-compatible regression fixture is a planning/authority choice if the
current ticket does not resolve it. This observation does not add a new
acceptance condition beyond the ticket's explicit regression validation.

## Decision

`IDSER-BATCH-12-01-01` receives `CHANGES_REQUIRED` for the six frozen
`CK-001` clauses above. The static/typecheck checks, isolated migration, grant
expiry, permission-denial, rollback, payload-boundary, and sequential fairness
observations are retained as evidence, but they do not close the missing
ticket-authorized race, saturation, mixed-scheduler, real-queue, restart, and
named-regression oracles. This first review does not authorize CFC or another
remediation cycle.
