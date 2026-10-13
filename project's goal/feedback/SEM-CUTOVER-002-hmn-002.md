# HMN Authorization: SEM-CUTOVER-002

- **Ticket:** `SEM-CUTOVER-002` — Successor semantic baseline and deferred verification HMN
- **Batch:** `SEM-CUTOVER`
- **HMN authorization ID:** `HMN-SEM-CUTOVER-002-002`
- **Invocation:** Explicit user `HMN SEM-CUTOVER-002` delegation, `APPROVE`, recorded 2026-10-13.
- **Current workflow state:** First independent CK returned `CHANGES_REQUIRED`; one bounded documentary CFC is authorized for the specified unresolved frozen clause only.

## Frozen ticket reference

- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-002-successor-baseline-and-deferred-verification-hmn.md`
- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/HMN-SEM-CUTOVER-002-PROPOSAL.md`
- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/00-SEM-CUTOVER-IMPLEMENTATION-CONTEXT.md`, including its 2026-10-13 binding planning clarification.

## Current repository evidence

| Evidence | Recorded state |
|---|---|
| Current HEAD | `0151ed80d14d489ded6f2773f879832578f91c8d` (`docs(sem-cutover): record 002 HMN decision`) on `codex/new-atlas-backend` |
| Relevant GO commit | None; this human-decision ticket is not a source GO. |
| Relevant CK artifact | `project's goal/feedback/SEM-CUTOVER-002-0151ed8-review.md` — first CK review of `0151ed8`, result `CHANGES_REQUIRED`. |
| Relevant CFC commit | None for `SEM-CUTOVER-002`. |
| Prior HMN authorization | `HMN-SEM-CUTOVER-002-001` in `project's goal/feedback/SEM-CUTOVER-002-hmn-001.md`; it recorded the original prospective human decision and did not authorize CFC. |
| Worktree state | Pre-existing unrelated tracked and untracked implementation, fixture, planning, feedback, REL-03-candidate, and temporary paths remain protected. The CK artifact is an uncommitted review record; it is evidence for this authorization and is not part of the authorized remediation diff. |

## Diagnosis

The first independent CK review of the committed decision record found one unresolved, ticket-bound documentary clause: `CK-001.a`, traced to `RC-002-01`. The finding requires bounded replacement-oracle documentation in the existing 002 decision record. It does not require a source, runtime, provider, schema, relationship, persistence, or architectural change.

The user has expressly authorized one remediation cycle for that frozen clause. The original `APPROVE` decision, successor architecture, historical artifacts, and open `BSS-V2-004-03-05` findings remain unchanged. This authorization selects the existing CK closure target; it does not create a new acceptance contract.

## Ticket-authority trace

| Authority | Status | HMN treatment |
|---|---|---|
| `SEM-CUTOVER-002` `RC-002-01` / CK `CK-001.a` | Unresolved, frozen, and documentary-repairable. | Authorized for one bounded CFC cycle. CFC must read the frozen closure oracle in the CK artifact directly. |
| `RC-002-02` through `RC-002-05` | Proven in the first CK review. | Protected from redesign or reopening. |
| Historical 03-05 `CK-001.a/b` | Open under their separate ticket and workflow. | Not authorized here. |

## Decision

**Decision: `AUTHORIZE_NEXT_CFC`.**

Authorize exactly one bounded CFC remediation for `CK-001.a` from `project's goal/feedback/SEM-CUTOVER-002-0151ed8-review.md`. This is a new, single-clause documentary remediation cycle following the first CK `CHANGES_REQUIRED` result. CFC must consume `HMN-SEM-CUTOVER-002-002` and return its one committed remediation checkpoint to independent CK.

## Authorized scope

- Only frozen clause `CK-001.a`.
- Only `project's goal/feedback/SEM-CUTOVER-002-hmn-001.md` may be changed by the CFC remediation.
- The CFC must use the frozen CK artifact as the source of the residual mismatch, closure oracle, evidence location, and direct-regression boundary.
- The user-supplied prospective replacement-oracle direction applies only to expressing the already-required documentary proof; it does not authorize downstream implementation or amend historical tickets.

## Required validation

- CFC must compare all six decision-table rows directly with their exact frozen historical authorities before committing.
- CFC must execute and record `git diff --check` for the bounded remediation diff and record its actual commit SHA.
- The CFC checkpoint must identify this consumed authorization ID, the exact CK clause, the changed decision-record path, validation outcome, and return to CK.

## Forbidden work

- Do not modify any file other than `project's goal/feedback/SEM-CUTOVER-002-hmn-001.md` during the CFC remediation.
- Do not change runtime code, tests, schemas, Docker, database, REL-03 candidate, provider routing, historical tickets or CK artifacts, Master, canonical RUN-003 data, publication, admission, or external-provider behavior.
- Do not execute `SEM-CUTOVER-003`, issue a GO, claim implementation PASS, self-issue CK PASS, alter the original human decision, or close 03-05 findings.
- Do not stage, clean, stash, reset, or otherwise alter unrelated dirty or untracked paths.

## Handoff

**Expected next command:** `cfc SEM-CUTOVER-002` for the single authorized clause `CK-001.a`, followed by independent `ck SEM-CUTOVER-002` against the committed remediation checkpoint. No successor ticket may proceed unless that CK returns `PASS`.
