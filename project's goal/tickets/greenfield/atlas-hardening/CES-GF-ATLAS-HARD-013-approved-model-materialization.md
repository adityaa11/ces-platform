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
- Preserve accepted registered organization-specific kinds and their pinned
  registry definitions without converting them to built-in kinds.
- Apply explicit identity rules: wording or classification correction retains
  the record ID; a split retains the original ID for at most one continuing
  meaning and assigns new IDs to additional meanings; a merge creates one
  deterministically identified accepted record with all parent lineage while
  superseding, not deleting, its inputs.
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
- [ ] Split and merge materialization follows the documented identity and
      lineage rules deterministically.
- [ ] Accepted organization-specific semantic kinds remain lossless and pinned
      to their reviewed registry revision.
- [ ] Published artifacts are authoritative and proposal/decision traceable.
- [ ] Unresolved blockers, stale decisions, or invalid links prevent publication.
- [ ] Downstream execution becomes allowed only after successful publication.
- [ ] Failed publication does not partially replace the last valid revision.

## Tests and evidence

Approve/reject/correct replay, classification change, split/merge lineage,
organization kind, stable/new ID, unresolved blocker, stale proposal, atomic
failure, graph parity, and downstream-gate fixtures.

## Out of scope

Downstream product behavior and registry policy evolution.
