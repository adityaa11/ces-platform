# CES-GF-ATLAS-UI-001 — Workflow Review Workspace Foundation

**Stage:** Atlas workflow review UI
**Status:** Planned

## Objective

Create the production Atlas review workspace as a domain-neutral renderer of
backend-owned workflow projections.

## Dependencies

- ATLAS-HARD-025 and ATLAS-HARD-026.

## Work

- Add a production web application within the existing workspace.
- Implement the required three-pane structure:
  - workflow navigation on the left;
  - persistent project overview and workflow detail in the center;
  - source-document evidence on the right.
- Display lifecycle, authority, approval, downstream-blocking, eligibility,
  and exception summaries from backend data.
- Create reusable loading, empty, error, unavailable-projection, and stale-data
  states.
- Preserve keyboard navigation, responsive behavior, focus visibility, and
  accessible graph alternatives.
- Consume versioned backend projections through typed adapters.
- Use neutral CES Atlas product language and project-provided display data.
- Render one buyer-facing item per governed semantic concept while allowing
  all exact original document representations to be inspected.

## Domain-neutral UI boundary

- Production headings, theme, navigation, colors, icons, sample labels, and
  default content must not contain fixture-specific terminology.
- No workflow name, actor, business rule, ordering, branch, or state may be
  hardcoded from a qualification fixture.
- Fixture data may appear only in tests or user-selected runtime project data.
- The UI must render an unrelated workflow domain without code or theme
  changes.

## Outputs

Production application shell, typed projection adapters, lifecycle banner,
three-pane responsive layout, accessibility baseline, and neutral empty/error
states.

## Acceptance criteria

- [ ] The three panes are visible together at supported desktop widths.
- [ ] Lifecycle and authority state cannot be hidden by workflow navigation.
- [ ] The UI renders only backend-provided semantic membership and topology.
- [ ] Fixture-specific headings or theme assumptions in production code equal
      zero.
- [ ] Loading, empty, error, missing-projection, and stale states are tested.
- [ ] Keyboard and screen-reader users can navigate workflows and graph items.
- [ ] Existing backend builds and tests remain green.

## Out of scope

Persistent overview/detail interaction is completed by ATLAS-UI-002.
