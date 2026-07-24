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
- Bind the decision to requirement, project-intent, catalog, and rubric hashes.
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

## Required evidence

- [ ] Approved and rejected decision fixtures.
- [ ] Context-composition and policy-neutrality tests.
- [ ] ADR JSON and Markdown examples.

## Out of scope

- Unsupervised stack selection.
- Adapter implementation.
- Infrastructure provisioning.
