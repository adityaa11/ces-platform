# AUI-002: Fixture scenarios and UI contracts

- **State:** awaiting_review
- **Review batch:** BATCH-02
- **Depends on:** AUI-001
- **Baseline:** UI/UX Prototype PRD 9.1, 9.3-9.4

## Outcome

Provide realistic, stable fixture scenarios and UI-facing contracts for every prototype state without coupling components to mock-data internals.

## Scope

- Define contracts for users, roles, projects, PRDs, workflows, facts, evidence, changes, CES results, memberships, approvals, and processing jobs.
- Provide named scenarios for empty/populated libraries, owner/editor/viewer access, processing outcomes, PRD lens selections, approvals, CES coverage, and sharing changes.
- Use Safara-derived content only as a clearly illustrative project scenario.

## Acceptance criteria

- Every state required by UI/UX Prototype PRD 9.1 can be selected through fixtures.
- Evidence fixtures retain exact quote, source document, and page fields.
- A fixture scenario or role can change without rewriting a screen component.
- Fixture data accurately represents relationships among project surfaces.

## Validation

- Validate fixture contracts and scenario integrity with focused tests.
- Render at least one owner, editor, viewer, processing, and approved-result scenario.
