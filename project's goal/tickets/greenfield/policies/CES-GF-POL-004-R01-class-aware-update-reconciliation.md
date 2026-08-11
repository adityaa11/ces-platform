# CES-GF-POL-004-R01 - Class-Aware Update Reconciliation

**Status:** Proposed
**Review class:** BATCHABLE
**Depends on:** Accepted POL-002-R01; provisionally consumes POL-003-R01

## Outcome

Make update awareness operate across the governed six-source baseline while
ensuring an observation or accepted candidate cannot alter source class,
processing authority, corpus activation, or a published baseline.

## Scope

- Register update adapters for all six governed source families.
- Preserve the accepted four-adapter v1 API and behavior.
- Snapshot class, activation, and governing revision on v1.1 candidates.
- Detect updates for REFERENCE_ONLY sources without making them extraction
  inputs.
- Make every governed candidate explicitly authority-neutral.

## Acceptance contract

- The v1 four-adapter contract remains unchanged.
- The v1.1 registry contains exactly all six governed families.
- CORE, EVALUATION_SOURCE, and REFERENCE_ONLY classes remain distinguishable.
- Reference-only update awareness never grants processing or activation.
- Candidate creation is deterministic, non-mutating, and authority-neutral.
- Existing unchanged, ambiguous, failed, review, and conflict behavior passes.

## Explicit non-goals

- Fetching live releases or implementing general crawling.
- Changing source classification or processing authorization.
- Automatically activating an accepted update candidate.
- Extracting vocabulary, changing POL-005, or resuming POL-006.

## Implementation evidence

- The governed adapter registry adds NIST CSF and SP 800-53 alongside the
  preserved four-family v1 registry.
- Governed candidates snapshot accepted governance and fix
  `authority_effect` to `NONE`.
- Tests prove exact registration, ISO reference-only awareness, non-mutation,
  and all accepted POL-004 behavior.

