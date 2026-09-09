# GLF-007: Correction and approval interaction design

- **State:** blocked
- **Review batch:** BATCH-23
- **Depends on:** GLF-006, user research
- **Baseline:** Architecture Checkpoint sections 7–11, 17–19, 22.3–22.13, 24; UI/UX Prototype PRD sections 5–6, 9.1, 9.4; GLF-003-02 provenance and source-accounting contract

## Outcome

Design the fixture-backed correction, approval, and chatbot components after
user research establishes the intended interaction pattern.

## Blocker

The user has not yet supplied or approved research for the correction/chatbot
interaction. Do not invent the interaction pattern or implement these UI
components before that research is available.

## Scope

- Research and approve the component/information-pattern direction first.
- Specify read versus correction paths, selected-branch context, and visible
  distinction between current truth, staged proposal, ambiguity, and history.
- Specify targeted ambiguity questions, stale-base behavior, merge-conflict
  handoff, approval requirements, and sealed Addendum relationship.
- Specify the provenance shown for a correction: the affected current fact,
  candidate assertion, and source-inventory evidence must remain traceable;
  a proposal cannot replace that evidence with a free-form summary.
- Define fixture scenarios and UI-facing contracts only; no live chatbot,
  provider call, database, or commit service is in scope.

## Acceptance criteria

- The approved design never permits chatbot output to silently mutate a fact.
- Every correction produces or revises a ChangeProposal with base revision,
  before/after meaning, evidence, and status.
- Ambiguous and conflicting changes visibly stop before commit.
- Approval visibly precedes an immutable Addendum/revision path.
- Correction and approval states retain a resolvable path to the affected
  candidate and source-inventory record when the change concerns sourced fact
  content.

## Validation

- Review annotated happy path, ambiguity, stale-base, and merge-conflict flows.
- Trace every UI-visible state to fixture data or an explicit future service contract.
