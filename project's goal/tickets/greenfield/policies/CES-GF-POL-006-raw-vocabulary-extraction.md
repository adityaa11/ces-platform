# CES-GF-POL-006 - Raw Vocabulary Extraction

**Status:** Proposed
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

## Execution gate

This ticket remains blocked from extraction execution until POL-003-R01,
POL-004-R01, POL-005-V01, and this synchronized contract each receive an
accepting terminal outcome. Provisional contract implementation does not grant
source authority or satisfy that gate.
