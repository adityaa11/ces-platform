# CK review: IDSER-010-03-02 / IDSER-BATCH-10-03-02

- **Ticket:** `IDSER-010-03-02-semantic-failure-containment.md`
- **Ticket state:** `awaiting_review`
- **Authorized predecessor:** IDSER-010-03-01 `PASS` (approved at `0fbce45`)
- **Reviewed commit:** `a0db61d171895356ecfb3672f040e65917547850` (`test(idser): contain semantic validation failures`)
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-10-03-02-go-checkpoint.md`
- **HMN authorization:** `HMN-IDSER-010-03-02-001` (`RETURN_TO_GO`), consumed by the GO checkpoint
- **Result:** `CHANGES_REQUIRED`
- **Review type:** First CK review

## Target and scope

The child ticket is explicitly `awaiting_review`; `HEAD` is the committed implementation checkpoint. No in-scope semantic implementation, tests, ticket, or GO checkpoint content is uncommitted. The generated `apps/atlas/tsconfig.tsbuildinfo` change and unrelated worktree artifacts do not make the target ambiguous.

Reviewed only IDSER-010-03-02's four frozen Review Contract rows: context/result denial, provider and deterministic acceptance failure, invalid acceptance rollback with reviewable uncertainty, and target-only terminal containment. The HMN artifact authorized GO for the initial implementation and does not expand those ticket requirements. Concurrency, replay redesign, browser/CSP behavior, and other child tickets remain outside this review.

## Review Contract

| Row | Ticket authority and required behavior | Evidence reviewed | Status |
|---|---|---|---|
| RC-010-03-02-01 | Unauthorized or mismatched context/result denial leaves target and control state unchanged. | `packages/atlas-db/tests/semantic-authority.integration.test.ts:56-60,85-92,155-156` exercises wrong credentials, invalid context, stale capability, and mismatched result scope. It asserts status/rejection, but has no before/after target/control snapshots for semantic materialization, progress, or queue state as required by the row's proof. | IMPLEMENTED_UNPROVEN |
| RC-010-03-02-02 | Controlled-provider worker failures and deterministic rejection produce bounded terminal failure without false progress or successor work. | `apps/agents-bridge/tests/semantic-worker.integration.test.ts:340-359` drives provider rejection, timeout, malformed output, schema-invalid output, and a `SemanticAcceptanceRejection` through the worker. It checks failed lifecycle, no handler acceptance, one failure handoff and no replay. It does not assert per-case provider-call counts or execution-specific absence of successor jobs/materialized state. The acceptance-rejection worker case uses a synthetic handler throw rather than the real extraction/reconciliation acceptance handlers. | IMPLEMENTED_UNPROVEN |
| RC-010-03-02-03 | Invalid evidence, inventory, and cross-scope references roll back; valid ambiguity/conflict remains reviewable. | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:102-127` checks invalid evidence/inventory leaves no extraction result and no reconciliation queue continuation. `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:121-136,307-308` exercises reviewable relationship uncertainty and verifies a cross-scope final reference leaves no reconciliation result. The test code throws the new typed acceptance rejection from these invalid conditions. GO records the focused acceptance suites as passing. | PROVEN |
| RC-010-03-02-04 | A terminal failure affects only its target member/bundle; Master remains empty and an unrelated control is unchanged. | The worker fixture at `apps/agents-bridge/tests/semantic-worker.integration.test.ts:245-251` creates an Initial Draft workspace and separate test bundles, but no Master workspace or designated control bundle snapshot. Its new terminal-failure assertion at line 359 reads only the target member, target bundle, and completed count. It does not prove the Master/control state or queue stayed unchanged. | IMPLEMENTED_UNPROVEN |

The GO checkpoint records passing test counts and package-level Compose validation, but it does not provide exact Compose invocations for each required focused suite or record target/control DB and queue observations. The ticket's hard-stop section explicitly requires those records before `awaiting_review`.

## Findings

### CK-001 — Authorization denials lack required non-mutation snapshots

The current tests reject unauthorized or mismatched context/result requests, but do not take before/after snapshots of the target and control state. Status codes and thrown errors alone do not prove the ticket's required absence of results, progress, successor work, or cross-scope mutation.

### CK-002 — Scenario G terminal failure proof is incomplete

The worker integration exercises the provider failures and terminal route, but its typed deterministic rejection is injected by a synthetic handler. The focused extraction/reconciliation tests independently prove acceptance rollback, but do not connect those actual validator rejections to the worker's terminal-failure handoff. The worker test also does not establish per-case provider-call counts and no successor/materialization, and its terminal case lacks the ticket-required empty Master and unchanged control-bundle/queue observations.

