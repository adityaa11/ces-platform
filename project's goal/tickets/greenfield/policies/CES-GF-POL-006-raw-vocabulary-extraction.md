# CES-GF-POL-006 - Raw Vocabulary Extraction

**Status:** Proposed
**Depends on:** POL-003 and POL-005

## Outcome

Produce a reviewable raw vocabulary corpus from the four pinned source releases.

## Scope

- Repeatable extraction workflow with lawful source access.
- Source locators, exact source terminology, semantic-role proposals, scope
  dispositions, confidence, and extraction provenance.
- Human review of ambiguous classification and extraction coverage.
- Coverage evidence for each pinned release.

## Acceptance contract

- Every accepted concept validates against POL-005 and traces to one release.
- Extraction does not invent canonical names or implementation guidance.
- Ambiguity remains explicit rather than being silently resolved.
- Re-running the same inputs is deterministic or records why provider output
  differs before approval.
- Representative controls, requirements, concerns, and verification contexts
  from all four releases are covered.

## Explicit non-goals

- Claiming exhaustive reproduction of protected standards text.
- Canonicalization, policy taxonomy, runtime applicability, or Atlas wiring.
- Adding sources beyond the frozen four.
