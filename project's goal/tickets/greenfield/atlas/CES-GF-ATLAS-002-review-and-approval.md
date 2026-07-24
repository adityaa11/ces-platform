# CES-GF-ATLAS-002 — Atlas: Review and Approval

**Phase:** 3B — Atlas Review  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally

**Evidence:** [`evidence/CES-GF-ATLAS-002-local-review.md`](evidence/CES-GF-ATLAS-002-local-review.md)

## Goal

Turn candidate analysis into an explicit, auditable collection of approved
Requirement Packages through human decisions.

## Work

- Support approve, reject, correct, supersede, and defer decisions.
- Generate targeted questions for unresolved high-impact facts.
- Bind review decisions to candidate and source revision hashes.
- Require re-review when a reviewed source or candidate changes.
- Compile only approved records into individually valid Requirement Packages.
- Emit a deterministic Requirement Collection and review report.

## Acceptance criteria

- [x] An agent cannot approve its own inference.
- [x] Every approved field traces to a source or explicit human answer.
- [x] Stale decisions fail closed after source changes.
- [x] Unresolved blocking facts prevent affected packages from approval.
- [x] Equivalent approved inputs produce byte-identical approved artifacts.
- [x] Existing core compilation accepts each emitted package unchanged.

## Required evidence

- [x] Review-state transition tests.
- [x] Stale-review and conflict fixtures.
- [x] End-to-end candidate-to-core compilation test.

## Out of scope

- Authentication and organization-wide approval roles.
- Architecture approval.
- Governance exceptions.
