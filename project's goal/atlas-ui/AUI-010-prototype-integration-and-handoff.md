# AUI-010: Prototype integration and handoff

- **State:** awaiting_review
- **Review batch:** BATCH-09
- **Depends on:** AUI-009
- **Baseline:** UI/UX Prototype PRD 1, 9, 10; [AUI-007–AUI-010 reference-system analysis](AUI-007-010-reference-system-analysis.md)

## Outcome

Deliver a coherent fixture-driven Atlas prototype that demonstrates the entire approved journey and is ready to review or wire to future services through the fixture boundary.

## Scope

- Verify end-to-end navigation across account, library, upload/processing, sharing, Main Workflow, Project Facts, CES Result, Changes Done, evidence, and approvals.
- Verify fixture scenarios can switch without component rewrites.
- Verify the shared project/lens controller and source-accounting paths across workflow, facts, CES, and changes.
- Document the fixture boundary and the intended future replacement points.
- Resolve only integration defects and acceptance-criteria gaps; new product ideas remain scope changes.

## Acceptance criteria

- All UI/UX Prototype PRD acceptance criteria are demonstrably satisfied with local fixtures.
- The only planned production-wiring replacement is the fixture data boundary.
- The application has no live-service dependency.
- The journey is coherent for Owner, Editor, and Viewer fixture states.
- Every rendered count, source statement, and cross-link is derived from a resolvable fixture relationship; no screen-local data boundary remains.

## Validation

- Run application build and relevant automated checks.
- Complete an end-to-end manual walkthrough using representative fixture scenarios, lens modes, cross-links, source accounting, and screen sizes.
