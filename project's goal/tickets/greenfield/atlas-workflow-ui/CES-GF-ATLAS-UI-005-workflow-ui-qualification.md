# CES-GF-ATLAS-UI-005 — Workflow UI Production Qualification

**Stage:** Atlas workflow review UI production gate
**Status:** Planned

## Objective

Prove that the production UI accurately renders the backend-owned integrated
semantic graph and supported proposed or approved model projections across
different domains and lifecycle states.

## Dependencies

- ATLAS-UI-001 through ATLAS-UI-004.
- Connected and qualified outputs from ATLAS-HARD-021 through ATLAS-HARD-026.
- Golden main-workflow output from ATLAS-HARD-027.

## Work

- Run component, interaction, accessibility, responsive, and browser tests.
- Test linear, branching, joining, looping, parallel, incomplete, ambiguous,
  conflicting, multilingual, proposed, and approved workflows.
- Test documents supporting several model kinds and at least one document that
  supports no workflow but does support another model kind.
- Verify integrated, workflow, dependency, state, decision, and actor views
  reuse canonical identities and synchronize selection.
- Verify the persistent overview and stacked detail interaction.
- Verify exact source-document, page, source-unit, text-span, and bounding-box
  navigation.
- Prove that pending and rejected semantics cannot appear authoritative.
- Prove authentication, project authorization, revision pinning, idempotency,
  stale-decision conflict handling, secure source delivery, safe bulk approval,
  and audit coverage.
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
- [ ] Pending multilingual equivalence remains separate and visibly
      non-authoritative until accepted.
- [ ] At least two structurally different domains render without UI code
      changes.
- [ ] A non-workflow document renders supported model projections without a
      fabricated workflow.
- [ ] The integrated graph relates all supported model kinds while layer
      controls keep it readable.
- [ ] Keyboard navigation and automated accessibility checks pass.
- [ ] Supported desktop and responsive layouts pass visual regression review.
- [ ] Cross-project access, forged reviewer identity, stale revision replay,
      duplicate command submission, unauthorized document access, and
      ineligible bulk approval tests fail safely.
- [ ] A human reviewer accepts the production workflow-review experience.

## Outputs and evidence

Qualification report, screenshots, browser traces, accessibility report,
cross-domain fixtures, artifact hashes, deployment version, and human
acceptance.

## Out of scope

Workflow execution, BPMN authoring, and frontend-owned semantic inference.
