# CES-GF-AGB-009 - Policy Knowledge-Evolution Workflow State

**Status:** Proposed; implementation unauthorized
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
