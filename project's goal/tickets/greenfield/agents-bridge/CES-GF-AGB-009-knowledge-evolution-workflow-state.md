# CES-GF-AGB-009 - Policy Knowledge-Evolution Workflow State

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-006 and AGB-008
**Blocks:** AGB-010 and AGB-011

## Outcome

Define a durable Policies-owned orchestration state machine around the stateless
Agents Bridge for one bounded knowledge gap at a time.

## Scope

- Versioned workflow, gap, attempt, proposal, validation, review, publication,
  suspension, resume, and coverage-result identities.
- Deterministic gap fingerprint over fact, earliest incomplete layer, and all
  relevant governed knowledge revisions.
- Exact transition rules and append-only evidence/provenance.
- Separation between `KNOWLEDGE_CONVERGED`, `GOVERNED_SUSPENSION`, and
  `FULLY_RESOLVED`.

## Acceptance contract

- Invalid/incomplete coverage cannot enter semantic knowledge evolution.
- Only `SOURCE_OR_POLICY_GAP` activates a knowledge agent;
  `DECISION_REQUIRED` does not.
- The bridge performs one bounded execution and stores no workflow authority.
- Accepted historical artifacts are referenced immutably, never rewritten.
- Illegal, stale, skipped, duplicated, or cross-workflow transitions fail.

## Explicit non-goals

- Implementing REVIEW_GATE decisions, automatic approval, UI, distributed job
  infrastructure, or a numeric retry budget.

## Review focus

Ownership boundary, state determinism, immutable history, exact entry/terminal
predicates, and compatibility with a stateless Agents Bridge.

## Implementation evidence

- Policies-owned `@company/ces-policy-knowledge-workflow` defines the versioned,
  append-only state and deterministic transition contract; Agents Bridge core
  remains unchanged and stateless.
- Valid, complete coverage routes exactly one `SOURCE_OR_POLICY_GAP` into a
  bounded attempt. `DECISION_REQUIRED` enters `KNOWLEDGE_CONVERGED` without an
  agent, while zero remaining gaps or decisions enters `FULLY_RESOLVED`.
- Gap fingerprints bind fact identity, earliest incomplete layer, and all four
  governed knowledge revisions.
- Attempt, proposal, and validation transitions are ordered, evidence-linked,
  hash-chained, and bind their transition payloads. Valid proposals enter
  `GOVERNED_SUSPENSION` with `REVIEW_REQUIRED`; review decisions and authority
  resume remain reserved for AGB-010.
- Every event now contains its complete resulting snapshot under the event
  hash. The schema deterministically verifies each transition and requires the
  top-level snapshot to equal the final replayed event snapshot, preventing
  forged state or identity fields from manufacturing skipped transitions.
- Focused workflow and architecture tests pass, together with package
  typechecking.

This candidate does not implement review verdicts, publication resume,
non-convergence policy, or any workflow authority inside Agents Bridge.
