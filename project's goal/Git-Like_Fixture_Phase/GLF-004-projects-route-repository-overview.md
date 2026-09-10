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
    complete; show the completed extraction state. This display-only fixture
    must state clearly when its review workspace is unavailable in the
    prototype rather than exposing a dead route.
- Keep Master truth distinct from Initial Draft candidate work. Do not imply
  that extracted draft material is already published or accepted.
- Include the route-level Create action and the concise Create → Extract →
  Review → Publish guide without inventing data outside the fixture contract.
- Reserve stable layout space for shared card sections so text wrapping in one
  project cannot shift the Master, draft progress, metrics, or action sections
  relative to the other cards.
- Apply the Responsive Fit Contract: derive the grid from the available shell
  width, use a 304–400px card-width range with 16px gaps, and cap columns only
  by the number of projects actually present. Do not keep a fixed three-card
  ceiling on wider screens.
- Preserve valid project identity and repository text in the visible card
  layout. Fit by responsive reflow and deliberate wrapping rather than visual
  ellipses or line clamps.
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
  be published Master truth. When no fixture-owned workspace exists, its
  disabled primary action explains that the review workspace is unavailable.
- Card sections align consistently across the fixture states at desktop,
  tablet, and mobile widths, including wrapped names, descriptions, badges,
  progress bars, metrics, and actions.
- Grid columns and card width are recalculated when the available route width
  changes (including the shell sidebar state), respecting the 304px minimum,
  400px maximum, 16px gap, and actual project count.
- Maximum-length lower-, upper-, and mixed-case test content remains fully
  visible through wrapping at each responsive card width; it does not rely on
  ellipses or clipping to appear contained.
- The route preserves the existing no-project-selected shell behavior and
  routes only by stable project identity.
- The standalone formula reference demonstrates responsive-fit behavior; the
  application implementation must preserve fixture ownership and use it only
  as a visual/layout correctness baseline.

## Validation

- Render the Projects route with the three initial fixture states and verify
  the Master, Initial Draft, metrics, and action boundaries at desktop,
  tablet/narrow, and mobile widths.
- Verify extracting and display-only ready-for-review actions are disabled with
  accessible explanations, while the published project action remains enabled
  and routes by stable project identity.
- Verify the card list is fixture-driven and no state is inferred from display
  text or duplicated in a card-specific implementation.
- Run fixture relationship, route, accessibility, and visual checks, then
  apply the frontend review gate before review.

## Decision log

- 9 September 2026: user confirmed that a completed Ready for review project
  must expose enabled Open project and Share actions; while extraction is still
  in progress, both actions remain visibly disabled. This supersedes the
  temporary disabled-ready-action remediation recorded for BATCH-20.
- 10 September 2026: the formula reference
  `atlas_project_cards_formula_responsive_v5_grouped_spaces.html` is the
  visual correctness baseline for this remediation. The project grid measures
  its available shell width and derives columns/card width from a 304–400px
  range and 16px gap, capped only by the project count.
- 10 September 2026: maximum-length lower-, upper-, and mixed-case content is
  tested as progressively grouped text at the planned limits. The route must
  retain and wrap valid content rather than conceal it with ellipses or line
  clamps.
- 9 September 2026: the regression input now lives separately as
  `projectCardStressFixtures`, rather than in an accepted fixture scenario or
  the golden Safara bundle. It supplies 48-character valid IDs plus
  80-character names and 280-character descriptions in lowercase, uppercase,
  and mixed case for the responsive-card remediation.
- 10 September 2026: BATCH-20 remediation separates the project ID onto its
  own header row and retains complete title and description content in the
  visible card layout. A temporary stress render confirms that the three
  maximum-length records remain contained through responsive reflow before the
  accepted demo scenario is restored.
- 10 September 2026: the Ready for review fixture represents a completed
  Initial Draft but does not own a workspace/read model. Its primary action is
  therefore disabled with an explicit prototype-boundary explanation; only
  published fixture records expose an enabled workspace destination.
