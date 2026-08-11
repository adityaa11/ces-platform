# CES-GF-ARCH-002 — Architect: Decision Approval and Technical Context

**Phase:** 4A — Architect Decision  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Convert reviewed architecture candidates into an approved ADR and the exact
technical context consumed by the existing adapter stage.

## Work

- Present one recommendation and up to two meaningful alternatives.
- Capture approval, rejected candidates, rationale, and revisit conditions.
- Bind the decision to requirement, project-intent, POL-015 baseline, Context
  Binding, catalog, and rubric identities/hashes.
- Show how applicable capability needs are addressed by the selected candidate
  or preserve them as explicit unsupported gaps.
- Emit the existing `ProjectTechnicalContext` fragment exactly.
- Compose the fragment with assurance, project, baseline, and adapter selection
  into a valid existing `ProjectContext`.
- Prevent technical choices from entering policy-resolution inputs.

## Acceptance criteria

- [ ] No technical context is finalized without explicit approval.
- [ ] The emitted fragment passes `ProjectTechnicalContextSchema`.
- [ ] The composed context passes the existing `ProjectContextSchema`.
- [ ] Changing technical context does not change Policy Manifest applicability.
- [ ] Selecting an unavailable adapter produces an explicit gap.
- [ ] No architecture or stack decision is finalized without the exact
      validated POL-015 baseline used during candidate scoring.
- [ ] Every applicable capability need is addressed or remains an explicit gap;
      an unresolved architecture-class `DECISION_REQUIRED` state blocks final
      approval rather than being silently answered.

## Required evidence

- [ ] Approved and rejected decision fixtures.
- [ ] Context-composition and policy-neutrality tests.
- [ ] ADR JSON and Markdown examples.
- [ ] Policy-baseline traceability, unsupported-capability, and unresolved
      architecture-decision fixtures.

## Out of scope

- Unsupervised stack selection.
- Adapter implementation.
- Infrastructure provisioning.

## Depends on

- `CES-GF-ARCH-001`
- `CES-GF-POL-015`
