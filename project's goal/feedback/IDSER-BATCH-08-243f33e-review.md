# CK review: IDSER-008 / IDSER-BATCH-08

- **Review type:** first committed-checkpoint review
- **Ticket:** [IDSER-008 bundle completion and failure lifecycle](../Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md)
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `243f33e885d8df6739533cccfefe5e45001e39cf` (`feat(idser): complete bundle lifecycle`)
- **GO checkpoint:** `IDSER-BATCH-08-go-checkpoint.md`
- **Prior CK/CFC:** none
- **Result:** `CHANGES_REQUIRED`

The reviewed commit matches the GO handoff. The remaining worktree changes are outside the committed checkpoint and do not make the review target ambiguous. This is the first review; the findings below freeze the complete currently identified ticket-bound repair and proof targets.

## Review Contract

| Row | Ticket authority | Required behavior / proof | Evidence inspected | Status |
|---|---|---|---|---|
| RC-001 | Mandatory completion gate; AC-23/27/31/32; REV-READY-IDSER-008-01 | Atomically enforce the twelve completion conditions before final result, relationship, count, bundle, and workspace completion. Independently exercise inconsistent preconditions in isolated DB fixtures. | `packages/atlas-db/src/reconciliation-acceptance.ts`; `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts`; GO checkpoint validation record. Some conditions have rejection tests; several do not (see CK-001.b). | IMPLEMENTED_UNPROVEN |
| RC-002 | Lifecycle rules; AC-28/29; Validation; REV-READY-IDSER-008-02 | Keep transient source/Bridge/Atlas failures recoverable under the existing retry ledger; persist terminal bounded failure only for terminal technical outcomes; preserve accepted completion during races. Prove restart, delayed availability, and perception plus both semantic-stage races in Compose. | `apps/agents-bridge/src/document-perception-worker.ts`; `packages/atlas-db/src/perception-authority.ts`; `packages/atlas-db/src/semantic-authority.ts`; Compose tests and GO checkpoint record. A source/replay infrastructure error is currently converted to terminal failure; the required lifecycle scenarios are not all evidenced. | UNRESOLVED |
| RC-003 | AC-31/32; REV-READY-IDSER-008-03; mandatory gate conditions 11-12 | Keep candidates reviewable, Master empty, and downstream authority untouched; inspect committed finalization writes and preserve transactional rollback. | Completion handler writes candidate-only lifecycle/result tables and checks Master state; integration test observes candidate/Master constraints and rollback. | PROVEN |

## Frozen Finding Closure Matrix

### CK-001 — Failure reporting and required lifecycle proof remain incomplete

**Result:** `CHANGES_REQUIRED`

#### CK-001.a — Transient source and replay infrastructure failures are reported as terminal

- **Ticket authority:** IDSER-008 Lifecycle rules require approved transient retries to remain recoverable. They also require the existing queue/operational ledger to retain retry responsibility during Atlas unavailability until Atlas records a terminal outcome. Validation requires delayed availability and recovery under the existing BSS-009/BSS-006 boundaries.
- **Unsatisfied evidence / implementation:** `apps/agents-bridge/src/document-perception-worker.ts:22-38` catches errors from replay load/stage, source redemption, provider work, and delivery. Unless a trusted result exists, cancellation occurred, or no failure client exists, generic errors are converted to a failure code and sent to `results.fail`. Thus an Atlas source handoff marked unavailable, or a transient Bridge replay-store read/stage error, can mark the Atlas member and bundle `needs_attention` instead of leaving the work retryable. The terminal failure distinction does not establish the ticket's transient-retry behavior.
- **Observable correction:** Transient Atlas source-handoff and Bridge replay-ledger errors leave the durable execution retryable and do not send a terminal failure; deterministic invalid source/result and exhausted provider failures still use bounded terminal reporting. Use the existing worker/queue retry path; do not add another recovery service.
- **Binary closure oracle:** **PASS** only when a Compose worker test injects a transient source-handoff failure and a transient replay load/stage failure, observes no terminal Atlas `needs_attention` transition while the operational effect remains retryable, then restores the dependency and observes the existing retry recover to its expected terminal outcome. Also retain proof that a genuinely terminal technical failure persists. Exact evidence must be recorded in the IDSER-008 checkpoint and run with the named Compose integration command(s). **FAIL** if either injected transient error is recorded as terminal before retry/recovery. Direct-regression boundary: perception worker error classification and the existing Bridge queue/operational ledger behavior needed to evaluate these cases.

#### CK-001.b — Mandatory completion-gate conditions are not independently exercised

