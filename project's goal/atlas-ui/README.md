# Atlas UI/UX Prototype Ticket Set

**Baseline:**

- [Full Atlas product context](../Atlas_Full_Product_Context.md)
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md)
- [Atlas UI/UX Review Protocol](../Atlas_UI_UX_Review_Protocol.md)

**Scope:** Build the future-facing `apps/atlas` UI using `packages/atlas-fixtures` as its sole temporary data boundary. Use `pnpm` for the workspace. If Docker is used, downloaded packages and caches belong in named Docker volumes, not the repository root. No production service is introduced in this ticket set.

## Fixture relationship rule

Before creating or changing any fixture-driven screen, identify and document the relationship path for every displayed item: its fixture identity, owning scenario, related project/PRD/workflow records, selectable state, and destination or intentional lack of destination. Components must consume those relationships from shared fixture contracts; they must not invent local placeholder records, labels, counts, selected states, or routes. A fixture is acceptable only when its cards, switchers, detail views, statuses, and navigation remain mutually consistent through the same identity and relationship data.

The required backend-wiring semantics are defined in [Fixture Data-Intent Contract](FIXTURE_DATA_INTENT_CONTRACT.md).

## Remaining-workspace reference baseline

[AUI-007–AUI-010 reference-system analysis](AUI-007-010-reference-system-analysis.md) records the full shared-workspace behaviour derived from the reference prototype. AUI-007 through AUI-010 must use it alongside the PRD: shared project/lens state, grouped facts, increment timeline, CES cross-links, source-document accounting, and relationship-derived navigation are not optional screen-local details.

## Delivery order

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | AUI-001 / BATCH-01 | approved | - | Is the future-facing app and fixture-only boundary ready for UI work? |
| 2 | AUI-002 / BATCH-02 | approved | AUI-001 | Can fixtures faithfully drive every required prototype state and traceability view? |
| 3 | AUI-003 / BATCH-03 | approved | AUI-001, AUI-002 | Is the account shell clear, responsive, and reusable? |
| 4 | AUI-004 + AUI-005 / BATCH-04 | approved | AUI-003 | Can an owner create, monitor, and safely share a private project? |
| 5 | AUI-006 / BATCH-05-00 then BATCH-05 | approved | AUI-003, AUI-004 | Does the shared shell foundation, then Main Workflow, make accumulated PRD understanding and evidence easy to inspect? |
| 6 | AUI-007 / BATCH-06 | approved | AUI-003, AUI-004 | Are non-workflow facts and incremental changes visible and traceable? |
| 7 | AUI-008 / BATCH-07 | approved | AUI-006, AUI-007 | Does CES Result make baseline awareness, coverage, and open decisions clear without prescribing solutions? |
| 8 | AUI-009 / BATCH-08 | approved | AUI-004 through AUI-008 | Does the complete experience remain clear and accessible across screen sizes? |
| 9 | AUI-010 / BATCH-09 | in_progress | AUI-009 | Is the fixture-driven prototype coherent, navigable, and ready for handoff? |
| 10 | AUI-011 / BATCH-10 | planned | AUI-003, AUI-009, AUI-010 | Does the shared shell improve navigation clarity across desktop and mobile without changing route or fixture behavior? |

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

## Whole-surface validation rule

When changing a UI surface, validate the complete connected surface before requesting review—not merely the annotated element. For navigation and account controls this includes expanded and collapsed states, open and closed popovers, desktop and narrow layouts, light and dark themes, focus/keyboard behavior, z-index and clipping, text rhythm, and fixture-driven selected/unselected or enabled/disabled states. Do not hand off a local correction while its adjacent states remain uninspected.

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
- [AUI-011 Shell navigation cosmetic refactor](AUI-011-shell-navigation-cosmetic-refactor.md)
