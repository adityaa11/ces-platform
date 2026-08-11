# CES-GF-POL-000-R01-F01 - Publish Frozen Context v1.1

**Status:** Accepted
**Depends on:** Accepted POL-000-R01

## Outcome

Publish a successor frozen context that activates the accepted source strategy
without modifying the historical v1 context or reopening unrelated CES Policy
decisions.

## Scope

- Incorporate v1 by reference and enumerate only the superseded source rules.
- Freeze the v1.1 source classes, exact releases, roles, processing boundaries,
  non-equivalence rules, and downstream reconciliation gate.
- Preserve v1 as immutable historical evidence.
- Keep POL-006 blocked until upstream contracts and its acceptance contract are
  reconciled.

## Acceptance contract

- v1.1 has explicit predecessor, authority, precedence, and activation rules.
- The exact source strategy matches accepted POL-000-R01.
- ISO remains REFERENCE_ONLY and excluded from machine extraction.
- NIST authorization remains bounded to reviewed NIST-authored material with
  attribution, third-party-content, foreign-rights, and non-endorsement
  conditions preserved.
- The context makes no NIST/ISO equivalence, compliance, or certification claim.
- POL-002, POL-003, POL-004, POL-005, and POL-006 gates are explicit.
- Every non-source v1 boundary remains frozen.
- The original v1 file is unchanged.

## Explicit non-goals

- Amending implementation schemas or source records.
- Extracting or canonicalizing vocabulary.
- Resuming POL-006.
- Reopening accepted non-source CES Policy decisions.

## Review focus

Review only faithful application of accepted POL-000-R01, historical lineage,
source boundaries, reconciliation gates, and preservation of the remaining v1
contract. Use only the frozen terminal review outcomes.

## Acceptance evidence

- Commit `085897f` proposed the successor frozen context and publication
  contract.
- Round 1 result: `NOT ACCEPTED`; REQUIRED-01 identified the missing explicit
  NIST foreign-rights and geographic condition.
- Commit `e08e623` preserved NIST's foreign-rights and worldwide-grant terms.
- Round 2 closure result: `ACCEPTED`.
