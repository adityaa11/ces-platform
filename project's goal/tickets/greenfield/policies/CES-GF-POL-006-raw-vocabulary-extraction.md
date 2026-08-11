# CES-GF-POL-006 - Raw Vocabulary Extraction

**Status:** Accepted
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-003-R01, POL-004-R01, and POL-005-V01

## Outcome

Produce a reviewable raw vocabulary corpus from the governed Frozen Context
v1.1 machine inputs, including a bounded evaluation of SP 800-53.

## Scope

- Repeatable extraction workflow with lawful source access.
- Required representative extraction from NIST CSF 2.0, OWASP ASVS 5.0.0,
  and OWASP WSTG 4.2.
- Bounded representative evaluation extraction from NIST SP 800-53 Rev. 5,
  Release 5.2.0.
- Source locators, exact source terminology, semantic-role proposals, scope
  dispositions, confidence, and extraction provenance.
- Human review of ambiguous classification and extraction coverage.
- Coverage evidence for each pinned release.
- Explicit exclusion of ISO/IEC 27001 and ISO/IEC 27002 source content under
  their current REFERENCE_ONLY authorization.
- SP 800-53 contribution classification as `UNIQUE_VALUE`,
  `REINFORCES_EXISTING_CONCEPT`, `OUT_OF_SCOPE_ORGANIZATIONAL`, or
  `DUPLICATE_NOISE` without deciding permanent source admission.

## Acceptance contract

- Every accepted concept validates against POL-005 and traces to one release.
- Every vocabulary input passes the governed POL-005-V01 activation check.
- Extraction does not invent canonical names or implementation guidance.
- Ambiguity remains explicit rather than being silently resolved.
- Re-running the same inputs is deterministic or records why provider output
  differs before approval.
- Representative outcomes, controls, requirements, concerns, and verification
  contexts from all four governed machine inputs are covered.
- NIST processing is limited to reviewed NIST-authored material and preserves
  attribution, third-party-content exclusion/review, foreign-rights, and
  non-endorsement conditions.
- OWASP extraction preserves the recorded attribution and ShareAlike terms.
- No raw concept, locator, term, or description is extracted or reconstructed
  from either ISO publication.
- The SP 800-53 evaluation result is evidence for a later POL-000 revision; it
  does not promote, demote, or remove the source automatically.

## Explicit non-goals

- Claiming exhaustive source reproduction.
- ISO machine processing, transcription, reconstruction, or substitution of
  third-party summaries or metadata as representative ISO vocabulary.
- Canonicalization, policy taxonomy, runtime applicability, or Atlas wiring.
- Adding sources beyond the governed Frozen Context v1.1 source set.
- Deciding permanent SP 800-53 admission or changing source governance.

## Execution gate evidence

POL-003-R01, POL-004-R01, POL-005-V01, and POL-006-R01 received accepting
terminal outcomes before extraction began. Acceptance bookkeeping commit
`f8e2e41` recorded closure of that source-governance gate.

## Implementation evidence

- Four governed inputs have exact SHA-256 and revision evidence: a committed
  deterministic NIST CSF 2.0 normalized extraction slice, NIST SP 800-53
  OSCAL 5.2.0, ASVS 5.0.0 CSV, and the WSTG 4.2 tagged repository.
- The compact representative corpus contains source-faithful concepts for all
  four governed machine inputs and contains no ISO vocabulary.
- Raw roles cover objectives, controls, requirements, a risk concern, and
  verification contexts with exact release locators and artifact-level hashes.
- SP 800-53 concepts have bounded contribution evidence without changing its
  EVALUATION_SOURCE status.
- Deterministic tests validate governed input authority, provenance, semantic
  coverage, ISO exclusion, and repeatable output.
- Every concept records confidence; every ambiguous scope classification and
  each release's non-exhaustive representative coverage have explicit Round 1
  human-review evidence.
- Human approval evidence is recorded as `CES-GF-POL-006-H01`; corpus review
  records reference that approval rather than a prior defect report.

## Acceptance evidence

- Primary implementation commit: `19c4f25`.
- Reproducible-provenance, confidence, and review-evidence remediation commit:
  `86f090c`.
- Human approval evidence and truthful corpus-reference commit: `b3bebc0`.
- Combined dependency-aware review artifact:
  `CES_COMBINED_REVIEW_b3bebc0_5293980.md`.
- Continued Round 2 closure terminal result: `ACCEPTED`.
- BLOCKER: none; REQUIRED: none.
