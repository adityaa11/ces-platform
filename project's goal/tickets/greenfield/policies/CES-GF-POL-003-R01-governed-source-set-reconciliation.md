# CES-GF-POL-003-R01 - Governed Source Set Reconciliation

**Status:** Accepted
**Depends on:** Accepted POL-002-R01 and accepted POL-003

## Outcome

Publish the concrete six-record Source Glossary v1.1 successor required by
Frozen Context v1.1 while retaining the accepted four-record v1 export as its
specific immutable predecessor.

## Scope

- Add exact NIST CSF 2.0 and NIST SP 800-53 Rev. 5 Release 5.2.0 records.
- Classify NIST CSF, ASVS, and WSTG as CORE; SP 800-53 as EVALUATION_SOURCE;
  and both ISO releases as REFERENCE_ONLY.
- Record processing authority, source roles, rights evidence, attribution,
  third-party, geographic, non-endorsement, and extraction conditions.
- Preserve all four accepted v1 family and release values unchanged.
- Trace all six decisions to accepted POL-000-R01.

## Acceptance contract

- The historical v1 export still contains exactly its original four records.
- The successor contains exactly the six releases frozen by v1.1.
- Exact NIST releases and official metadata evidence are represented.
- Every release has exactly one matching governance record and class.
- ISO is BLOCKED and REFERENCE_ONLY for every processing operation.
- NIST records preserve attribution, third-party review, foreign-rights, and
  non-endorsement conditions.
- SP 800-53 remains active only as EVALUATION_SOURCE.
- The successor identifies the exact historical predecessor baseline.
- Deterministic hashes cover the exact normalized metadata observations.

## Explicit non-goals

- Fetching or extracting NIST, OWASP, or ISO source content.
- Mutating or deleting the accepted v1 export.
- Implementing class-aware update detection.
- Changing POL-005 or resuming POL-006.
- Deciding whether SP 800-53 becomes permanent CORE.

## Implementation evidence

- `CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1` additively extends the immutable
  four-release predecessor with the two accepted NIST releases.
- `CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1` binds all six releases to the
  accepted classes, roles, rights, activation states, and POL-000-R01 decision.
- Tests preserve the historical prefix, assert the exact six classifications,
  and enforce the ISO and NIST processing boundaries.

## Acceptance evidence

- Primary implementation commit: `53df311`.
- Combined dependency-aware review: Round 1 `ACCEPTED`.
- No BLOCKER, REQUIRED, or DEFERRED findings were recorded.
