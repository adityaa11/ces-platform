# CES-GF-ATLAS-HARD-005 — Source Coverage Map

**Stage:** Atlas hardening quality
**Status:** Planned

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
- Record one-to-many and many-to-one source/record mappings.
- Require reviewed reasons for exclusion or context-only disposition.
- Validate all source, candidate, normalized-record, workflow, and graph links.
- Calculate deterministic coverage counts without agent certification.

## Outputs

`source-coverage.json`, coverage summary, invalid-link diagnostics, and
pipeline-stage loss report.

## Acceptance criteria

- [ ] Every source unit has an explicit current disposition.
- [ ] Every normalized record links to its source units and candidates.
- [ ] Unmapped normative content is visible and blocks publication.
- [ ] Silent exclusion and attach-all provenance are rejected.
- [ ] Pipeline-stage loss can be diagnosed directly.
- [ ] Coverage ordering and counts are deterministic.

## Tests and evidence

One-to-many, many-to-one, duplicate, context, exclusion, missing-link,
wrong-document, workflow-assignment loss, and graph-projection loss fixtures.

## Out of scope

Agent criticism, retry execution, approval, and UI visualization.
