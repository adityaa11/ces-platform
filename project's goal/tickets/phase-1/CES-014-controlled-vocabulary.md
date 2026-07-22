# CES-014 — Phase 1: Enforce Controlled Facts and Trust Boundaries

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Prevent silent policy omission caused by misspelled or ambiguous policy-relevant facts.

## Work

- Replace resolver-relevant open strings with versioned enums for actor, operation, input, media, effects, assurance, tenancy, data class, and delivery semantics.
- Add explicit input `source` and/or `trust_boundary` facts.
- Derive `EXTERNAL_INPUT` only from the explicit trust-boundary fact.
- Reject unknown values with schema exit code 2, or represent a deliberately supported `unknown` value as blocked with exit code 3.

## Acceptance criteria

- [x] Typos such as `binary-file`, `images`, `own`, and `public` cannot silently pass.
- [x] External-input policies require an explicit external trust-boundary fact.
- [x] Every supported vocabulary member has positive schema coverage.
- [x] Unknown-value behavior is deterministic and documented.

## Required evidence

- [x] Attach invalid-vocabulary CLI diagnostics and exit codes.
- [x] Attach positive enumeration coverage.
- [x] Attach resolver evidence proving explicit trust-boundary derivation.

## Migration note

Update examples and evidence deliberately; do not infer trust from the mere presence of an input.
