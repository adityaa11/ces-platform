# Atlas UI/UX Prototype Ticket Set

**Baseline:**

- [Full Atlas product context](../Atlas_Full_Product_Context.md)
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md)
- [Atlas UI/UX Review Protocol](../Atlas_UI_UX_Review_Protocol.md)

**Scope:** Build the future-facing `apps/atlas` UI using `packages/atlas-fixtures` as its sole temporary data boundary. Use `pnpm` for the workspace. If Docker is used, downloaded packages and caches belong in named Docker volumes, not the repository root. No production service is introduced in this ticket set.

## Delivery order

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | AUI-001 / BATCH-01 | approved | - | Is the future-facing app and fixture-only boundary ready for UI work? |
| 2 | AUI-002 / BATCH-02 | approved | AUI-001 | Can fixtures faithfully drive every required prototype state and traceability view? |
| 3 | AUI-003 / BATCH-03 | approved | AUI-001, AUI-002 | Is the account shell clear, responsive, and reusable? |
| 4 | AUI-004 + AUI-005 / BATCH-04 | awaiting_review | AUI-003 | Can an owner create, monitor, and safely share a private project? |
| 5 | AUI-006 / BATCH-05 | planned | AUI-003, AUI-004 | Does Main Workflow make accumulated PRD understanding and evidence easy to inspect? |
| 6 | AUI-007 / BATCH-06 | planned | AUI-003, AUI-004 | Are non-workflow facts and incremental changes visible and traceable? |
| 7 | AUI-008 / BATCH-07 | planned | AUI-006, AUI-007 | Does CES Result make baseline awareness, coverage, and open decisions clear without prescribing solutions? |
| 8 | AUI-009 / BATCH-08 | planned | AUI-004 through AUI-008 | Does the complete experience remain clear and accessible across screen sizes? |
| 9 | AUI-010 / BATCH-09 | planned | AUI-009 | Is the fixture-driven prototype coherent, navigable, and ready for handoff? |

## Batch rationale

Only BATCH-04 includes more than one ticket. AUI-004 (project library/upload/progress) and AUI-005 (sharing/RBAC states) are independently implementable after the application shell and answer one coherent owner-facing review question: can a user create and safely collaborate on a private project?

All other tickets have individual batches because their acceptance decisions are distinct. They must not be combined merely to reduce review count.

## Review controls

- After a ticket or batch is implemented, validated, and committed, set it to `awaiting_review`.
- `ck` reviews the committed `HEAD` and writes one consolidated review file under `project's goal/feedback/`.
- `cfc` resolves accepted in-scope feedback and commits the remediation; it returns the ticket to `awaiting_review`.
- `go` may start the next dependency-ready ticket only after the final commit has a `PASS` review.
- New requirements are recorded as scope changes and become a separate ticket or baseline update; they do not reopen an approved ticket.

## Required visual-validation record

Every UI ticket must include a validation record before it moves to `awaiting_review`. Use [AUI ticket validation template](AUI-TICKET-VALIDATION-TEMPLATE.md) and record the rendered states actually inspected. A build, lint, or unit-test result is necessary but is not visual validation.

## Ticket records

- [AUI-001 Foundation and fixture boundary](AUI-001-foundation-and-fixture-boundary.md)
- [AUI-002 Fixture scenarios and UI contracts](AUI-002-fixture-scenarios-and-ui-contracts.md)
- [AUI-003 Account shell and reusable UI primitives](AUI-003-account-shell-and-ui-primitives.md)
- [AUI-004 Project library, upload, and processing experience](AUI-004-project-library-upload-and-processing.md)
- [AUI-005 Project sharing and RBAC states](AUI-005-project-sharing-and-rbac-states.md)
- [AUI-006 Main Workflow, PRD lens, and evidence](AUI-006-main-workflow-prd-lens-and-evidence.md)
- [AUI-007 Project Facts and Changes Done](AUI-007-project-facts-and-changes.md)
- [AUI-008 CES Result and approval gates](AUI-008-ces-result-and-approval-gates.md)
- [AUI-009 Responsive and clarity pass](AUI-009-responsive-and-clarity-pass.md)
- [AUI-010 Prototype integration and handoff](AUI-010-prototype-integration-and-handoff.md)
