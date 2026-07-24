# CES-GF-INT-001 — Integration: Project-Management Greenfield Demonstration

**Phase:** Integrated Greenfield Milestone  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Prove one connected PRD-to-evidence lifecycle for a multi-tenant
project-management application using the approved greenfield contracts.

## Work

- Author a realistic Markdown PRD and small Project Intent input.
- Cover company, membership, project, task, assignment, invitation,
  notification, audit, authorization, tenancy, and state transitions.
- Run Atlas extraction, clarification, approval, collection, and graph.
- Run Architect analysis and human decision.
- Compile the existing deterministic core and Laravel adapter.
- Generate Forge tasks and the Laravel baseline.
- Implement one bounded feature using the generated contract.
- Run existing verification and update Assurance views.
- Capture reproducible positive and negative evidence.

## Acceptance criteria

- [ ] Every policy, task, test, and evidence requirement traces to approved input.
- [ ] Unreviewed agent output never enters the core.
- [ ] Architecture and adapter decisions are explicit and approved.
- [ ] The generated baseline preserves user-owned files.
- [ ] Verification results update Assurance without fabricating evidence.
- [ ] Repeated runs from pinned approved inputs reproduce deterministic artifacts.
- [ ] Existing profile-picture regression tests continue to pass.

## Required evidence

- [ ] Complete input and approved-review fixture.
- [ ] Generated artifact identity index.
- [ ] Passing positive path and at least one failure per major boundary.
- [ ] Local and hosted CI results on the accepted commit.

## Out of scope

- Brownfield discovery.
- Multiple production scaffolds.
- Full project-management product implementation.
- Certification.
