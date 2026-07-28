# CES-GF-ATLAS-HARD-013 — Approved Model Materialization

**Stage:** Atlas hardening publication
**Status:** Planned

## Objective

Materialize and atomically publish the authoritative `ApprovedProjectModel`
from an immutable proposal and validated human approval decisions.

## Dependencies

- ATLAS-HARD-012.
- Completed DAPE-007 approved-model and projection contracts.

## Work

- Replay decisions deterministically against the exact proposal revision.
- Include only approved or corrected-and-approved records.
- Preserve stable semantic IDs while advancing record/model revisions.
- Retain origin revision, proposal statement, decision linkage, and correction
  history.
- Enforce publication blockers and enable downstream execution only after
  successful atomic publication.
- Project the approved graph from the same shared graph contract.

## Outputs

`approved-project-model.json`, `approved-workflow-graph.json`,
`approval-report.md`, publication diagnostics, and manifest linkage.

## Acceptance criteria

- [ ] Only human-approved semantic content enters the authoritative model.
- [ ] Stable IDs survive corrections; separate requirements receive new IDs.
- [ ] Published artifacts are authoritative and proposal/decision traceable.
- [ ] Unresolved blockers, stale decisions, or invalid links prevent publication.
- [ ] Downstream execution becomes allowed only after successful publication.
- [ ] Failed publication does not partially replace the last valid revision.

## Tests and evidence

Approve/reject/correct replay, stable/new ID, unresolved blocker, stale
proposal, atomic failure, graph parity, and downstream-gate fixtures.

## Out of scope

Downstream product behavior and registry policy evolution.