### CK-003 — Required Compose validation record is incomplete

The ticket's hard stop requires exact Compose commands and target/control DB plus queue observations. The GO checkpoint names suites and reports passing counts, but does not record the exact invocations or the required control and queue observations.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|
| CK-001.a | IDSER-010-03-02 RC-010-03-02-01: context/result authorization denial must not mutate trusted target or control state; required proof is the Compose internal-route/semantic-authority fixture with before/after target/control snapshots. | `packages/atlas-db/tests/semantic-authority.integration.test.ts:56-60,85-92,155-156` asserts rejection/status without comparing persisted state or queue observations before and after the unauthorized/mismatched attempts. | **PASS iff** the existing Compose semantic-authority fixture snapshots target and unrelated control materialization/lifecycle/progress/queue state, exercises its unauthorized or mismatched context/result denials, and asserts the snapshots are identical with no result, progress, successor, or cross-scope mutation. Evidence is the committed assertions and their exact passing Compose run. | Semantic context/result authorization and denial only; do not expand into provider failure or lifecycle redesign. |
| CK-002.a | IDSER-010-03-02 RC-010-03-02-02 and RC-010-03-02-03: named provider failures and deterministic evidence/inventory/reference rejection must use the bounded technical path without false result or successor; Scenario G uses the controlled-provider production worker plus focused Atlas acceptance suites. | `semantic-worker.integration.test.ts:340-359` uses a synthetic typed handler error for its terminal acceptance case. Actual invalid evidence/inventory/reference rejection is only exercised directly in the DB acceptance tests, without the worker/failure handoff. The provider loop also lacks per-case call-count and successor/materialization assertions. | **PASS iff** the controlled-provider Compose worker proof records the observed provider call/result for each named rejection consistently with existing retry behavior, and sends an actual invalid evidence, inventory, or reference result through the existing terminal technical-failure path; assertions show no trusted result/materialization/progress/replay/successor and bounded failure output. The focused Atlas acceptance tests continue to prove rollback for the named invalid forms and reviewability for valid ambiguity/conflict. Evidence is the committed focused assertions and their exact passing Compose runs. | Semantic result validation-to-failure handoff and directly required acceptance rollback only; preserve retryable handler/transport outage behavior and existing replay guarantees. |
| CK-002.b | IDSER-010-03-02 RC-010-03-02-04: only the target enters `Needs attention`; Master remains empty and the unrelated control bundle is unchanged. | `semantic-worker.integration.test.ts:245-251,354-359` creates no Master/control baseline and asserts only target member/bundle state and completed count. It provides no control queue observation. | **PASS iff** a terminal Scenario G failure fixture begins with an empty Master and a recorded unrelated control bundle/queue snapshot, then proves the target member and bundle enter `needs_attention` with zero completed count while the Master remains empty and the control bundle/queue snapshot is unchanged. Evidence is the committed worker integration assertions and exact passing Compose run. | Target-only semantic technical failure containment, Master preservation, and control-bundle/queue integrity. |
| CK-003.a | IDSER-010-03-02 hard stop: before `awaiting_review`, all rejection classes and the reviewable-ambiguity contrast must be proven with exact Compose commands and target/control DB plus queue observations. | `IDSER-BATCH-10-03-02-go-checkpoint.md` records suite names and pass counts but not exact Compose invocations or the ticket-required target/control and queue observations. | **PASS iff** the durable GO evidence names each exact Compose command actually executed and its result for the worker, semantic-authority, extraction-acceptance, and reconciliation-acceptance suites, and records the required target/control DB and queue observations for the ticket's denial and terminal-failure scenarios. | Validation/evidence record for IDSER-010-03-02 only; does not authorize additional behavior or broaden the frozen ticket. |

## Validation and decision

- Inspected the committed diff from predecessor `537dd80` to `a0db61d`, the frozen ticket, the GO checkpoint, the consumed HMN authorization, and the focused worker/authority/acceptance assertions.
- The GO checkpoint records the worker, semantic-authority, extraction-acceptance, reconciliation-acceptance, package test, and typecheck results as passing. I did not independently rerun those commands during this review.
- No direct code defect requiring a new provider, worker, queue, retry policy, schema, or lifecycle design was identified; those changes remain outside ticket authority.

`IDSER-BATCH-10-03-02` receives `CHANGES_REQUIRED` because CK-001.a, CK-002.a, CK-002.b, and CK-003.a remain unproven against the frozen ticket. Keep the ticket at `awaiting_review`. Any bounded CFC remediation is limited to these frozen clauses and their stated regression boundaries; this artifact does not authorize remediation by itself.