- **Ticket authority:** Mandatory completion gate conditions 7-9 and 11; AC-23/31; Validation requires mutating/injecting each missing or inconsistent precondition in isolated DB fixtures and proving final acceptance fails before a valid success.
- **Unsatisfied evidence / implementation:** `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:247-270` independently mutates manifest count, member state, perception state, missing execution IDs, failed semantic execution, and Master presence. It separately checks candidate promotion and Master-state constraints. The recorded evidence does not independently inject a candidate tied to the wrong extraction-result scope, evidence tied to the wrong document or a nonexistent normalized-document locator, a reconciliation reference outside the authorized context at final acceptance, or a queued/running active-version stage. The completion code contains checks/validation for parts of these conditions, but the ticket explicitly requires fixture proof for every condition.
- **Observable correction:** Add isolated failure probes for the unexercised ticket conditions. For each probe, show the exact invalid state, rejection within the final acceptance transaction, and rollback of final result/relationships/member completion/count/bundle/workspace. Keep the existing valid atomic-success and replay assertions.
- **Binary closure oracle:** **PASS** only when the Compose `test:reconciliation-acceptance` evidence independently demonstrates each listed invalid condition is rejected and rolled back, followed by valid final acceptance and exact replay with no second progress effect. **FAIL** if any listed condition lacks its own assertion or final acceptance succeeds for it. Exact evidence location: `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` and the recorded command outcome in the checkpoint. Direct-regression boundary: the completion gate and its transaction; no unrelated predecessor behavior.

#### CK-001.c — Required end-to-end failure, restart, and race scenarios are not evidenced

- **Ticket authority:** IDSER-008 Lifecycle rules and Validation; AC-28/29/31/32; REV-READY-IDSER-008-02. The ticket names retry exhaustion, Atlas unavailability, worker restart, success/failure races for perception and both semantic stages, delayed source/delivery beyond grant expiry, and focused Core/DB/Bridge Compose integration.
- **Unsatisfied evidence:** The committed GO checkpoint records `test:semantic-authority` and `test:reconciliation-acceptance`, but its evidence identifies direct perception-failure route persistence/forged-scope rejection and semantic failure/race assertions, not the required perception worker retry/outage/restart/race path or delayed-grant recovery. The recorded commands do not include a Bridge worker Compose integration exercising terminal and transient perception behavior. The reconciliation test proves a worker restart for reconciliation progression; that does not prove the separately named perception and semantic failure/recovery observations.
- **Observable correction:** Complete and record the applicable Compose scenarios from the ticket: perception retry exhaustion and delayed grant expiry; durable failure handoff across Atlas unavailability and worker restart; and accepted-completion versus failure races for perception, extraction, and reconciliation. Observe durable Atlas state and the existing Bridge/pg-boss retry ledger where the ticket requires recovery. Preserve the current direct route assertions.
- **Binary closure oracle:** **PASS** only when the exact ticket-named Compose scenarios above have passing recorded outcomes, show terminal failure persisted after retries where required, show transient outage/restart remains recoverable until Atlas records it, and show accepted completions are not regressed by stale failure notifications. **FAIL** if any named scenario is absent, substitutes a direct route/unit test for worker/Compose behavior, or contradicts the required state. Exact evidence location: the committed Compose integration test(s) plus the GO checkpoint's command/output record. Direct-regression boundary: failure/recovery and race behavior of the perception worker, semantic handlers, and existing operational/queue ledger.

## Validation and evidence recorded

- Inspected the frozen IDSER-008 ticket, IDSER-BATCH-08 GO checkpoint, committed implementation diff, completion/failure handlers, and named integration tests.
- Reviewed the prior IDSER-007 supplemental verification for reusable separate-bundle concurrency evidence; it is not reopened.
- The GO checkpoint records passing Compose commands for contracts typecheck, Core tests, DB typecheck, `test:semantic-authority`, `test:reconciliation-acceptance`, and migration check. These are recorded implementer outcomes, not rerun during this CK review.
- `git diff HEAD^ HEAD --check` passed during review.
- No test command was executed during this review.

## Scope-change observations

None identified. The findings above trace to explicit IDSER-008 requirements and use the existing BSS-006/BSS-009 boundaries.

## Decision

Record `CHANGES_REQUIRED` for IDSER-008 / IDSER-BATCH-08 at `243f33e885d8df6739533cccfefe5e45001e39cf`. The first review found one implementation defect and required ticket-specific proof gaps. The three clauses and their closure oracles above are frozen. Return control to human/planning authority; this CK result does not authorize CFC.
