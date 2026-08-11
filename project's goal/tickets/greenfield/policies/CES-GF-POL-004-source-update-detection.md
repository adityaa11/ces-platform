# CES-GF-POL-004 - Source Update Detection

**Status:** Implemented; pending review
**Depends on:** POL-003

## Outcome

Detect possible source releases and create reviewable update candidates without
changing an approved source release or CES baseline.

## Scope

- Per-family update-check adapters behind a common contract.
- Check timestamps, observed release evidence, candidate status, and errors.
- Idempotent candidate creation and explicit human disposition.
- Impact-analysis placeholder linking a candidate to affected mappings later.

## Acceptance contract

- Unchanged checks create no duplicate candidate.
- A detected release produces a candidate, never an automatic activation.
- Network, parsing, and ambiguous-version failures are visible and fail safe.
- Existing published releases and baselines remain byte-for-byte unchanged.
- Deterministic fixtures cover unchanged, updated, ambiguous, and failed checks.

## Explicit non-goals

- Automatically accepting an update or rewriting vocabulary and policies.
- General web crawling, implementation-source support, or notification UI.

## Implementation evidence

- Four source-family adapter registrations share one validated probe contract;
  network/parsing behavior remains adapter-owned and injectable.
- Update observations distinguish unchanged, detected, ambiguous, and failed
  checks with evidence and safe diagnostics.
- Deterministic candidate IDs make repeated detection idempotent, while
  conflicting reuse fails closed.
- Human disposition records acceptance, rejection, or deferral but never adds
  or activates a source release; impact analysis begins as `not_assessed`.
- Five focused tests cover registration, unchanged/failure behavior,
  idempotence, non-mutation, human disposition, and malformed identity output.
