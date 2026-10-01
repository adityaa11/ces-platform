# IDSER-010-04: Concurrent bundle identity isolation

- **State:** `approved`; **Review batch:** `IDSER-BATCH-10-04` (`PASS` at `91c2405`).
- **Predecessors:** IDSER-010-03-02 `PASS`.
- **Consumes:** approved membership, bundle identity, context/result authority, queue and reconciliation boundaries; it does not alter their semantics.
- **Execution environment:** two authenticated users/projects in the deterministic Compose stack with independently named scoped queues/consumers where the existing test configuration supports them.

## Authority and bounded outcome

Own Scenario F: independently authorized users/bundles progress at the same time without identity, context, result, count, job, candidate, evidence or relationship leakage. Use duplicate display names deliberately to prove stable project/workspace/bundle/document/execution IDs—not presentation text—route authority. The harness must prevent a test consumer from stealing another scenario's jobs and must show that a provider response/context/result is bound to the exact execution scope.

## Explicit non-authority

No normal semantic classification (A–E), failure/retry semantics, replay/restart, browser visual regression or live provider. This child does not add a tenant model, change membership/queue architecture, create a new isolation mechanism, or make display name an identity key.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-04-01 | Two authenticated owners can run same-display-name projects/bundles concurrently without cross-read or cross-write. | Two-user Compose fixture and scoped DB assertions. **PASS iff** every project/workspace/bundle/document/execution ID remains unique and each user sees/mutates only its own rows. |
| RC-010-04-02 | Concurrent workers/jobs consume only their designated test scenario work; no consumer steals a production/other-test job. | pg-boss job IDs/queue names plus worker execution log and cleanup assertions. **PASS iff** each job is claimed/delivered once by its matching scope and no unrelated job state changes. |
| RC-010-04-03 | Context, controlled-provider response and result delivery cannot cross bundle/project scope; counts/candidates/evidence/relationships remain separate. | Deliberately distinguishable fixture payloads with context/result capture and persisted queries. **PASS iff** no foreign ID/payload appears and each bundle reaches only its own N/N outcome. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-010-05` / `REV-010-05` is the identity and test-consumer isolation boundary. Mandatory negatives are same display name, cross-user context/result, queue stealing, foreign candidate/reference and target/control progress mutation. Direct regressions are membership reads, semantic context/result, pg-boss worker and reconciliation scope tests.

CFC repairs are local to the concurrency fixture, test queue isolation config or exact scope assertion. HMN may resolve one consumer-isolation, ID-scope or foreign-reference oracle only. It cannot authorize replay fencing, normal semantic reclassification, failure design, browser work or infrastructure replacement.

## Hard stop and required handoff

Before `awaiting_review`, all concurrency rows are `PROVEN` with exact Compose command/counts, queue IDs, safe scoped IDs and target/control DB observations. Scenario F authority is complete; 010-05 owns restart/replay. Record `Internal readiness: READY_FOR_CK`; CK decides one isolation contract.
