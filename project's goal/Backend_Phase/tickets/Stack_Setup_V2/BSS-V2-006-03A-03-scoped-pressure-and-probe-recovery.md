# BSS-V2-006-03A-03 — Scoped runtime pressure and bounded probe recovery

- **State:** `planned`; explicit GO required after 03A-02 CK `PASS`.
- **Batch:** `BSS-V2-BATCH-06-03A-03`.
- **Depends on:** 03A-01/02 CK `PASS`.
- **Original traceability:** RC07–09, E01, E04–05, and applicable E08.

## Outcome and scope

Add Bridge-owned immutable runtime-pressure safety policy, durable route/domain incidents, conservative 429 handling, one atomically claimed probe, and narrowly scoped recovery. Numeric clamps apply only with trusted domain-scoped evidence; ambiguous scope blocks only its attributed route. The active BSS-005 plan remains numeric authority.

No plan publication, activation wakeup consumer, replan intent, background parity, or provider SDK retry loop is authorized.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-03-01 | Shared-domain and independent-domain fixtures prove one numeric owner per canonical domain; route-only pressure does not manufacture a shared numeric clamp or hidden fallback. |
| RC-03-02 | A versioned operator policy drives 429 with and without trusted Retry-After. Missing policy fails closed with no probe or transport. |
| RC-03-03 | Exactly one fresh probe can be claimed for a stable incident across restart; failure consumes the bounded budget and no retry recursion occurs. |
| RC-03-04 | Only matching trusted recovery clears matching pressure; stale, higher, malformed, repeated, or unrelated feedback cannot raise a ceiling or lift an incident. |

## Workflow and handoff

GO adds pressure only as an admission fence over 03A-02 usage. CK checks scope and recovery independently. CFC cannot change numeric BSS-005 policy. HMN is required for an actual unresolved observation-scope or configured-policy conflict; absent policy remains a fail-closed implementation result, not an HMN invitation to invent values.

On PASS, hand off incident identity, policy version, cooldown/probe state, and the admission-block decision to 03A-04. The next ticket may schedule a wakeup for already-defined eligibility, but cannot reinterpret pressure scope or policy.

## Uncommitted-work allocation and SecurityReadiness

Split pressure-only tables/functions from current `0049–0051`; do not carry replan intent or wakeup-dispatch ownership into this ticket. `SR-03-SCOPE` separates route holds from domain clamps; `SR-03-POLICY` keeps values operator-configured; `RB-04` requires restart/probe and invalid-feedback tests.
