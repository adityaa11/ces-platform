# Post-CFC CK verification: IDSER-010-03-02 / IDSER-BATCH-10-03-02

- **Ticket:** `IDSER-010-03-02-semantic-failure-containment.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `726f4abb5d4c61729c0c45b5206f1a17e475395b` (`test(idser): close semantic containment evidence gaps`)
- **Remediation base:** `a0db61d171895356ecfb3672f040e65917547850`
- **Original CK:** `IDSER-BATCH-10-03-02-a0db61d-review.md` (`CHANGES_REQUIRED`)
- **CFC checkpoint:** `IDSER-BATCH-10-03-02-cfc-checkpoint.md`
- **HMN authorization consumed by CFC:** `HMN-IDSER-010-03-02-002` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- **Verification scope:** original frozen clauses `CK-001.a`, `CK-002.a`, `CK-002.b`, and `CK-003.a` only
- **Result:** `CHANGES_REQUIRED`
- **Review type:** Post-CFC verification

## Target and scope

The CFC checkpoint names the consumed HMN authorization and limits its remediation to the four unresolved clauses. `HEAD` is the committed remediation checkpoint. The reviewed remediation changes only the semantic-authority and semantic-worker integration tests plus the CFC checkpoint; it changes no production implementation. Other worktree changes are outside these reviewed files and do not make the checkpoint ambiguous.

This verification compares each clause with its original frozen oracle in `IDSER-BATCH-10-03-02-a0db61d-review.md`. It does not reopen resolved clauses, add findings, or restart broad review.

## Frozen clause verification

| Clause | Status | Evidence against the frozen oracle |
|---|---|---|
| `CK-001.a` | **UNRESOLVED** | The frozen oracle requires before/after target and unrelated-control snapshots of materialization, lifecycle, progress, and queue state around an unauthorized or mismatched context/result denial. `packages/atlas-db/tests/semantic-authority.integration.test.ts:59` snapshots lifecycle, `completed_document_count`, member state, and matching `pgboss.job` row count. Lines 62–64 compare that snapshot around a mismatched result denial and prove those captured values unchanged. The snapshot does not query or compare semantic extraction/reconciliation results, candidates, or other persisted semantic materialization. Actual evidence is therefore a lifecycle/progress/member/queue snapshot, not the required materialization/lifecycle/progress/queue snapshot. The clause remains unproven against its frozen oracle. |
| `CK-002.a` | **RESOLVED** | `apps/agents-bridge/tests/semantic-worker.integration.test.ts:151–157, 232–237, 355–364, 370–375` sends schema-valid invalid evidence from the controlled provider through `PostgresExtractionAcceptanceHandler` in the production worker fixture. The named provider-failure cases assert per-case provider calls, bounded failure handoff, no replay, no result/candidate/successor, and zero completed progress. The invalid-evidence case asserts the real rejection follows the terminal failure path without trusted acceptance, replay, materialization, progress, or successor. The focused extraction and reconciliation acceptance suites are also recorded as passing, retaining invalid-form rollback and reviewable uncertainty proof. This meets frozen clause `CK-002.a`. |
| `CK-002.b` | **RESOLVED** | `apps/agents-bridge/tests/semantic-worker.integration.test.ts:254–255, 370–381` creates an empty Master workspace, confirms the terminal target has failed/`needs_attention`, zero completed progress and no result/candidate/successor, and compares the unrelated control bundle and its matching queue observation before and after. Master remains empty. This meets frozen clause `CK-002.b`. |
| `CK-003.a` | **RESOLVED** | The committed CFC checkpoint records the exact Compose invocations and passing outcomes for semantic-authority (1 test), semantic worker (1), extraction acceptance (2), and reconciliation acceptance (1), and records the target/control and queue observations established by their committed assertions. It also records the controlled-stack health result and `git diff --check`. This supplies the exact validation and observation record required by the frozen clause. |

## Direct regression check

The remediation diff is limited to test fixtures and the CFC evidence record; no production behavior changed. The CFC checkpoint records all four focused Compose suites passing, a healthy controlled Compose stack, and `git diff --check` passing. I inspected the remediation diff and those recorded results; I did not independently rerun the commands. No direct regression introduced by the remediation was identified.

## Decision

`IDSER-BATCH-10-03-02` remains `CHANGES_REQUIRED` because frozen clause `CK-001.a` is unresolved. The expected state is a before/after snapshot covering target and control materialization, lifecycle, progress, and queue state around the denial. The actual state captured by `denialSnapshot` is lifecycle, bundle progress, member state, and matching queue row count; semantic result/materialization state is absent. The exact evidence locator is `packages/atlas-db/tests/semantic-authority.integration.test.ts:59,62-64`.

Return control to human/planning authority. This verification does not authorize another CFC pass.
