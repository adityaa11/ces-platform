# IDSER-010-03-02: Semantic failure containment

- **State:** `planned`; **Review batch:** `IDSER-BATCH-10-03-02`.
- **Predecessors:** IDSER-010-03-01 `PASS`.
- **Consumes:** frozen IDSER-004 context/result authority, IDSER-005 worker failure mapping, IDSER-006/007 validation/acceptance and IDSER-008 bounded lifecycle.
- **Execution environment:** controlled-provider Compose worker plus focused Atlas semantic-authority/extraction/reconciliation integration suites.

## Authority and bounded outcome

Own Scenario G and the semantic-stage technical-failure closure model. Inject authorized context denial, result denial, provider rejection/timeout/malformed response, schema rejection, evidence locator rejection, source-inventory rejection and cross-scope reference rejection. Each must terminate through the approved bounded technical path: no trusted partial result, candidate, relationship, completed count, ready state, or successor job; after the supported retry semantics, the exact member/bundle is `Needs attention`. Valid ambiguity/conflict remains reviewable and is not a technical failure.

## Explicit non-authority

This child does not own initial create rollback, normal relationship/sequencing semantics, concurrent isolation, staged replay/lease handling, browser/CSP regression, live Mistral, or new failure-state design. It may not make a provider fallback, change retry policy, invent a queue/worker, or treat an assertion failure as an opportunity to change a frozen predecessor.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-03-02-01 | Context/result authorization denial rejects before trusted semantic mutation and leaves target/control state unchanged. | Compose authenticated internal-route/semantic-authority fixture with before/after target/control snapshots. **PASS iff** denial produces no result, progress, successor or cross-scope mutation. |
| RC-010-03-02-02 | Provider unavailable/timeout/malformed output and schema rejection produce the approved bounded technical failure, not a fabricated result or retry-success. | Controlled MistralProvider fixture through production worker. **PASS iff** provider call/result logs and persisted lifecycle show zero false progress and no successor job. |
| RC-010-03-02-03 | Invalid evidence, inventory or reference (including cross-scope) rolls back acceptance completely; valid conflict/ambiguity does not enter this failure path. | Focused extraction/reconciliation acceptance tests plus Scenario G fixture. **PASS iff** invalid result leaves no partial materialization and valid uncertain output remains reviewable. |
| RC-010-03-02-04 | The failure is scoped to its member/bundle and has a bounded safe observable state after supported retry behavior. | DB/lifecycle read-model assertions with unrelated control bundle. **PASS iff** only target enters `Needs attention`; Master remains empty and control is unchanged. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-010-04` / `REV-010-04` covers the untrusted provider/result-to-Atlas transition and failure disclosure. Mandatory negatives are unauthorized context/result, malformed/schema/reference/evidence/inventory rejection, no raw provider/source leakage, zero false progress, no successor, no downstream truth and control-bundle immutability. Direct regressions are semantic worker/client, semantic authority, extraction/reconciliation acceptance and lifecycle tests.

CFC stays in the semantic failure fixture, validation/acceptance transaction or existing worker error mapping. HMN may resolve one exact rejection-to-state assertion, no-successor observation, or bounded-message issue; it cannot authorize a retry-policy, queue, provider, schema or lifecycle redesign.

## Hard stop and required handoff

Before `awaiting_review`, all rejection classes and the reviewable-ambiguity contrast are `PROVEN` with exact Compose commands, target/control DB and queue observations. Scenario G/failure-containment authority is complete; 010-04 owns concurrency and 010-05 owns replay. Record `Internal readiness: READY_FOR_CK`; CK decides this one terminal-containment contract.
