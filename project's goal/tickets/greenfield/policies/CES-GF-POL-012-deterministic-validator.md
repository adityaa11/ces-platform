# CES-GF-POL-012 - Deterministic Validator

**Status:** Proposed
**Review class:** BATCHABLE
**Depends on:** POL-011

## Outcome

Implement a fail-closed validator that prevents untrusted reasoning output from
becoming CES Policy output unless all references and boundaries are valid.

## Scope

- Schema, identity, revision, relationship, and Atlas-reference validation.
- Binding-to-fact grounding and approved-baseline checks.
- Deterministic rejection of unknown IDs and forbidden implementation fields.
- Stable machine-readable validation codes and safe diagnostics.

## Acceptance contract

- Unknown policy, concern, capability, fact, baseline, and revision IDs fail.
- Activated policies without Atlas facts fail.
- Stale or cross-project references fail.
- Structured implementation prescriptions and disallowed fields fail.
- Valid results are deterministic; invalid fixtures identify exact contract
  violations without exposing protected source content.

## Explicit non-goals

- Claiming deterministic proof of every free-text semantic nuance.
- Calling a model, correcting candidates, or selecting architecture.
- Approving candidates or replacing human review.
