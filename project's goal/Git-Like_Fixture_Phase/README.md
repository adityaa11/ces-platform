# Git-Like Fixture Phase Ticket Set

**State:** awaiting_review

## Baseline

- [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md)
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md)
- [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md)
- [Atlas review workflow](../../.agents/skills/atlas-review-workflow/SKILL.md)

## Outcome

Replace the fixture-only accumulated workspace model with reviewed, Git-like
golden fixtures and make the existing Atlas UI read branch-relative current
truth through a workspace selector. The later correction/approval experience is
designed only after the branch-aware read path has passed review.

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
| 3 | GLF-003 / BATCH-19 | awaiting_review | GLF-002 | Does the golden-fixture data contract supply every relationship and branch/HEAD field required by the shared skills and future UI? |
| 3.1 | GLF-003-01 / BATCH-19.1 | awaiting_review | GLF-003 | Do deterministic skill outputs account for all Safara source PDFs and project the complete operational workflow? |
| 4 | GLF-004 / BATCH-20 | planned | GLF-003 | Can a user select a workspace/branch and understand its selected HEAD without confusing it with the PRD lens? |
| 5 | GLF-005 / BATCH-21 | planned | GLF-003, GLF-004 | Do all existing knowledge surfaces resolve one coherent current truth from the selected branch HEAD? |
| 6 | GLF-006 / BATCH-22 | blocked | GLF-005, user research | Is the correction and approval/chatbot interaction grounded in approved interaction research and unable to mutate truth silently? |
| 7 | GLF-007 / BATCH-23 | blocked | Agents Bridge pipeline, GLF-001–GLF-003 | Is the eventual `codex` versus `agents_bridge` comparison contract reproducible and authority-safe? |

Each batch has one ticket because every acceptance decision changes the data or
interaction contract required by the next checkpoint. Batches must be reviewed
individually; they are not combined for convenience.

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
- [GLF-004 Workspace selector](GLF-004-workspace-selector.md)
- [GLF-005 Branch-aware UI fixture integration](GLF-005-branch-aware-ui-fixture-integration.md)
- [GLF-006 Correction and approval interaction design](GLF-006-correction-and-approval-interaction-design.md)
- [GLF-007 Skill execution comparison contract](GLF-007-skill-execution-comparison-contract.md)
