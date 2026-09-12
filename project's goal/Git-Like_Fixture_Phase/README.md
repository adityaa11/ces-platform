# Git-Like Fixture Phase Ticket Set

**State:** complete

## Baseline

- [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md)
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md)
- [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md)
- [Atlas review workflow](../../.agents/skills/atlas-review-workflow/SKILL.md)

## Outcome

Replace the fixture-only accumulated workspace model with reviewed, Git-like
golden fixtures, establish a repository-style Projects Route for project
selection and lifecycle state, and make the existing Atlas UI read
branch-relative current truth through a workspace selector. The later
correction/approval experience is designed only after the branch-aware read
path has passed review.

## Scope boundary

This phase uses local fixtures and shared skill packages. It does not add a
database, object storage, production PRD processing, a live Agents Bridge, or a
provider integration. `SKILLS_MODE` supplies the default fixture-authoring
executor (`codex` in this phase), while the actual execution mode belongs to
the revision provenance at a branch HEAD. The `agents_bridge` mode is a future
comparison contract.

## Delivery order

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | GLF-001 / BATCH-17 | approved | — | Is the repository-local `SKILLS_MODE` configuration explicit, safe, and defaulted to `codex`? |
| 2 | GLF-002 / BATCH-18 | approved | GLF-001 | Are the shared skill definitions, purposes, responsibilities, and review checks complete and non-authoritative? |
| 3 | GLF-003 / BATCH-19 | approved | GLF-002 | Does the golden-fixture data contract supply every relationship and branch/HEAD field required by the shared skills and future UI? |
| 3.1 | GLF-003-01 / BATCH-19.1 | approved | GLF-003 | Do deterministic skill outputs account for all Safara source PDFs and project the complete operational workflow? |
| 3.2 | GLF-003-02 / BATCH-19.2 | approved | GLF-003-01 | Can every material statement in Increment 01-03 be reconciled to an atomic extraction result or a justified non-fact classification? |
| 4 | GLF-004 / BATCH-20 | approved | GLF-003 | Does the Projects route explain each project's repository-like state and available next action without confusing draft work with published Master truth? |
| 4.1 | GLF-004-01 / BATCH-20.1 | approved | GLF-003-02 approved, GLF-004 | Do the Projects library, project switcher, and project routes resolve one fixture-owned repository record by stable project identity without migrating downstream knowledge surfaces? |
| 4.2 | GLF-004-02 / BATCH-20.2 | approved | GLF-003-02 approved, GLF-004 approved, GLF-004-01 approved | Does the Create and process intake produce one validated fixture-owned project request, Extracting card, and processing job with the same stable project ID? |
| 5 | GLF-005 / BATCH-21 | approved | GLF-003, GLF-004-01 | Does the reusable workspace-switcher UI clearly present the current selected workspace and the available workspace inventory without creating independent UI truth? |
| 5.1 | GLF-005-01 / BATCH-21.1 | approved | GLF-005, GLF-003-03 | Does the switcher resolve its inventory and availability from the golden fixture, preserve project/route context, and keep selected workspace separate from the PRD lens? |
| 5.1.1 | GLF-003-03 / BATCH-19.3 | approved | GLF-003-02 approved, GLF-004-01 | Does the fixture contract safely represent a newly requested Extracting workspace, its selected-base snapshot, and uploaded-PDF metadata without changing immutable Safara truth? |
| 5.2 | GLF-005-02 / BATCH-21.2 | approved | GLF-005-01, GLF-003-03 | Does the New workspace modal create one fixture-owned Extracting workspace request from an existing base workspace and uploaded PRD PDFs, without exposing revision internals to the user? |

Each batch has one ticket because every acceptance decision changes the data or
interaction contract required by the next checkpoint. Batches must be reviewed
individually; they are not combined for convenience.

## Completion boundary

This ticket set is complete through GLF-005 / BATCH-21.2. The final checkpoint
is `10f7a92` with the PASS review recorded in
`feedback/BATCH-21.2-10f7a92-review.md`. No further ticket in this set is
authorized to begin.

## Retired future work

The following unstarted tickets are retained only as historical planning
context. They are intentionally retired from this completed ticket set, are
not active delivery work, and must not be resumed here. Any related work must
be proposed and approved in a separate re-extraction lifecycle bundle.

| Historical ticket / batch | Disposition | Original subject |
|---|---|---|
| GLF-006 / BATCH-22 | Retired without implementation | Branch-aware UI fixture integration |
| GLF-007 / BATCH-23 | Retired without implementation | Correction and approval interaction design |
| GLF-008 / BATCH-24 | Retired without implementation | Skill execution comparison contract |

## Review controls

- Implement only the currently authorized ticket or batch.
- Commit the intended ticket changes, then set its state to `awaiting_review`.
- `ck` reviews the committed checkpoint and writes one feedback file under
  `project's goal/feedback/`.
- `cfc` handles accepted in-scope findings in one remediation commit.
- `go` begins the next dependency-ready ticket only after a `PASS` review of
  the final checkpoint commit.
- A new product requirement is a scope change and receives a separate ticket
  or an approved baseline update.

## Ticket records

- [GLF-001 Shared skill contracts and execution mode](GLF-001-shared-skill-contracts-and-execution-mode.md)
- [GLF-002 Skill definitions and review contract](GLF-002-skill-definitions-and-review-contract.md)
- [GLF-003 Golden fixture data contract](GLF-003-golden-fixture-data-contract.md)
- [GLF-003-01 Complete Safara source accounting and deterministic skill outputs](GLF-003-01-complete-safara-source-accounting.md)
- [GLF-003-02 Exhaustive Safara fact extraction and source accounting](GLF-003-02-exhaustive-safara-fact-accounting.md)
- [GLF-003-03 Workspace-creation fixture contract](GLF-003-03-workspace-creation-fixture-contract.md)
- [GLF-004 Projects Route repository overview](GLF-004-projects-route-repository-overview.md)
- [GLF-004-01 Project-route fixture recalibration](GLF-004-01-project-route-fixture-recalibration.md)
- [GLF-004-02 Project creation intake and pipeline handoff](GLF-004-02-project-creation-intake-and-pipeline-handoff.md)
- [GLF-005 Workspace selector](GLF-005-workspace-selector.md)
- [GLF-005 validation](GLF-005-validation.md)
- [GLF-005-01 Workspace selector golden-fixture integration](GLF-005-01-workspace-selector-golden-fixture-integration.md)
- [GLF-005-02 New workspace modal and fixture handoff](GLF-005-02-new-workspace-modal-and-fixture-handoff.md)
- [GLF-006 Branch-aware UI fixture integration — retired history](GLF-006-branch-aware-ui-fixture-integration.md)
- [GLF-007 Correction and approval interaction design — retired history](GLF-007-correction-and-approval-interaction-design.md)
- [GLF-008 Skill execution comparison contract — retired history](GLF-008-skill-execution-comparison-contract.md)
