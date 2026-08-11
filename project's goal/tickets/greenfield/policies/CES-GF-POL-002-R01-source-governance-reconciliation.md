# CES-GF-POL-002-R01 - Source Governance Reconciliation

**Status:** Proposed
**Depends on:** Accepted Frozen Context v1.1 and accepted POL-002

## Outcome

Extend the technology-neutral Source Glossary contract so a separately
versioned v1.1 baseline can express the source governance accepted in
POL-000-R01 without mutating the accepted v1 contract or source records.

## Scope

- Add CORE, EVALUATION_SOURCE, and REFERENCE_ONLY source classes.
- Record a stable role for each governed source release.
- Record explicit machine-processing, structured-extraction, and AI-analysis
  authorization states.
- Separate source classification from active machine-corpus admission.
- Record rights classification, evidence, attribution, third-party-content,
  geographic, and additional conditions.
- Trace every governance decision to its POL-000 revision and rationale.
- Provide an explicit, non-mutating v1-to-v1.1 migration boundary.

## Acceptance contract

- The accepted v1 schema and values continue to validate unchanged.
- A governed v1.1 wrapper has explicit predecessor and baseline identities.
- Every governed release has exactly one matching governance decision.
- An ACTIVE machine-corpus source requires explicit authorization for all
  three processing operations; pending or prohibited sources remain BLOCKED.
- REFERENCE_ONLY sources cannot be represented as authorized extraction inputs.
- Missing, duplicate, or mismatched governance fails closed.
- Rights evidence and all accepted condition categories are required.
- Generic tests prove migration does not mutate v1 and invalid authority fails.

## Explicit non-goals

- Seeding or reclassifying concrete NIST, OWASP, or ISO records.
- Changing source-update detection.
- Extracting vocabulary or changing POL-005.
- Selecting persistence, transport, UI, or runtime architecture.

## Implementation evidence

- `GovernedSourceGlossarySchema` composes the immutable accepted v1 glossary
  with complete release-level governance in schema version 1.1.0.
- `migrateSourceGlossaryV1ToGovernedV1_1` validates and nests the accepted v1
  value without modifying it.
- Generic fixtures cover valid migration, complete coverage, and fail-closed
  reference-only authorization.
