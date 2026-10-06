# CK review: IDSER-010-04 / IDSER-BATCH-10-04

- **Ticket:** `IDSER-010-04-concurrent-bundle-identity-isolation.md`
- **Ticket state:** `awaiting_review`
- **Review type:** First consolidated CK review
- **Reviewed commit:** `95cc521d63daae3188e2d698f619464ffd4cfe1e` (`test(idser): prove concurrent bundle isolation`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-010-04-concurrent-bundle-identity-isolation.md`
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-10-04-go-checkpoint.md`
- **Predecessor:** IDSER-010-03-02 `PASS` at `f919439`; predecessor remains closed.
- **Result:** `CHANGES_REQUIRED`

## Target and review scope

The frozen ticket is `awaiting_review`, names `IDSER-BATCH-10-04`, and the committed GO checkpoint targets `HEAD` at `95cc521d63daae3188e2d698f619464ffd4cfe1e`. No earlier CK artifact exists for this batch. The committed Scenario F harness and Compose overlay match their committed contents; other working-tree changes do not alter this review target.

This first review covers only Scenario F and its three ticket Review Contract rows, required hard-stop evidence, and named direct-regression boundary. It does not reopen scenarios A–E, failure/retry semantics, replay/restart, or predecessor work.

## Review Contract

| Row | Ticket authority | Status | Evidence assessment |
|---|---|---|---|
| `RC-010-04-01` | Ticket Review Contract row 01; Security readiness negatives; hard-stop evidence | `IMPLEMENTED_UNPROVEN` | `idser-010-compose.mjs:110–139` creates two authenticated owners concurrently with the same display name, checks scoped IDs and payload meanings, and checks owner reads. It does not attempt a cross-owner progress mutation or record target/control progress observations. The GO record omits the exact Compose command/counts, safe scoped IDs, and target/control observations required before `awaiting_review`. |
| `RC-010-04-02` | Ticket Review Contract row 02; Security readiness queue-stealing negative; hard-stop evidence | `IMPLEMENTED_UNPROVEN` | The production worker is exercised and the test checks for zero remaining jobs by execution ID (`idser-010-compose.mjs:137–139`). It does not record pg-boss job IDs/queue names or worker execution evidence proving one matching claim/delivery per job and no unrelated job-state change. A zero-row cleanup query does not establish those observations. |
| `RC-010-04-03` | Ticket Review Contract row 03; Security readiness cross-user context/result and foreign candidate/reference negatives; hard-stop evidence | `IMPLEMENTED_UNPROVEN` | Distinct provider meanings and per-bundle result/materialization counts are checked (`idser-010-compose.mjs:120–129`). The fixture does not capture and deny cross-scope context/result use or assert the required foreign candidate/reference negative. The scoped aggregate query does not prove those denial and reference-integrity observations. |

## Frozen Finding Closure Matrix

### CK-001 — Scenario F isolation proof and required checkpoint evidence are incomplete

#### CK-001.a — Owner write isolation and target/control progress

- **Ticket authority:** `RC-010-04-01` requires each owner to see and mutate only its own rows. The Security readiness section explicitly requires target/control progress mutation as a negative case. The hard stop requires target/control DB observations and safe scoped IDs.
- **Unsatisfied evidence:** Scenario F checks unique project/workspace/bundle/document/execution IDs and owner-scoped reads, but performs no cross-owner progress mutation attempt and records no target/control progress observations. The GO checkpoint does not preserve the exact Compose command/counts, safe scoped IDs, or target/control observations.
- **Observable correction:** Extend the Scenario F production-Compose proof to exercise the ticket-authorized cross-owner progress-mutation denial and preserve the target/control progress observations and safe scoped IDs in the checkpoint evidence.
- **Binary closure oracle:** **PASS iff** the committed Scenario F harness/evidence shows (1) the two concurrently created owners and same-display-name projects retain unique project, workspace, bundle, document, and execution IDs; (2) each owner reads only its own project; (3) the unauthorized cross-owner progress mutation is denied; and (4) the recorded target/control progress observations are unchanged by that denial. The durable evidence must name the exact Compose command and outcome/counts and the safe scoped IDs/observations. Evidence location: `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F assertions and the IDSER-BATCH-10-04 checkpoint. Direct-regression boundary: membership reads and progress authorization exercised by this Scenario F proof only.

#### CK-001.b — Queue claim/delivery isolation

- **Ticket authority:** `RC-010-04-02` requires pg-boss job IDs/queue names, worker execution log, and cleanup assertions proving each job is claimed/delivered once by its matching scope and no unrelated job state changes. The Security readiness section explicitly requires the queue-stealing negative. The hard stop requires queue IDs and exact Compose evidence.
- **Unsatisfied evidence:** The harness only counts remaining `pgboss.job` rows for the two execution IDs and expects zero. It captures neither job IDs/queue names nor worker execution records, and does not establish overlapping progress, one matching claim/delivery per job, or unchanged unrelated job state. Concurrent project creation and waiting for both terminal states do not prove that both bundles progressed at the same time.
- **Observable correction:** Record the two Scenario F job IDs and queue names, observe overlapping production-worker execution for both scopes, show each job is claimed/delivered exactly once by its matching scope, assert unrelated job state is unchanged, and retain the cleanup result in the checkpoint evidence.
- **Binary closure oracle:** **PASS iff** the committed Scenario F Compose proof identifies each job ID and queue name, demonstrates overlapping progress for both bundle scopes, exactly one claim/delivery mapped to each matching execution scope, no unrelated job-state change, and cleanup; the checkpoint records the exact Compose command and outcome/counts. Evidence location: `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F queue assertions/worker observation and the IDSER-BATCH-10-04 checkpoint. Direct-regression boundary: pg-boss worker and queue-scope behavior exercised by Scenario F; no replay/restart requirement is added.

#### CK-001.c — Context/result and foreign-reference isolation

- **Ticket authority:** `RC-010-04-03` requires context, controlled-provider response, and result delivery to remain in the exact bundle/project scope with no foreign ID/payload. The Security readiness section explicitly requires cross-user context/result and foreign candidate/reference negatives. The hard stop requires exact Compose evidence and target/control observations.
- **Unsatisfied evidence:** Distinct source meanings are persisted under the expected projects and row counts are checked, but the harness does not capture a denied cross-scope context/result attempt or assert the foreign candidate/reference negative. Its aggregate query is scoped to the selected projects and does not establish that rejected foreign references leave target/control observations unchanged.
- **Observable correction:** Add the ticket-required cross-scope context/result denial and foreign candidate/reference checks to the Scenario F Compose proof; show each accepted provider response/result maps to its matching execution and each bundle's own N/N materialization, with target/control observations preserved for the denials.
- **Binary closure oracle:** **PASS iff** the committed Scenario F proof demonstrates that a cross-scope context/result attempt and foreign candidate/reference are rejected, target/control observations remain unchanged after those denials, and each bundle contains only its own execution-bound provider meaning, candidate/evidence/relationship references, and N/N outcome. The checkpoint records the exact Compose command, outcome/counts, safe scoped IDs, and target/control observations. Evidence location: `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F context/result and persisted-reference assertions and the IDSER-BATCH-10-04 checkpoint. Direct-regression boundary: semantic context/result delivery and reconciliation reference scoping exercised by Scenario F.

All three clauses are frozen to the current ticket. Their closure does not require replay/restart or any A–E reclassification.

## Validation and evidence reviewed

- Inspected commit `95cc521d63daae3188e2d698f619464ffd4cfe1e`, the frozen ticket, GO checkpoint, Scenario F harness, controlled provider fixture, and deterministic Compose overlay.
- The GO checkpoint reports `node --check` for the harness and mock, `git diff --check`, and `node apps\\agents-bridge\\tests\\idser-010-compose.mjs` as passing. I did not independently rerun these commands.
- The ticket requires exact Compose command/counts, queue IDs, safe scoped IDs, and target/control DB observations. Those are not recorded in the GO checkpoint. The inspected `.codex-tools/idser-010-final.out` contains only the earlier A/B result and is not evidence for Scenario F.
- No direct regression failure was observed in the inspected diff. Existing named regression suites were not independently rerun during this review.

## Decision

`IDSER-BATCH-10-04` receives `CHANGES_REQUIRED`: the committed work proves useful positive identity/read/result isolation, but required cross-scope mutation, queue-delivery, context/result/reference-negative, and durable checkpoint observations remain unproven against the frozen ticket. Keep the ticket at `awaiting_review`. Any CFC work is bounded to `CK-001.a` through `CK-001.c` and their frozen direct-regression boundaries. This review does not itself authorize remediation or advance IDSER-010-05.



