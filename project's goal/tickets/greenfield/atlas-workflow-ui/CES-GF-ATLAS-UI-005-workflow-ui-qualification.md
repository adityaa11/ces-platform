# CES-GF-ATLAS-UI-005 — Workflow UI Production Qualification

**Stage:** Atlas workflow review UI production gate
**Status:** Planned

## Objective

Prove that the production UI accurately renders backend-owned proposed and
approved workflow projections across different domains and lifecycle states.

## Dependencies

- ATLAS-UI-001 through ATLAS-UI-004.
- Connected and qualified outputs from ATLAS-HARD-021 through ATLAS-HARD-026.
- Golden main-workflow output from ATLAS-HARD-027.

## Work

- Run component, interaction, accessibility, responsive, and browser tests.
- Test linear, branching, joining, looping, parallel, incomplete, ambiguous,
  conflicting, multilingual, proposed, and approved workflows.
- Verify the persistent overview and stacked detail interaction.
- Verify exact source-document, page, source-unit, text-span, and bounding-box
  navigation.
- Prove that pending and rejected semantics cannot appear authoritative.
- Run at least one qualification fixture and one structurally different domain.
- Verify that changing project data changes labels and content without
  production-code or theme changes.
- Store screenshots, interaction traces, accessibility results, artifact
  versions, and reviewer acceptance.

## Acceptance criteria

- [ ] Project overview remains visible while workflow detail opens below it.
- [ ] Overview and detail minimize/restore behavior passes interaction tests.
- [ ] All focused tabs render only backend-owned membership.
- [ ] Source traceability resolves correctly for every sampled UI item.
- [ ] Pending/rejected authority leakage equals zero.
- [ ] Fixture-specific production headings, theme, or hardcoded semantics equal
      zero.
- [ ] Language-only duplicate workflow nodes, operations, rules, states, and
      relationships equal zero.
- [ ] Every sampled multilingual concept exposes all exact original document
      representations.
- [ ] At least two structurally different domains render without UI code
      changes.
- [ ] Keyboard navigation and automated accessibility checks pass.
- [ ] Supported desktop and responsive layouts pass visual regression review.
- [ ] A human reviewer accepts the production workflow-review experience.

## Outputs and evidence

Qualification report, screenshots, browser traces, accessibility report,
cross-domain fixtures, artifact hashes, deployment version, and human
acceptance.

## Out of scope

Workflow execution, BPMN authoring, and frontend-owned semantic inference.
