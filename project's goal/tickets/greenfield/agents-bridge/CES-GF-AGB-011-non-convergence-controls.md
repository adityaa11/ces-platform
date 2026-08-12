# CES-GF-AGB-011 - Knowledge-Evolution Non-Convergence Controls

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-009 and AGB-010
**Blocks:** AGB-014

## Outcome

Prevent duplicate reviews and never-ending semantic feedback loops through
deterministic attempt, duplicate, progress, and escalation controls.

## Scope

- Attempt identity and bounded attempt policy per gap fingerprint/revision.
- Normalized proposal fingerprint and semantic duplicate detection.
- Before/after gap-state comparison following accepted successor publication.
- No-progress, exhausted-attempt, authority-unavailable, and governed-source-
  unavailable suspension/escalation outcomes.

## Acceptance contract

- Materially equivalent proposals for the same governed state do not create a
  new successor, review, or coverage cycle.
- An accepted successor that does not change the semantic gap cannot loop.
- Retry after `NOT ACCEPTED` requires bounded REQUIRED findings and consumes an
  explicit attempt under the final reviewed policy.
- Exhaustion suspends/escalates; it never silently retries or invents Policy.
- A genuine governed revision or changed gap fingerprint can begin a new
  bounded attempt history without mutating the old one.

## Explicit non-goals

- Choosing the numeric production attempt budget before operational review,
  treating semantic text equality as sufficient, or converting every stop into
  `DECISION_REQUIRED` without the disposition contract permitting it.

## Review focus

Loop termination, normalization safety, progress semantics, retry authority,
historical immutability, and false-positive/false-negative duplicate fixtures.

## Implementation evidence

- A Policies-owned content-addressed convergence ledger binds one governed gap
  fingerprint to an injected, reviewed attempt policy and immutable attempts.
- Semantic proposal fingerprints normalize structured decisions, targets,
  support, lineage, comparisons, and obligation/definition meaning while
  excluding rationale prose; cosmetic wording/order changes cannot evade
  duplicate detection, and materially distinct targets/meanings remain distinct.
- Duplicate proposals and exhausted policy budgets suspend without creating a
  new attempt, review, successor, or coverage cycle. Retry after `NOT ACCEPTED`
  requires explicit bounded REQUIRED identities and consumes an attempt.
- Coverage comparison detects unchanged fact/layer semantics after an accepted
  successor as `NO_PROGRESS`; zero gaps converges, while a genuinely changed
  layer/gap identity may start a separately linked history without mutation.
- Authority-unavailable and governed-source-unavailable are explicit suspension
  reasons and are not silently converted into `DECISION_REQUIRED`.
- Focused convergence, workflow architecture, and typechecking evidence passes.

The numeric budget is supplied by a reviewed policy artifact; this ticket does
not choose a production number or authorize autonomous retries.
