# CES-GF-ATLAS-HARD-005 — Source Coverage Map

**Stage:** Atlas hardening quality
**Status:** Implemented

## Objective

Track every source unit and semantic candidate through each extraction stage so
that omission and distortion can be assigned to the responsible stage.

## Dependencies

- ATLAS-HARD-003 and ATLAS-HARD-004.
- Completed DAPE-005 coverage foundation.

## Work

- Extend the canonical DAPE coverage contract with stage-specific transitions:
  evaluated, non-normative, candidate, classified, normalized, deduplicated,
  assigned, projected, unmapped, ambiguous, conflicting, and excluded.
- Apply identical coverage accounting to built-in, organization-specific, and
  unknown semantic candidates and records.
- Record one-to-many and many-to-one source/record mappings.
- Require reviewed reasons for exclusion or context-only disposition.
- Validate all source, candidate, normalized-record, workflow, and graph links.
- Calculate deterministic coverage counts without agent certification.

## Outputs

`source-coverage.json`, coverage summary, invalid-link diagnostics, and
pipeline-stage loss report.

## Acceptance criteria

- [x] Every source unit has an explicit current disposition.
- [x] Unknown and organization-specific records participate in coverage counts,
      mappings, findings, and projection checks.
- [x] Every normalized record links to its source units and candidates.
- [x] Unmapped normative content is visible and blocks publication.
- [x] Silent exclusion and attach-all provenance are rejected.
- [x] Pipeline-stage loss can be diagnosed directly.
- [x] Coverage ordering and counts are deterministic.

## Tests and evidence

One-to-many, many-to-one, unknown and organization-kind, duplicate, context,
exclusion, missing-link, wrong-document, workflow-assignment loss, and
graph-projection loss fixtures.

## Completion evidence

- Added a compatible hardened pipeline-coverage artifact beside the existing
  DAPE coverage gate.
- Tracks all required stages and validates source, candidate, record, workflow,
  and graph identities.
- Enforces candidate-inherited record provenance and reviewed exclusions.
- Counts unknown and organization-specific records and reports loss by stage.
- Focused coverage and architecture tests: 12 passed.
- Package TypeScript build passed.

## Out of scope

Agent criticism, retry execution, approval, and UI visualization.
