# CES-GF-POL-005-V01 - Governed Compatibility Validation

**Status:** Proposed
**Review class:** BATCHABLE
**Depends on:** Accepted POL-002-R01 and accepted POL-005; provisionally consumes POL-003-R01

## Outcome

Validate the source-neutral raw vocabulary contract against Frozen Context v1.1
and make the smallest correction required to distinguish an active extraction
input from a tracked reference-only release.

## Scope

- Preserve the accepted raw vocabulary schema and v1 validation API.
- Validate CORE and EVALUATION_SOURCE releases as active machine inputs.
- Reject REFERENCE_ONLY or otherwise BLOCKED releases at the governed glossary
  boundary.
- Prove the correction adds no source-specific field to raw vocabulary.

## Acceptance contract

- The accepted v1 raw vocabulary schema and tests remain unchanged and passing.
- NIST CSF, SP 800-53 evaluation, ASVS, and WSTG releases validate through the
  governed entry point.
- Both ISO releases fail governed vocabulary validation.
- Source class and activation remain Source Glossary concerns rather than raw
  concept fields.
- No extraction, canonicalization, or taxonomy work occurs.

## Explicit non-goals

- Changing the raw vocabulary schema version or semantic roles.
- Adding NIST-, OWASP-, or ISO-specific raw concept fields.
- Performing source extraction or deciding SP 800-53 permanent admission.
- Changing source governance or update detection.

## Compatibility result

The source-neutral data shape requires no structural amendment. A minimal
governed validation entry point is required because the v1.1 glossary tracks
REFERENCE_ONLY releases that must not become vocabulary inputs.

## Implementation evidence

- `validateGovernedRawSourceVocabulary` composes the accepted validator with
  the v1.1 source class and corpus-activation gate.
- Tests accept all four governed machine inputs, reject both ISO references,
  and preserve the exact raw vocabulary value and original v1 behavior.

