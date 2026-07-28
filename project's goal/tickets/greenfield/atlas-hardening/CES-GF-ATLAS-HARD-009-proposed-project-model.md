# CES-GF-ATLAS-HARD-009 — ProposedProjectModel

**Stage:** Atlas hardening proposal
**Status:** Implemented

## Objective

Materialize an immutable, source-grounded, explicitly non-authoritative project
proposal before any human approval decisions exist.

## Dependencies

- ATLAS-HARD-005 through ATLAS-HARD-008.
- Canonical DAPE semantic contracts and identities.

## Work

- Define a versioned `ProposedProjectModel` contract containing workflow steps,
  an extensible semantic-record collection, relationships, source documents,
  coverage, findings, blockers, and derived summary counts.
- Represent built-in, registered organization-specific, and unknown record
  kinds losslessly through the pinned taxonomy registry; typed convenience
  arrays may exist only as compatibility projections.
- Preserve candidate-to-record lineage, classification status, explicit,
  derived, or human-added origin, and review-required issues.
- Preserve canonical DAPE record IDs and revision tuple.
- Set lifecycle, authority, approval-required, and downstream-execution flags
  through deterministic invariants.
- Publish proposal artifacts atomically and retain them after later approval.
- Reject proposals with invalid links, missing revision pins, or inconsistent
  summaries.

## Outputs

`proposed-project-model.json` plus schema, validation diagnostics, semantic hash,
and run-manifest reference.

## Acceptance criteria

- [x] The model exists before approval and is immutable after publication.
- [x] `authoritative` and `downstream_execution_allowed` are always false.
- [x] Findings, source coverage, and approval blockers are included.
- [x] Unknown and organization-specific semantic records survive proposal
      materialization without coercion or loss.
- [x] Derived records are visibly distinct and ineligible for bulk approval
      until explicitly confirmed.
- [x] Compatibility projections cannot omit canonical records silently.
- [x] All semantic and workflow records preserve canonical stable identities.
- [x] Summary counts are derived and validated, never provider-authored.
- [x] The original proposal remains available after approval.

## Tests and evidence

Valid proposal, unknown and organization-kind records, derived record, lossy
compatibility projection, missing source link, inconsistent count, attempted
authority escalation, mutation, stale revision, atomic failure, and
repeated-run fixtures.

## Completion evidence

- Added the dedicated `@company/ces-proposed-project-model` package.
- Proposal invariants make authority and downstream execution impossible.
- Extensible records retain candidates, kinds, evidence, origin, issues, and
  compatibility disposition.
- Coverage, findings, blockers, revision pins, and derived summaries validate
  deterministically.
- Atomic create-once publication retains the original proposal.
- Proposal and architecture tests passed; package typecheck passed.

## Out of scope

Approval decisions, authoritative publication, and downstream execution.
