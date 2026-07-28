# CES-GF-ATLAS-HARD-006 — Completeness Critic

**Stage:** Atlas hardening quality
**Status:** Planned

## Objective

Produce source-evidenced completeness and precision findings from structured
pipeline state without granting the critic approval or suppression authority.

## Dependencies

- ATLAS-HARD-005.
- Completed DAPE-005 critic foundation.

## Work

- Feed the critic all source units, candidates, normalized records, coverage,
  low-confidence classifications, duplicates, conflicts, empty workflow areas,
  and suspiciously sparse categories.
- Define versioned finding types, severity, evidence, recommended action, and
  stable finding identity.
- Deterministically validate findings against canonical source units.
- Preserve all findings and their resolution history.

## Outputs

`extraction-findings.json`, critic diagnostics, and deterministic finding
summary suitable for the proposal and approval UI.

## Acceptance criteria

- [ ] Findings identify affected source units and pipeline stage.
- [ ] Uncovered, distorted, unsupported, conflicting, and suspiciously sparse
      extraction states are distinguishable.
- [ ] The critic cannot approve, suppress, rewrite, or publish records.
- [ ] Invalid or unsupported findings are rejected explicitly.
- [ ] Repeated equivalent input produces deterministic finding identities.
- [ ] Blocking findings remain visible until a recorded resolution exists.

## Tests and evidence

Missing Safara rule, false context, distorted candidate, unsupported record,
empty workflow, sparse category, duplicate/conflict, and critic overreach
fixtures.

## Out of scope

Executing retries, human decisions, and approved-model publication.
