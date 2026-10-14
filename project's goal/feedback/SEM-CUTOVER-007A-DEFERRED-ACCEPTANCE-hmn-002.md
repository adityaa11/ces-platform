# HMN Authorization: SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE

Ticket: `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`
Batch: `SEM-CUTOVER`
HMN authorization ID: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-002`
Invocation: explicit user `HMN — SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE readiness unblock` delegation
Current workflow state: `RETURN_TO_GO`

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE.md`
Current HEAD: `0f77d0d6c31cac8becefab07456eab436075796a`
Relevant GO commit: none — the prerequisite remains in initial GO
Relevant CK artifact: `project's goal/feedback/SEM-CUTOVER-007-2ffda79-review.md` (protected predecessor PASS)
Relevant CFC commit: none
Prior HMN authorization: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-001`
Worktree state: pre-existing runtime, generated-fixture, planning, archive, and temporary changes remain preserved and outside this authorization.

## Diagnosis

The prerequisite is still incomplete initial GO: its qualified-result implementation lacks the frozen isolated-PostgreSQL route evidence for `RC-DA-01` through `RC-DA-05`. Its required IDSER-006 extraction regression also contains a superseded historical expectation that direct legacy perception admission automatically creates a semantic extraction job. The accepted IDSER-012 boundary intentionally rejects that legacy admission, and the approved staged path intentionally terminates at `perceived`.

## Ticket-authority trace

The frozen prerequisite requires real Atlas qualified-result route evidence, exact atomic partial/deferred acceptance behavior, and unchanged full-canonical extraction/reconciliation behavior (`RC-DA-01` through `RC-DA-06`). The user has expressly authorized only the obsolete IDSER-006 test-contract correction needed to preserve that last guarantee. IDSER-012 admission tests remain the owner of staged-admission and legacy-admission-rejection proof.

## Decision

`RETURN_TO_GO` — this is not a CK/CFC remediation cycle. The earlier `RETURN_TO_GO` authority remains active; this record narrows the permitted test-contract realignment while initial GO completes its frozen validation.

## Authorized scope

Complete `RC-DA-01` through `RC-DA-06`. In `packages/atlas-db/tests/extraction-acceptance.integration.test.ts`, replace only the superseded perception-to-extraction automatic-scheduling setup with an explicitly authorized semantic extraction execution having valid Atlas source/context ownership. Retain PostgreSQL materialization, transactional pg-boss reconciliation rollback/replay/idempotence, and exactly-one permitted reconciliation-job proof. Keep existing full-canonical regression coverage.

## Required validation

Run and record the entire extraction-acceptance suite, the staged-admission regression suite, and the new deferred-acceptance suite. The latter must use isolated PostgreSQL and the actual Atlas qualified-result route, proving the ticket's positive, lifecycle, idempotence, hash/source, atomicity, and zero-effect cases.

## Forbidden work

Do not re-enable or modify legacy perception admission; do not cause staged admission to create semantic jobs; do not alter production perception-admission behavior, REL-03, reconciliation semantics, D1 scheduling, provider activation, the main `SEM-CUTOVER-007A` runtime cutover, Master, or publication. Do not weaken, delete, or skip historical regression assertions merely to obtain a green suite.

## Handoff

Expected next command: continuation of `GO SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`. GO may report `READY_FOR_CK` only after every `RC-DA-01` through `RC-DA-06` row is proven and its checkpoint records the exact commands and outcomes. Independent CK remains the only authority that can issue PASS.
