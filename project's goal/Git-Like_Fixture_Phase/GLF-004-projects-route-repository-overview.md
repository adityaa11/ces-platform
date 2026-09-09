# GLF-004: Projects Route repository overview

- **State:** awaiting_review
- **Review batch:** BATCH-20
- **Depends on:** GLF-003
- **Baseline:** Architecture Checkpoint sections 12–17, 22.5–22.8, 24; UI/UX Prototype PRD sections 4.2–4.3, 5–6, 9.1, 9.4; Fixture Data-Intent Contract; AUI-002; AUI-004; AUI-013

## Outcome

Make the Projects route the clear repository-style entry point for Atlas. A
user should be able to see what exists in each project, which state is the
current source of truth, and what action is available next without opening a
workspace prematurely.

## Scope

- Render every project through one reusable Project Card component driven by
  fixture records, not duplicated card-specific markup.
- Show a consistent card structure: project identity and status, project
  summary, Master state, optional Initial Draft extraction state, fixture-derived
  metrics, and the primary action.
- Represent the initial repository lifecycle explicitly:
  - **Published:** Master exists and represents the current accepted project
    source of truth.
  - **Extracting:** Master is still empty while the Initial Draft is being
    built; show processed PRD progress and keep the project action disabled.
  - **Ready for review:** Master is still empty while the Initial Draft is
    complete; show the completed extraction state and allow the user to open
    the project for review and publication.
- Keep Master truth distinct from Initial Draft candidate work. Do not imply
  that extracted draft material is already published or accepted.
- Include the route-level Create action and the concise Create → Extract →
  Review → Publish guide without inventing data outside the fixture contract.
- Reserve stable layout space for shared card sections so text wrapping in one
  project cannot shift the Master, draft progress, metrics, or action sections
  relative to the other cards.
- Preserve project identity by stable `project.id`; display labels must not
  determine routing or state.

## Acceptance criteria

- The Projects route renders the published, extracting, and ready-for-review
  fixture states through the same Project Card component.
- Published projects show their accepted Master state and published metrics.
- Projects without a published Master show an explicit empty Master state plus
  the Initial Draft extraction state when fixture data provides one.
- An extracting project cannot be opened into the workspace; its disabled action
  communicates that extraction is still in progress.
- A completed Initial Draft is visibly ready for review and does not appear to
  be published Master truth.
- Card sections align consistently across the fixture states at desktop,
  tablet, and mobile widths, including wrapped names, descriptions, badges,
  progress bars, metrics, and actions.
- The route preserves the existing no-project-selected shell behavior and
  routes only by stable project identity.
- The standalone UI reference may demonstrate the states, but this ticket does
  not authorize changing application code until the checkpoint is approved.

## Validation

- Render the Projects route with the three initial fixture states and verify
  the Master, Initial Draft, metrics, and action boundaries at desktop,
  tablet/narrow, and mobile widths.
- Verify the extracting action is disabled and the ready-for-review action is
  enabled, with accessible names and visible focus states.
- Verify the card list is fixture-driven and no state is inferred from display
  text or duplicated in a card-specific implementation.
- Run fixture relationship, route, accessibility, and visual checks, then
  apply the frontend review gate before review.

## Decision log

- 9 September 2026: user confirmed that a completed Ready for review project
  must expose enabled Open project and Share actions; while extraction is still
  in progress, both actions remain visibly disabled. This supersedes the
  temporary disabled-ready-action remediation recorded for BATCH-20.
- 9 September 2026: the maximum-length lowercase, uppercase, and mixed-case
  fixture stress render demonstrated that Project Card text can overflow its
  compact frame. This is accepted BATCH-20 remediation work: constrain and
  format valid input, reserve a full-width identity row, and contain title and
  description rendering without changing the underlying project identity.
- 9 September 2026: the regression input now lives separately as
  `projectCardStressFixtures`, rather than in an accepted fixture scenario or
  the golden Safara bundle. It supplies 48-character valid IDs plus
  80-character names and 280-character descriptions in lowercase, uppercase,
  and mixed case for the responsive-card remediation.
- 9 September 2026: BATCH-20 remediation separates the project ID onto its
  own header row, retains complete content in the accessible DOM, and limits
  only visual title and description presentation. A temporary stress render
  confirmed that the three maximum-length records remain contained within
  their cards before the accepted demo scenario was restored.
